import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { CLINIC } from '../clinic-spec.mjs?v=14';
import { mesh, pipe, surface, random, fitModel } from './spatial.js';

// A spatial rehearsal. Architectural mechanisms move; no Clinic climate,
// body response, filtration efficiency or treatment effect is inferred.
export async function makeClinic(m) {
  const root=new THREE.Group();root.name='Environmental Variability Clinic';
  const shell=new THREE.Group();shell.name='demountable outer skin';root.add(shell);
  const roof=new THREE.Group();roof.name='tailored canopy';root.add(roof);
  const structure=new THREE.Group();structure.name='precision frame';root.add(structure);
  const privacy=new THREE.Group();privacy.name='upper privacy membranes';root.add(privacy);
  const rand=random(4821),unitBox=new THREE.BoxGeometry(1,1,1),unitCylinder=new THREE.CylinderGeometry(1,1,1,24);
  const metal=new THREE.MeshStandardMaterial({color:0xcbd1d1,metalness:.93,roughness:.23,envMapIntensity:1});
  const satin=new THREE.MeshStandardMaterial({color:0xd9ddda,metalness:.72,roughness:.31,envMapIntensity:.9});
  const darkMetal=new THREE.MeshStandardMaterial({color:0x5b6563,metalness:.8,roughness:.27});
  const gasket=new THREE.MeshStandardMaterial({color:0x747b75,roughness:.60});
  const floorMat=new THREE.MeshStandardMaterial({color:0xe7e6dc,roughness:.48,metalness:.025});
  const porcelain=new THREE.MeshPhysicalMaterial({color:0xf0eee6,roughness:.35,clearcoat:.18,clearcoatRoughness:.3});
  const green=new THREE.MeshPhysicalMaterial({color:0x4c655a,roughness:.51,sheen:.5,sheenColor:0x8c9b87,sheenRoughness:.7});
  const softGreen=green.clone();softGreen.color.set(0x748478);
  const pearl=new THREE.MeshPhysicalMaterial({color:0xf0f0e9,roughness:.38,transmission:.20,thickness:.006,ior:1.42,sheen:.25,sheenColor:0xffffff,side:THREE.DoubleSide});
  const membrane=new THREE.MeshPhysicalMaterial({color:0xeeefe7,roughness:.29,transmission:.36,thickness:.003,ior:1.42,clearcoat:.10,side:THREE.DoubleSide});
  const clear=new THREE.MeshPhysicalMaterial({color:0xf5f8f4,roughness:.055,transmission:.93,thickness:.009,ior:1.46,side:THREE.DoubleSide});
  const paper=new THREE.MeshStandardMaterial({color:0xf0efe8,roughness:.8});
  const red=new THREE.MeshPhysicalMaterial({color:0xaf5543,roughness:.32,clearcoat:.22});
  const seamMat=new THREE.MeshStandardMaterial({color:0xc3c8bf,roughness:.6});
  const seamGreen=new THREE.MeshStandardMaterial({color:0x829287,roughness:.7});
  const lightMat=new THREE.MeshBasicMaterial({color:0xf0f3e9});
  const brush=document.createElement('canvas');brush.width=256;brush.height=256;const bg=brush.getContext('2d');bg.fillStyle='#b8b8b8';bg.fillRect(0,0,256,256);
  for(let y=0;y<256;y++){const g=173+Math.floor(rand()*17);bg.fillStyle=`rgb(${g},${g},${g})`;bg.fillRect(0,y,256,1);}
  const brushed=new THREE.CanvasTexture(brush);brushed.wrapS=brushed.wrapT=THREE.RepeatWrapping;brushed.repeat.set(1,5);metal.roughnessMap=brushed;metal.bumpMap=brushed;metal.bumpScale=.00014;
  const linen=document.createElement('canvas');linen.width=128;linen.height=128;const lc=linen.getContext('2d');lc.fillStyle='#a7a7a7';lc.fillRect(0,0,128,128);lc.strokeStyle='#adadad';lc.lineWidth=.5;for(let i=0;i<128;i+=4){lc.beginPath();lc.moveTo(i,0);lc.lineTo(i,128);lc.moveTo(0,i);lc.lineTo(128,i);lc.stroke();}
  const weave=new THREE.CanvasTexture(linen);weave.wrapS=weave.wrapT=THREE.RepeatWrapping;weave.repeat.set(12,20);green.bumpMap=weave;green.bumpScale=.00018;softGreen.bumpMap=weave;softGreen.bumpScale=.00018;
  function box(parent,mat,size,pos,name=''){const o=mesh(unitBox,mat,parent,pos,name);o.scale.set(...size);return o;}
  function rod(parent,mat,r,h,pos,rotation=null){const o=mesh(unitCylinder,mat,parent,pos);o.scale.set(r,h,r);if(rotation)o.rotation.set(...rotation);return o;}
  function roundedPath(w,h,r){const p=new THREE.Shape(),x=-w/2,y=-h/2;r=Math.min(r,w/2-.001,h/2-.001);p.moveTo(x+r,y);p.lineTo(x+w-r,y);p.quadraticCurveTo(x+w,y,x+w,y+r);p.lineTo(x+w,y+h-r);p.quadraticCurveTo(x+w,y+h,x+w-r,y+h);p.lineTo(x+r,y+h);p.quadraticCurveTo(x,y+h,x,y+h-r);p.lineTo(x,y+r);p.quadraticCurveTo(x,y,x+r,y);return p;}
  function slab(parent,mat,w,h,d,pos,r=.1,name=''){
    const geo=new THREE.ExtrudeGeometry(roundedPath(w,d,r),{depth:h,steps:1,bevelEnabled:true,bevelSize:Math.min(.008,h*.18),bevelThickness:Math.min(.008,h*.18),bevelSegments:2,curveSegments:10});
    const o=mesh(geo,mat,parent,[pos[0],pos[1]-h/2,pos[2]],name);o.rotation.x=-Math.PI/2;return o;
  }
  function pillow(parent,mat,w,h,d,pos,r=.14,name=''){
    // The rounded edge is modelled in section, with the specified outer
    // dimensions retained; its 40 mm shoulder is distinct from the thin tray.
    const b=Math.min(.040,h*.34,d*.19,w*.16);
    const geo=new THREE.ExtrudeGeometry(roundedPath(w-2*b,d-2*b,Math.max(.02,r-b)),{depth:h-2*b,steps:1,bevelEnabled:true,bevelSize:b,bevelThickness:b,bevelSegments:7,curveSegments:14});
    const o=mesh(geo,mat,parent,[pos[0],pos[1]-h/2+b,pos[2]],name);o.rotation.x=-Math.PI/2;return o;
  }
  function flange(parent,w,h,r,stroke,depth,pos,mat=metal){const shape=roundedPath(w,h,r);shape.holes.push(roundedPath(w-2*stroke,h-2*stroke,Math.max(.01,r-stroke)));const o=mesh(new THREE.ExtrudeGeometry(shape,{depth,steps:1,bevelEnabled:true,bevelSize:.003,bevelThickness:.003,bevelSegments:2,curveSegments:12}),mat,parent,[pos[0],pos[1],pos[2]-depth/2]);return o;}
  function sheet(parent,w,h,pos,rotation=[0,0,0],mat=paper){const o=mesh(new THREE.PlaneGeometry(w,h),mat,parent,pos);o.rotation.set(...rotation);o.castShadow=false;return o;}
  function screenPrint(lines,{width=768,height=768,background='#e8ece3',foreground='#34473d'}={}){const c=document.createElement('canvas');c.width=width;c.height=height;const texture=new THREE.CanvasTexture(c);texture.colorSpace=THREE.SRGBColorSpace;const ctx=c.getContext('2d');const draw=rows=>{ctx.fillStyle=background;ctx.fillRect(0,0,width,height);ctx.fillStyle=foreground;ctx.textAlign='left';ctx.font='29px Arial';ctx.fillText(rows[0]||'',40,62);ctx.strokeStyle='#b4c0b4';ctx.beginPath();ctx.moveTo(40,83);ctx.lineTo(width-40,83);ctx.stroke();rows.slice(1).forEach((line,i)=>{ctx.font=i===0?'44px Arial':'27px Arial';ctx.fillText(line,40,145+i*62,width-80);});texture.needsUpdate=true;};draw(lines);return {texture,draw};}
  function seamLoop(parent,w,d,y,z=0,mat=seamGreen,r=.1){const pts=[];const corners=[[-w/2+r,-d/2+r,Math.PI],[w/2-r,-d/2+r,Math.PI*1.5],[w/2-r,d/2-r,0],[-w/2+r,d/2-r,Math.PI*.5]];for(const [cx,cz,a]of corners)for(let j=0;j<=8;j++){const t=a+j/8*Math.PI/2;pts.push([cx+Math.cos(t)*r,y,z+cz+Math.sin(t)*r]);}return pipe(parent,mat,pts,.0025,true);}
  function plaque(text,w,pos){const c=screenPrint([text],{width:1024,height:128,background:'#e9e9e0'});sheet(root,w,.19,pos,[-Math.PI/2,0,0],new THREE.MeshStandardMaterial({map:c.texture,roughness:.6}));}

  // Honed continuous floor, with fine construction joints rather than a dark grid.
  slab(root,porcelain,CLINIC.width+.26,.16,CLINIC.depth+.26,[0,-.06,0],.26,'thin continuous ground plate');
  slab(root,floorMat,CLINIC.width,.055,CLINIC.depth,[0,.025,0],.20,'honed mineral floor');
  for(const x of [-5.2,-2.8,2.8,5.2])box(root,seamMat,[.0015,.0015,10.5],[x,.055,0]);
  for(const z of [-3.8,-.3,3.5])box(root,seamMat,[15.3,.0015,.0015],[0,.055,z]);
  slab(root,porcelain,15.25,.012,1.2,[0,.061,4.5],.14,'level public route');
  for(const x of [-2.8,2.8]){box(root,satin,[.09,.014,6.7],[x,.068,-1.05]);for(const dx of [-.025,.025])box(root,seamMat,[.002,.003,6.6],[x+dx,.078,-1.05]);}

  // The rear and side skins are replaceable thin panels with precise reveals.
  for(const x of [-5.3,5.3]){
    box(shell,porcelain,[4.96,3.25,.11],[x,1.71,-5.4]);
    for(let i=0;i<5;i++){const px=x-1.98+i*.99;box(shell,satin,[.0028,2.92,.004],[px,1.73,-5.341]);}
    box(shell,satin,[4.90,.045,.12],[x,.10,-5.34]);
  }
  // A continuous lower skin carries the enclosure; the upper band is a
  // shallow ribbed pearl membrane, with fine silver reveals at its edges.
  const sidePearl=pearl.clone();sidePearl.color.set(0xe4e8df);sidePearl.transmission=.25;sidePearl.roughness=.34;
  for(const x of [-7.8,7.8]){
    const sign=Math.sign(x);
    box(shell,porcelain,[.09,1.13,10.5],[x,.65,0]);
    const band=surface(shell,sidePearl,10.5,1.94,210,32,(u,v)=>[x+sign*.011*Math.cos((u+5.25)*Math.PI*9),2.24+v,u],'ribbed pearl side band');band.castShadow=false;
    for(const y of [.13,1.245,3.225])box(shell,satin,[.10,y===.13?.035:.018,10.5],[x,y,0]);
    for(const z of [-4.2,-2.1,0,2.1,4.2])pipe(shell,satin,[[x+sign*.018,1.27,z],[x+sign*.018,3.205,z]],.006);
    for(const z of [-5.25,5.25])pipe(shell,metal,[[x,.10,z],[x,2.97,z],[x-sign*.025,3.14,z-Math.sign(z)*.02],[x-sign*.11,3.225,z-Math.sign(z)*.11]],.015);
  }
  // Slender perimeter supports leave the arrival route and trial equipment clear.
  for(const x of [-7.55,-2.8,2.8,7.55])for(const z of [-5.12,2.50]){
    rod(structure,metal,.027,3.20,[x,1.66,z]);rod(structure,satin,.052,.018,[x,.073,z]);rod(structure,satin,.043,.10,[x,3.24,z]);
  }
  for(const x of [-2.67,2.67]){
    slab(structure,satin,.16,.12,7.6,[x,3.18,-1.15],.06,'enclosed service spine');
    pipe(structure,metal,[[x,3.13,2.5],[x,3.13,-4.9],[x,.23,-4.9]],.011);
  }

  // Pleated membranes have actual shallow folds and welded horizontal hems.
  // Upper panels are removed in the cutaway so that the three zones stay legible.
  function divider(x,sign){
    const part=new THREE.Group();privacy.add(part);
    const s=surface(part,membrane,6.65,2.62,160,28,(u,v)=>[x+sign*(.014*Math.cos((u+3.325)*Math.PI*8)+.005*Math.cos(u*51)),1.48+v,-1.05+u],'tailored privacy membrane');s.castShadow=false;
    for(const y of [.17,2.79]){pipe(structure,metal,[[x,y,-4.38],[x,y,2.275]],.012);pipe(part,seamMat,[[x+sign*.02,y,-4.35],[x+sign*.02,y,2.25]],.0035);}
    for(const z of [-4.375,2.275]){rod(structure,metal,.018,2.66,[x,1.48,z]);for(const y of [.21,2.75])rod(structure,satin,.032,.05,[x,y,z]);}
    for(let z=-4.0;z<2.1;z+=1.1)pipe(part,seamMat,[[x,.20,z],[x,2.76,z]],.0017);
    // A low opaque datum provides privacy while the full height remains light.
    slab(root,porcelain,.09,.22,6.58,[x,.18,-1.05],.035,'partition foot');
  }
  divider(-2.8,-1);divider(2.8,1);
  const caseWindow=new THREE.Group();caseWindow.position.set(2.81,1.47,.6);caseWindow.rotation.y=-Math.PI/2;root.add(caseWindow);
  flange(caseWindow,1.14,.88,.08,.035,.035,[0,0,0]);
  const ownScreen=screenPrint(['Your case','Room 001 home replay','Prepared room record','No body tracking']);
  sheet(caseWindow,1.05,.79,[0,0,.023],[0,0,0],new THREE.MeshBasicMaterial({map:ownScreen.texture}));
  slab(caseWindow,satin,1.16,.025,.27,[0,-.47,.09],.04,'patient reading ledge');

  // Chairs, table and the waiting ledge share formed edges and tailored pads.
  function consultationChair(x,z,yaw){
    const g=new THREE.Group();g.position.set(x,.07,z);g.rotation.y=yaw;root.add(g);
    slab(g,metal,.59,.022,.58,[0,.07,0],.19,'thin seat base');
    rod(g,satin,.040,.34,[0,.25,0]);
    slab(g,metal,.64,.035,.61,[0,.43,0],.15,'formed seat shell');
    slab(g,softGreen,.59,.085,.56,[0,.48,0],.14,'tailored seat');seamLoop(g,.55,.52,.51,0,seamGreen,.12);
    const back=new THREE.Group();back.position.set(0,.70,-.24);back.rotation.x=-.13;g.add(back);
    const shell=slab(back,metal,.64,.032,.40,[0,0,0],.13);shell.rotation.x=0;
    // Turn the plan-form slab upright as one continuous back shell.
    shell.rotation.x=0;shell.position.set(0,0,-.025);
    const cushion=slab(back,green,.59,.075,.35,[0,.0,.01],.11);cushion.rotation.x=0;cushion.position.set(0,0,.015);
    for(const side of [-1,1])pipe(g,metal,[[side*.27,.45,.18],[side*.29,.61,.12],[side*.29,.63,-.14],[side*.27,.49,-.24]],.009);
    return g;
  }
  consultationChair(-5.8,.85,-.28);consultationChair(-4.13,-1.62,Math.PI+.16);
  const consult=new THREE.Group();consult.position.set(-5.06,.07,-.40);consult.rotation.y=.10;root.add(consult);
  slab(consult,metal,2.15,.035,1.12,[0,.76,0],.30,'shared consultation shell');
  slab(consult,porcelain,2.06,.018,1.03,[0,.79,0],.28,'inset writing surface');
  slab(consult,satin,.86,.035,.69,[0,.07,0],.23);slab(consult,porcelain,.46,.63,.36,[0,.40,0],.13,'single consultation pedestal');
  const consent=screenPrint(['Consultation','Your room, your account','Consent remains optional','You can stop the trial']);
  sheet(consult,.44,.56,[-.36,.805,0],[-Math.PI/2,0,.08],new THREE.MeshStandardMaterial({map:consent.texture,roughness:.8}));
  pipe(consult,darkMetal,[[.02,.806,.27],[.16,.806,-.19]],.0025);
  const deskScreen=screenPrint(['Appointment 001','Environmental Variability','Resident account','Room evidence']);
  const tablet=new THREE.Group();tablet.position.set(.64,.88,-.12);tablet.rotation.x=-.42;consult.add(tablet);
  flange(tablet,.42,.29,.025,.012,.019,[0,0,0]);sheet(tablet,.39,.26,[0,0,.012],[0,0,0],new THREE.MeshBasicMaterial({map:deskScreen.texture}));
  const bench=new THREE.Group();bench.position.set(-6.85,.07,-3.7);root.add(bench);
  slab(bench,satin,.65,.035,1.8,[0,.39,0],.20);slab(bench,green,.61,.10,1.74,[0,.45,0],.19);
  for(const z of [-.60,.60]){slab(bench,porcelain,.40,.31,.24,[0,.23,z],.075);}
  seamLoop(bench,.56,1.66,.49,0,seamGreen,.16);

  // The canopy has shallow shoulders and a continuous tailored crown. It is
  // suspended above the patient, rather than a greenhouse arch enclosure.
  function crownY(x){return 3.28-.59*Math.pow(Math.abs(x)/2.57,6);}
  const canopy=surface(roof,pearl,5.14,7.05,90,90,(u,v)=>[u,crownY(u)+.007*Math.sin(v*3),-1.05+v],'pearly trial canopy');canopy.castShadow=false;
  for(const side of [-1,1]){
    const edge=surface(structure,satin,.13,7.05,8,65,(u,v)=>{const x=side*(2.50+u);return[x,crownY(x)-.018,-1.05+v];},'formed canopy shoulder');edge.castShadow=false;
  }
  for(const z of [-4.575,2.475]){
    const points=[];for(let i=0;i<=64;i++){const x=-2.57+i/64*5.14;points.push([x,crownY(x),z]);}pipe(structure,metal,points,.015);
  }
  for(const x of [-1.30,0,1.30]){const pts=[];for(let i=0;i<=44;i++){const z=-4.54+i/44*7;pts.push([x,crownY(x)+.005,z]);}pipe(roof,seamMat,pts,.0025);}
  // Quiet side canopies have softly radiused corners and fine silver lips.
  for(const x of [-5.15,5.15]){
    slab(roof,pearl,4.65,.085,7.4,[x,3.13,-1.08],.40,'tailored side canopy');
    for(const z of [-4.79,2.63])pipe(structure,satin,[[x-2.0,3.12,z],[x+2.0,3.12,z]],.013);
    for(const z of [-3.0,-.8,1.4])box(roof,seamMat,[4.35,.002,.002],[x,3.083,z]);
  }
  // Clear approach is maintained across all three front openings.
  for(const x of [-5.15,0,5.15]){
    slab(roof,porcelain,x===0?5.18:4.70,.065,.46,[x,x===0?3.15:3.10,2.61],.20,'soft entrance brow');
  }

  // Body platform: a shallow formed shell, concealed pedestal and three
  // distinct contact pads. The surrounding walking area remains unobstructed.
  const body=CLINIC.bodySupport||{centre:[.1,.08,-.55],width:1.18,length:2.62,baseHeight:.40,padHeight:.64};
  const support=new THREE.Group();support.position.set(...body.centre);root.add(support);
  slab(support,satin,.72,.035,1.42,[0,.07,0],.23,'body platform foot');
  slab(support,porcelain,.47,.32,1.14,[0,.25,0],.17,'concealed adjustment pedestal');
  slab(support,metal,body.width,.065,body.length,[0,.47,0],.24,'formed body platform');
  slab(support,porcelain,1.12,.025,2.55,[0,.515,0],.22,'inset platform liner');
  const pads=[{w:.98,d:.76,z:-.80,y:.70,angle:.11},{w:1.02,d:.88,z:.04,y:.64,angle:0},{w:.94,d:.66,z:.84,y:.615,angle:.055}];
  for(const [i,p]of pads.entries()){
    const g=new THREE.Group();g.position.set(0,p.y,p.z);g.rotation.x=p.angle;support.add(g);
    slab(g,metal,p.w+.022,.018,p.d+.022,[0,-.075,0],.13,'articulated pad carrier');
    pillow(g,green,p.w,.12,p.d,[0,0,0],.14,'body contact segment '+(i+1));
    seamLoop(g,p.w-.090,p.d-.090,.061,0,seamGreen,.095);
    for(const x of [-.38,.38])rod(g,satin,.045,.028,[x,-.07,0],[0,0,Math.PI/2]);
  }
  pillow(support,softGreen,.50,.12,.20,[0,.825,-.96],.085,'removable head support');
  for(const side of [-1,1])pipe(support,metal,[[side*.48,.49,-1.0],[side*.54,.54,-.38],[side*.54,.54,.46],[side*.46,.49,1.08]],.008);
  // A slim stand keeps the stop control visible and reachable beside the body.
  const pause=new THREE.Group();pause.position.set(-.73,.77,-.14);support.add(pause);
  pipe(support,metal,[[-.40,.31,-.14],[-.65,.40,-.14],[-.73,.71,-.14]],.012);
  // Tilt the complete panel assembly. Its cylinder face and printed label
  // stay on the housing's top surface, angled towards the approaching patient.
  const stopPanel=new THREE.Group();stopPanel.rotation.x=.62;pause.add(stopPanel);
  slab(stopPanel,porcelain,.16,.045,.22,[0,0,0],.045,'patient control housing');
  const switchButton=rod(stopPanel,red,.040,.022,[0,.043,.040]);switchButton.name='Patient pause control';switchButton.userData.clinicAction='pause';
  const pauseLabel=screenPrint(['Pause'],{width:256,height:128,background:'#eeefe8'});
  sheet(stopPanel,.11,.055,[0,.035,-.053],[-Math.PI/2,0,0],new THREE.MeshStandardMaterial({map:pauseLabel.texture,roughness:.7}));
  pipe(support,gasket,[[-.73,.74,-.14],[-.73,.56,-.14],[-.66,.44,-.14],[-.36,.28,-.14],[-.36,.12,-1.25],[-2.25,.12,-1.25],[-2.25,.16,-4.5]],.004);

  // Thickened environmental threshold: rounded flanges, concertina membrane
  // sleeves, a clear sliding pair, an independent mesh cassette and louvres.
  const portal=new THREE.Group();portal.position.set(...CLINIC.boundary.centre);root.add(portal);
  flange(portal,5.02,3.12,.24,.095,.09,[0,0,.11],satin);
  flange(portal,4.82,2.94,.19,.055,.055,[0,0,-.42],metal);
  flange(portal,4.72,2.86,.17,.035,.03,[0,0,-.68],satin);
  for(const sign of [-1,1]){
    const sleeve=surface(portal,membrane,.62,2.73,52,42,(u,v)=>{const z=-.24+u;return[sign*(2.36+.026*Math.cos((u+.31)*Math.PI*26)),v,z];},'concertina side sleeve');sleeve.castShadow=false;
    for(const y of [-1.36,1.36])pipe(portal,seamMat,[[sign*2.36,y,-.55],[sign*2.36,y,.07]],.0035);
  }
  for(const y of [-1.45,1.45]){
    box(portal,metal,[4.68,.028,.61],[0,y,-.22]);
    for(const z of [-.01,-.17,-.35])box(portal,gasket,[4.56,.005,.008],[0,y+(y<0?.02:-.02),z]);
  }
  const leaves=[];
  for(const side of [-1,1]){
    const leaf=new THREE.Group();leaf.position.x=side*1.12;portal.add(leaf);leaves.push({leaf,side});
    flange(leaf,2.20,2.67,.105,.025,.025,[0,0,.02]);
    const pane=sheet(leaf,2.15,2.62,[0,0,.018],[0,0,0],clear);pane.castShadow=false;
    pipe(leaf,metal,[[side*.88,-.20,.095],[side*.88,.20,.095]],.008);
    for(const y of [-1.15,1.15])rod(leaf,satin,.025,.018,[side*.88,y,-.075],[Math.PI/2,0,0]);
  }
  for(const x of [-1.67,1.67]){
    rod(portal,satin,.027,.67,[x,1.58,-.02],[0,0,Math.PI/2]);rod(portal,metal,.010,.72,[x+(x<0?.46:-.46),1.58,-.02],[0,0,Math.PI/2]);
    slab(portal,porcelain,.18,.085,.16,[x+(x<0?-.36:.36),1.58,-.02],.04,'linear actuator cap');
  }
  const meshCanvas=document.createElement('canvas');meshCanvas.width=128;meshCanvas.height=128;const mg=meshCanvas.getContext('2d');mg.fillStyle='#fff';mg.fillRect(0,0,128,128);mg.fillStyle='#000';for(let x=0;x<128;x+=8)for(let y=0;y<128;y+=8)mg.fillRect(x+1,y+1,6,6);
  const meshMap=new THREE.CanvasTexture(meshCanvas);meshMap.wrapS=meshMap.wrapT=THREE.RepeatWrapping;meshMap.repeat.set(20,14);
  const meshMat=new THREE.MeshStandardMaterial({color:0xd3d9cc,alphaMap:meshMap,alphaTest:.4,side:THREE.DoubleSide,roughness:.56});
  const filterCassette=new THREE.Group();filterCassette.position.set(0,0,-.25);portal.add(filterCassette);
  flange(filterCassette,4.37,2.61,.105,.025,.025,[0,0,0],satin);sheet(filterCassette,4.32,2.56,[0,0,0],[0,0,0],meshMat);
  for(const x of [-2.16,2.16])box(filterCassette,darkMetal,[.022,.09,.024],[x,0,.025]);
  const louvres=[];for(let i=0;i<12;i++){const pivot=new THREE.Group();pivot.position.set(0,-1.17+i*.214,-.46);portal.add(pivot);slab(pivot,satin,4.33,.018,.24,[0,0,0],.035,'shade leaf');for(const x of [-2.20,2.20])rod(pivot,darkMetal,.008,.10,[x,0,0],[0,0,Math.PI/2]);louvres.push(pivot);}
  for(const x of [-2.26,2.26])pipe(portal,metal,[[x,-1.20,-.47],[x,1.35,-.47]],.006);
  // Narrow flush drainage and a planted exterior edge preserve the weather connection.
  slab(root,satin,4.65,.022,.66,[0,.069,-4.54],.07,'threshold drain surround');
  box(root,darkMetal,[4.48,.009,.47],[0,.078,-4.54]);
  const mat4=new THREE.Matrix4(),q=new THREE.Quaternion(),sc=new THREE.Vector3(),po=new THREE.Vector3();
  const grate=new THREE.InstancedMesh(unitBox,satin,94);for(let i=0;i<94;i++){po.set(-2.22+i*.0477,.087,-4.54);sc.set(.010,.012,.48);mat4.compose(po,q,sc);grate.setMatrixAt(i,mat4);}grate.receiveShadow=true;root.add(grate);
  slab(root,porcelain,5.15,.19,1.0,[0,.05,-6.03],.12,'exterior planting trough');
  box(root,m.dirt,[4.93,.05,.78],[0,.16,-6.03]);
  const fernAsset=await new GLTFLoader().loadAsync('./assets/fern_02/fern_02.gltf');
  for(const [x,z,h,a]of[[-1.92,-6.05,.70,.32],[-1.05,-6.20,.52,1.14],[-.15,-5.91,.84,-.57],[.76,-6.14,.61,2.04],[1.45,-5.99,.49,-1.31]]){const fern=fitModel(fernAsset.scene.clone(true),h,[x,.19,z],a);fern.name='Fern at the exterior weather edge';root.add(fern);}
  slab(root,metal,.32,.025,.55,[2.08,.20,-6.03],.055,'weather collection tray');
  for(let i=0;i<7;i++)box(root,satin,[.25,.008,.012],[2.08,.217,-6.24+i*.06]);

  // An integrated service desk, two case-specific monitors and fine storage.
  const console=new THREE.Group();console.position.set(5.05,.07,-1.55);console.rotation.y=-.10;root.add(console);
  slab(console,metal,3.44,.040,1.22,[0,.88,0],.21,'integrated operations surface');
  slab(console,porcelain,3.32,.018,1.10,[0,.912,0],.18);
  for(const x of [-1.20,1.20]){slab(console,satin,.47,.025,.83,[x,.075,0],.14);slab(console,porcelain,.25,.75,.66,[x,.47,-.07],.10);}
  const caseMonitor=screenPrint(['Room 001 case replay','Patient home','Generated demonstration','No live room connected']);
  const historyMonitor=screenPrint(['Change record','EV-03','No session activity','Patient can view own case']);
  function monitor(x,content){const g=new THREE.Group();g.position.set(x,1.27,-.25);g.rotation.x=-.10;console.add(g);flange(g,1.10,.72,.06,.025,.035,[0,0,0],satin);sheet(g,1.04,.66,[0,0,.025],[0,0,0],new THREE.MeshBasicMaterial({map:content.texture}));box(g,satin,[1.02,.64,.008],[0,0,-.025]);pipe(console,metal,[[x,.95,-.33],[x,1.23,-.33]],.014);return g;}
  monitor(-.76,caseMonitor);monitor(.52,historyMonitor);
  slab(console,satin,.58,.016,.20,[-.71,.94,.30],.025,'inset keyboard');
  const keys=new THREE.InstancedMesh(unitBox,porcelain,45);for(let i=0;i<45;i++){po.set(-.96+(i%15)*.036,.954,.24+Math.floor(i/15)*.055);sc.set(.025,.008,.038);mat4.compose(po,q,sc);keys.setMatrixAt(i,mat4);}console.add(keys);
  slab(console,satin,.18,.012,.25,[.1,.942,.28],.035,'pointing surface');slab(console,satin,.40,.025,.52,[1.27,.948,.20],.045,'document tray');
  for(let i=0;i<3;i++)sheet(console,.33,.44,[1.27,.966+i*.001,.20],[-Math.PI/2,0,(i-1)*.012]);
  for(let i=0;i<5;i++){const x=3.35+i*.72;slab(root,porcelain,.65,1.08,.62,[x,.61,-4.72],.045,'flush service cabinet');for(let j=0;j<3;j++){box(root,satin,[.59,.002,.008],[x,.29+j*.32,-4.40]);slab(root,metal,.20,.012,.026,[x,.35+j*.32,-4.38],.01,'recessed drawer pull');}}
  for(let i=0;i<5;i++){const x=3.75+i*.72;flange(root,.55,.63,.035,.018,.025,[x,2.04,-5.27],satin);sheet(root,.50,.58,[x,2.04,-5.25],[0,0,0],paper);}
  consultationChair(5.48,.4,.06);
  const recordLed=mesh(new THREE.SphereGeometry(.014,12,8),new THREE.MeshBasicMaterial({color:0x71826c}),console,[1.52,1.47,-.20]);

  // Broad integrated light sources soften the silver without glowing trim.
  for(const x of [-5.15,0,5.15]){
    const light=new THREE.RectAreaLight(0xf5f3e9,x===0?2.6:2.0,3.1,.50);light.position.set(x,2.99,-.7);light.lookAt(x,.2,-.7);root.add(light);
    slab(roof,lightMat,3.12,.012,.40,[x,3.025,-.7],.13,'diffuse ceiling light');
  }
  const trialFill=new THREE.PointLight(0xf2f4eb,1.2,8,2);trialFill.position.set(0,2.1,1.8);root.add(trialFill);
  plaque('Consultation',2.05,[-5.15,.075,5.23]);plaque('Environmental trial',2.58,[0,.075,5.23]);plaque('Operations and records',2.65,[5.15,.075,5.23]);

  let targetOpening=0,currentOpening=0,targetShade=.4,currentShade=.4,targetFilter=0,currentFilter=0,lastScreenKey='',state={};
  function setState(next={}){
    state={...state,...next};targetOpening=Math.max(0,Math.min(1,Number(state.opening)||0));targetShade=Math.max(0,Math.min(1,Number(state.shade)||0));targetFilter=state.filter==='bypass'?1:0;recordLed.material.color.set(state.recording?0xb1c7a7:0x78877d);
    const key=JSON.stringify([state.indoor,state.outdoor,state.source,state.classification,state.role,state.recording,state.ruleVersion,state.events?.length,state.zone]);if(key===lastScreenKey)return;lastScreenKey=key;
    const n=v=>Number.isFinite(v)?v.toFixed(1)+'°C':'Not supplied',status=state.recording?'Appointment record open':'Appointment record stopped',source=state.source||'Generated demonstration';
    caseMonitor.draw(['Room 001 case replay','Patient home',source,'Indoor  '+n(state.indoor),'Outdoor  '+n(state.outdoor),'Clinic mechanisms are a rehearsal']);
    const events=(state.events||[]).slice(-4).map(e=>typeof e==='string'?e:(e.label||e.type||e.action||'Recorded change'));
    historyMonitor.draw(state.role==='staff'?['Change record',state.ruleVersion||CLINIC.protocolVersion,status,...(events.length?events:['No changes in this session'])]:['Operations and records','Staff-side register',status,'Own-case summary faces the patient']);
    ownScreen.draw(['Your case','Room 001 home replay',state.classification||'Assessment not opened',status,'You can stop the trial']);
  }
  function step(dt=1/30){const a=1-Math.exp(-Math.min(.1,dt)*6);currentOpening+=(targetOpening-currentOpening)*a;currentShade+=(targetShade-currentShade)*a;currentFilter+=(targetFilter-currentFilter)*a;leaves.forEach(({leaf,side})=>leaf.position.x=side*(1.12+currentOpening*CLINIC.boundary.travel));louvres.forEach(p=>p.rotation.x=currentShade*Math.PI*CLINIC.boundary.maxLouvreAngle/180);filterCassette.position.x=currentFilter*4.65;}
  function setCutaway(value){shell.visible=!value;roof.visible=!value;privacy.visible=!value;}
  setState({opening:0,shade:.4,filter:'filtered',recording:false,role:'patient'});
  root.userData={geometry:CLINIC,trialSpace:'Architectural mechanism study; no climate or health prediction',caseId:'Room 001'};
  return {root,roof,setCutaway,setState,step,pickables:[switchButton]};
}
