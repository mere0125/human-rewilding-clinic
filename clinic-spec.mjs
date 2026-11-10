// Metres. One geometry register for the architectural model and its plan.
export const CLINIC = Object.freeze({
  width:15.6, depth:10.8, height:3.4,
  zones:Object.freeze([
    {id:'reception',name:'Consultation',centre:[-5.15,0,0],bounds:[-7.8,-2.8,-5.4,5.4]},
    {id:'trial',name:'Environmental trial',centre:[0,0,0],bounds:[-2.8,2.8,-5.4,5.4]},
    {id:'records',name:'Operations and records',centre:[5.15,0,0],bounds:[2.8,7.8,-5.4,5.4]}
  ]),
  cameras:Object.freeze({
    arrival:{eye:[12.8,5.2,18.4],at:[0,1.35,-.75],fov:43},
    overview:{eye:[13.4,10.6,17.8],at:[0,1,0],fov:43},
    reception:{eye:[-6.75,1.58,4.4],at:[-4.9,1.05,-.8],fov:57},
    trial:{eye:[-1.76,1.48,3.65],at:[.12,1.18,-3.25],fov:59},
    records:{eye:[6.9,1.64,3.8],at:[4.45,1.28,-1.45],fov:57},
    publicRecord:{eye:[.75,1.62,2.25],at:[2.69,1.47,.6],fov:54}
  }),
  boundary:Object.freeze({centre:[0,1.65,-4.95],width:4.6,height:2.8,travel:1.10,maxLouvreAngle:75}),
  bodySupport:Object.freeze({centre:[.1,0,-.55],width:1.18,length:2.62,baseHeight:.40,padHeight:.64}),
  furniture:Object.freeze({
    consultation:Object.freeze({centre:[-5.06,0,-.40],yaw:.10,chairs:[[-5.8,.85],[-4.13,-1.62]]}),
    operations:Object.freeze({centre:[5.05,0,-1.55],yaw:-.10,chair:[4.813,-.388]}),
    caseWindow:Object.freeze({centre:[2.8,1.47,.6],frontX:2.69,width:1.14,height:.88})
  }),
  protocolVersion:'EV-03',
  status:'Architectural study. Clinic room environmental performance is not simulated.'
});
