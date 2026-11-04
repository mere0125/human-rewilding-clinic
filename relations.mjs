// Relationships around one calculated room. Context nodes carry no fabricated
// ecological scores, monitored occupancy or additional thermal simulations.
export const RELATION_NODES=Object.freeze([
  {id:'weather',name:'Outdoor record',kind:'evidence',at:[.2,5.5,-4.7],detail:'Generated boundary condition, shared by every operating plan.'},
  {id:'room',name:'Room 001',kind:'thermal',at:[0,2.7,0],detail:'One thermal state, with the same geometry in the plan and interior.'},
  {id:'window',name:'East opening',kind:'thermal',at:[1.9,1.8,0],detail:'The schedule, permission and outdoor limits determine its modelled state. Added air changes remain an assumption.'},
  {id:'equipment',name:'Room equipment',kind:'thermal',at:[-2.3,1.1,3.7],detail:'Heating and cooling respond to the selected thermostat range.'},
  {id:'logger',name:'Room record',kind:'evidence',at:[.65,2.2,-1.5],detail:'A modelled indoor record in this draft. Future measured data would need a traceable source.'},
  {id:'resident',name:'Resident',kind:'authority',at:[-1,1.9,2],detail:'A fictional consent review. Declining a change retains existing operation.'},
  {id:'clinic',name:'Clinic desk',kind:'evidence',at:[5.15,4.1,7],detail:'Descriptive indicators become an institutional judgement here. The category is authored, not a clinical finding.'},
  {id:'office',name:'Building office',kind:'authority',at:[12.2,6.3,0],detail:'Window and thermostat permissions enter the reviewed operating plan.'},
  {id:'maintenance',name:'Maintenance',kind:'care',at:[12.8,4.2,-7.2],detail:'Context for repair and ongoing operation. No work order is sent by this demo.'},
  {id:'garden',name:'Common garden',kind:'care',at:[6,1.9,.7],detail:'Shared ecological care belongs to the Clinic’s wider setting. It is not a measured treatment outcome.'},
  {id:'archive',name:'Case archive',kind:'evidence',at:[-4.8,5.8,8.4],detail:'An export keeps the source record, assumptions, criteria and permissions together.'}
]);
export const RELATION_EDGES=Object.freeze([
  {from:'weather',to:'room',layer:'thermal',label:'Outdoor temperature'},
  {from:'weather',to:'window',layer:'thermal',label:'Opening eligibility'},
  {from:'window',to:'room',layer:'thermal',label:'Assumed outdoor air exchange'},
  {from:'equipment',to:'room',layer:'thermal',label:'Signed heating or cooling'},
  {from:'room',to:'logger',layer:'evidence',label:'Temperature record'},
  {from:'logger',to:'clinic',layer:'evidence',label:'Daily fit and equipment record'},
  {from:'clinic',to:'archive',layer:'evidence',label:'Case export'},
  {from:'office',to:'window',layer:'authority',label:'Opening permission'},
  {from:'office',to:'equipment',layer:'authority',label:'Thermostat permission'},
  {from:'resident',to:'clinic',layer:'authority',label:'Accept or decline'},
  {from:'clinic',to:'room',layer:'authority',label:'Reviewed operating plan'},
  {from:'maintenance',to:'equipment',layer:'care',label:'Repair and maintenance context'},
  {from:'maintenance',to:'window',layer:'care',label:'Opening hardware context'},
  {from:'resident',to:'garden',layer:'care',label:'Shared care context'}
]);
export const RELATION_LAYERS=Object.freeze([
  {id:'all',name:'All relations',colour:'#789c92'},
  {id:'thermal',name:'Heat and weather',colour:'#b38652'},
  {id:'evidence',name:'Evidence',colour:'#698b82'},
  {id:'authority',name:'Permission',colour:'#8b7d98'},
  {id:'care',name:'Maintenance and care',colour:'#97a36f'}
]);
export function relatedNodes(layer){const edges=RELATION_EDGES.filter(e=>layer==='all'||e.layer===layer);return new Set(edges.flatMap(e=>[e.from,e.to]));}
