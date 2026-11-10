import {CLINIC} from './clinic-spec.mjs';
// A local architectural rehearsal, not authentication or a medical record.
const ROLES=new Set(['patient','staff']);
const ZONES=new Set(['reception','trial','records']);
const FILTERS=new Set(['filtered','bypass']);
const RETENTION='Kept in this page’s memory only. Reloading clears the session.';
const own=o=>Object.fromEntries(Object.entries(o));

function seal(state){
  Object.freeze(state.criteria);
  state.events.forEach(event=>{if(event.change)Object.freeze(event.change);Object.freeze(event);});
  Object.freeze(state.events);
  return Object.freeze(state);
}
function update(state,patch={},event){
  const events=event?[...state.events,{seq:state.events.length+1,caseId:state.caseId,actor:state.role,...event}]:[...state.events];
  return seal({...state,...patch,criteria:{...(patch.criteria||state.criteria)},events});
}
function deny(state,notice){return update(state,{notice});}
function event(type,category,detail,change){return {type,category,detail,...(change?{change}:{} )};}
function validCriteria(c){
  return c&&Number.isFinite(c.ratio)&&c.ratio>=.01&&c.ratio<=2&&
    Number.isFinite(c.duty)&&c.duty>=0&&c.duty<=1&&
    Number.isInteger(c.controls)&&c.controls>=0&&c.controls<=4;
}

export function createSession(){
  return seal({
    caseId:'Room 001',role:'patient',status:'idle',consent:false,zone:'reception',recording:false,
    opening:0,shade:.45,filter:'filtered',criteria:{ratio:.25,duty:.7,controls:1},ruleVersion:1,
    events:[],notice:'The patient decides whether to begin.',retention:RETENTION
  });
}

export function canEditCriteria(state){return state.role==='staff'&&state.status!=='ended';}

