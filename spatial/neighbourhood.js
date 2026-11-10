import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {fitModel,random,surface} from './spatial.js';
import {worldFinishes} from './world-finishes.js?v=20';
import {buildStreet} from './street.js?v=20';

// A constructed habitat network. Only the separate Room 001 case has a
// thermal model; the surrounding fabric is a spatial proposition.
export async function makeNeighbourhood(materials,renderer){
  const root=new THREE.Group();root.name='Constructed habitat courtyard';
  const built=new THREE.Group();root.add(built);
  const rand=random(1402),unitBox=new THREE.BoxGeometry(1,1,1),f=worldFinishes();
  const mat={plaster:f.ivory,chalk:f.ivory.clone(),wood:f.mist,iron:f.dark,green:f.green,stone:f.mineral,
    paving:new THREE.MeshStandardMaterial({color:0xcbd0c5,roughness:.70}),soil:materials.dirt,glass:f.glass,
    curtain:f.pearl,roof:f.silver,copper:f.silver,brick:f.mist,silver:f.silver,pearl:f.pearl};
  mat.chalk.color.set(0xebece4);
  mat.cobbles=mat.paving;
  const windowMaterials=[0x9eafa7,0xb9c4b9,0x7e928a,0xcbd0bf].map((c,i)=>new THREE.MeshStandardMaterial({color:c,roughness:.28,metalness:.25,emissive:0xe2e7d4,emissiveIntensity:i===0?.09:.025}));
  const glow=new THREE.MeshStandardMaterial({color:0xe8eddc,emissive:0xecf1df,emissiveIntensity:.6,roughness:.4});
  const geometryCache=new Map();
  function block(m,size,xyz,parent=built){const o=new THREE.Mesh(unitBox,m);o.scale.set(...size);o.position.set(...xyz);o.castShadow=o.receiveShadow=true;parent.add(o);return o;}
  function soft(m,size,xyz,r=.12,parent=built){const radius=Math.min(r,Math.min(...size)*.44),key=size.join(',')+','+radius;let geo=geometryCache.get(key);if(!geo){geo=new RoundedBoxGeometry(...size,3,radius);geometryCache.set(key,geo);}const o=new THREE.Mesh(geo,m);o.position.set(...xyz);o.castShadow=o.receiveShadow=true;parent.add(o);return o;}
  function cylinder(m,r,h,xyz,segments=20,parent=built){const o=new THREE.Mesh(new THREE.CylinderGeometry(r,r,h,segments),m);o.position.set(...xyz);o.castShadow=o.receiveShadow=true;parent.add(o);return o;}
  function rod(m,a,b,r=.022,parent=built){const from=new THREE.Vector3(...a),to=new THREE.Vector3(...b),d=to.clone().sub(from);const o=cylinder(m,r,d.length(),from.clone().add(to).multiplyScalar(.5).toArray(),12,parent);o.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),d.normalize());return o;}
  function label(value,width,height,xyz,rotation=0,parent=built){const c=document.createElement('canvas');c.width=1024;c.height=256;const g=c.getContext('2d');g.fillStyle='#e6eae0';g.fillRect(0,0,c.width,c.height);g.fillStyle='#3c5549';g.font='400 76px Arial';g.textAlign='center';g.fillText(value,512,155,950);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;const o=new THREE.Mesh(new THREE.PlaneGeometry(width,height),new THREE.MeshStandardMaterial({map:t,roughness:.7}));o.position.set(...xyz);o.rotation.y=rotation;o.castShadow=false;parent.add(o);return o;}
  function roundedShape(w,h,r){const p=new THREE.Shape(),x=-w/2,y=-h/2;p.moveTo(x+r,y);p.lineTo(x+w-r,y);p.quadraticCurveTo(x+w,y,x+w,y+r);p.lineTo(x+w,y+h-r);p.quadraticCurveTo(x+w,y+h,x+w-r,y+h);p.lineTo(x+r,y+h);p.quadraticCurveTo(x,y+h,x,y+h-r);p.lineTo(x,y+r);p.quadraticCurveTo(x,y,x+r,y);return p;}
  function frame(parent,w,h,depth,pos,r=.10){const s=roundedShape(w,h,r);s.holes.push(roundedShape(w-.09,h-.09,Math.max(.025,r-.045)));const geo=new THREE.ExtrudeGeometry(s,{depth,steps:1,bevelEnabled:true,bevelSize:.002,bevelThickness:.002,bevelSegments:1,curveSegments:8});const o=new THREE.Mesh(geo,mat.silver);o.position.set(...pos);o.castShadow=o.receiveShadow=true;parent.add(o);return o;}

  // Each opening has a recessed reveal, continuous glazing, a separate
  // climate screen and an accessible cassette rail. The facade is no longer
  // a flat historic window graphic on a block.
  function facadeWindow(parent,x,y,w=1.05,h=1.65,{clear=false,screen=false}={}){
    soft(mat.iron,[w+.18,h+.18,.12],[x,y,.015],.065,parent);
    frame(parent,w+.12,h+.12,.055,[x,y,.07],.11);
    const glazing=soft(clear?mat.glass:windowMaterials[Math.floor(rand()*windowMaterials.length)],[w,h,.018],[x,y,.106],.04,parent);glazing.castShadow=false;
    soft(mat.silver,[w+.26,.045,.32],[x,y-h/2-.065,.035],.018,parent);
    // Shade projects from its own upper rail and leaves the pane unobstructed.
    soft(mat.silver,[w+.30,.055,.39],[x,y+h/2+.085,.12],.024,parent);
    for(const side of [-1,1])block(mat.silver,[.025,h+.12,.045],[x+side*(w/2+.08),y,.155],parent);
    if(screen){
      const width=w*.36,offset=w*.28;
      const panel=soft(mat.pearl,[width,h-.06,.02],[x+offset,y,.22],.045,parent);panel.castShadow=false;
      for(let k=0;k<5;k++)block(mat.silver,[.006,h-.12,.018],[x+offset-width/2+.025+k*(width-.05)/4,y,.237],parent);
      block(mat.dark||mat.iron,[.03,.11,.032],[x+offset-width/2+.016,y,.25],parent);
    }
    // A narrow lower service strip, with real recesses instead of huge fins.
    for(let i=0;i<5;i++)block(mat.iron,[.085,.008,.015],[x-w*.30+i*w*.15,y-h/2-.08,.207],parent);
  }

  function house({x,z,w,d,h,floors,brick=false,openFront=false}){
    const skin=brick?mat.brick:mat.plaster;
    // Rounded corners and a thin, shouldered crown are common to housing,
    // service buildings and the Clinic, with different rhythms and scale.
    if(!openFront)soft(skin,[w,h-.20,d],[x,h/2-.03,z],.27);
    else{
      for(const side of [-1,1])soft(skin,[.17,h,d],[x+side*(w/2-.085),h/2,z],.06);
      soft(skin,[w,h,.15],[x,h/2,z-d/2+.075],.06);
      soft(mat.ivory||mat.chalk,[w,.12,d],[x,h-.06,z],.05);
    }
    soft(mat.stone,[w+.07,.10,d+.07],[x,.015,z],.04);
    soft(mat.silver,[w+.16,.055,d+.16],[x,h-.09,z],.025);
    soft(mat.chalk,[w+.10,.20,d+.10],[x,h+.025,z],.095);
    soft(mat.roof,[w-.24,.06,d-.24],[x,h+.15,z],.028);
    // A shallow pearly raised shoulder covers service heads, not a gable.
    if(floors>1){
      soft(mat.pearl,[w*.73,.37,d*.77],[x,h+.27,z-.06],.16);
      for(const side of [-1,1])soft(mat.silver,[.06,.18,d*.72],[x+side*w*.365,h+.30,z-.06],.026);
    }
    for(let f=1;f<floors;f++){
      soft(mat.silver,[w+.13,.045,d+.13],[x,f*h/floors,z],.02);
      soft(mat.chalk,[w+.18,.10,d+.18],[x,f*h/floors-.065,z],.042);
    }
    for(const side of ['south','north','east']){
      if(openFront&&side==='south')continue;
      const g=new THREE.Group();built.add(g);const frontage=side==='east'?d:w;
      g.position.set(side==='east'?x+w/2+.012:x,0,side==='south'?z+d/2+.012:side==='north'?z-d/2-.012:z);
      g.rotation.y=side==='east'?Math.PI/2:side==='north'?Math.PI:0;
      const cols=Math.max(2,Math.floor(frontage/1.85)),step=frontage/(cols+.35);
      for(let f=0;f<floors;f++)for(let c=0;c<cols;c++){
        const px=(c-(cols-1)/2)*step,py=(f+.5)*h/floors+.06;
        facadeWindow(g,px,py,Math.min(1.14,step*.70),Math.min(1.60,h/floors*.60),{screen:(c+f+(brick?1:0))%3===0});
      }
      // Tall satin inset records the access and maintenance spine on a facade.
      for(const side of [-1,1])block(mat.silver,[.025,h-.42,.035],[side*(frontage/2-.19),h/2,.03],g);
    }
    // Enclosed riser, flush inspection cover and rain return on one edge.
    const dx=x+w/2+.10,dz=z+d/2+.12;
    soft(mat.silver,[.09,h-.25,.13],[dx,h/2,dz],.035);
    for(let y=.6;y<h-.2;y+=1.25)block(mat.iron,[.024,.12,.008],[dx,y,dz+.071]);
    for(const xx of [-w*.29,w*.29]){
      soft(mat.chalk,[.53,.34,.65],[x+xx,h+.30,z-d*.20],.13);
      soft(mat.silver,[.44,.025,.57],[x+xx,h+.485,z-d*.20],.01);
      for(let n=0;n<5;n++)block(mat.iron,[.34,.007,.011],[x+xx,h+.495,z-d*.20-.20+n*.1]);
    }
    // Clear access and an attached thin canopy. The small housing threshold
    // shares the same detail family as the public Clinic entrance.
    if(!openFront){
      const doorX=x-w*.26,doorZ=z+d/2+.18;
      soft(mat.iron,[1.16,2.24,.10],[doorX,1.12,doorZ-.07],.09);
      soft(mat.green,[.98,2.12,.038],[doorX,1.06,doorZ],.065);
      frame(built,1.09,2.22,.04,[doorX,1.11,doorZ+.025],.09);
      soft(mat.silver,[1.60,.06,.92],[doorX,2.39,doorZ+.26],.025);
      for(const side of [-1,1])rod(mat.silver,[doorX+side*.65,2.36,doorZ+.62],[doorX+side*.65,2.10,doorZ-.05],.011);
      soft(mat.stone,[1.45,.055,.72],[doorX,.028,doorZ+.26],.022);
      rod(mat.silver,[doorX+.35,.90,doorZ+.083],[doorX+.35,1.23,doorZ+.083],.012);
      soft(mat.iron,[.09,.12,.018],[doorX+.55,1.36,doorZ+.09],.01);
    }
    // A low, accurately supported roof guard is subordinate to the soft crown.
    if(floors>1)for(const zz of [-1,1]){
      for(let xx=-w/2+.28;xx<w/2;xx+=1.25)rod(mat.silver,[x+xx,h+.17,z+zz*(d/2-.22)],[x+xx,h+.93,z+zz*(d/2-.22)],.009);
      rod(mat.silver,[x-w/2+.28,h+.93,z+zz*(d/2-.22)],[x+w/2-.28,h+.93,z+zz*(d/2-.22)],.012);
    }
  }

  house({x:-4.5,z:0,w:5.05,d:7.1,h:8.9,floors:3,brick:true});
  house({x:5.3,z:-7,w:8.8,d:4.4,h:8.1,floors:3});
  house({x:12.25,z:-.1,w:4.1,d:7.8,h:5.9,floors:2});
  house({x:5.15,z:7.0,w:6.2,d:3.85,h:3.42,floors:1,openFront:true});
  house({x:12.8,z:-7.25,w:4.5,d:3.7,h:3.8,floors:1,brick:true});
  house({x:-4.8,z:8.4,w:5.6,d:4.3,h:5.4,floors:2});

  // The selected room is still its separate exact shell at the common datum.
  // These trims stay above/below its real 1.50 by 1.20 m east opening.
  soft(mat.roof,[3.94,.075,3.54],[0,2.87,0],.032);
  soft(mat.chalk,[3.96,.13,3.56],[0,2.79,0],.052);
  for(const zz of [-1.72,1.72])soft(mat.silver,[3.97,.035,.04],[0,2.88,zz],.014);
  for(const zz of [-1.60,1.60])soft(mat.silver,[.055,2.63,.065],[1.987,1.33,zz],.020);
  soft(mat.mist||mat.brick,[.035,.57,3.15],[1.995,.34,0],.015);
  soft(mat.silver,[.05,.025,1.70],[2.015,.712,0],.012);
  label('Room 001',.75,.20,[2.031,2.24,.85],Math.PI/2);
  label('Building office',1.8,.31,[14.33,2.28,1.4],Math.PI/2);

  // The neighbourhood Clinic is a local reception threshold. Its architecture
  // is related to, rather than claimed to be a full copy of, the spatial study.
  const doorZ=8.99;
  for(const side of [-1,1]){
    const xx=5.15+side*1.93;
    frame(built,2.05,2.43,.055,[xx,1.27,doorZ],.13);
    const pane=soft(mat.glass,[1.94,2.32,.018],[xx,1.27,doorZ+.035],.05);pane.castShadow=false;
  }
  for(const x of [4.38,5.92])soft(mat.chalk,[.22,2.46,.085],[x,1.27,doorZ+.015],.025);
  frame(built,1.28,2.46,.065,[5.15,1.26,doorZ+.015],.11);
  const door=soft(mat.glass,[1.15,2.33,.022],[5.15,1.225,doorZ+.05],.045);door.castShadow=false;
  rod(mat.silver,[5.57,.95,doorZ+.13],[5.57,1.35,doorZ+.13],.014);
  soft(mat.silver,[6.30,.085,1.26],[5.15,2.66,9.40],.04);
  const clinicCanopy=surface(built,mat.pearl,6.15,1.12,68,20,(u,v)=>[5.15+u,2.72-.17*(Math.abs(u)/3.075)**6,9.40+v],'Clinic entrance membrane');clinicCanopy.castShadow=false;
  for(const xx of [2.25,8.05])rod(mat.silver,[xx,.05,9.84],[xx,2.63,9.84],.020);
  soft(mat.stone,[6.7,.075,1.35],[5.15,.038,9.48],.03);
  label('The Human Rewilding Clinic',3.9,.32,[5.15,3.02,9.02]);
  soft(mat.chalk,[4.15,.76,.62],[5.30,.42,7.96],.15);
  soft(mat.green,[4.05,.59,.035],[5.30,.40,8.29],.075);
  soft(mat.silver,[4.24,.035,.78],[5.30,.825,7.96],.016);
  for(let i=0;i<8;i++)block(materials.paper,[.018,.24,.20],[3.68+i*.045,.965,7.94]);
  soft(mat.silver,[.50,.020,.31],[5.65,.855,7.95],.009);
  for(const x of [3.2,4.05,6.5]){
    soft(mat.silver,[.59,.035,.55],[x,.46,6.20],.015);
    soft(mat.green,[.55,.075,.52],[x,.505,6.20],.033);
    for(const xx of [-.23,.23])rod(mat.silver,[x+xx,.04,6.41],[x+xx,.44,6.41],.014);
    soft(mat.green,[.57,.44,.075],[x,.74,5.98],.032);
  }
  label('Case review',1.8,.26,[5.25,2.05,5.19]);
  const reportCanvas=document.createElement('canvas');reportCanvas.width=768;reportCanvas.height=1024;
  const reportTexture=new THREE.CanvasTexture(reportCanvas);reportTexture.colorSpace=THREE.SRGBColorSpace;
  const reportMaterial=new THREE.MeshStandardMaterial({map:reportTexture,roughness:.75});
  soft(mat.silver,[.64,.85,.035],[6.60,1.36,8.00],.015);
  const report=new THREE.Mesh(new THREE.PlaneGeometry(.59,.79),reportMaterial);report.position.set(6.60,1.36,8.022);report.castShadow=false;built.add(report);
  rod(mat.silver,[6.60,.86,8.00],[6.60,.98,8.00],.017);

  soft(mat.stone,[24.6,.22,23.2],[3.45,-.18,.40],.08);
  block(mat.paving,[24.2,.045,22.8],[3.45,-.042,.40]);
  // Pale honed slabs and drainage seams replace the irregular cobbled scene.
  const tileMats=[0xcbd0c5,0xc7cfc2,0xd0d5c9].map(c=>{const x=mat.paving.clone();x.color.set(c);return x;});
  for(let xi=0;xi<9;xi++)for(let zi=0;zi<8;zi++){
    const x=-.2+xi*1.18,z=-4.1+zi*1.18;
    if((x<2.05&&z>-1.8&&z<1.8)||x>10.1||z>5.0)continue;
    block(tileMats[(xi+zi)%3],[1.16,.022,1.16],[x,.001,z]);
  }
  for(const x of [2.15,9.95]){
    block(mat.iron,[.065,.012,9.15],[x,.008,.45]);
    for(let z=-4;z<5;z+=.16)block(mat.silver,[.055,.009,.013],[x,.017,z]);
  }
  function bed(x,z,w,d){soft(mat.chalk,[w+.14,.18,d+.14],[x,.09,z],.07);block(mat.soil,[w,.045,d],[x,.165,z]);for(const side of [-1,1])block(mat.silver,[w+.08,.015,.018],[x,.188,z+side*(d/2+.035)]);}
  bed(6.1,.7,3.4,3.4);bed(2.7,-3.0,1.4,1.7);bed(9.0,-3.1,1.5,1.6);bed(9.3,3.3,1.4,1.5);
  function bench(x,z,rotation=0){const g=new THREE.Group();g.position.set(x,0,z);g.rotation.y=rotation;built.add(g);soft(mat.silver,[1.65,.035,.55],[0,.43,0],.017,g);soft(mat.green,[1.59,.075,.49],[0,.48,0],.035,g);for(const xx of [-.58,.58])soft(mat.chalk,[.16,.36,.40],[xx,.22,0],.055,g);soft(mat.green,[1.59,.30,.065],[0,.66,-.22],.028,g);}
  bench(6.1,-1.45);bench(8.25,.5,Math.PI/2);bench(2.8,5.3,Math.PI/2);
  for(const xx of [8.0,9.2])rod(mat.silver,[xx,.04,5.5],[xx,1.94,5.5],.022);
  soft(mat.chalk,[1.4,.95,.065],[8.6,1.48,5.5],.028);
  for(const [i,text]of['Shared care','Nursery hours','Repair requests','Case appointments','Water return','Courtyard access'].entries())label(text,.36,.20,[8.16+(i%3)*.44,1.26+Math.floor(i/3)*.33,5.537]);
  label('Courtyard notices',1.23,.17,[8.6,2.06,5.56]);
  soft(mat.chalk,[.86,1.12,.72],[10.0,.64,-4.9],.20);
  for(const y of [.22,1.04])soft(mat.silver,[.88,.025,.74],[10,y,-4.9],.012);
  rod(mat.silver,[10,.27,-4.53],[10,.27,-4.30],.012);
  const tap=cylinder(mat.silver,.018,.09,[10,.25,-4.29],16);tap.rotation.x=Math.PI/2;
  // The bicycle remains a commonplace object in this speculative setting.
  const bx=10.10,bz=2.9;
  for(const zz of[bz-.54,bz+.54]){const wheel=new THREE.Mesh(new THREE.TorusGeometry(.32,.018,8,48),mat.iron);wheel.rotation.y=Math.PI/2;wheel.position.set(bx,.35,zz);built.add(wheel);for(let n=0;n<16;n++){const a=n/16*Math.PI*2;rod(mat.silver,[bx,.35,zz],[bx,.35+Math.cos(a)*.31,zz+Math.sin(a)*.31],.0016);}}
  const bike=[[bx,.35,bz-.54],[bx,.78,bz-.16],[bx,.35,bz+.10],[bx,.35,bz-.54],[bx,.75,bz+.40],[bx,.35,bz+.54],[bx,.35,bz+.10],[bx,.78,bz-.16],[bx,.75,bz+.40]];
  for(let i=0;i<bike.length-1;i++)rod(mat.green,bike[i],bike[i+1],.012);
  soft(mat.iron,[.16,.035,.23],[bx,.87,bz-.18],.015);rod(mat.silver,[bx,.75,bz+.4],[bx,.96,bz+.44],.014);rod(mat.silver,[bx-.16,.96,bz+.44],[bx+.16,.96,bz+.44],.012);
  const setting=buildStreet({root,built,mat,materials,block,soft,cylinder,rod,house,label,glow,rand});

  // Merge static geometry by material; all geometries use the same attributes.
  built.updateMatrixWorld(true);const buckets=new Map();
  built.traverse(o=>{if(!o.isMesh)return;const k=o.material.uuid;if(!buckets.has(k))buckets.set(k,{material:o.material,geometries:[]});let g=o.geometry.clone().applyMatrix4(o.matrixWorld);if(g.index)g=g.toNonIndexed();buckets.get(k).geometries.push(g);});
  const merged=new THREE.Group();
  for(const {material,geometries}of buckets.values()){const g=mergeGeometries(geometries,false);if(!g)continue;const mesh=new THREE.Mesh(g,material);mesh.castShadow=!material.transparent&&!(material.transmission>0);mesh.receiveShadow=true;merged.add(mesh);geometries.forEach(g=>g.dispose());}
  root.remove(built);root.add(merged);
  const gltf=new GLTFLoader();const [tree,fern,plant]=await Promise.all([gltf.loadAsync('./assets/courtyard_tree.glb'),gltf.loadAsync('./assets/fern_02/fern_02.gltf'),gltf.loadAsync('./assets/potted_plant_02/potted_plant_02.gltf')]);
  for(const [x,z,h,rot]of[[6.05,.6,5.4,.3],[2.7,-3,3.5,2.4],[9.1,-3.1,4.1,1.1]])root.add(fitModel(tree.scene.clone(true),h,[x,.18,z],rot));
  for(let i=0;i<12;i++){const a=i/12*Math.PI*2;root.add(fitModel(fern.scene.clone(true),.34+rand()*.16,[6.1+Math.cos(a)*1.25,.20,.7+Math.sin(a)*1.25],rand()*6.28));}
  for(const [x,z,h]of[[3.3,9.25,.55],[7.1,9.25,.63],[10.8,3.1,.48],[10.8,2.2,.65]])root.add(fitModel(plant.scene.clone(true),h,[x,.04,z],rand()*6.28));
  for(const[x,z,h]of setting.trees)root.add(fitModel(tree.scene.clone(true),h,[x,.15,z],rand()*6.28));
  for(let i=0;i<26;i++){const a=i/26*Math.PI*2;root.add(fitModel(fern.scene.clone(true),.25+rand()*.40,[6.1+Math.cos(a)*1.35,.20,.7+Math.sin(a)*1.35],rand()*6.28));}
  for(const[x,z,y]of setting.planters)root.add(fitModel(plant.scene.clone(true),.38+rand()*.30,[x,y,z],rand()*6.28));
  return {root,windowMaterials,reportCanvas,reportTexture,glow,lamps:setting.lamps,anchors:{room:[1.7,3.1,1.1],clinic:[5.2,4.1,7.2],garden:[6,1.4,.5],office:[12.0,6.7,.1],maintenance:[12.8,4.5,-7.2],archive:[-4.8,6.1,8.4],weather:[.2,4.5,-4.7]},centre:new THREE.Vector3(3.0,2.0,.9)};
}
