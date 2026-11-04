import {CASE} from './case.mjs';
import {metrics,simulate} from './engine.mjs';

export const PLANS=Object.freeze([
  {id:'baseline',name:'Existing operation',short:'Existing',colour:'#8c7162'},
  {id:'opening',name:'Scheduled opening',short:'Opening',colour:'#b17b43'},
  {id:'range',name:'Wider temperature range',short:'Wider range',colour:'#59776b'},
  {id:'combined',name:'Both changes',short:'Both changes',colour:'#2b5948'}
]);
export const EMPTY_REVIEW=Object.freeze({resident:'unrecorded',opening:'unverified',thermostat:'unverified',note:''});
export function initialSettings(){return {...CASE.thermal,permission:true,deadband:2.5};}
export function planParameters(id,settings){
  if(id==='baseline')return {...CASE.thermal};
  if(id==='opening')return {...settings,deadband:CASE.thermal.deadband};
  if(id==='range')return {...settings,permission:false};
  if(id==='combined')return {...settings};
  throw Error('Unknown operating plan.');
}
export function reviewedParameters(settings,review){
  if(review.resident==='declined')return {...CASE.thermal};
  if(review.resident!=='accepted'||!['granted','refused'].includes(review.opening)||!['granted','refused'].includes(review.thermostat))return null;
  return {...settings,permission:settings.permission&&review.opening==='granted',deadband:review.thermostat==='granted'?settings.deadband:CASE.thermal.deadband};
}
export function calculateStudy(record,settings,review=EMPTY_REVIEW){
  const conditions=Object.fromEntries(PLANS.map(plan=>{
    const parameters=planParameters(plan.id,settings),rows=simulate(record,parameters);
    return [plan.id,{parameters,rows,metrics:metrics(rows)}];
  }));
  const allowed=reviewedParameters(settings,review);
  if(allowed){const rows=simulate(record,allowed);conditions.reviewed={parameters:allowed,rows,metrics:metrics(rows)};}
  return {recordMetrics:metrics(record),conditions};
}

export const LOCAL_PLACES=Object.freeze({
  room:{title:'Room 001',kind:'Room under study',text:'A dwelling beside the shared courtyard. This is the only room with a thermal model in this draft.'},
  clinic:{title:'Clinic desk',kind:'Case review',text:'The room record, the Clinic’s trial criteria and a proposed operating plan meet here. Review entries stay in this browser.'},
  garden:{title:'Shared courtyard',kind:'Common ground',text:'A place for contact and shared care. The courtyard gives this case a local setting. Its ecology is not measured in this draft.'},
  office:{title:'Building office',kind:'Permission and maintenance',text:'Window and thermostat changes require someone with authority to approve them. This node opens a fictional permission review for Room 001.'}
  ,maintenance:{title:'Maintenance workshop',kind:'Repair and operation',text:'A protocol depends on functioning openings and equipment, and on someone being responsible for them. This workshop is a constructed setting for that relation. No maintenance job is sent by the demo.'}
  ,archive:{title:'Case archive',kind:'Evidence and decisions',text:'A case keeps the record, source status, model parameters, Clinic criteria and permission review together. The export is generated from the current study in this browser.'}
});
