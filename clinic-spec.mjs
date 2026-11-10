// Metres. One geometry register for the architectural model and its plan.
export const CLINIC = Object.freeze({
  width:15.6, depth:10.8, height:3.8,
  zones:Object.freeze([
    {id:'reception',name:'Consultation',centre:[-5.15,0,0],bounds:[-7.8,-2.8,-5.4,5.4]},
    {id:'trial',name:'Environmental trial',centre:[0,0,0],bounds:[-2.8,2.8,-5.4,5.4]},
    {id:'records',name:'Operations and records',centre:[5.15,0,0],bounds:[2.8,7.8,-5.4,5.4]}
  ]),
  cameras:Object.freeze({
    overview:{eye:[13.8,11.5,18.2],at:[0,1,0],fov:43},
    reception:{eye:[-6.75,1.62,4.4],at:[-4.6,1.25,-.5],fov:59},
    trial:{eye:[-1.95,1.62,3.65],at:[.1,1.2,-3.3],fov:61},
    records:{eye:[6.8,1.68,4.1],at:[4.1,1.25,-1.1],fov:60},
    publicRecord:{eye:[.75,1.62,2.25],at:[2.81,1.47,.6],fov:54}
  }),
  boundary:Object.freeze({centre:[0,1.65,-4.95],width:4.6,height:2.8,travel:1.10,maxLouvreAngle:75}),
  protocolVersion:'EV-03',
  status:'Architectural study. Clinic room environmental performance is not simulated.'
});
