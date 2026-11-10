import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { CLINIC } from '../clinic-spec.mjs';
import { mesh, block, pipe, cylinder, lathe, surface, random, fitModel } from './spatial.js';

// An architectural study of a consultation, an environmental trial and its
// operations room. Moving parts are an interface, not a climate simulation.
export async function makeClinic(m) {
  const root = new THREE.Group(); root.name = 'Environmental Variability Clinic';
  const shell = new THREE.Group(); shell.name = 'removable enclosure'; root.add(shell);
  const roof = new THREE.Group(); roof.name = 'removable ceiling layers'; root.add(roof);
  const structure = new THREE.Group(); structure.name = 'serviceable silver frame'; root.add(structure);
  const rand = random(4821);
  const unitBox = new THREE.BoxGeometry(1,1,1);
  const unitCylinder = new THREE.CylinderGeometry(1,1,1,16);
  const metal = new THREE.MeshStandardMaterial({color:0xb5beb8,metalness:.91,roughness:.33,envMapIntensity:.74});
  const satin = new THREE.MeshStandardMaterial({color:0xc3cac2,metalness:.66,roughness:.49,envMapIntensity:.58});
  const darkMetal = new THREE.MeshStandardMaterial({color:0x45534c,metalness:.73,roughness:.45});
  const gasket = new THREE.MeshStandardMaterial({color:0x303d34,roughness:.85});
  const floorMat = m.wall.clone(); floorMat.color.set(0xb9c0b3); floorMat.roughness=.94;
  const edgeStone = new THREE.MeshStandardMaterial({color:0xaaa99a,roughness:.94});
  const porcelain = new THREE.MeshStandardMaterial({color:0xe3e4d7,roughness:.72});
  const green = m.linen.clone(); green.color.set(0x344f40); green.sheenColor.set(0x5c6d56); green.roughness=.88;
  const softGreen = green.clone(); softGreen.color.set(0x8a9681);
  const felt = m.linen.clone(); felt.color.set(0x88917e); felt.roughness=1;
  const fabric = m.curtain.clone(); fabric.color.set(0xdce0cf); fabric.opacity=.73; fabric.transmission=.24; fabric.roughness=.9;
  const translucent = new THREE.MeshPhysicalMaterial({color:0xdbe3d5,transparent:true,opacity:.40,transmission:.34,roughness:.44,thickness:.012,ior:1.46,side:THREE.DoubleSide,depthWrite:false});
  const clear = new THREE.MeshPhysicalMaterial({color:0xe6eee5,transparent:true,opacity:.31,transmission:.66,roughness:.09,thickness:.016,ior:1.47,side:THREE.DoubleSide,depthWrite:false});
  const amber = new THREE.MeshStandardMaterial({color:0xa88a60,metalness:.5,roughness:.47});
  const paper = m.paper.clone(); paper.color.set(0xe5e4d4);
  const red = new THREE.MeshStandardMaterial({color:0x9a5d41,roughness:.7});
  const lightMaterial = new THREE.MeshBasicMaterial({color:0xe4efd8});

  // A deterministic brushed finish gives the aluminium a direction without
  // pretending it is a photographed surface or drawing decorative scratches.
  const brush = document.createElement('canvas'); brush.width=256;brush.height=256;
  const bg=brush.getContext('2d'); bg.fillStyle='#9e9e9e';bg.fillRect(0,0,256,256);
  for(let y=0;y<256;y++){const g=132+Math.floor(rand()*49);bg.fillStyle=`rgb(${g},${g},${g})`;bg.fillRect(0,y,256,1);}
  const brushed = new THREE.CanvasTexture(brush);brushed.wrapS=brushed.wrapT=THREE.RepeatWrapping;brushed.repeat.set(1,6);
  metal.roughnessMap=brushed; metal.bumpMap=brushed;metal.bumpScale=.00055;

  function box(parent,mat,size,pos,name=''){
    const o=mesh(unitBox,mat,parent,pos,name);o.scale.set(...size);return o;
  }
  function rod(parent,mat,r,h,pos,rotation=null){
    const o=mesh(unitCylinder,mat,parent,pos);o.scale.set(r,h,r);if(rotation)o.rotation.set(...rotation);return o;
  }
  const fasteners=[];
  function fastener(x,y,z,axis='z',parent=structure){fasteners.push({x,y,z,axis,parent});}
  function panelFrame(parent,w,h,at,{mat=metal,glass=translucent,depth=.055}={}){
    const g=new THREE.Group();g.position.set(...at);parent.add(g);
    for(const x of [-w/2,w/2])box(g,mat,[.033,h,.055],[x,0,0]);
    for(const y of [-h/2,h/2])box(g,mat,[w,.033,.055],[0,y,0]);
    const p=box(g,glass,[w-.055,h-.055,.01],[0,0,.004]);p.castShadow=false;
    return g;
  }
  function sheet(parent,w,h,position,rotation,mat=paper){
    const a=mesh(new THREE.PlaneGeometry(w,h),mat,parent,position);a.rotation.set(...rotation);a.castShadow=false;return a;
  }
  function printTexture(lines,{width=768,height=768,background='#dee3d5',foreground='#334a3b'}={}){
    const c=document.createElement('canvas');c.width=width;c.height=height;
    const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;
    const ctx=c.getContext('2d');
    const draw=rows=>{ctx.fillStyle=background;ctx.fillRect(0,0,width,height);ctx.fillStyle=foreground;ctx.textAlign='left';
      ctx.font='30px Arial';ctx.fillText(rows[0]||'',40,62);ctx.strokeStyle=foreground;ctx.globalAlpha=.3;ctx.beginPath();ctx.moveTo(40,83);ctx.lineTo(width-40,83);ctx.stroke();ctx.globalAlpha=1;
      rows.slice(1).forEach((line,i)=>{ctx.font=i===0?'46px Arial':'27px Arial';ctx.fillText(line,40,145+i*62,width-80);});t.needsUpdate=true;};
    draw(lines);return {canvas:c,texture:t,draw};
  }
  function plaque(parent,lines,w,h,pos,rotation=[0,0,0]){
    const p=printTexture(lines,{width:1024,height:Math.round(1024*h/w),background:'#c7d0c1'});
    const o=sheet(parent,w,h,pos,rotation,new THREE.MeshStandardMaterial({map:p.texture,roughness:.86}));return o;
  }

  // Foundations and floor seams establish a common level throughout all bays.
  block(root,edgeStone,[CLINIC.width+.4,.28,CLINIC.depth+.4],[0,-.15,0],.07,'precast ground plate');
  box(root,floorMat,[CLINIC.width,.085,CLINIC.depth],[0,.012,0],'continuous mineral floor');
  for(let x=-7.8;x<=7.8;x+=1.3)box(root,gasket,[.004,.002,10.8],[x,.057,0]);
  for(let z=-5.4;z<=5.4;z+=1.35)box(root,gasket,[15.6,.002,.004],[0,.058,z]);
  for(const x of [-2.8,2.8]){
    box(root,metal,[.17,.018,10.8],[x,.065,0],'flush partition track');
    for(const dx of [-.05,.05])box(root,gasket,[.008,.007,10.7],[x+dx,.076,0]);
  }
  // The front circulation path stays level, legible and free of apparatus.
  box(root,porcelain,[15.4,.008,1.3],[0,.064,4.5],'clear approach path');
  for(const x of [-7.65,7.65])box(root,metal,[.06,.08,10.4],[x,.12,0]);
  for(const z of [-5.3,5.3])box(root,metal,[15.3,.08,.06],[0,.12,z]);
  // Demountable cladding and cavity construction at the rear of the building.
  for(const x of [-5.3,5.3]){
    box(shell,m.wall,[5.0,3.65,.18],[x,1.87,-5.4]);
    for(let px=x-2.35;px<x+2.4;px+=.78){
      box(shell,satin,[.74,1.1,.025],[px,.64,-5.285]);
      box(shell,satin,[.74,1.7,.025],[px,2.11,-5.285]);
      for(const y of [.16,1.10,1.35,2.83])fastener(px-.31,y,-5.265,'z',shell);
    }
  }
  for(const x of [-7.82,7.82]){
    box(shell,m.wall,[.18,3.65,10.8],[x,1.87,0]);
    for(let z=-4.9;z<5;z+=1.05){box(shell,satin,[.022,.70,.98],[x+(x<0?.105:-.105),.46,z]);}
  }
  // Exposed pinned steel posts; transverse beams remain in the cutaway.
  for(const x of [-7.55,-2.8,2.8,7.55])for(const z of [-5.12,-1.25,2.8]){
    box(structure,metal,[.10,3.73,.10],[x,1.91,z]);
    box(structure,metal,[.25,.018,.25],[x,.088,z]);
    for(const dx of [-.085,.085])for(const dz of [-.085,.085])fastener(x+dx,.105,z+dz,'y');
    box(structure,darkMetal,[.13,.085,.15],[x,3.56,z]);
    for(const y of [3.52,3.62])fastener(x,y,z+.082);
  }
  for(const z of [-5.12,-1.25,2.8]){
    box(structure,metal,[15.2,.12,.095],[0,3.73,z]);
    box(structure,metal,[15.15,.014,.24],[0,3.68,z]);
  }
  // Slim service spine: two ducts, condensation returns, accessible cable tray.
  for(const x of [-2.57,2.57]){
    box(structure,satin,[.26,.25,8.6],[x,3.42,-.8]);
    for(let z=-4.8;z<3.4;z+=1.12){box(structure,darkMetal,[.29,.012,.024],[x,3.29,z]);}
    pipe(structure,metal,[[x-.23,3.34,3.05],[x-.23,3.34,-4.95],[x-.23,.32,-4.95]],.022);
  }
  for(let z=-4.6;z<3.1;z+=.42){box(structure,metal,[.30,.018,.018],[2.25,3.52,z]);}
  for(const x of [2.08,2.42])pipe(structure,metal,[[x,3.52,-4.8],[x,3.52,3.1]],.012);
  for(const x of [2.16,2.22,2.28,2.34])pipe(structure,gasket,[[x,3.54,-4.8],[x,3.54,2.35],[4.8,3.54,2.35],[4.8,1.2,2.35]],.008);

  // Curved woven screens carry privacy and acoustic separation. A clear
  // walking route remains at the front, rather than fake transparent walls.
  function divider(x,sign){
    const g=new THREE.Group();g.position.x=x;root.add(g);
    panelFrame(g,6.65,2.75,[0,1.48,-1.05]).rotation.y=Math.PI/2;
    for(let z=-4.32;z<2.1;z+=.16){
      box(g,satin,[.055,2.7,.023],[.012,1.48,z]);
    }
    for(const y of [.18,2.86])box(g,metal,[.11,.045,6.8],[0,y,-1.05]);
    return g;
  }
  const leftDivider=divider(-2.8,-1),rightDivider=divider(2.8,1);
  // Reception side receives a softer acoustic sleeve, with its woven folds
  // visible against the denser service-side partition.
  const curtain=surface(root,fabric,6.7,2.64,80,20,(u,v)=>[-2.91+Math.sin(u*28)*.032,1.51+v,-1.05+u],'woven privacy sleeve');
  curtain.castShadow=false;
  const rail=rod(root,metal,.018,6.9,[-2.91,2.91,-1.05],[Math.PI/2,0,0]);
  for(let z=-4.3;z<2.1;z+=.24){const ring=mesh(new THREE.TorusGeometry(.025,.003,6,12),metal,root,[-2.91,2.91,z]);ring.rotation.y=Math.PI/2;}
  // The own-case window sits at the public edge of the operations bay.
  const caseWindow=new THREE.Group();caseWindow.position.set(2.81,1.47,.6);caseWindow.rotation.y=-Math.PI/2;root.add(caseWindow);
  block(caseWindow,metal,[1.14,.88,.075],[0,0,0],.028,'patient-facing case window');
  block(caseWindow,gasket,[1.04,.78,.015],[0,0,.046],.018);
  const ownScreen=printTexture(['Case window','Room 001','Prepared room record','No body tracking']);
  const ownPlane=sheet(caseWindow,.95,.70,[0,.015,.059],[0,0,0],new THREE.MeshBasicMaterial({map:ownScreen.texture}));
  box(caseWindow,metal,[1.2,.035,.32],[0,-.47,.12],'accessible reading ledge');

  // Consultation furniture: two identical chairs around an oblique, rounded
  // writing surface, with a physically reachable paper consent register.
  function consultationChair(x,z,yaw){
    const g=new THREE.Group();g.position.set(x,.07,z);g.rotation.y=yaw;root.add(g);
    rod(g,metal,.29,.034,[0,.03,0],null);
    rod(g,metal,.032,.36,[0,.22,0]);
    block(g,softGreen,[.62,.12,.59],[0,.46,0],.07,'consultation seat');
    const back=block(g,green,[.65,.46,.095],[0,.71,-.27],.045);back.rotation.x=-.12;
    for(const x of [-.31,.31])pipe(g,metal,[[x,.43,.20],[x,.66,.10],[x,.66,-.22]],.013);
    for(let i=0;i<4;i++)fastener(x+(i%2?.19:-.19),.08,z+(i<2?.19:-.19),'y');
  }
  consultationChair(-5.8,.85,-.28);consultationChair(-4.13,-1.62,Math.PI+.16);
  const consult=new THREE.Group();consult.position.set(-5.06,.07,-.40);consult.rotation.y=.10;root.add(consult);
  block(consult,metal,[2.15,.075,1.12],[0,.76,0],.15,'shared consultation surface');
  block(consult,porcelain,[1.94,.014,.94],[0,.805,0],.10);
  for(const x of [-.72,.72]){
    box(consult,metal,[.055,.70,.65],[x,.39,0]);
    box(consult,metal,[.32,.025,.76],[x,.06,0]);
  }
  const consent=printTexture(['Consultation','Your room, your account','Consent remains optional','You can stop the trial']);
  sheet(consult,.44,.56,[-.36,.815,0],[-Math.PI/2,0,.08],new THREE.MeshStandardMaterial({map:consent.texture,roughness:1}));
  pipe(consult,darkMetal,[[.02,.817,.27],[.16,.817,-.19]],.0035);
  const deskScreen=printTexture(['Appointment 001','Environmental Variability','Resident account','Room evidence']);
  const screenGroup=new THREE.Group();screenGroup.position.set(.64,.92,-.12);screenGroup.rotation.x=-.42;consult.add(screenGroup);
  block(screenGroup,metal,[.42,.29,.025],[0,0,0],.012);
  sheet(screenGroup,.38,.25,[0,0,.014],[0,0,0],new THREE.MeshBasicMaterial({map:deskScreen.texture}));
  // A curved waiting bench is a different posture from the examination support.
  const bench=new THREE.Group();bench.position.set(-6.85,.07,-3.7);root.add(bench);
  block(bench,green,[.65,.14,1.8],[0,.43,0],.065);
  block(bench,softGreen,[.12,.55,1.8],[-.29,.64,0],.055);
  for(const z of [-.66,.66])box(bench,metal,[.52,.38,.045],[0,.22,z]);
  // Acoustic canopy panels are replaceable independently of the frame.
  for(let z=-3.9;z<2.2;z+=.86){
    const c=block(roof,felt,[4.50,.045,.78],[-5.15,3.30,z],.06);c.rotation.z=.025;
    for(const x of [-6.7,-3.6])pipe(roof,metal,[[x,3.33,z],[x,3.70,z]],.003);
  }

  // Central trial bay: a sequence of slender vaults expresses the exchange
  // between the inhabited room and the layered outside boundary.
  for(const z of [-4.86,-3.22,-1.58,.06,1.70]){
    const points=[[-2.48,.11,z],[-2.48,2.65,z],[-2.25,3.12,z],[-1.50,3.49,z],[0,3.65,z],[1.50,3.49,z],[2.25,3.12,z],[2.48,2.65,z],[2.48,.11,z]];
    pipe(structure,metal,points,.031);
    for(const x of [-2.48,2.48]){box(structure,metal,[.20,.025,.20],[x,.10,z]);fastener(x-.06,.12,z,'y');fastener(x+.06,.12,z,'y');}
  }
  // Narrow membrane strips retain an open crown and make room for the
  // service spine instead of covering the study with one opaque dome.
  for(const sign of [-1,1]){
    surface(roof,fabric,1.58,6.6,30,64,(u,v)=>{
      const x=sign*(.77+u),s=Math.max(0,1-(x/2.5)**2);
      return [x,2.76+.86*Math.sqrt(s)+Math.sin(v*2.4+u*8)*.012,-1.60+v];
    },'replaceable roof membrane');
  }
  // A fine flush grate and floor drain make the outside edge tangible.
  const grate=new THREE.InstancedMesh(unitBox,metal,94);
  const mat4=new THREE.Matrix4(),q=new THREE.Quaternion(),sc=new THREE.Vector3(),po=new THREE.Vector3();
  for(let i=0;i<94;i++){po.set(-2.25+i*.048,.081,-4.54);sc.set(.013,.018,.65);mat4.compose(po,q,sc);grate.setMatrixAt(i,mat4);}grate.receiveShadow=true;root.add(grate);
  box(root,darkMetal,[4.60,.035,.7],[0,.058,-4.54]);
  // Re-add grate over its dark recess, without z-fighting.
  grate.renderOrder=1;
  for(const z of [-4.90,-4.18])box(root,metal,[4.63,.025,.027],[0,.083,z]);

  // Reclining support assembled as a contoured pad on a repairable steel
  // chassis. Its length, head roll, handrail and foot deck register a body.
  const support=new THREE.Group();support.position.set(.1,.08,-.55);root.add(support);
  const padShape=(u,v)=>{
    const t=(v+1.04)/2.08;
    let y=.57+.68*Math.exp(-(((t-.12)/.23)**2))+.12*Math.exp(-(((t-.78)/.13)**2));
    y+=.035*(1-(u/.44)**2);
    return [u,y,v];
  };
  surface(support,green,.88,2.08,34,84,padShape,'contoured examination support');
  surface(support,metal,.90,2.11,24,64,(u,v)=>{const p=padShape(u,v*.985);return [p[0],p[1]-.075,v];},'formed aluminium tray');
  for(const sign of [-1,1]){
    const trim=[];for(let i=0;i<=80;i++){const v=-1.04+i/80*2.08,p=padShape(sign*.438,v);trim.push([p[0],p[1]+.005,p[2]]);}pipe(support,softGreen,trim,.006);
    pipe(support,metal,[[sign*.30,.13,-.80],[sign*.30,.41,-.80],[sign*.30,.50,.67],[sign*.30,.13,.85]],.027);
    pipe(support,metal,[[sign*.50,.46,-.44],[sign*.50,.80,-.35],[sign*.50,.81,.18],[sign*.50,.49,.40]],.016);
  }
  block(support,green,[.65,.15,.21],[0,1.20,-.84],.07,'removable head support');
  for(const z of [-.74,.78])box(support,metal,[.84,.035,.26],[0,.11,z]);
  for(const x of [-.34,.34])for(const z of [-.74,.78]){
    rod(support,darkMetal,.032,.04,[x,.08,z],[Math.PI/2,0,0]);
    fastener(x,.34,z,'z',support);
  }
  // A patient-accessible pause control has a wired route and one purpose.
  const pause=new THREE.Group();pause.position.set(-.61,.82,-.36);support.add(pause);
  block(pause,porcelain,[.13,.18,.09],[0,0,0],.018);
  const switchButton=rod(pause,red,.033,.025,[0,.025,.059],[Math.PI/2,0,0]);
  switchButton.name='Patient pause control';switchButton.userData.clinicAction='pause';
  pipe(support,gasket,[[-.61,.74,-.36],[-.61,.43,-.36],[-.57,.16,-.50],[-.8,.11,-1.2],[-2.3,.11,-1.2],[-2.3,.3,-4.65]],.006);
  const pauseLabel=printTexture(['Pause'],{width:256,height:128,background:'#d3d7c9'});
  sheet(pause,.10,.05,[0,-.055,.046],[0,0,0],new THREE.MeshStandardMaterial({map:pauseLabel.texture,roughness:1}));
  // No simulated person is placed here: the body support and reachable
  // control establish bodily scale without fabricating biometric evidence.

  // The outer boundary is mechanically explicit: fixed frame, separate
  // filter cassette, sliding double leaf and a linked louvre bank.
  const portal=new THREE.Group();portal.position.set(0,1.65,-4.95);root.add(portal);
  for(const x of [-2.36,2.36]){
    box(portal,metal,[.15,3.0,.24],[x,0,0]);
    for(const y of [-1.23,1.23]){box(portal,satin,[.21,.16,.28],[x,y,0]);fastener(x,y+1.65,-4.79);}
  }
  for(const y of [-1.43,1.43]){
    box(portal,metal,[4.86,.15,.25],[0,y,0]);
    for(const z of [-.07,.07])box(portal,gasket,[4.56,.008,.018],[0,y+(y<0?.078:-.078),z]);
  }
  const leaves=[];
  for(const side of [-1,1]){
    const leaf=new THREE.Group();leaf.position.x=side*1.12;portal.add(leaf);leaves.push({leaf,side});
    const framed=panelFrame(leaf,2.20,2.67,[0,0,.02],{glass:clear,mat:metal});
    box(leaf,gasket,[.012,2.59,.01],[-side*1.05,0,.056]);
    pipe(leaf,metal,[[side*.85,-.25,.14],[side*.85,.25,.14]],.012);
    for(const y of [-1.15,1.15]){rod(leaf,darkMetal,.029,.028,[side*.88,y,-.12],[Math.PI/2,0,0]);}
  }
  // Linear actuators and bellows make the controlled threshold maintainable.
  for(const x of [-1.7,1.7]){
    const actuator=rod(portal,satin,.045,.65,[x,1.61,.04],[0,0,Math.PI/2]);
    rod(portal,metal,.017,.74,[x+(x<0?.48:-.48),1.61,.04],[0,0,Math.PI/2]);
    box(portal,gasket,[.20,.13,.16],[x+(x<0?-.36:.36),1.61,.04]);
  }
  // Fine mesh has genuine transparent openings; the cassette can move clear
  // of the passage without implying a quantified filtration efficiency.
  const meshCanvas=document.createElement('canvas');meshCanvas.width=128;meshCanvas.height=128;
  const mg=meshCanvas.getContext('2d');mg.fillStyle='#ffffff';mg.fillRect(0,0,128,128);mg.fillStyle='#000000';
  for(let x=0;x<128;x+=8)for(let y=0;y<128;y+=8)mg.fillRect(x+1,y+1,5,5);
  const meshMap=new THREE.CanvasTexture(meshCanvas);meshMap.wrapS=meshMap.wrapT=THREE.RepeatWrapping;meshMap.repeat.set(15,10);
  const meshMat=new THREE.MeshStandardMaterial({color:0xbac2ad,alphaMap:meshMap,alphaTest:.45,side:THREE.DoubleSide,roughness:.92});
  const filterCassette=panelFrame(portal,4.37,2.61,[0,0,-.25],{glass:meshMat,mat:satin});
  for(const x of [-2.16,2.16])box(filterCassette,darkMetal,[.05,.13,.05],[x,0,.045]);
  const louvres=[];
  for(let i=0;i<12;i++){
    const pivot=new THREE.Group();pivot.position.set(0,-1.17+i*.214,-.46);portal.add(pivot);
    box(pivot,metal,[4.33,.038,.24],[0,0,0]);
    for(const x of [-2.20,2.20])rod(pivot,darkMetal,.012,.14,[x,0,0],[0,0,Math.PI/2]);
    louvres.push(pivot);
  }
  for(const x of [-2.26,2.26])pipe(portal,amber,[[x,-1.20,-.47],[x,1.35,-.47]],.010);
  // The protected exterior bed is soil and rough mineral, not wellness decor.
  box(root,edgeStone,[5.15,.30,1.0],[0,-.01,-6.03]);
  box(root,m.dirt,[4.95,.07,.82],[0,.16,-6.03]);
  const stones=new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1,1),edgeStone,80);
  for(let i=0;i<80;i++){po.set((rand()-.5)*4.75,.20+rand()*.05,-6.03+(rand()-.5)*.7);sc.set(.035+rand()*.05,.025+rand()*.025,.04+rand()*.07);mat4.compose(po,q,sc);stones.setMatrixAt(i,mat4);}stones.castShadow=true;stones.receiveShadow=true;root.add(stones);
  // The weather boundary opens towards a living edge, not an image of green.
  // Reuse the same CC0 scanned fern already present in the room asset set.
  // The plants are rooted in the soil trough; no fabricated ecological data
  // or change in vegetation is derived from the Clinic's controls.
  const fernAsset = await new GLTFLoader().loadAsync('./assets/fern_02/fern_02.gltf');
  const plantRegister = [
    [-1.92,-6.05,.70,.32],[-1.05,-6.20,.52,1.14],
    [-.15,-5.91,.84,-.57],[.76,-6.14,.61,2.04],[1.45,-5.99,.49,-1.31]
  ];
  for (const [x,z,height,rotation] of plantRegister) {
    const fern = fitModel(fernAsset.scene.clone(true),height,[x,.198,z],rotation);
    fern.name='Fern at the exterior weather edge';root.add(fern);
  }
  // A small fixed water catcher and a replaceable coarse mat articulate the
  // weather edge without inventing microbial measurements.
  box(root,metal,[.36,.06,.60],[2.08,.22,-6.03]);
  box(root,gasket,[.29,.012,.52],[2.08,.255,-6.03]);
  for(let i=0;i<9;i++)box(root,satin,[.30,.01,.018],[2.08,.266,-6.26+i*.052]);

  // Operations: a bent sheet service desk, visible underside, repairable
  // monitors and a paper audit tray. No bank of fictional patient feeds.
  const console=new THREE.Group();console.position.set(5.05,.07,-1.55);console.rotation.y=-.10;root.add(console);
  block(console,metal,[3.44,.075,1.22],[0,.88,0],.075,'folded-sheet operations bench');
  box(console,satin,[3.30,.04,.84],[0,.83,-.06]);
  for(const x of [-1.4,1.4]){
    box(console,metal,[.045,.80,.83],[x,.45,0]);
    box(console,metal,[.40,.035,1.02],[x,.06,0]);
    for(const z of [-.34,.34])fastener(x,.89,z,'y',console);
  }
  box(console,darkMetal,[3.0,.055,.09],[0,.38,-.35]);
  for(let i=0;i<5;i++)pipe(console,gasket,[[.20+i*.035,.84,-.40],[.20+i*.035,.59,-.41],[1.3,.59,-.41],[1.3,.12,-.41]],.005);
  const caseMonitor=printTexture(['Room 001 case replay','Patient home','Generated demonstration','No live room connected']);
  const historyMonitor=printTexture(['Change record','EV-03','No session activity','Patient can view own case']);
  function monitor(x,content){
    const g=new THREE.Group();g.position.set(x,1.28,-.25);g.rotation.x=-.10;console.add(g);
    block(g,darkMetal,[1.1,.72,.05],[0,0,0],.026);
    block(g,satin,[1.07,.69,.015],[0,0,-.035],.025);
    sheet(g,1.02,.64,[0,0,.028],[0,0,0],new THREE.MeshBasicMaterial({map:content.texture}));
    rod(console,metal,.025,.31,[x,1.0,-.29]);
    box(console,metal,[.35,.018,.24],[x,.93,-.29]);
    return g;
  }
  monitor(-.76,caseMonitor);monitor(.52,historyMonitor);
  const keyboard=block(console,satin,[.58,.025,.20],[-.71,.935,.30],.012);keyboard.rotation.y=.03;
  const keys=new THREE.InstancedMesh(unitBox,porcelain,45);
  for(let i=0;i<45;i++){po.set(-.96+(i%15)*.036,.952,.24+Math.floor(i/15)*.055);sc.set(.026,.012,.04);mat4.compose(po,q,sc);keys.setMatrixAt(i,mat4);}console.add(keys);
  block(console,darkMetal,[.18,.025,.25],[.1,.936,.28],.01,'pointing surface');
  const tray=block(console,satin,[.40,.05,.52],[1.27,.945,.20],.012);
  for(let i=0;i<4;i++)sheet(console,.33,.44,[1.27,.974+i*.001,.20],[-Math.PI/2,0,(i-2)*.017]);
  // Open service drawers and paper sleeve rail make maintenance readable.
  for(let i=0;i<5;i++){
    const x=3.35+i*.72;
    block(root,metal,[.65,1.08,.62],[x,.61,-4.72],.017,'service cabinet');
    for(let j=0;j<3;j++){
      block(root,satin,[.60,.29,.025],[x,.33+j*.32,-4.39],.008);
      pipe(root,metal,[[x-.12,.38+j*.32,-4.36],[x-.12,.38+j*.32,-4.31],[x+.12,.38+j*.32,-4.31],[x+.12,.38+j*.32,-4.36]],.007);
    }
  }
  for(let i=0;i<7;i++){
    const x=3.4+i*.53;
    const sleeve=panelFrame(root,.46,.62,[x,2.09,-5.15],{glass:translucent,mat:satin});
    sheet(sleeve,.36,.49,[0,0,.01],[0,0,0],paper);
  }
  // Technician perch uses the same assembly language as the consultation.
  consultationChair(5.48,.4,.06);
  // The operations canopy keeps the service connections visible below it.
  for(let z=-4.25;z<2.4;z+=1.1){
    box(roof,satin,[4.50,.025,1.01],[5.15,3.56,z]);
    box(roof,gasket,[4.32,.01,.015],[5.15,3.54,z+.47]);
  }
  // Low-glare task lighting belongs to furniture and structure.
  for(const x of [-5.15,0,5.15]){
    const light=new THREE.RectAreaLight(0xe5eddc,x===0?3.6:2.5,3.8,.16);light.position.set(x,3.35,-.8);light.lookAt(x,.2,-.8);root.add(light);
    box(structure,metal,[3.8,.055,.11],[x,3.41,-.8]);
    box(structure,lightMaterial,[3.7,.009,.075],[x,3.378,-.8]);
  }
  const trialFill=new THREE.PointLight(0xe3eadd,3,8,2);trialFill.position.set(0,2.1,1.8);root.add(trialFill);
  const recordLed=mesh(new THREE.SphereGeometry(.018,12,8),new THREE.MeshBasicMaterial({color:0x71826c}),console,[1.57,1.53,-.20]);
  // A continuous datum contains zone names without turning the architecture
  // into a forest of labels. These are signs, not speculative diagnoses.
  plaque(root,['Consultation'],2.05,.20,[-5.15,.19,5.23],[-Math.PI/2,0,0]);
  plaque(root,['Environmental trial'],2.58,.20,[0,.19,5.23],[-Math.PI/2,0,0]);
  plaque(root,['Operations and records'],2.65,.20,[5.15,.19,5.23],[-Math.PI/2,0,0]);

  // Fasteners are instanced per parent, so small construction details do not
  // become hundreds of individual draw calls in the browser.
  const boltGeo=new THREE.CylinderGeometry(.008,.008,.009,6);
  for(const parent of new Set(fasteners.map(b=>b.parent))){
    const items=fasteners.filter(b=>b.parent===parent),bolts=new THREE.InstancedMesh(boltGeo,darkMetal,items.length);
    const rot=new THREE.Quaternion();
    items.forEach((b,i)=>{po.set(b.x,b.y,b.z);rot.setFromEuler(new THREE.Euler(b.axis==='z'?Math.PI/2:0,0,b.axis==='x'?Math.PI/2:0));mat4.compose(po,rot,new THREE.Vector3(1,1,1));bolts.setMatrixAt(i,mat4);});parent.add(bolts);bolts.castShadow=true;
  }
  let targetOpening=0,currentOpening=0,targetShade=.4,currentShade=.4,targetFilter=0,currentFilter=0;
  let lastScreenKey='',state={};
  function setState(next={}){
    state={...state,...next};
    targetOpening=Math.max(0,Math.min(1,Number(state.opening)||0));
    targetShade=Math.max(0,Math.min(1,Number(state.shade)||0));
    targetFilter=state.filter==='bypass'?1:0;
    recordLed.material.color.set(state.recording?0xc1d9ab:0x6c7c65);
    const key=JSON.stringify([state.indoor,state.outdoor,state.source,state.classification,state.role,state.recording,state.ruleVersion,state.events?.length,state.zone]);
    if(key===lastScreenKey)return;lastScreenKey=key;
    const n=v=>Number.isFinite(v)?v.toFixed(1)+'°C':'Not supplied';
    const status=state.recording?'Appointment record open':'Appointment record stopped';
    const source=state.source||'Generated demonstration';
    caseMonitor.draw(['Room 001 case replay','Patient home',source,'Indoor  '+n(state.indoor),'Outdoor  '+n(state.outdoor),'Clinic mechanisms are a rehearsal']);
    const events=(state.events||[]).slice(-4).map(e=>typeof e==='string'?e:(e.label||e.type||e.action||'Recorded change'));
    historyMonitor.draw(state.role==='staff'?['Change record',state.ruleVersion||CLINIC.protocolVersion,status,...(events.length?events:['No changes in this session'])]:['Operations and records','Staff-side register',status,'Own-case summary faces the patient']);
    ownScreen.draw(['Your case','Room 001 home replay',state.classification||'Assessment not opened',status,'You can stop the trial']);
  }
  function step(dt=1/30){
    const a=1-Math.exp(-Math.min(.1,dt)*6);
    currentOpening+=(targetOpening-currentOpening)*a;
    currentShade+=(targetShade-currentShade)*a;
    currentFilter+=(targetFilter-currentFilter)*a;
    leaves.forEach(({leaf,side})=>leaf.position.x=side*(1.12+currentOpening*1.10));
    louvres.forEach(p=>p.rotation.x=(currentShade*Math.PI*75/180));
    filterCassette.position.x=currentFilter*4.65;
  }
  function setCutaway(value){
    shell.visible=!value;roof.visible=!value;
  }
  setState({opening:0,shade:.4,filter:'filtered',recording:false,role:'patient'});
  root.userData={geometry:CLINIC,trialSpace:'Architectural mechanism study; no climate or health prediction',caseId:'Room 001'};
  return {root,roof,setCutaway,setState,step,pickables:[switchButton]};
}
