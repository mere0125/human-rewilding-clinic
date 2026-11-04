import {CASE, volume} from './case.mjs';
export const HOUR = 3600000;
const localTime = new Intl.DateTimeFormat('en-US', {timeZone: CASE.timezone, hour: 'numeric', minute: 'numeric', hourCycle: 'h23'});
export function hourAt(t) {
  const p = Object.fromEntries(localTime.formatToParts(new Date(t)).map(p => [p.type,p.value]));
  return Number(p.hour) + Number(p.minute)/60;
}
export const median = a => { const s=[...a].sort((a,b)=>a-b); return s.length ? (s[Math.floor((s.length-1)/2)]+s[Math.ceil((s.length-1)/2)])/2 : null; };
export function quality(rows) {
  const steps=rows.slice(1).map((r,i)=>r.t-rows[i].t), nominal=median(steps) || 900000;
  const valid = steps.filter(d=>d>0 && d<=nominal*1.5);
  const span=rows.length>1 ? rows.at(-1).t-rows[0].t : 0;
  const validMs=valid.reduce((a,b)=>a+b,0);
  return {nominal,span,hours:validMs/HOUR,coverage:span?validMs/span:0,
    gaps:steps.filter(d=>d>nominal*1.5).length,longestGap:Math.max(0,...steps.filter(d=>d>nominal*1.5)),
    hvacCoverage:span?steps.reduce((s,d,i)=>s+(d<=nominal*1.5 && rows[i].hvac!==null?d:0),0)/span:0};
}
// Weighted least squares with an independently fitted intercept. No regular-grid assumption.
function solve3(A,b) {
  const m=A.map((row,i)=>[...row,b[i]]);
  for(let c=0;c<3;c++) {
    let p=c; for(let r=c+1;r<3;r++) if(Math.abs(m[r][c])>Math.abs(m[p][c])) p=r;
    [m[c],m[p]]=[m[p],m[c]];
    if(Math.abs(m[c][c])<1e-10) return null;
    const v=m[c][c]; for(let j=c;j<4;j++) m[c][j]/=v;
    for(let r=0;r<3;r++) if(r!==c) { const f=m[r][c]; for(let j=c;j<4;j++) m[r][j]-=f*m[c][j]; }
  }
  return m.map(r=>r[3]);
}
export function harmonic(rows,key,period=24) {
  if(rows.length<4) return null;
  const q=quality(rows), origin=rows[0].t;
  const A=Array.from({length:3},()=>[0,0,0]), b=[0,0,0];
  let sw=0, sy=0;
  const samples=rows.map((r,i)=>{
    const before=i?Math.min(r.t-rows[i-1].t,q.nominal):0;
    const after=i<rows.length-1?Math.min(rows[i+1].t-r.t,q.nominal):0;
    const w=(before+after)/(2*q.nominal), h=(r.t-origin)/HOUR;
    const x=[1,Math.sin(2*Math.PI*h/period),Math.cos(2*Math.PI*h/period)];
    for(let j=0;j<3;j++){b[j]+=w*x[j]*r[key];for(let k=0;k<3;k++) A[j][k]+=w*x[j]*x[k];}
    sw+=w;sy+=w*r[key];return {w,x,y:r[key]};
  });
  const beta=solve3(A,b); if(!beta) return null;
  const amplitude=Math.hypot(beta[1],beta[2]);
  const peak=((Math.atan2(beta[1],beta[2])*period/(2*Math.PI))%period+period)%period;
  const mean=sy/sw;
  let residual=0,total=0;
  samples.forEach(({w,x,y})=>{residual+=w*(y-x.reduce((s,v,i)=>s+v*beta[i],0))**2;total+=w*(y-mean)**2;});
  return {mean:beta[0],amplitude,peak,beta,r2:total?1-residual/total:null,origin,period};
}
export function metrics(rows) {
  const q=quality(rows), out=harmonic(rows,'outdoor'), inside=harmonic(rows,'indoor');
  let on=0,valid=0,energy=0,energyTime=0;
  rows.slice(0,-1).forEach((r,i)=>{
    const dt=rows[i+1].t-r.t;
    if(dt>q.nominal*1.5) return;
    if(r.hvac!==null){on+=dt*r.hvac;valid+=dt;}
    if(Number.isFinite(r.thermalWh)){energy+=r.thermalWh;energyTime+=dt;}
  });
  const ratio=out?.amplitude>=0.5 && inside ? inside.amplitude/out.amplitude:null;
  // Signed shortest phase difference, not an assertion of causality.
  const lag=ratio!==null ? ((inside.peak-out.peak+36)%24)-12:null;
  const energyComplete=q.hours>0&&Math.abs(energyTime-q.hours*HOUR)<1;
  return {q,out,inside,ratio,lag,duty:valid?on/valid:null,energy:energyComplete?energy/1000:null};
}
export function classify(m,audit,protocol=CASE.protocol) {
  const states=Object.values(audit), unknown=states.includes('unknown');
  const controls=states.filter(s=>s==='yes').length;
  const sufficient=m.q.hours>=protocol.minimumHours && m.q.coverage>=protocol.minimumCoverage && m.q.hvacCoverage>=protocol.minimumCoverage && m.ratio!==null && m.duty!==null && !unknown;
  const flags=[m.ratio===null?null:m.ratio<protocol.ratio,m.duty===null?null:m.duty>protocol.duty,unknown?null:controls<=protocol.controls];
  return {controls,sufficient,flags,flag:sufficient?flags.every(Boolean):null,
    title:!sufficient?'Evidence incomplete':flags.every(Boolean)?'Environmental Variability Deficit':'Criteria not jointly met'};
}
// Piecewise-constant exact solution of one lumped thermal state.
export function thermalStep(T,To,Q,G,C,seconds) {
  if(G===0) return T+Q*seconds/C;
  const equilibrium=To+Q/G;
  return equilibrium+(T-equilibrium)*Math.exp(-G*seconds/C);
}
export function simulate(weather,overrides={},stepSeconds=60) {
  const p={...CASE.thermal,...overrides};
  const C=p.fabricCapacity+p.rho*p.cp*volume;
  const q=quality(weather), result=[];
  let T=weather[0].indoor, mode=0, resets=0;
  for(let i=0;i<weather.length;i++) {
    const r=weather[i], next=weather[i+1];
    const out={...r,indoor:T,hvac:null,window:null,thermalWh:0,balance:null};result.push(out);
    if(!next)break;
    const dt=(next.t-r.t)/1000;
    if(dt>q.nominal*1.5/1000) {T=next.indoor;mode=0;resets++;continue;}
    let onSeconds=0,windowSeconds=0,wattsSeconds=0;
    const balance={envelope:0,ventilation:0,internal:0,conditioning:0,storage:0};
    const intervalHour=hourAt(r.t);
    for(let elapsed=0;elapsed<dt;) {
      const ds=Math.min(stepSeconds,dt-elapsed), h=(intervalHour+(elapsed+ds/2)/3600)%24;
      const occupied=h>=6.5&&h<23;
      const scheduled=(h>=p.morningStart&&h<p.morningEnd)||(h>=p.eveningStart&&h<p.eveningEnd);
      const open=p.permission&&scheduled&&r.outdoor>=p.minOutdoor&&r.outdoor<=p.maxOutdoor;
      const low=p.setpoint-p.deadband/2,high=p.setpoint+p.deadband/2;
      if(mode===1&&T>=p.setpoint || mode===-1&&T<=p.setpoint)mode=0;
      if(mode===0) {if(T<low)mode=1;else if(T>high)mode=-1;}
      const hvac=mode===1?p.heatingW:mode===-1?-p.coolingW:0;
      const flow=volume*(p.baseACH+(open?p.extraACH:0))/3600;
      const G=p.ua+p.rho*p.cp*flow;
      const gains=occupied?95:24,before=T;
      T=thermalStep(T,r.outdoor,gains+hvac,G,C,ds);
      // Integrate the same constant-coefficient state over this substep.
      // Each signed energy is in joules until the interval closes.
      const equilibrium=G===0?0:r.outdoor+(gains+hvac)/G;
      const differenceIntegral=G===0?(r.outdoor-before)*ds-(gains+hvac)*ds*ds/(2*C):(r.outdoor-equilibrium)*ds-(before-equilibrium)*(-Math.expm1(-G*ds/C))*C/G;
      balance.envelope+=p.ua*differenceIntegral;
      balance.ventilation+=(G-p.ua)*differenceIntegral;
      balance.internal+=gains*ds;balance.conditioning+=hvac*ds;
      balance.storage+=C*(T-before);
      onSeconds+=mode!==0?ds:0;windowSeconds+=open?ds:0;wattsSeconds+=Math.abs(hvac)*ds;elapsed+=ds;
    }
    out.hvac=onSeconds/dt;out.window=windowSeconds/dt;out.thermalWh=wattsSeconds/3600;
    out.balance=Object.fromEntries(Object.entries(balance).map(([k,v])=>[k,v/3600]));
  }
  result.resets=resets;return result;
}
export function makeDemo() {
  const start=Date.parse('2026-10-13T00:00:00-04:00');
  const weather=Array.from({length:673},(_,i)=>{
    const h=i/4;
    return {t:start+i*900000,outdoor:17.2+5.9*Math.sin(2*Math.PI*(h-8)/24)+1.1*Math.sin(2*Math.PI*h/(24*5)),indoor:22,hvac:null,window:null};
  });
  return simulate(weather);
}
export function parseCSV(text) {
  const lines=text.replace(/^\uFEFF/,'').trim().split(/\r?\n/);
  const split=line=>{const result=[];let s='',quoted=false;for(let i=0;i<line.length;i++){const c=line[i];if(c==='"'){if(quoted&&line[i+1]==='"'){s+='"';i++;}else quoted=!quoted;}else if(c===','&&!quoted){result.push(s.trim());s='';}else s+=c;}if(quoted)throw Error('Unclosed CSV quote.');result.push(s.trim());return result;};
  const headers=split(lines.shift()), required=['timestamp','outdoor_temp_c','indoor_temp_c'];
  if(required.some(k=>!headers.includes(k)))throw Error('Include timestamp, outdoor_temp_c and indoor_temp_c.');
  const rows=lines.filter(l=>l.trim()).map((line,index)=>{
    const values=split(line);if(values.length!==headers.length)throw Error(`Row ${index+2}: column count differs from header.`);
    const v=Object.fromEntries(headers.map((h,i)=>[h,values[i]]));
    if(!/(Z|[+-]\d\d:\d\d)$/i.test(v.timestamp))throw Error(`Row ${index+2}: timestamp needs an explicit timezone, such as -04:00.`);
    const t=Date.parse(v.timestamp);if(!Number.isFinite(t))throw Error(`Row ${index+2}: invalid timestamp.`);
    const num=(k,min,max,optional=false)=>{if(v[k]===undefined||v[k]===''){if(optional)return null;throw Error(`Row ${index+2}: ${k} is missing.`);}const n=Number(v[k]);if(!Number.isFinite(n)||n<min||n>max)throw Error(`Row ${index+2}: check ${k}.`);return n;};
    const outdoor=num('outdoor_temp_c',-80,70),indoor=num('indoor_temp_c',-20,60);
    const hvac=headers.includes('hvac_fraction')?num('hvac_fraction',0,1,true):num('hvac_on',0,1,true);
    if(!headers.includes('hvac_fraction')&&hvac!==null&&hvac!==0&&hvac!==1)throw Error(`Row ${index+2}: hvac_on must be 0 or 1.`);
    const window=num('window_open',0,1,true);
    if(window!==null&&window!==0&&window!==1)throw Error(`Row ${index+2}: window_open must be 0 or 1.`);
    return {t,outdoor,indoor,hvac,window};
  }).sort((a,b)=>a.t-b.t);
  if(rows.length<5)throw Error('At least five paired temperature readings are needed.');
  if(rows.some((r,i)=>i&&r.t===rows[i-1].t))throw Error('Duplicate timestamps found. Resolve them before importing.');
  return rows;
}
export function toCSV(rows) {
  return ['timestamp,outdoor_temp_c,indoor_temp_c,hvac_fraction,window_open',...rows.map(r=>[new Date(r.t).toISOString(),r.outdoor.toFixed(3),r.indoor.toFixed(3),r.hvac===null?'':r.hvac.toFixed(5),r.window===null?'':Number(r.window>0.5)].join(','))].join('\n');
}
export function sensitivity(rows,scenario,onProgress=()=>{}) {
  const results=[];
  for(let u=0;u<9;u++) {
   const ua=CASE.thermal.ua*(0.5+u/8);
   const base=metrics(simulate(rows,{...CASE.thermal,ua}));
   for(let a=0;a<9;a++) {
    const extraACH=0.5+a*4.5/8;
    const proposed=metrics(simulate(rows,{...scenario,ua,extraACH}));
    results.push({ua,extraACH,delta:proposed.ratio!==null&&base.ratio!==null?proposed.ratio-base.ratio:null});
    onProgress(results.length);
   }
  }
  return results;
}
