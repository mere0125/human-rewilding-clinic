import {CASE,volume,clearArea} from './case.mjs';
import {makeDemo,metrics,classify,simulate,toCSV,parseCSV,HOUR} from './engine.mjs';
import {PLANS,EMPTY_REVIEW,LOCAL_PLACES,initialSettings,calculateStudy} from './study.mjs';
import {RELATION_NODES,RELATION_EDGES,RELATION_LAYERS} from './relations.mjs';

const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fixed=(n,d=1)=>Number.isFinite(n)?n.toFixed(d):'Unknown';
const pct=n=>Number.isFinite(n)?(n*100).toFixed(1)+'%':'Unknown';
const date=t=>new Intl.DateTimeFormat('en-GB',{timeZone:CASE.timezone,day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).format(new Date(t));
const day=t=>new Intl.DateTimeFormat('en-GB',{timeZone:CASE.timezone,day:'numeric',month:'short'}).format(new Date(t));
const hour=x=>String(Math.floor(x)).padStart(2,'0')+':'+String(Math.round((x%1)*60)).padStart(2,'0');
const register=values=>values.map(([a,b])=>'<div><dt>'+esc(a)+'</dt><dd>'+esc(b)+'</dd></div>').join('');
const frame=$('#field');
let record=makeDemo(),recordName='Seven-day demonstration',imported=false;
let settings=initialSettings(),review={...EMPTY_REVIEW},audit={...CASE.audit},protocol={...CASE.protocol};
let study,selectedPlan='record',cursor=56,spatialReady=false,view='neighbourhood',pane='admission',place='room',playing=null,compareTraces=false;
let sensitivityWorker=null,sensitivityResults=[],plotGeometry=null,relationLayer='all',relationNode=null;
const reviewKey='clinic-room-001-review-v6';
try{
  const saved=JSON.parse(localStorage.getItem(reviewKey)||'null');
  if(saved?.caseId===CASE.id&&saved.recordKind==='constructed'&&JSON.stringify(saved.settings)===JSON.stringify(settings)&&['unrecorded','accepted','declined'].includes(saved.review?.resident)&&['unverified','granted','refused'].includes(saved.review?.opening)&&['unverified','granted','refused'].includes(saved.review?.thermostat))review={...EMPTY_REVIEW,...saved.review,note:String(saved.review.note||'').slice(0,1200)};
}catch{}
const send=d=>{if(spatialReady)frame.contentWindow.postMessage(d,location.origin);};
const condition=()=>selectedPlan==='record'?{rows:record,metrics:study.recordMetrics}:study.conditions[selectedPlan]||study.conditions.baseline;
const planName=()=>selectedPlan==='record'?(imported?'Imported case record':'Case record'):selectedPlan==='reviewed'?'Reviewed operation':PLANS.find(p=>p.id===selectedPlan)?.name||'Existing operation';
function setView(next){
  view=next;$$('[data-view]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.view===next)));
  document.body.dataset.view=next;
  $('#viewCaption').textContent=({neighbourhood:'Courtyard block',room:'Room 001',section:'Room 001, architectural section',plan:'Room 001, dimensioned plan',network:'Relations around Room 001'})[next];
  $('#viewpoints').hidden=next!=='room';
  $('#neighbourhoodViewpoints').hidden=next!=='neighbourhood';
  $('#relationTools').hidden=next!=='network';$('#openNetwork').hidden=next==='network';
  $('#spatialGesture').textContent=next==='neighbourhood'?'Drag to turn the model. Select a place to visit.':next==='room'?'Drag to look around. Scroll or use the arrow keys to move.':'The plan and interior share the same geometry.';
  send({type:'clinic-view',view:next});
  if(next==='network')send({type:'clinic-network-layer',layer:relationLayer});
}
function setPlan(id){
  if(id!=='record'&&!study.conditions[id])return;selectedPlan=id;
  renderComparison();drawPlot();updateCursor();
}
function openPane(next,{keepPlan=false,keepView=false}={}){
  pane=next;place='room';relationNode=null;document.body.dataset.pane=next;
  $$('.pane').forEach(p=>p.hidden=p.id!=='pane-'+next);
  $('.desk-nav').hidden=false;$$('[data-pane]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.pane===next)));
  $('#deskTitle').textContent=next==='admission'?'Appointment 001':next==='discharge'?'Case 001':'Room 001';$('#deskKind').textContent=next==='admission'?'Clinic reception':next==='discharge'?'Consultation outcome':next==='review'?'Clinic desk, permission review':'Patient room model';if(next==='discharge')renderDischarge();
  $$('[data-place]').forEach(b=>b.classList.toggle('selected',b.dataset.place==='room'));
  if(!keepView)setView(next==='admission'?'neighbourhood':'room');
  if(next==='case'&&!keepPlan)setPlan('record');
  if(next==='comparison'&&selectedPlan==='record')setPlan('combined');
  if(next==='review'&&selectedPlan==='record')setPlan('combined');
  $('.desk-content').scrollTop=0;
}
function openPlace(id){
  if(id==='room'){openPane('case');return;}
  place=id;setView('neighbourhood');
  $$('[data-place]').forEach(b=>b.classList.toggle('selected',b.dataset.place===id));
  if(id==='clinic'){
    openPane('admission',{keepPlan:true,keepView:true});place='clinic';
    $$('[data-place]').forEach(b=>b.classList.toggle('selected',b.dataset.place==='clinic'));
    $('#deskTitle').textContent='Clinic desk';$('#deskKind').textContent='Environmental consultation';$$('[data-neighbourhood-camera]').forEach(x=>x.setAttribute('aria-pressed',String(x.dataset.neighbourhoodCamera==='entrance')));send({type:'clinic-neighbourhood-camera',camera:'entrance'});return;
  }
  const info=LOCAL_PLACES[id];if(!info)return;
  $$('.pane').forEach(p=>p.hidden=p.id!=='pane-place');$('.desk-nav').hidden=true;
  $('#deskTitle').textContent=info.title;$('#deskKind').textContent=info.kind;
  $('#placeHeading').textContent=({garden:'Common garden',office:'Control permissions',maintenance:'Maintenance responsibilities',archive:'Case contents'})[id];$('#placeText').textContent=info.text;
  $('#placeActions').innerHTML='<button class="primary-action" id="placePrimary">'+(id==='office'?'Review Room 001 permissions':id==='archive'?'Export the current case':id==='maintenance'?'Trace maintenance relations':'Visit Room 001')+' <span aria-hidden="true">↗</span></button><button class="plain-action" id="placeRelations">View connected relations</button>';
  $('#placePrimary').onclick=()=>id==='office'?openPane('review',{keepView:true}):id==='archive'?exportCase():id==='maintenance'?(setView('network'),openRelation('maintenance')):openPane('case');
  $('#placeRelations').onclick=()=>{setView('network');openRelation(id);};
  $('.desk-content').scrollTop=0;
}
function openRelation(id){
  const node=RELATION_NODES.find(n=>n.id===id);if(!node)return;relationNode=id;
  $$('.pane').forEach(p=>p.hidden=p.id!=='pane-place');$('.desk-nav').hidden=true;
  $('#deskTitle').textContent=node.name;$('#deskKind').textContent='Room 001 relation';$('#placeHeading').textContent=node.kind==='thermal'?'Model dependency':node.kind==='evidence'?'Evidence path':node.kind==='authority'?'Authority and refusal':'Care context';$('#placeText').textContent=node.detail;
  const edges=RELATION_EDGES.filter(e=>e.from===id||e.to===id);
  $('#placeActions').innerHTML='<div class="relation-entry">'+edges.map(e=>{const target=e.from===id?e.to:e.from;return '<button data-related="'+target+'"><span>'+esc(e.label)+'</span><strong>'+esc(RELATION_NODES.find(n=>n.id===target).name)+'</strong></button>';}).join('')+'</div><button class="primary-action" id="relationAction">'+(id==='clinic'?'Inspect the Clinic assessment':id==='office'||id==='resident'?'Open the permission review':id==='archive'?'Export this case':id==='weather'?'Inspect the input sources':'Examine this room case')+' <span aria-hidden="true">↗</span></button>';
  $$('[data-related]').forEach(b=>b.onclick=()=>{setView('network');openRelation(b.dataset.related);});
  $('#relationAction').onclick=()=>id==='clinic'?openPane('classification',{keepView:true}):id==='office'||id==='resident'?openPane('review',{keepView:true}):id==='archive'?exportCase():id==='weather'?$('#methodDialog').showModal():openPane('case',{keepView:true});
  send({type:'clinic-network-selection',node:id});$('.desk-content').scrollTop=0;
}
function inspect(part){
  openPane('case',{keepPlan:true});send({type:'clinic-part',part});
  $$('[data-part]').forEach(b=>b.classList.toggle('active',b.dataset.part===part));
}
function updateCursor(){
  cursor=Math.max(0,Math.min(record.length-2,cursor));$('#cursor').value=String(cursor);
  const rows=condition().rows,r=rows[cursor];
  $('#sampleSource').textContent=planName();$('#sampleTime').textContent=date(r.t);$('#cursorDate').textContent=date(r.t);
  $('#indoorNow').textContent=fixed(r.indoor)+'°C';$('#outdoorNow').textContent=fixed(r.outdoor)+'°C';
  $('#windowNow').textContent=r.window===null?'Unknown':r.window>.5?'Open':'Closed';
  $('#windowSummary').textContent=r.window===null?'Opening state not recorded':r.window>.5?'Open in the selected interval':'Closed in the selected interval';
  $('#loggerSummary').textContent=fixed(r.indoor)+'°C in the selected '+(selectedPlan==='record'?'record':'model');
  $('#conditioningSummary').textContent=r.hvac===null?'Equipment state not recorded':pct(r.hvac)+' of the selected interval active';
  send({type:'clinic-sample',caseId:CASE.id,sample:{...r,source:planName(),review,classification:classify(study.recordMetrics,audit,protocol).title,provenance:imported?'Imported temperatures':'Generated demonstration',parameters:selectedPlan==='record'?null:condition().parameters}});
  if(plotGeometry){const {left,right,width,top,tempBottom,low,high}=plotGeometry;const x=left+(r.t-record[0].t)/(record.at(-1).t-record[0].t)*(width-left-right),y=top+(high-r.indoor)/(high-low)*(tempBottom-top);$('#plotCursor')?.setAttribute('x1',x);$('#plotCursor')?.setAttribute('x2',x);$('#plotPoint')?.setAttribute('cx',x);$('#plotPoint')?.setAttribute('cy',y);}
  renderBalance(r,cursor,rows);
  $('#temperaturePlot').dataset.cursor=String(cursor);document.body.dataset.plan=selectedPlan;document.body.dataset.cursor=String(cursor);
}
function renderBalance(r,index,rows){
  $('#balanceTime').textContent=date(r.t);
  const b=r.balance,dt=(rows[index+1]?.t-r.t)/1000;
  if(!b||!(dt>0)){$('#balanceRows').innerHTML='';$('#balanceStatus').textContent='Heat-flow components are unavailable in this record. Select a modelled plan to inspect its balance.';return;}
  const names={envelope:'Envelope',ventilation:'Outdoor air',internal:'Internal gains',conditioning:'Conditioning',storage:'Net storage'};
  const values=Object.entries(names).map(([key,name])=>({key,name,watts:b[key]*3600/dt})),max=Math.max(1,...values.map(v=>Math.abs(v.watts)));
  $('#balanceRows').innerHTML=values.map(v=>'<div class="heat-row '+v.key+'"><span>'+v.name+'</span><i><b style="'+(v.watts>=0?'left:50%':'right:50%')+';width:'+Math.abs(v.watts)/max*48+'%" class="'+(v.watts<0?'negative':'positive')+'"></b></i><strong>'+(v.watts>=0?'+':'−')+fixed(Math.abs(v.watts),0)+'</strong></div>').join('');
  $('#balanceStatus').textContent='Rounded interval means in W. Positive enters the room. Flows sum to storage before rounding.';
}
function path(rows,key,x,y){let d='',prev=null;for(const r of rows){if(!Number.isFinite(r[key])){prev=null;continue;}d+=(prev&&r.t-prev.t<=study.recordMetrics.q.nominal*1.5?'L':'M')+x(r.t).toFixed(2)+' '+y(r[key]).toFixed(2)+' ';prev=r;}return d;}
function drawPlot(){
  const width=Math.max(360,$('#temperaturePlot').clientWidth),height=146,left=56,right=10,top=23,tempBottom=86;
  const rows=condition().rows;
  const series=[{rows:record,key:'outdoor',colour:'#8c9d8c',dash:true,name:'Outdoor'},{rows,key:'indoor',colour:'#c8dcb4',name:'Indoor'}];
  if(compareTraces){for(const [id,c]of [['baseline','#cba176'],['combined','#80b191']])if(selectedPlan!==id)series.push({rows:study.conditions[id].rows,key:'indoor',colour:c,dash:true,name:id==='baseline'?'Existing':'Both changes'});}
  const vals=series.flatMap(s=>s.rows.map(r=>r[s.key])).filter(Number.isFinite);const low=Math.floor((Math.min(...vals)-.6)/2)*2,high=Math.ceil((Math.max(...vals)+.6)/2)*2;
  const x=t=>left+(t-record[0].t)/(record.at(-1).t-record[0].t)*(width-left-right),y=v=>top+(high-v)/(high-low)*(tempBottom-top);
  let body='',legendX=left;
  for(const s of series){body+='<path d="M'+legendX+' 7h11" stroke="'+s.colour+'" stroke-width="1.5"'+(s.dash?' stroke-dasharray="3 2"':'')+'/><text x="'+(legendX+16)+'" y="10" class="chart-label" style="font-size:9px;fill:'+s.colour+'">'+s.name+'</text>';legendX+=s.name.length*4.8+30;}
  const tick=(high-low)>20?10:(high-low)>12?4:2;
  for(let v=Math.ceil(low/tick)*tick;v<=high;v+=tick)body+='<path d="M'+left+' '+y(v)+'H'+(width-right)+'" stroke="#51614f" stroke-width=".6"/><text x="'+(left-6)+'" y="'+(y(v)+3)+'" text-anchor="end" class="chart-label">'+v+'°</text>';
  for(const [key,label,yy,colour]of [['hvac','Equipment',97,'#cba176'],['window','Opening',114,'#86ad91']]){
    body+='<text x="'+(left-7)+'" y="'+(yy+7)+'" text-anchor="end" class="chart-label" style="font-size:8px">'+label+'</text>';
    for(let i=0;i<rows.length-1;i++){const a=rows[i],b=rows[i+1];if(b.t-a.t>study.recordMetrics.q.nominal*1.5)continue;body+='<rect x="'+x(a.t)+'" y="'+yy+'" width="'+Math.max(.3,x(b.t)-x(a.t))+'" height="9" fill="'+(a[key]===null?'#b9bdb5':colour)+'" fill-opacity="'+(a[key]===null?.4:.08+.92*a[key])+'"/>';}
  }
  const ticks=width<500?3:7;
  for(let i=0;i<=ticks;i++){const t=record[0].t+(record.at(-1).t-record[0].t)*i/ticks;body+='<text x="'+x(t)+'" y="'+(height-3)+'" text-anchor="'+(i===0?'start':i===ticks?'end':'middle')+'" class="chart-label">'+esc(day(t))+'</text>';}
  for(const s of series)body+='<path d="'+path(s.rows,s.key,x,y)+'" fill="none" stroke="'+s.colour+'" stroke-width="'+(s.dash?1.1:1.7)+'"'+(s.dash?' stroke-dasharray="3 3"':'')+'/>';
  body+='<line id="plotCursor" class="plot-cursor" y1="'+top+'" y2="125"/><circle id="plotPoint" r="3" fill="#e3eecf"/>';
  $('#temperaturePlot').innerHTML='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 '+width+' '+height+'" aria-hidden="true">'+body+'</svg>';
  $('#plotTitle').textContent=planName();
  plotGeometry={width,height,left,right,top,tempBottom,low,high};updateCursor();
}
function renderComparison(){
  const items=[...PLANS];if(study.conditions.reviewed)items.push({id:'reviewed',name:'With reviewed permissions'});
  $('#conditionRows').innerHTML=items.map(p=>{const m=study.conditions[p.id].metrics;return '<tr class="'+(selectedPlan===p.id?'selected ':'')+(p.id==='reviewed'?'reviewed':'')+'"><td><button data-plan="'+p.id+'" aria-pressed="'+String(selectedPlan===p.id)+'">'+esc(p.name)+'</button></td><td>'+fixed(m.ratio,3)+'</td><td>'+pct(m.duty)+'</td><td>'+fixed(m.energy)+' kWh</td></tr>';}).join('');
  $$('[data-plan]').forEach(b=>b.onclick=()=>setPlan(b.dataset.plan));
  const b=study.conditions.baseline.metrics,o=study.conditions.opening.metrics,r=study.conditions.range.metrics;
  const difference=(m,n)=>Math.abs(m-n).toFixed(1);
  $('#comparisonFinding').textContent='Opening alone '+(o.energy>=b.energy?'adds ':'reduces ')+difference(o.energy,b.energy)+' kWh in this record. The wider temperature range '+(r.energy>=b.energy?'adds ':'reduces ')+difference(r.energy,b.energy)+' kWh. These are modelled thermal quantities under the stated assumptions.';
  const m=condition().metrics;$('#selectedIndicators').innerHTML='<h2>'+esc(planName())+'</h2><dl>'+register([['Indoor daily amplitude',fixed(m.inside?.amplitude,3)+' K'],['Outdoor daily amplitude',fixed(m.out?.amplitude,3)+' K'],['Signed peak difference',fixed(m.lag)+' h']])+'</dl><p>These describe the fitted daily cycle. A larger ratio does not establish a health benefit.</p>';
}
function renderClassification(){
  const m=study.recordMetrics,c=classify(m,audit,protocol),states=c.flags;
  $('#clinicVerdict').innerHTML='<span>Clinic assessment of the source record</span><strong>'+esc(c.title)+'</strong><p>'+(!c.sufficient?'The evidence checks must be resolved before the trial rule can be applied.':c.flag?'All three authored criteria are satisfied.':'The current record does not satisfy all three authored criteria.')+'</p>';
  const rows=[['Daily amplitude ratio',fixed(m.ratio,3),'R < '+fixed(protocol.ratio,2)],['Equipment active time',pct(m.duty),'D > '+pct(protocol.duty)],['Audited resident controls',c.controls+' of 4','N ≤ '+protocol.controls]];
  $('#criterionRows').innerHTML=rows.map(([name,value,rule],i)=>'<div><header><span>'+name+'</span><strong>'+value+'</strong></header><p>'+rule+' <em class="'+(states[i]===true?'criterion-met':'')+'">'+(states[i]===null?'Unknown':states[i]?'Criterion met':'Criterion not met')+'</em></p></div>').join('');
  for(const form of [$('#clinicCriteriaForm'),$('#protocolForm')]){form.elements.ratio.value=protocol.ratio;form.elements.duty.value=Math.round(protocol.duty*100);form.elements.controls.value=protocol.controls;}
}
function renderReview(){
  for(const key of ['resident','opening','thermostat','note'])$('#reviewForm').elements[key].value=review[key];
  const c=study.conditions.reviewed;
  if(!c){$('#reviewStatus').textContent='Review incomplete. Record the resident response and both permissions before evaluating the reviewed operation.';$('#reviewResult').innerHTML='';return;}
  const explanation=review.resident==='declined'?'The resident declines the changes. The reviewed calculation retains existing operation.':(review.opening==='granted'?'The opening schedule can enter the reviewed calculation. ':'The window remains closed in the reviewed calculation. ')+(review.thermostat==='granted'?'The wider temperature range is included.':'The existing thermostat range remains.');
  $('#reviewStatus').textContent=explanation;
  $('#reviewResult').innerHTML='<div class="review-outcome"><span>Reviewed operating scenario</span><strong>'+fixed(c.metrics.energy)+' kWh</strong><p>'+pct(c.metrics.duty)+' conditioning active time</p><button id="viewReviewed" class="plain-action">Show this operation in the room</button></div>';
  $('#viewReviewed').onclick=()=>{setView('room');setPlan('reviewed');};
}
function renderMethods(){
  const m=study.recordMetrics,q=m.q,c=classify(m,audit,protocol);
  $('#qualityRegister').innerHTML=register([['Record',recordName],['Provenance',imported?'Imported, not independently verified':'Generated weather and simulated indoor air'],['Paired readings',record.length],['Typical interval',fixed(q.nominal/60000,0)+' min'],['Valid time',fixed(q.hours)+' h'],['Temperature coverage',pct(q.coverage)],['Conditioning coverage',pct(q.hvacCoverage)],['Gaps',q.gaps]]);
  $('#assumptionsRegister').innerHTML=register([['Room volume',fixed(volume,3)+' m³'],['Envelope conductance','46 W K⁻¹'],['Fabric heat capacity','4.16 MJ K⁻¹'],['Background air changes','0.2 h⁻¹'],['Added opening air changes',fixed(settings.extraACH)+' h⁻¹'],['Heating and cooling','950 W and 1350 W thermal'],['Internal gains','95 W occupied, 24 W otherwise'],['Solar and moisture','Excluded'],['Model validation','No independent field validation yet']]);
  $('#classificationResult').textContent='Current record: '+c.title+'. '+(c.flag===null?'Evidence requirements are incomplete.':c.flag?'All three trial criteria hold.':'The criteria do not all hold.');
  $('#analysisRegister').innerHTML=register([['Indoor daily amplitude',m.inside?fixed(m.inside.amplitude,3)+' K':'Unresolved'],['Outdoor daily amplitude',m.out?fixed(m.out.amplitude,3)+' K':'Unresolved'],['Daily amplitude ratio',fixed(m.ratio,3)],['Indoor daily-fit R²',fixed(m.inside?.r2,3)],['Phase difference',Number.isFinite(m.lag)?fixed(m.lag)+' h':'Unresolved'],['Conditioning active time',pct(m.duty)],['Audited control channels',c.controls+' of 4']]);
  $('#recordFinding').textContent=(m.ratio!==null?'The fitted indoor daily cycle is '+(m.ratio<1?'smaller':'larger')+' than the outdoor cycle. ':'A daily indoor–outdoor comparison is unresolved. ')+(c.flag===null?'The current evidence does not support the trial classification.':c.flag?'The record meets the current trial rules.':'The current record does not meet all the Clinic’s trial rules.');
  renderClassification();
  const fine=simulate(record,study.conditions.combined.parameters,30),coarse=study.conditions.combined.rows;
  const max=Math.max(...fine.map((r,i)=>Math.abs(r.indoor-coarse[i].indoor)));
  $('#numericalCheck').textContent='For the combined plan, thirty- and sixty-second controller steps differ by at most '+fixed(max,3)+' K. This is a numerical check. Physical validation still needs independent data.';
}
function recompute({invalidateSensitivity=true}={}){
  study=calculateStudy(record,settings,review);
  if(selectedPlan==='reviewed'&&!study.conditions.reviewed)selectedPlan='combined';
  $('#cursor').max=record.length-2;$('#recordPeriod').textContent=day(record[0].t)+' to '+day(record.at(-1).t)+', '+fixed(study.recordMetrics.q.nominal/60000,0)+' min';
  $('#recordOrigin').textContent=imported?'Imported temperatures, constructed room':'Generated weather and modelled indoor air';
  $('#sourceCaption').textContent=imported?recordName+', New York display time':'Seven-day demonstration record, New York time';
  $('#recordQuality').textContent=fixed(study.recordMetrics.q.hours)+' valid hours';
  $('.desk-footer>span').textContent=imported?'Imported record, draft room':'Constructed case';
  renderComparison();renderReview();renderMethods();renderDischarge();drawPlot();
  if(invalidateSensitivity){if(sensitivityWorker)sensitivityWorker.terminate();sensitivityWorker=null;sensitivityResults=[];$('#sensitivityPlot').innerHTML='';$('#sensitivityStatus').textContent='The grid runs when requested.';$('#runSensitivity').disabled=false;}
}
function stop(){if(playing)clearInterval(playing);playing=null;$('#play').textContent='Play record';$('#play').setAttribute('aria-pressed','false');}
function resetReview(){review={...EMPTY_REVIEW};try{localStorage.removeItem(reviewKey);}catch{}}
function runSensitivity(){
  if(sensitivityWorker)sensitivityWorker.terminate();$('#runSensitivity').disabled=true;$('#sensitivityStatus').textContent='Calculating the first paired comparison';
  sensitivityWorker=new Worker('./study-worker.mjs',{type:'module'});const id=Date.now();
  sensitivityWorker.onmessage=({data})=>{
    if(data.id!==id)return;
    if(data.error){$('#sensitivityStatus').textContent=data.error;$('#runSensitivity').disabled=false;return;}
    if(data.results){sensitivityResults=data.results;renderSensitivity();sensitivityWorker.terminate();sensitivityWorker=null;$('#runSensitivity').disabled=false;}
    else $('#sensitivityStatus').textContent=data.progress+' of 81 paired comparisons calculated.';
  };
  sensitivityWorker.onerror=()=>{$('#sensitivityStatus').textContent='The sensitivity worker could not finish.';$('#runSensitivity').disabled=false;};
  sensitivityWorker.postMessage({id,rows:record,scenario:settings});
}
function renderSensitivity(){
  const vals=sensitivityResults.map(r=>r.delta).filter(Number.isFinite);
  if(!vals.length){$('#sensitivityStatus').textContent='The record has no resolvable daily ratio for these comparisons.';return;}
  const min=Math.min(...vals),max=Math.max(...vals),limit=Math.max(Math.abs(min),Math.abs(max),.001);
  let body='';sensitivityResults.forEach((r,i)=>{const x=66+(i%9)*25,y=22+(8-Math.floor(i/9))*25,amount=r.delta===null?0:Math.abs(r.delta)/limit;const colour=r.delta===null?'#ccc':r.delta>=0?'rgb('+[222-amount*146,232-amount*113,208-amount*128].map(Math.round).join(',')+')':'rgb('+[231-amount*63,219-amount*98,200-amount*103].map(Math.round).join(',')+')';body+='<rect x="'+x+'" y="'+y+'" width="23" height="23" fill="'+colour+'"><title>Conductance '+fixed(r.ua)+' W per K, additional air changes '+fixed(r.extraACH,2)+', ratio change '+fixed(r.delta,4)+'</title></rect>';});
  const t=(x,y,v,anchor='start')=>'<text x="'+x+'" y="'+y+'" text-anchor="'+anchor+'" class="chart-label">'+esc(v)+'</text>';
  body+=t(66,12,'Envelope conductance, W K⁻¹')+t(59,39,'69','end')+t(59,139,'46','end')+t(59,239,'23','end')+t(66,262,'0.5')+t(178,262,'2.75','middle')+t(289,262,'5','end')+t(178,283,'Added ventilation, h⁻¹','middle')+t(324,67,'81 paired calculations')+t(324,100,'Smallest change '+fixed(min,3))+t(324,126,'Largest change '+fixed(max,3))+t(324,175,'Green means a larger ratio')+t(324,197,'Ochre means a smaller ratio');
  $('#sensitivityPlot').innerHTML='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 570 294" role="img" aria-label="Completed sensitivity calculations">'+body+'</svg>';
  $('#sensitivityStatus').textContent='Completed. The ratio change ranges from '+fixed(min,3)+' to '+fixed(max,3)+'. This is a deterministic range of assumptions.';
}
function download(name,data,type){const url=URL.createObjectURL(new Blob([data],{type})),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),2000);}
function caseExport(){return {schema:'clinic-appointment-draft-08',appointment:{patient:'Fictional resident 001',reason:'Wants contact with outdoor conditions but has limited control of the room',visit:'Voluntary environmental consultation',recordScope:'One prepared room case',followUp:'Proposed one week after an agreed change; not scheduled or tested'},exported:new Date().toISOString(),case:CASE,geometry:{volume,clearArea},record:{name:recordName,provenance:imported?'Imported, not independently verified':'Generated weather and model-generated indoor temperature',rows:record},audit,protocol,settings,review:{...review,scope:'Fictional browser-local rehearsal'},metrics:study.recordMetrics,conditions:Object.fromEntries(Object.entries(study.conditions).map(([id,c])=>[id,{parameters:c.parameters,metrics:c.metrics}])),relations:{nodes:RELATION_NODES,edges:RELATION_EDGES},sensitivity:sensitivityResults,spatialScope:'Constructed neighbourhood. Only Room 001 has a thermal model. Daylight is illustrative.'};}
function exportCase(){download('Room-001-case-record.json',JSON.stringify(caseExport(),null,2),'application/json');}
function printCase(){
  const m=study.conditions.combined.metrics,c=classify(study.recordMetrics,audit,protocol);
  $('#printDocument').innerHTML='<p>The Human Rewilding Clinic</p><h1>Case 001, conditional environmental prescription</h1><p>Fictional resident: seeks more contact with outdoor conditions while having limited control of the room.</p><p class="print-source">Constructed institution. '+esc(imported?recordName:'Generated demonstration record')+'. '+esc(date(Date.now()))+'</p><h2>Room and evidence</h2><dl>'+register([['Room','3.60 × 3.20 × 2.70 m'],['Window','East, 1.50 × 1.20 m'],['Record',day(record[0].t)+' to '+day(record.at(-1).t)],['Current trial result',c.title]])+'</dl><h2>Proposed operation</h2><dl>'+register([['Opening',hour(settings.morningStart)+' to '+hour(settings.morningEnd)+' and '+hour(settings.eveningStart)+' to '+hour(settings.eveningEnd)],['Thermostat range',fixed(settings.deadband)+' K total around 22°C'],['Added ventilation',fixed(settings.extraACH)+' air changes per hour, assumed'],['Predicted thermal energy',fixed(m.energy)+' kWh'],['Predicted active time',pct(m.duty)]])+'</dl><h2>Review rehearsal</h2><dl>'+register([['Resident response',review.resident],['Window permission',review.opening],['Thermostat permission',review.thermostat]])+'</dl><p>'+esc(review.note)+'</p><p class="print-source">The model excludes solar gains, moisture, local airflow and health effects. Permission responses belong to a fictional local review. Actual site conditions and authority need independent assessment.</p>';
  const comparison='<h2>Operating comparisons</h2><table><thead><tr><th>Plan</th><th>Daily ratio</th><th>Active time</th><th>Thermal energy</th></tr></thead><tbody>'+PLANS.map(p=>{const x=study.conditions[p.id].metrics;return '<tr><td>'+p.name+'</td><td>'+fixed(x.ratio,3)+'</td><td>'+pct(x.duty)+'</td><td>'+fixed(x.energy)+' kWh</td></tr>';}).join('')+'</tbody></table>';
  const allowed=study.conditions.reviewed?.metrics;
  $('#printDocument').insertAdjacentHTML('beforeend',comparison+'<h2>Reviewed operation</h2><p>'+esc(allowed?fixed(allowed.energy)+' kWh thermal energy, '+pct(allowed.duty)+' equipment active time, daily ratio '+fixed(allowed.ratio,3)+'.':'The review is incomplete. No authorised operation is inferred.')+'</p><h2>Clinic criteria</h2><p>'+esc('R < '+protocol.ratio+', D > '+pct(protocol.duty)+', N ≤ '+protocol.controls+'. These are authored institutional rules, not validated health thresholds.')+'</p>');
  $('#printDocument').insertAdjacentHTML('beforeend','<h2>Follow-up proposal</h2><p>One week after an agreed change, compare a new room record and the resident’s account of the experience. This follow-up has not been scheduled or tested.</p>');window.print();
}

$$('[data-view]').forEach(b=>b.onclick=()=>{if(b.dataset.view==='room'||b.dataset.view==='plan')openPane('case',{keepPlan:true,keepView:true});setView(b.dataset.view);});
$$('[data-place]').forEach(b=>b.onclick=()=>openPlace(b.dataset.place));
$$('[data-pane]').forEach(b=>b.onclick=()=>openPane(b.dataset.pane,{keepView:true}));
$$('[data-part]').forEach(b=>b.onclick=()=>inspect(b.dataset.part));
$$('[data-neighbourhood-camera]').forEach(b=>b.onclick=()=>{$$('[data-neighbourhood-camera]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));send({type:'clinic-neighbourhood-camera',camera:b.dataset.neighbourhoodCamera});});
$$('[data-inspect]').forEach(b=>b.onclick=()=>inspect(b.dataset.inspect));
$('#home').onclick=e=>{e.preventDefault();openPlace('clinic');};
$('#returnRoom').onclick=()=>openPane('case');$('#startComparison').onclick=$('#classifyToCompare').onclick=()=>openPane('comparison');$('#startReview').onclick=()=>openPane('review',{keepPlan:true});$('#startClassification').onclick=()=>openPane('classification',{keepView:true});
$('#openNetwork').onclick=()=>{setView('network');openRelation('room');};
$('#relationLayers').innerHTML=RELATION_LAYERS.map(l=>'<button data-relation-layer="'+l.id+'" aria-pressed="'+(l.id==='all')+'"><i style="background:'+l.colour+'"></i>'+l.name+'</button>').join('');
$$('[data-relation-layer]').forEach(b=>b.onclick=()=>{relationLayer=b.dataset.relationLayer;$$('[data-relation-layer]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));send({type:'clinic-network-layer',layer:relationLayer});});
$('#methodsButton').onclick=$('#notesFromDesk').onclick=()=>$('#methodDialog').showModal();$('#closeMethods').onclick=()=>$('#methodDialog').close();
$('#methodDialog').addEventListener('click',e=>{if(e.target===$('#methodDialog')){const r=e.target.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)e.target.close();}});
$('#saveView').onclick=()=>send({type:'clinic-save-view'});
$('#cursor').addEventListener('input',e=>{stop();cursor=Number(e.target.value);updateCursor();});
$('#play').onclick=()=>{if(playing){stop();return;}$('#play').textContent='Pause record';$('#play').setAttribute('aria-pressed','true');playing=setInterval(()=>{cursor=(cursor+1)%(record.length-1);updateCursor();},350);};
$('#showEvidence').onclick=()=>{compareTraces=!compareTraces;$('#showEvidence').setAttribute('aria-pressed',String(compareTraces));drawPlot();};
let scrub=false;
function scrubAt(e){const r=$('#temperaturePlot').getBoundingClientRect(),g=plotGeometry;if(!g)return;const fraction=Math.max(0,Math.min(1,((e.clientX-r.left)/r.width*g.width-g.left)/(g.width-g.left-g.right)));cursor=Math.round(fraction*(record.length-2));updateCursor();}
$('#temperaturePlot').addEventListener('pointerdown',e=>{stop();scrub=true;e.currentTarget.setPointerCapture(e.pointerId);scrubAt(e);});$('#temperaturePlot').addEventListener('pointermove',e=>{if(scrub)scrubAt(e);});$('#temperaturePlot').addEventListener('pointerup',()=>scrub=false);$('#temperaturePlot').addEventListener('pointercancel',()=>scrub=false);
$('#auditForm').onsubmit=e=>{e.preventDefault();audit=Object.fromEntries(new FormData(e.target));renderMethods();$('#auditStatus').textContent='Survey entries updated. The temperature record is unchanged.';};
$('#protocolForm').onsubmit=$('#clinicCriteriaForm').onsubmit=e=>{e.preventDefault();const v=Object.fromEntries(new FormData(e.target));protocol={...protocol,ratio:Number(v.ratio),duty:Number(v.duty)/100,controls:Number(v.controls)};renderMethods();updateCursor();};
$('#operatingForm').onsubmit=e=>{
  e.preventDefault();const v=Object.fromEntries(new FormData(e.target)),next={...settings};
  for(const key of ['morningStart','morningEnd','eveningStart','eveningEnd']){const [h,m]=v[key].split(':').map(Number);next[key]=(h===0&&m===0&&key.endsWith('End'))?24:h+m/60;}
  next.deadband=Number(v.deadband);next.extraACH=Number(v.extraACH);
  if(!Object.values(next).filter(v=>typeof v==='number').every(Number.isFinite)||next.morningStart>=next.morningEnd||next.eveningStart>=next.eveningEnd||next.morningEnd>next.eveningStart){$('#operatingStatus').textContent='Use two non-overlapping periods, with morning first.';return;}
  settings=next;resetReview();recompute();setPlan('combined');$('#operatingStatus').textContent='All plans recalculated. The revised proposal needs a new review.';
};
$('#reviewForm').onsubmit=e=>{
  e.preventDefault();review={...Object.fromEntries(new FormData(e.target)),updated:new Date().toISOString()};
  try{localStorage.setItem(reviewKey,JSON.stringify({caseId:CASE.id,recordKind:imported?'imported':'constructed',settings,review}));}catch{}
  recompute({invalidateSensitivity:false});if(study.conditions.reviewed){setPlan('reviewed');setView('room');}
};
$('#runSensitivity').onclick=runSensitivity;$('#downloadCase').onclick=exportCase;$('#printCase').onclick=printCase;
$('#downloadCSV').onclick=()=>download('Room-001-temperatures.csv',toCSV(record),'text/csv');
$('#importRecord').onclick=()=>$('#csvInput').click();
$('#csvInput').onchange=async e=>{
  const file=e.target.files[0];if(!file)return;
  try{if(file.size>8e6)throw Error('Use a temperature record smaller than 8 MB.');const rows=parseCSV(await file.text());if(rows.length>20000)throw Error('Use up to 20,000 paired readings in this browser study.');stop();record=rows;recordName=file.name;imported=true;cursor=0;selectedPlan='record';resetReview();recompute();$('#importStatus').textContent='Imported '+record.length+' paired readings. The room geometry and thermal assumptions remain those of Room 001.';}
  catch(error){$('#importStatus').textContent='Import not applied: '+error.message;}
  e.target.value='';
};
$('#restoreRecord').onclick=()=>{stop();record=makeDemo();recordName='Seven-day demonstration';imported=false;cursor=56;selectedPlan='record';resetReview();recompute();$('#importStatus').textContent='Restored the generated demonstration record.';};
addEventListener('message',e=>{
  if(e.origin!==location.origin||e.source!==frame.contentWindow)return;
  if(e.data?.type==='clinic-viewer-ready'){spatialReady=true;$('#sceneStatus').textContent='Constructed spatial study';setView(view);if(pane==='admission')send({type:'clinic-neighbourhood-camera',camera:'entrance'});updateCursor();}
  if(e.data?.type==='clinic-viewer-error')$('#sceneStatus').textContent=e.data.message;
  if(e.data?.type==='clinic-spatial-view'&&view!==e.data.view)setView(e.data.view);
  if(e.data?.type==='clinic-place')openPlace(e.data.place);
  if(e.data?.type==='clinic-relation')openRelation(e.data.node);
  if(e.data?.type==='clinic-part'){openPane('case',{keepPlan:true,keepView:true});$$('[data-part]').forEach(b=>b.classList.toggle('active',b.dataset.part===e.data.part));}
});

function renderDischarge(){
  const c=study.conditions.reviewed,judgement=classify(study.recordMetrics,audit,protocol);
  const opening=review.resident==='accepted'&&review.opening==='granted';
  const thermostat=review.resident==='accepted'&&review.thermostat==='granted';
  const status=!c?'Permission review incomplete':review.resident==='declined'?'Resident declines the proposed change':'Conditional operating prescription';
  const plan=!c?'No operation is authorised by this rehearsal.':review.resident==='declined'?'Existing operation is retained.':(opening?'Opening from '+hour(settings.morningStart)+' to '+hour(settings.morningEnd)+' and '+hour(settings.eveningStart)+' to '+hour(settings.eveningEnd)+', when outdoor air is between 14°C and 26°C.':'Scheduled opening is not included.')+' '+(thermostat?'Thermostat range widened to '+fixed(settings.deadband)+' K total around 22°C.':'Existing thermostat range retained.');
  $('#caseOutcome').innerHTML='<p class="appointment-kicker">Consultation record</p><h2 class="outcome-title">'+status+'</h2><p class="case-intro">The resident’s concern remains part of the case. A modelled temperature change cannot establish a health outcome.</p><h3>Clinic assessment</h3><p>'+esc(judgement.title)+'. This judgement follows the Clinic’s current trial criteria.</p><h3>Agreed operation</h3><p>'+esc(plan)+'</p>'+(c?'<dl class="room-register"><div><dt>Predicted thermal energy</dt><dd>'+fixed(c.metrics.energy)+' kWh</dd></div><div><dt>Equipment active time</dt><dd>'+pct(c.metrics.duty)+'</dd></div></dl>':'')+'<h3>Responsibilities</h3><p>The resident may accept or decline. The building authority records opening and thermostat permissions. Hardware and maintenance conditions still require a site check.</p>'+(review.note?'<blockquote class="review-note">'+esc(review.note)+'</blockquote>':'')+'<h3>Follow-up proposal</h3><p>One week after an agreed change, compare a new room record and the resident’s account of the experience. This follow-up has not been scheduled or tested.</p><p class="quiet">Fictional case. Generated source data. No independently validated physical prediction or medical outcome.</p>';
}
$('#beginConsultation').onclick=()=>openPane('case');
$('#finishConsultation').onclick=()=>openPane('discharge',{keepPlan:true,keepView:true});
$('#printOutcome').onclick=printCase;$('#exportOutcome').onclick=exportCase;
$('#reviseReview').onclick=()=>openPane('review',{keepPlan:true,keepView:true});

new ResizeObserver(()=>{if(study)drawPlot();}).observe($('#temperaturePlot'));
document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});
setView(view);recompute();openPlace('clinic');
