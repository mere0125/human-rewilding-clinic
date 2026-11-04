import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {fitModel,random} from './spatial.js';
import {buildStreet} from './street.js';

// A constructed courtyard gives the case a spatial and institutional setting.
// Its other buildings do not have invented thermal records or sensor feeds.
export async function makeNeighbourhood(materials,renderer){
  const root=new THREE.Group();root.name='Constructed courtyard';
  const built=new THREE.Group();root.add(built);
  const rand=random(1402),box=new THREE.BoxGeometry(1,1,1);
  const mat={
    plaster:materials.wall.clone(),chalk:materials.chalk.clone(),wood:materials.oak,
    iron:new THREE.MeshStandardMaterial({color:0x394239,roughness:.65,metalness:.55}),
    green:new THREE.MeshStandardMaterial({color:0x506b58,roughness:.7,metalness:.12}),
    stone:new THREE.MeshStandardMaterial({color:0xb8b5a7,roughness:.94}),
    paving:new THREE.MeshStandardMaterial({color:0xbab6a9,roughness:.94}),
    soil:materials.dirt,glass:new THREE.MeshStandardMaterial({color:0x4a5a56,metalness:.35,roughness:.25,envMapIntensity:.7}),
    curtain:materials.linen.clone(),roof:new THREE.MeshStandardMaterial({color:0x777f77,roughness:.65,metalness:.6}),
    copper:new THREE.MeshStandardMaterial({color:0x796955,roughness:.72,metalness:.6})
  };
  mat.plaster.color.set(0xc4c1b3);mat.chalk.color.set(0xd7d5c9);mat.curtain.color.set(0xc1c0a7);
  const windowMaterials=[0xddd3b6,0xadb8b4,0x8e9f9d,0xd4b98b].map((c,i)=>new THREE.MeshStandardMaterial({color:c,roughness:.32,metalness:.18,emissive:0xe9b779,emissiveIntensity:i===0?.18:.04}));
  const glow=new THREE.MeshStandardMaterial({color:0xf0dfb3,emissive:0xf4c77c,emissiveIntensity:.85,roughness:.6});
  const loader=new THREE.TextureLoader();
  const maps=await Promise.all(['diffuse','normal','roughness'].map(k=>loader.loadAsync('./assets/brick_wall_006/'+k+'.jpg')));
  maps.forEach(t=>{t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(1,1);t.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());});maps[0].colorSpace=THREE.SRGBColorSpace;
  mat.brick=new THREE.MeshStandardMaterial({map:maps[0],normalMap:maps[1],roughnessMap:maps[2],normalScale:new THREE.Vector2(.35,.35),color:0xb4a18a,roughness:.93});
  const pavementMaps=await Promise.all(['Diffuse','nor_gl','Rough'].map(k=>loader.loadAsync('./assets/cobblestone_floor_01/'+k+'.jpg')));
  pavementMaps.forEach(t=>{t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(.38,.38);t.anisotropy=8;});pavementMaps[0].colorSpace=THREE.SRGBColorSpace;
  mat.cobbles=new THREE.MeshStandardMaterial({map:pavementMaps[0],normalMap:pavementMaps[1],roughnessMap:pavementMaps[2],color:0xb9b7a8,normalScale:new THREE.Vector2(.65,.65),roughness:.95});
  const concreteMaps=await Promise.all(['Diffuse','nor_gl','Rough'].map(k=>loader.loadAsync('./assets/concrete_wall_008/'+k+'.jpg')));
  concreteMaps.forEach(t=>{t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(1.2,1.2);t.anisotropy=8;});concreteMaps[0].colorSpace=THREE.SRGBColorSpace;
  Object.assign(mat.stone,{map:concreteMaps[0],normalMap:concreteMaps[1],roughnessMap:concreteMaps[2],normalScale:new THREE.Vector2(.35,.35)});
  function block(m,size,xyz,parent=built){
    const geometry=m===mat.brick?box.clone():box;
    if(m===mat.brick){const uv=geometry.attributes.uv,p=geometry.attributes.position,n=geometry.attributes.normal;for(let i=0;i<p.count;i++){const side=Math.abs(n.getX(i))>.5;uv.setXY(i,(side?p.getZ(i)*size[2]:p.getX(i)*size[0])*.7,p.getY(i)*size[1]*.7);}}
    const o=new THREE.Mesh(geometry,m);o.scale.set(...size);o.position.set(...xyz);o.castShadow=o.receiveShadow=true;parent.add(o);return o;
  }
  function cylinder(m,r,h,xyz,segments=20,parent=built){const o=new THREE.Mesh(new THREE.CylinderGeometry(r,r,h,segments),m);o.position.set(...xyz);o.castShadow=o.receiveShadow=true;parent.add(o);return o;}
  function rod(m,a,b,r=.022){const from=new THREE.Vector3(...a),to=new THREE.Vector3(...b),d=to.clone().sub(from);const o=cylinder(m,r,d.length(),from.clone().add(to).multiplyScalar(.5).toArray(),10);o.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),d.normalize());return o;}
  function label(value,width,height,xyz,rotation=0){
    const c=document.createElement('canvas');c.width=1024;c.height=256;const g=c.getContext('2d');g.fillStyle='#e3e5d7';g.fillRect(0,0,c.width,c.height);g.fillStyle='#3c5140';g.font='400 83px Arial';g.textAlign='center';g.fillText(value,512,157);
    const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;const o=new THREE.Mesh(new THREE.PlaneGeometry(width,height),new THREE.MeshStandardMaterial({map:t,roughness:.8}));o.position.set(...xyz);o.rotation.y=rotation;built.add(o);
  }
  function facadeWindow(parent,x,y,w=1.05,h=1.7,clear=false){
    block(mat.iron,[w+.14,h+.13,.11],[x,y,0],parent);
    block(clear?materials.glass:windowMaterials[Math.floor(rand()*windowMaterials.length)],[w,h,.025],[x,y,.068],parent);
    for(const side of [-1,1])block(mat.stone,[.065,h+.08,.15],[x+side*(w*.5+.07),y,.025],parent);
    for(const xx of [x-w*.5,x,x+w*.5])block(mat.chalk,[.045,h+.03,.085],[xx,y,.11],parent);
    for(const yy of [y-h*.5,y,y+h*.5])block(mat.chalk,[w+.08,.045,.085],[x,yy,.11],parent);
    block(mat.chalk,[w+.28,.075,.33],[x,y-h*.5-.045,.08],parent);
    block(mat.chalk,[w+.24,.07,.22],[x,y+h*.5+.10,.035],parent);
    if(rand()>.3){const cloth=block(mat.curtain,[w*.28,h-.08,.024],[x+(rand()>.5?1:-1)*w*.3,y,.083],parent);cloth.material=mat.curtain;}
  }
  function house({x,z,w,d,h,floors,face='south',brick=false,pitched=false,openFront=false}){
    if(!openFront)block(brick?mat.brick:mat.plaster,[w,h,d],[x,h*.5,z]);
    else{
      for(const side of [-1,1])block(mat.plaster,[.18,h,d],[x+side*(w*.5-.09),h*.5,z]);
      block(mat.plaster,[w,h,.18],[x,h*.5,z-d*.5+.09]);block(mat.plaster,[w,.15,d],[x,h-.075,z]);
      for(const side of [-1,1])block(mat.plaster,[.34,h,.18],[x+side*(w*.5-.17),h*.5,z+d*.5-.09]);
      block(mat.plaster,[w,.48,.18],[x,h-.24,z+d*.5-.09]);block(mat.chalk,[w,.10,d],[x,.05,z]);
    }
    block(mat.stone,[w+.06,.38,d+.06],[x,.19,z]);
    block(mat.chalk,[w+.24,.16,d+.24],[x,h-.20,z]);
    block(mat.roof,[w-.13,.09,d-.13],[x,h+.015,z]);
    for(const xx of [-1,1])block(mat.chalk,[.13,.28,d+.24],[x+xx*(w*.5+.03),h+.15,z]);
    for(const zz of [-1,1])block(mat.chalk,[w+.12,.28,.13],[x,h+.15,z+zz*(d*.5+.03)]);
    for(let f=1;f<floors;f++)block(mat.chalk,[w+.09,.08,d+.09],[x,f*(h/floors),z]);
    const count=Math.max(2,Math.floor(w/1.9));
    for(const side of ['south','north','east']){
      const g=new THREE.Group();built.add(g);
      const frontage=side==='east'?d:w;
      g.position.set(side==='east'?x+w*.5+.012:x,0,side==='south'?z+d*.5+.012:side==='north'?z-d*.5-.012:z);
      g.rotation.y=side==='east'?Math.PI/2:side==='north'?Math.PI:0;
      const cols=side==='east'?Math.max(2,Math.floor(d/2)):count;
      for(let f=0;f<floors;f++)for(let c=0;c<cols;c++){
        facadeWindow(g,(c-(cols-1)*.5)*frontage/(cols+.25),(f+.5)*h/floors+.12,frontage/(cols+1)*.59,Math.min(1.65,h/floors*.57),openFront&&side==='south');
      }
    }
    const drainX=x+w*.5+.1,drainZ=z+d*.5+.13;
    rod(mat.copper,[drainX,.05,drainZ],[drainX,h-.18,drainZ],.035);
    for(let y=.5;y<h;y+=1.3)block(mat.iron,[.11,.025,.1],[drainX-.015,y,drainZ-.02]);
    // Roof seams, service heads and parapet flashing are physical geometry.
    for(let xx=-w*.5+.3;xx<w*.5-.1;xx+=.42)block(mat.roof,[.018,.035,d-.2],[x+xx,h+.08,z]);
    for(let n=0;n<2;n++){
      const xx=x-w*.3+n*w*.4,zz=z-d*.22;
      block(mat.stone,[.55,.58,.58],[xx,h+.32,zz]);
      block(mat.iron,[.69,.05,.70],[xx,h+.63,zz]);
    }
    const doorX=x-w*.26,doorZ=z+d*.5+.17;
    if(!openFront)block(mat.green,[.96,2.05,.09],[doorX,1.025,doorZ]);
    for(const xx of [doorX-.55,doorX+.55])block(mat.chalk,[.09,2.22,.21],[xx,1.11,doorZ]);
    block(mat.chalk,[1.18,.12,.30],[doorX,2.22,doorZ]);
    block(mat.stone,[1.40,.14,.74],[doorX,.07,doorZ+.22]);
    block(materials.chrome,[.025,.23,.035],[doorX+.34,1.05,doorZ+.075]);
    // Roof-level guard rails have posts, two horizontals and a fixed access head.
    if(!pitched)for(const zz of [-1,1]){
      for(let xx=-w*.5+.22;xx<w*.5;xx+=.75)rod(mat.iron,[x+xx,h+.25,z+zz*(d*.5-.19)],[x+xx,h+1.04,z+zz*(d*.5-.19)],.012);
      for(const yy of [h+.65,h+1.04])rod(mat.iron,[x-w*.5+.20,yy,z+zz*(d*.5-.19)],[x+w*.5-.20,yy,z+zz*(d*.5-.19)],.012);
    }
    if(!pitched){block(mat.plaster,[1.12,1.05,1.35],[x+w*.2,h+.55,z-d*.16]);block(mat.roof,[1.3,.08,1.5],[x+w*.2,h+1.11,z-d*.16]);}
    else{
      const rise=1.5,slope=Math.atan2(rise,w*.5),length=Math.hypot(w*.5,rise)+.18;
      for(const side of [-1,1]){const plane=block(mat.roof,[length,.065,d+.35],[x+side*w*.25,h+rise*.5,z]);plane.rotation.z=-side*slope;}
      rod(mat.copper,[x,h+rise+.04,z-d*.5-.16],[x,h+rise+.04,z+d*.5+.16],.04);
      for(const side of [-1,1])for(let i=1;i<12;i++){const t=i/12;rod(mat.roof,[x+side*w*.5*t,h+rise*(1-t)+.05,z-d*.5-.1],[x+side*w*.5*t,h+rise*(1-t)+.05,z+d*.5+.1],.015);}
      for(const side of [-1,1]){const zz=z+side*(d*.5+.012),g=new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(x-w*.5,h,zz),new THREE.Vector3(x+w*.5,h,zz),new THREE.Vector3(x,h+rise,zz)]);g.setIndex([0,1,2,2,1,0]);g.computeVertexNormals();g.setAttribute('uv',new THREE.Float32BufferAttribute([0,0,1,0,.5,1],2));const end=new THREE.Mesh(g,brick?mat.brick:mat.plaster);end.castShadow=end.receiveShadow=true;built.add(end);}
    }
  }
  // The selected room is a single-storey annex against the west terrace.
  house({x:-4.5,z:0,w:5.05,d:7.1,h:8.9,floors:3,brick:true});
  house({x:5.3,z:-7,w:8.8,d:4.4,h:8.1,floors:3});
  house({x:12.25,z:-.1,w:4.1,d:7.8,h:5.9,floors:2});
  house({x:5.15,z:7.0,w:6.2,d:3.85,h:3.42,floors:1,openFront:true});
  house({x:12.8,z:-7.25,w:4.5,d:3.7,h:3.8,floors:1,brick:true});
  house({x:-4.8,z:8.4,w:5.6,d:4.3,h:5.4,floors:2});
  // Annex has the exact room shell elsewhere in the scene. These trims add
  // exterior fabric without covering its interior or its operating window.
  block(mat.roof,[3.9,.065,3.5],[0,2.86,0]);
  for(const zz of [-1.76,1.76])block(mat.copper,[3.98,.1,.045],[0,2.85,zz]);
  block(mat.copper,[.045,.1,3.5],[1.96,2.85,0]);
  label('Room 001',.75,.2,[1.992,2.24,.85],Math.PI/2);
  label('The Human Rewilding Clinic',3.4,.52,[5.15,2.72,9.00]);
  label('Building office',1.8,.34,[14.33,2.28,1.4],Math.PI/2);
  // Doors, awning and an outdoor bench give the Clinic a local street frontage.
  for(const x of [4.56,5.74])block(mat.green,[.07,2.35,.18],[x,1.175,9.035]);
  for(const y of [.08,2.30])block(mat.green,[1.25,.10,.18],[5.15,y,9.035]);
  block(mat.glass,[.96,1.50,.02],[5.15,1.43,9.14]);
  for(const xx of [4.61,5.69])block(mat.chalk,[.04,2.2,.05],[xx,1.16,9.15]);
  block(mat.chrome||materials.chrome,[.04,.38,.06],[5.55,1.2,9.20]);
  block(mat.green,[4.0,.08,1.05],[5.15,2.55,9.43]);
  for(const xx of [3.35,6.95])rod(mat.iron,[xx,2.52,9.82],[xx,1.9,9.02],.018);
  block(mat.stone,[6.7,.13,1.35],[5.15,.06,9.48]);
  // Reception is a real space behind the glazed frontage.
  block(mat.green,[4.15,.76,.62],[5.30,.42,7.96]);block(mat.wood,[4.24,.055,.78],[5.30,.825,7.96]);
  for(let i=0;i<12;i++)block(materials.paper,[.044,.28,.22],[3.55+i*.055,1.0,7.94]);
  block(materials.chrome,[.50,.025,.31],[5.65,.866,7.95]);
  for(let i=0;i<3;i++)block(mat.iron,[.27,.025,.20],[5.68,.90+i*.03,7.97]);
  for(const x of [3.2,4.05,6.5]){block(mat.wood,[.6,.06,.55],[x,.48,6.20]);for(const xx of [-.24,.24])for(const zz of [-.2,.2])block(mat.iron,[.025,.46,.025],[x+xx,.23,6.20+zz]);block(mat.wood,[.62,.55,.04],[x,.73,5.98]);}
  label('Case review',1.8,.35,[5.25,2.05,5.19]);
  const reportCanvas=document.createElement('canvas');reportCanvas.width=768;reportCanvas.height=1024;
  const reportTexture=new THREE.CanvasTexture(reportCanvas);reportTexture.colorSpace=THREE.SRGBColorSpace;
  const reportMaterial=new THREE.MeshStandardMaterial({map:reportTexture,roughness:.93});
  block(mat.iron,[.64,.85,.025],[6.60,1.30,8.00]);
  const report=new THREE.Mesh(new THREE.PlaneGeometry(.59,.79),reportMaterial);report.position.set(6.60,1.30,8.018);built.add(report);
  rod(mat.iron,[6.60,.85,8.00],[6.60,1.16,8.00],.025);
  // A shallow plinth and inset pavement keep every object on one ground datum.
  block(mat.stone,[24.6,.28,23.2],[3.45,-.21,.40]);
  block(mat.paving,[24.2,.055,22.8],[3.45,-.045,.40]);
  const tileMats=[0xc4c1b6,0xc0bdb1,0xbab8ac,0xc7c4b8].map(c=>{const m=mat.cobbles.clone();m.color.set(c);return m;});
  for(let xi=0;xi<18;xi++)for(let zi=0;zi<16;zi++){
    const x=-.65+xi*.59,z=-4.55+zi*.59;
    if((x<2.05&&z>-1.8&&z<1.8)||(x>10.1)||(z>5.0))continue;
    block(tileMats[Math.floor(rand()*4)],[.565,.024,.565],[x,.0,z]);
  }
  function bed(x,z,w,d){
    block(mat.chalk,[w+.17,.22,d+.17],[x,.10,z]);block(mat.soil,[w,.12,d],[x,.17,z]);
  }
  bed(6.1,.7,3.4,3.4);bed(2.7,-3.0,1.4,1.7);bed(9.0,-3.1,1.5,1.6);bed(9.3,3.3,1.4,1.5);
  function bench(x,z,rotation=0){
    const g=new THREE.Group();g.position.set(x,0,z);g.rotation.y=rotation;built.add(g);
    for(let i=0;i<5;i++)block(mat.wood,[1.65,.035,.058],[0,.46,-.15+i*.075],g);
    for(let i=0;i<4;i++)block(mat.wood,[1.65,.055,.032],[0,.67+i*.068,.22],g);
    for(const xx of [-.61,.61]){block(mat.iron,[.042,.48,.39],[xx,.24,.02],g);block(mat.iron,[.035,.52,.04],[xx,.70,.25],g);}
  }
  bench(6.1,-1.45);bench(8.25,.5,Math.PI/2);bench(2.8,5.3,Math.PI/2);
  // Community noticeboard with layers of paper and a steel backing.
  for(const xx of [8.0,9.2])block(mat.green,[.055,1.85,.055],[xx,.925,5.5]);
  block(mat.green,[1.4,.95,.08],[8.6,1.48,5.5]);
  for(let n=0;n<6;n++){const paper=block(materials.paper,[.26,.33,.006],[8.13+(n%3)*.36,1.26+Math.floor(n/3)*.37,5.545]);paper.rotation.z=(rand()-.5)*.1;}
  label('Courtyard notices',1.23,.17,[8.6,2.06,5.56]);
  // A rainwater barrel and service fittings belong to the illustrative setting.
  cylinder(mat.green,.43,1.12,[10.0,.64,-4.9],48);
  for(let y=.13;y<1.18;y+=.045){const ring=new THREE.Mesh(new THREE.TorusGeometry(.432,.009,5,48),mat.green);ring.rotation.x=Math.PI/2;ring.position.set(10,y,-4.9);built.add(ring);}
  rod(materials.chrome,[10,.27,-4.46],[10,.27,-4.30],.014);
  const tap=cylinder(mat.copper,.02,.1,[10,.25,-4.29],16);tap.rotation.x=Math.PI/2;
  // A bicycle, with a drawn frame and individual spokes, leans by the office.
  const bx=10.10,bz=2.9;
  for(const zz of [bz-.54,bz+.54]){
    const wheel=new THREE.Mesh(new THREE.TorusGeometry(.32,.018,8,48),mat.iron);wheel.rotation.y=Math.PI/2;wheel.position.set(bx,.35,zz);built.add(wheel);
    for(let n=0;n<16;n++){const a=n/16*Math.PI*2;rod(materials.chrome,[bx,.35,zz],[bx,.35+Math.cos(a)*.31,zz+Math.sin(a)*.31],.0016);}
  }
  const frame=[[bx,.35,bz-.54],[bx,.78,bz-.16],[bx,.35,bz+.10],[bx,.35,bz-.54],[bx,.75,bz+.40],[bx,.35,bz+.54],[bx,.35,bz+.10],[bx,.78,bz-.16],[bx,.75,bz+.40]];
  for(let i=0;i<frame.length-1;i++)rod(mat.green,frame[i],frame[i+1],.012);
  block(mat.iron,[.16,.035,.23],[bx,.87,bz-.18]);rod(mat.iron,[bx,.75,bz+.4],[bx,.96,bz+.44],.014);rod(mat.iron,[bx-.16,.96,bz+.44],[bx+.16,.96,bz+.44],.012);
  const setting=buildStreet({root,built,mat,materials,block,cylinder,rod,house,label,glow,rand});
  // Merge only the static constructed fabric. Shared scanned vegetation keeps
  // its material assignments and transparency intact.
  built.updateMatrixWorld(true);
  const buckets=new Map();
  built.traverse(o=>{if(!o.isMesh)return;const k=o.material.uuid;if(!buckets.has(k))buckets.set(k,{material:o.material,geometries:[]});buckets.get(k).geometries.push(o.geometry.clone().applyMatrix4(o.matrixWorld));});
  const merged=new THREE.Group();
  for(const {material,geometries}of buckets.values()){
    const g=mergeGeometries(geometries,false);if(!g)continue;const mesh=new THREE.Mesh(g,material);mesh.castShadow=!material.transparent&&!(material.transmission>0);mesh.receiveShadow=true;merged.add(mesh);geometries.forEach(g=>g.dispose());
  }
  root.remove(built);root.add(merged);
  const gltf=new GLTFLoader();
  const [tree,fern,plant]=await Promise.all([
    gltf.loadAsync('./assets/courtyard_tree.glb'),
    gltf.loadAsync('./assets/fern_02/fern_02.gltf'),
    gltf.loadAsync('./assets/potted_plant_02/potted_plant_02.gltf')
  ]);
  for(const [x,z,h,rot]of [[6.05,.6,5.4,.3],[2.7,-3,3.5,2.4],[9.1,-3.1,4.1,1.1]])root.add(fitModel(tree.scene.clone(true),h,[x,.18,z],rot));
  for(let i=0;i<12;i++){
    const a=i/12*Math.PI*2,x=6.1+Math.cos(a)*1.25,z=.7+Math.sin(a)*1.25;
    root.add(fitModel(fern.scene.clone(true),.34+rand()*.16,[x,.22,z],rand()*6.28));
  }
  for(const [x,z,h]of [[3.3,9.25,.55],[7.1,9.25,.63],[10.8,3.1,.48],[10.8,2.2,.65]])root.add(fitModel(plant.scene.clone(true),h,[x,.04,z],rand()*6.28));
  for(const [x,z,h]of setting.trees)root.add(fitModel(tree.scene.clone(true),h,[x,.0,z],rand()*6.28));
  for(let i=0;i<30;i++){const a=i/30*Math.PI*2;root.add(fitModel(fern.scene.clone(true),.25+rand()*.45,[6+Math.cos(a)*1.4,.22,.7+Math.sin(a)*1.4],rand()*6.28));}
  for(const [x,z,y]of setting.planters)root.add(fitModel(plant.scene.clone(true),.38+rand()*.30,[x,y,z],rand()*6.28));
  return {root,windowMaterials,reportCanvas,reportTexture,glow,lamps:setting.lamps,anchors:{room:[1.7,3.1,1.1],clinic:[5.2,4.1,7.2],garden:[6,1.4,.5],office:[12.0,6.7,.1],maintenance:[12.8,4.5,-7.2],archive:[-4.8,6.1,8.4],weather:[.2,4.5,-4.7]},centre:new THREE.Vector3(3.0,2.0,.9)};
}