/** Expected refusals return a notice. Every accepted change returns a new state. */
export function transition(state,action={}){
  const {type,value}=action;
  // Changing the demonstration viewpoint never grants authority over consent.
  if(type==='role'){
    if(!ROLES.has(value))return deny(state,'Choose the patient or staff perspective.');
    if(value===state.role)return deny(state,'This perspective is already selected.');
    const zone=value==='patient'&&state.zone==='records'?'trial':state.zone;
    const notice=value==='patient'&&state.zone==='records'?'The patient can inspect their own case at the public record window.':
      'Demonstration perspective changed. This is not a sign-in or an access-control system.';
    return update(state,{role:value,zone,notice},state.status==='ended'?null:
      event('role','perspective','Demonstration perspective changed from '+state.role+' to '+value+'.'));
  }
  if(type==='zone'){
    if(!ZONES.has(value))return deny(state,'Choose a consultation, trial or records position.');
    if(value==='records'&&state.role!=='staff')return deny(state,'The operations room is staff-only in this rehearsal. The patient can see their own case and rule history at the public record window.');
    if(value===state.zone)return deny(state,'This position is already selected.');
    return update(state,{zone:value,notice:value==='records'?'Staff access to operations and the current case.':'The current case remains available to the patient.'},
      state.status==='ended'?null:event('zone','access','The '+state.role+' perspective enters '+value+'.'));
  }
  if(state.status==='ended')return deny(state,'This session has ended. Begin a new session to change its apparatus or criteria.');

  if(type==='patient-stop'){
    if(state.status!=='active')return deny(state,'There is no active trial to pause.');
    return update(state,{status:'paused',recording:false,opening:0,notice:'Paused with the patient’s physical stop control. The aperture closes and session observation stops.'},
      {...event('patient-stop','session','Patient presses the physical stop control. The aperture closes and session observation stops.'),actor:'patient'});
  }

  if(type==='consent'){
    if(state.role!=='patient')return deny(state,'Only the patient can give or withdraw consent.');
    if(typeof value!=='boolean')return deny(state,'Consent must be explicitly given or withdrawn.');
    if(value===state.consent)return deny(state,value?'Consent is already recorded.':'Consent has not been given.');
    const pause=state.status==='active'&&!value;
    return update(state,{
      consent:value,...(!value?{recording:false,opening:0}:{}),...(pause?{status:'paused'}:{}),
      notice:value?'Consent recorded. The patient may start or leave the trial.':'Consent withdrawn. The aperture closes and session observation stops.'
    },event('consent','consent',value?'Patient gives consent to this architectural trial.':'Patient withdraws consent. Session observation stops; the aperture closes.'));
  }
  if(type==='start'){
    if(state.role!=='patient')return deny(state,'Staff cannot start or resume a patient’s trial.');
    if(!state.consent)return deny(state,'The patient must explicitly consent before a trial can begin.');
    if(state.status==='active')return deny(state,'The trial is already active.');
    const resumed=state.status==='paused';
    return update(state,{status:'active',zone:'trial',recording:true,notice:'Trial active. Only deliberate apparatus changes are recorded; there is no body monitoring.'},
      event('start','session',resumed?'Patient resumes the trial.':'Patient starts the trial.'));
  }
  if(type==='stop'||type==='pause'){
    if(state.role!=='patient')return deny(state,'Only the patient starts, pauses or resumes this trial.');
    if(state.status!=='active')return deny(state,'There is no active trial to pause.');
    return update(state,{status:'paused',recording:false,opening:0,notice:'Paused by the patient. The aperture closes. No further apparatus observations are recorded.'},
      event('stop','session','Patient pauses the trial. The aperture closes and session observation stops.'));
  }
  if(type==='end'){
    if(state.role!=='patient')return deny(state,'Only the patient ends this trial.');
    return update(state,{status:'ended',recording:false,opening:0,notice:'Session ended. Its case and audit remain readable until this page is reloaded.'},
      event('end','session','Patient ends the session. Apparatus changes and criterion edits are locked for this case.'));
  }
  if(type==='criteria'){
    if(!canEditCriteria(state))return deny(state,'Only the staff perspective can change Clinic criteria. The patient can read every revision.');
    if(!validCriteria(value))return deny(state,'Criteria need a ratio from 0.01 to 2, an active-time fraction from 0 to 1, and an integer control count from 0 to 4.');
    if(['ratio','duty','controls'].every(k=>state.criteria[k]===value[k]))return deny(state,'These criteria are unchanged. No new version has been created.');
    const next=own({ratio:value.ratio,duty:value.duty,controls:value.controls});
    const detail='Staff changes Clinic criteria from R < '+state.criteria.ratio+', D > '+Math.round(state.criteria.duty*100)+'%, N ≤ '+state.criteria.controls+
      ' to R < '+next.ratio+', D > '+Math.round(next.duty*100)+'%, N ≤ '+next.controls+'. The temperature record is unchanged.';
    const reason=typeof action.reason==='string'?action.reason.trim().slice(0,500):'';
    const revision={...event('criteria','governance',detail,{fromVersion:state.ruleVersion,toVersion:state.ruleVersion+1,ratio:next.ratio,duty:next.duty,controls:next.controls}),...(reason?{reason}:{})};
    return update(state,{criteria:next,ruleVersion:state.ruleVersion+1,notice:'Rule revision recorded and visible to the patient. Room temperatures have not changed.'},
      revision);
  }
  if(['opening','shade','filter'].includes(type)){
    if(!state.consent||state.status!=='active'||!state.recording)return deny(state,'Apparatus changes require an active trial and patient consent. Staff cannot override a pause.');
    if(type==='filter'?!FILTERS.has(value):!(Number.isFinite(value)&&value>=0&&value<=1))return deny(state,type==='filter'?'Choose the filter cassette or bypass position.':'The apparatus position must be between 0 and 1.');
    if(state[type]===value)return deny(state,'This apparatus position is unchanged.');
    const names={opening:'Aperture',shade:'Shading',filter:'Filter cassette'};
    const position=v=>type==='opening'?Math.round(v*CLINIC.boundary.travel*100)+' cm':type==='shade'?Math.round(v*CLINIC.boundary.maxLouvreAngle)+' degrees':v==='filtered'?'mesh cassette in place':'cassette drawn aside';
    const detail=names[type]+' changed from '+position(state[type])+' to '+position(value)+' by the '+state.role+'.';
    return update(state,{[type]:value,notice:'Apparatus position recorded. This visual trial does not predict the Clinic room’s climate.'},event(type,'apparatus',detail));
  }
  return deny(state,'This operation is not part of the Clinic rehearsal.');
}

/** The public window exposes only this case; it does not invent other patients. */
export function visibleRecord(state){
  return {
    caseId:state.caseId,status:state.status,consent:state.consent,recording:state.recording,
    opening:state.opening,shade:state.shade,filter:state.filter,
    criteria:{...state.criteria},ruleVersion:state.ruleVersion,retention:state.retention,
    events:state.events.map(e=>({...e,...(e.change?{change:{...e.change}}:{})}))
  };
}
