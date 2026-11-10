import {CLINIC} from './clinic-spec.mjs';
import {createSession,transition,visibleRecord,canEditCriteria} from './clinic-session.mjs';
import {renderClinicPlan} from './clinic-plan.mjs';

const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const num=(v,n=1)=>Number.isFinite(v)?v.toFixed(n):'Unknown';
const names={reception:'Consultation',trial:'Environmental trial',records:'Operations and records'};
export function mountClinic(bridge){
  const $=s=>document.querySelector(s),pane=$('#pane-clinic');
  let session=createSession(),selected='reception',pose='overview',active=false,planVisible=false;
  function spatial(preview={}){
    const c=bridge.context();
    bridge.send({type:'clinic-space',...visibleRecord(session),role:session.role,zone:selected,camera:pose,cutaway:pose==='overview',...preview,
      indoor:c.indoor,outdoor:c.outdoor,source:c.source,classification:c.classification,events:session.events});
  }
  function dispatch(action){
    const before=session;session=transition(session,action);
    if(action.type==='criteria'&&session.ruleVersion!==before.ruleVersion)bridge.applyCriteria(session.criteria);
    if(action.type==='start'&&session.status==='active'){selected='trial';pose='trial';}
    if(action.type==='role'&&selected==='records'){if(session.role==='staff'&&session.zone!=='records')session=transition(session,{type:'zone',value:'records'});pose=session.role==='staff'?'records':'publicRecord';}
    if(action.type==='stop'||action.type==='patient-stop'||action.type==='pause'||action.type==='end'||action.type==='consent'&&!action.value)bridge.pause();
    render();spatial();return session;
  }
  function choose(zone,{overview=false}={}){
    if(!names[zone])return;
    if(session.zone!==zone)session=transition(session,{type:'zone',value:zone});selected=zone;
    pose=overview?'overview':zone==='records'&&session.role==='patient'?'publicRecord':zone;
    render();spatial();
  }
  function audit(){
    if(!session.events.length)return '<p class="clinic-empty">No changes have been recorded.</p>';
    return '<ol class="clinic-audit">'+session.events.slice().reverse().map(e=>'<li><span class="audit-number">'+String(e.seq).padStart(2,'0')+'</span><div><span class="audit-actor">'+esc(e.actor)+'<span>'+esc(e.category)+'</span></span><p>'+esc(e.detail)+'</p>'+(e.reason?'<p class="audit-reason">Reason: '+esc(e.reason)+'</p>':'')+'</div></li>').join('')+'</ol>';
  }
  function ownCase(){
    const c=bridge.context();
    return '<div class="clinic-own-case"><span>Patient-facing case window</span><h3>Room 001</h3><dl><div><dt>Record</dt><dd>'+esc(c.source)+'</dd></div><div><dt>Indoor air</dt><dd>'+num(c.indoor)+'°C</dd></div><div><dt>Outdoor air</dt><dd>'+num(c.outdoor)+'°C</dd></div><div><dt>Clinic assessment</dt><dd>'+esc(c.classification)+'</dd></div><div><dt>Rule version</dt><dd>'+String(session.ruleVersion).padStart(2,'0')+'</dd></div></dl><p>The temperatures belong to the patient’s home case, not this Clinic space.</p><button type="button" data-clinic-action="case" class="clinic-text-action">Open the prepared room case <span aria-hidden="true">↗</span></button></div>';
  }
  function consultation(){
    return '<p class="clinic-lead">“I know the weather from my phone. My room feels the same all day.”</p><p class="clinic-body">The resident brings a concern. At the shared table, patient and clinician review what the appointment will record and which changes the patient can stop.</p><div class="clinic-material-note"><span>In this space</span><p>Acoustic textile screens, equal-height seats and a shared writing surface. The consent document faces both people.</p></div><label class="clinic-consent"><input id="clinicConsent" type="checkbox" '+(session.consent?'checked ':'')+(session.role!=='patient'||session.status==='ended'?'disabled':'')+'><span>I agree to this trial. I can pause or leave it.</span></label><button type="button" data-clinic-action="start" class="clinic-main-action" '+(session.role!=='patient'||!session.consent||session.status==='ended'?'disabled':'')+'>'+(session.status==='paused'?'Resume the trial':session.status==='active'?'Go to the trial':'Begin the trial')+' <span aria-hidden="true">↗</span></button><button type="button" data-clinic-action="case" class="clinic-text-action">Review the prepared home record</button><details class="clinic-details"><summary>The larger Clinic</summary><p>Environmental Variability is the working department. Microbial and Metabolic Ecologies and Ecological Reciprocity will be introduced through proposed cases and artifacts.</p></details>';
  }
  function trial(){
    const allowed=session.status==='active'&&session.consent,disabled=allowed?'':'disabled';
    return '<p class="clinic-body">The body support faces a layered outdoor boundary. A clear leaf, removable mesh cassette and external louvres can be adjusted separately. The patient holds a stop control.</p><div class="clinic-apparatus"><label for="clinicOpening">Clear-leaf travel <output id="clinicOpeningValue">'+Math.round(session.opening*110)+' cm</output></label><input id="clinicOpening" type="range" min="0" max="110" step="5" value="'+Math.round(session.opening*110)+'" '+disabled+'><label for="clinicShade">Louvre angle <output id="clinicShadeValue">'+Math.round(session.shade*75)+'°</output></label><input id="clinicShade" type="range" min="0" max="75" step="1" value="'+Math.round(session.shade*75)+'" '+disabled+'><label for="clinicFilter">Replaceable boundary layer</label><select id="clinicFilter" '+disabled+'><option value="filtered" '+(session.filter==='filtered'?'selected':'')+'>Mesh cassette in place</option><option value="bypass" '+(session.filter==='bypass'?'selected':'')+'>Cassette drawn aside</option></select></div><p class="clinic-technical">These controls move the architectural model. Their airflow, filtration and climate effects have not been calculated.</p><div class="clinic-stop-row"><button type="button" data-clinic-action="stop" class="clinic-stop" '+(session.status!=='active'||session.role!=='patient'?'disabled':'')+'>Pause the trial</button><button type="button" data-clinic-action="end" class="clinic-text-action" '+(session.role!=='patient'||session.status==='ended'?'disabled':'')+'>End this session</button></div>'+(session.status==='idle'?'<button type="button" data-clinic-action="consultation" class="clinic-main-action">Return to the consent table</button>':session.status==='paused'?'<button type="button" data-clinic-action="start" class="clinic-main-action" '+(session.role!=='patient'||!session.consent?'disabled':'')+'>Resume with patient consent</button>':'')+'<div class="clinic-material-note"><span>Why the mechanisms are exposed</span><p>Layered tracks, replaceable filters and an accessible stop make the arrangement of environmental contact visible.</p></div><button type="button" data-clinic-action="records" class="clinic-text-action">Visit the case window <span aria-hidden="true">↗</span></button>';
  }
  function records(){
    const editable=canEditCriteria(session),c=session.criteria;
    return '<p class="clinic-body">'+(session.role==='staff'?'The service bench sits behind a translucent partition. Staff can revise the current case’s trial criteria; each revision remains visible at the patient-facing window.':'The patient stays outside the staff work area. Their own case, current criteria and every recorded revision remain visible at this window.')+'</p>'+ownCase()+'<details class="clinic-details" '+(session.role==='staff'?'open':'')+'><summary>Classification criteria</summary><p>These are the artwork’s trial rules. A change can alter the assessment without changing the temperature record.</p><form id="clinicRuleForm"><label>Daily amplitude ratio below<input name="ratio" required type="number" min="0.01" max="2" step="0.01" value="'+c.ratio+'" '+(editable?'':'disabled')+'></label><label>Equipment active time above<span class="clinic-rule-value"><input name="duty" required type="number" min="0" max="100" value="'+Math.round(c.duty*100)+'" '+(editable?'':'disabled')+'><span>%</span></span></label><label>Available controls at most<input name="controls" required type="number" min="0" max="4" step="1" value="'+c.controls+'" '+(editable?'':'disabled')+'></label>'+(editable?'<label>Reason for this revision<textarea name="reason" required minlength="8" maxlength="500" rows="2" placeholder="What is this revision testing?"></textarea></label><button type="submit" class="clinic-main-action">Record a new rule version</button>':'<p class="clinic-technical">Criterion editing belongs to the staff perspective. The patient can read the rule history.</p>')+'</form></details><details class="clinic-details"><summary>Visible change history <span>'+session.events.length+'</span></summary>'+audit()+'</details><p class="clinic-technical">The rehearsal stays in this page’s memory. Reloading clears it. Ending the session locks apparatus changes and further rule edits.</p><button type="button" data-clinic-action="export" class="clinic-text-action">Export this rehearsal record</button>';
  }
  function render(){
    pane.innerHTML='<div class="clinic-perspective"><span>Demonstration perspective</span><div><button type="button" data-clinic-role="patient" aria-pressed="'+(session.role==='patient')+'">Patient</button><button type="button" data-clinic-role="staff" aria-pressed="'+(session.role==='staff')+'">Staff</button></div></div><div class="clinic-session-state"><span class="clinic-session-light '+(session.recording?'recording':'')+'"></span><span>'+(session.status==='active'?'Trial in progress':session.status==='paused'?'Paused by the patient':session.status==='ended'?'Session ended':'Before the trial')+'</span><span>Case 001</span></div><div class="clinic-zone-copy">'+(selected==='reception'?consultation():selected==='trial'?trial():records())+'</div><p id="clinicNotice" class="clinic-notice" role="status">'+esc(session.notice)+'</p>'+(session.status==='ended'?'<button type="button" data-clinic-action="reset" class="clinic-text-action">Clear this record and begin a new rehearsal</button>':'');
    if(active){$('#deskTitle').textContent=names[selected];$('#deskKind').textContent='Clinic architectural study';}
    document.querySelectorAll('[data-clinic-zone]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.clinicZone===selected)));
    $('#clinicPlanCanvas').innerHTML=renderClinicPlan(selected);
    bind();
    for(const form of [$('#clinicCriteriaForm'),$('#protocolForm')])if(form){form.querySelectorAll('input,button').forEach(e=>e.disabled=true);}
  }
  function bind(){
    pane.querySelectorAll('[data-clinic-role]').forEach(b=>b.onclick=()=>dispatch({type:'role',value:b.dataset.clinicRole}));
    const consent=$('#clinicConsent');if(consent)consent.onchange=e=>dispatch({type:'consent',value:e.target.checked});
    for(const [id,type,scale,label] of [['clinicOpening','opening',110,'cm'],['clinicShade','shade',75,'°']]){const el=$('#'+id);if(!el)continue;el.oninput=e=>{$('#'+id+'Value').textContent=e.target.value+(label==='cm'?' cm':'°');spatial({[type]:Number(e.target.value)/scale});};el.onchange=e=>dispatch({type,value:Number(e.target.value)/scale});}
    const filter=$('#clinicFilter');if(filter)filter.onchange=e=>dispatch({type:'filter',value:e.target.value});
    const form=$('#clinicRuleForm');if(form)form.onsubmit=e=>{e.preventDefault();const v=Object.fromEntries(new FormData(form));dispatch({type:'criteria',value:{ratio:Number(v.ratio),duty:Number(v.duty)/100,controls:Number(v.controls)},reason:String(v.reason||'')});};
    pane.querySelectorAll('[data-clinic-action]').forEach(b=>b.onclick=()=>{
      const action=b.dataset.clinicAction;
      if(['start','stop','end'].includes(action))dispatch({type:action});
      else if(action==='consultation')choose('reception');
      else if(action==='records')choose('records');
      else if(action==='case')bridge.openCase();
      else if(action==='export')download();
      else if(action==='reset'){session=createSession();bridge.applyCriteria(session.criteria);choose('reception');}
    });
  }
  function download(){const data={kind:'Clinic architectural rehearsal',geometry:CLINIC,status:'Fictional service and spatial controls; no Clinic climate or health simulation',session:visibleRecord(session)};const u=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'})),a=document.createElement('a');a.href=u;a.download='Clinic-001-rehearsal.json';a.click();URL.revokeObjectURL(u);}
  document.querySelectorAll('[data-clinic-zone]').forEach(b=>b.onclick=()=>choose(b.dataset.clinicZone));
  $('#clinicOverview').onclick=()=>{pose='overview';spatial();$('#clinicPlanSheet').hidden=true;planVisible=false;$('#clinicPlanToggle').setAttribute('aria-pressed','false');};
  $('#clinicPlanToggle').onclick=()=>{planVisible=!planVisible;$('#clinicPlanSheet').hidden=!planVisible;$('#clinicPlanToggle').setAttribute('aria-pressed',String(planVisible));};
  $('#clinicPlanClose').onclick=()=>{planVisible=false;$('#clinicPlanSheet').hidden=true;$('#clinicPlanToggle').setAttribute('aria-pressed','false');};
  const route=e=>{const z=e.target.closest('[data-clinic-plan-zone]');if(z){choose(z.dataset.clinicPlanZone);planVisible=false;$('#clinicPlanSheet').hidden=true;$('#clinicPlanToggle').setAttribute('aria-pressed','false');}};
  $('#clinicPlanCanvas').onclick=route;$('#clinicPlanCanvas').onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();route(e);}};
  $('#clinicPlanSave').onclick=()=>{const u=URL.createObjectURL(new Blob([renderClinicPlan(selected)],{type:'image/svg+xml'})),a=document.createElement('a');a.href=u;a.download='Clinic-architectural-plan.svg';a.click();URL.revokeObjectURL(u);};
  render();
  return {
    open(zone='reception'){active=true;bridge.pause();bridge.activate();choose(zone,{overview:zone==='reception'&&session.status==='idle'});},
    sync(){if(active)spatial();},
    leave(){active=false;planVisible=false;$('#clinicPlanSheet').hidden=true;$('#clinicPlanToggle').setAttribute('aria-pressed','false');},
    pauseTrial(){dispatch({type:'patient-stop'});},
    mayEditCriteria:()=>canEditCriteria(session),
    reviseRules(value,reason='Staff changes criteria from the case interface.'){return dispatch({type:'criteria',value,reason});},
    exportRecord:()=>visibleRecord(session)
  };
}
