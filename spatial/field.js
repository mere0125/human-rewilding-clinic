import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {RGBELoader} from 'three/addons/loaders/RGBELoader.js';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {RectAreaLightUniformsLib} from 'three/addons/lights/RectAreaLightUniformsLib.js';
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';
import {GTAOPass} from 'three/addons/postprocessing/GTAOPass.js';
import {OutputPass} from 'three/addons/postprocessing/OutputPass.js';
import {loadSurfaces} from './surfaces.js';
import {makeRoom} from './room.js';
import {makeClinic} from './clinic.js?v=14';
import {CLINIC} from '../clinic-spec.mjs?v=14';
import {makeNeighbourhood} from './neighbourhood.js';
import {CASE} from '../case.mjs';
import {createRelationView} from './relation-view.js';

const $=s=>document.querySelector(s),canvas=$('#scene');
const renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false,preserveDrawingBuffer:true,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.setSize(innerWidth,innerHeight);
renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.07;
renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
RectAreaLightUniformsLib.init();
const scene=new THREE.Scene();scene.background=new THREE.Color(0xe9e8df);
scene.fog=new THREE.Fog(0xc9cdc4,65,145);
const camera=new THREE.PerspectiveCamera(36,innerWidth/innerHeight,.025,160);
const planCamera=new THREE.OrthographicCamera(-3.5,3.5,2.8,-2.8,.1,40);
planCamera.position.set(0,12,.0001);planCamera.up.set(0,0,-1);planCamera.lookAt(0,0,0);
let activeCamera=camera;
const orbit=new OrbitControls(camera,canvas);orbit.enableDamping=true;orbit.dampingFactor=.075;orbit.maxPolarAngle=Math.PI*.47;orbit.minPolarAngle=.16;orbit.minDistance=15;orbit.maxDistance=86;orbit.target.set(3.5,1.8,.3);
camera.position.set(25,21.5,29);orbit.update();
const target=new THREE.WebGLRenderTarget(innerWidth,innerHeight,{type:THREE.HalfFloatType,samples:2});
const composer=new EffectComposer(renderer,target),renderPass=new RenderPass(scene,camera);
composer.addPass(renderPass);
const ao=new GTAOPass(scene,camera,innerWidth,innerHeight,undefined,{radius:.22,thickness:.5,distanceExponent:1.2,distanceFallOff:.8,scale:.85,samples:8});ao.blendIntensity=.75;ao.enabled=false;
const oldVisibility=ao.overrideVisibility.bind(ao);ao.overrideVisibility=()=>{oldVisibility();scene.traverse(o=>{if(o.isMesh&&o.material?.transmission>.1)o.visible=false;});};
composer.addPass(ao);composer.addPass(new OutputPass());
const sun=new THREE.DirectionalLight(0xffe4bd,3.4);sun.position.set(14,19,9);sun.target.position.set(3,0,.3);sun.castShadow=true;sun.shadow.mapSize.set(4096,4096);Object.assign(sun.shadow.camera,{left:-20,right:20,top:20,bottom:-20,near:1,far:75});sun.shadow.bias=-.00008;sun.shadow.normalBias=.018;sun.shadow.radius=3;scene.add(sun,sun.target);
const ambient=new THREE.HemisphereLight(0xe6ebe2,0x8c8879,.65);scene.add(ambient);
const windowFill=new THREE.RectAreaLight(0xe6e7df,10,1.12,1.45);windowFill.position.set(1.79,1.36,0);windowFill.lookAt(-1.3,1.2,0);scene.add(windowFill);
const bounce=new THREE.PointLight(0xd9c9aa,.3,5,2);bounce.position.set(-.6,.8,.1);scene.add(bounce);
const ground=new THREE.Mesh(new THREE.PlaneGeometry(180,180),new THREE.MeshStandardMaterial({color:0xe3e1d7,roughness:1}));ground.rotation.x=-Math.PI/2;ground.position.y=-.36;ground.receiveShadow=true;scene.add(ground);

let room,neighbourhood,clinic,worldEnvironment,clinicEnvironment,clinicState={},clinicPose='arrival',ready=false,view='clinic',selected='room',sample=null,openingTarget=0;
let yaw=0,pitch=0,drag=null,lastFrame=0,lookTween=null,neighbourhoodCamera='courtyard';
const keys=new Set();
const labels=[...document.querySelectorAll('[data-anchor]')];
function refreshWorldLabels(){
  const close={courtyard:['room','garden','weather'],entrance:['clinic'],nursery:['nursery']};
  const allowed=view==='clinic'?[]:view==='neighbourhood'?(neighbourhoodCamera==='overview'?['room','clinic','garden','office','maintenance','archive','weather']:(close[neighbourhoodCamera]||close.courtyard)):['room','section'].includes(view)?['window','logger','radiator']:[];
  labels.forEach(l=>l.hidden=!allowed.includes(l.dataset.anchor));
}
const logCanvas=document.createElement('canvas');logCanvas.width=256;logCanvas.height=128;const logTexture=new THREE.CanvasTexture(logCanvas);logTexture.colorSpace=THREE.SRGBColorSpace;
const anchors={window:[1.70,2.05,-.25],logger:[.65,1.60,-1.43],radiator:[1.45,.74,.55]};
const positions={door:{eye:[.22,1.59,1.36],at:[.64,1.08,-.48]},window:{eye:[.18,1.55,.56],at:[1.82,1.32,-.08]},logger:{eye:[.23,1.56,.66],at:[.65,1.42,-1.575]},radiator:{eye:[.20,1.36,.76],at:[1.63,.44,.03]},bed:{eye:[.22,1.57,.48],at:[-.98,.71,-.66]}};
const tell=data=>parent.postMessage(data,location.origin);
const relations=createRelationView(node=>tell({type:'clinic-relation',node}));
function visitNeighbourhood(id){
  neighbourhoodCamera=id;
  if(!ready)return;orbit.enabled=true;orbit.minDistance=.7;orbit.maxDistance=90;orbit.maxPolarAngle=Math.PI*.49;
  const poses={courtyard:{eye:[12.0,6.4,8.8],at:[3.0,1.8,-.2],fov:50},entrance:{eye:[7.7,1.75,11.4],at:[5.05,1.45,8.4],fov:56},nursery:{eye:[-1.6,2.1,-3.8],at:[-4.8,1.3,-7.3],fov:56}};
  if(id==='overview'){camera.fov=40;orbit.target.copy(neighbourhood.centre);const fit=Math.max(1,1.15/camera.aspect);camera.position.copy(neighbourhood.centre).add(new THREE.Vector3(31,28,38).multiplyScalar(fit));}
  else{const p=poses[id]||poses.courtyard;camera.fov=p.fov;camera.position.set(...p.eye);orbit.target.set(...p.at);if(camera.aspect<1){camera.position.sub(orbit.target).multiplyScalar(1.3).add(orbit.target);}}
  camera.updateProjectionMatrix();orbit.update();
  refreshWorldLabels();
}
function look(eye,at){camera.position.set(...eye);const d=new THREE.Vector3(...at).sub(camera.position).normalize();yaw=Math.atan2(d.x,d.z);pitch=Math.asin(d.y);updateLook();}
function updateLook(){const d=new THREE.Vector3(Math.sin(yaw)*Math.cos(pitch),Math.sin(pitch),Math.cos(yaw)*Math.cos(pitch));camera.lookAt(camera.position.clone().add(d));}
function choosePart(part){
  if(!ready)return;
  if(view!=='room')setView('room');
  const p=positions[part]||positions.door;
  const d=new THREE.Vector3(...p.at).sub(new THREE.Vector3(...p.eye)).normalize();
  lookTween={start:performance.now(),eye:camera.position.clone(),end:new THREE.Vector3(...p.eye),yaw0:yaw,pitch0:pitch,yaw1:Math.atan2(d.x,d.z),pitch1:Math.asin(d.y)};
  selected=part;labels.forEach(l=>l.classList.toggle('selected',l.dataset.anchor===part));
}
function applySample(value){
  sample=value;if(!ready)return;
  relations.update(value);
  if(clinic)clinic.setState({...clinicState,role:clinicState.role||'patient',opening:clinicState.opening||0,shade:clinicState.shade??.45});
  if(view==='clinic')return;
  openingTarget=value.window===null||value.window<=.5?0:-Math.PI/4;
  const ctx=logCanvas.getContext('2d');ctx.fillStyle='#bdc9ad';ctx.fillRect(0,0,256,128);ctx.fillStyle='#334932';ctx.font='60px Arial';ctx.textAlign='center';ctx.fillText(value.indoor.toFixed(1),128,86);logTexture.needsUpdate=true;room.loggerDisplay.material.map=logTexture;room.loggerDisplay.material.color.set(0xffffff);room.loggerDisplay.material.needsUpdate=true;
  $('#windowState').textContent=value.window===null?'State not recorded':value.window>.5?'Open in this interval':'Closed in this interval';
  $('#loggerTemperature').textContent=value.indoor.toFixed(1)+'°C at this time';
  $('#conditioningState').textContent=value.hvac===null?'Operation not recorded':(value.hvac*100).toFixed(0)+'% of this interval active';
  room.coolingIndicator.material.color.set(value.balance?.conditioning<0?0x97c883:0x52604d);
  // Display lighting follows the selected clock only. No solar gain is added
  // to the thermal equation, and no unmeasured temperature field is drawn.
  const h=new Intl.DateTimeFormat('en-US',{timeZone:CASE.timezone,hour:'numeric',minute:'numeric',hourCycle:'h23'}).formatToParts(new Date(value.t));
  const clock=Number(h.find(p=>p.type==='hour').value)+Number(h.find(p=>p.type==='minute').value)/60;
  const daylight=Math.max(0,Math.sin((clock-6)*Math.PI/12));
  sun.intensity=.15+3.6*daylight;ambient.intensity=.48+.19*daylight;windowFill.intensity=2+9*daylight;
  sun.position.set(13*Math.cos((clock-9)*Math.PI/12),5+19*daylight,9*Math.sin((clock-6)*Math.PI/12));
  renderer.toneMappingExposure=view==='room'?.94+.14*daylight:1.04;
  neighbourhood.windowMaterials.forEach((m,i)=>m.emissiveIntensity=(1-daylight)*[.48,.06,.10,.3][i]);
  neighbourhood.glow.emissiveIntensity=.6+(1-daylight)*1.4;neighbourhood.lamps.forEach(l=>l.intensity=(1-daylight)*11);
  const rctx=neighbourhood.reportCanvas.getContext('2d');rctx.fillStyle='#eeeede';rctx.fillRect(0,0,768,1024);rctx.fillStyle='#324837';rctx.textAlign='left';rctx.font='32px Arial';rctx.fillText('The Human Rewilding Clinic',50,85);rctx.font='64px Arial';rctx.fillText('Room 001',50,190);rctx.strokeStyle='#8c9a84';rctx.beginPath();rctx.moveTo(50,230);rctx.lineTo(718,230);rctx.stroke();rctx.font='27px Arial';['Prepared case record',value.source,'Indoor air  '+value.indoor.toFixed(1)+'°C','Outdoor air  '+value.outdoor.toFixed(1)+'°C',value.window>.5?'Opening scheduled':'Opening closed','Clinic trial criteria',value.classification||'Assessment pending',value.provenance||'Source not verified'].forEach((line,i)=>rctx.fillText(line,50,300+i*70));neighbourhood.reportTexture.needsUpdate=true;
  canvas.dataset.caseId=CASE.id;canvas.dataset.sampleTime=String(value.t);canvas.dataset.source=value.source;canvas.dataset.window=value.window===null?'unknown':value.window>.5?'open':'closed';canvas.dataset.indoor=value.indoor.toFixed(3);
}
function setView(next){
  if(!ready)return;lookTween=null;view=next;
  if(next!=='clinic'){
    scene.environment=worldEnvironment;scene.environmentRotation.y=1.35;scene.environmentIntensity=.58;
    sun.color.set(0xffe4bd);ambient.color.set(0xe6ebe2);ambient.groundColor.set(0x8c8879);
    ground.material.color.set(0xe3e1d7);ao.blendIntensity=.75;
    Object.assign(sun.shadow.camera,{left:-20,right:20,top:20,bottom:-20});sun.shadow.camera.updateProjectionMatrix();sun.target.position.set(3,0,.3);
  }
  orbit.enabled=['neighbourhood','network','section','clinic'].includes(next);activeCamera=next==='plan'?planCamera:camera;
  renderPass.camera=activeCamera;ao.camera=activeCamera;ao.enabled=['room','section'].includes(next);
  neighbourhood.root.visible=!['plan','section','clinic'].includes(next);ground.visible=!['plan','section'].includes(next);clinic.root.visible=next==='clinic';
  canvas.style.opacity=next==='network'?'.58':'1';canvas.style.filter=next==='network'?'saturate(.4)':'none';
  room.ceiling.visible=next==='room';room.cutawayWalls.forEach(o=>o.visible=true);room.eastWall.visible=true;
  renderer.clippingPlanes=next==='section'?[new THREE.Plane(new THREE.Vector3(0,0,-1),.8)]:[];
  room.root.visible=next!=='clinic';windowFill.visible=next!=='plan';bounce.visible=next==='room';
  dimensionLines.visible=next==='plan';
  relations.show(next==='network');
  if(next==='clinic'){
    renderer.clippingPlanes=[];ao.enabled=false;ao.blendIntensity=.32;windowFill.visible=false;bounce.visible=false;
    scene.background.set(0xe8e9e4);scene.environment=clinicEnvironment;scene.environmentRotation.y=.20;
    renderer.toneMappingExposure=.84;scene.environmentIntensity=.48;
    sun.color.set(0xfff6e9);sun.intensity=1.6;sun.position.set(-10,19,10);
    ambient.color.set(0xf1f3ef);ambient.groundColor.set(0xb2b8b0);ambient.intensity=.28;ground.material.color.set(0xe0e3dc);
    Object.assign(sun.shadow.camera,{left:-13,right:13,top:12,bottom:-12});sun.shadow.camera.updateProjectionMatrix();sun.target.position.set(0,0,0);
    visitClinic(clinicPose);$('#canvasNote').textContent='Clinic architectural study. Room 001 remains the separate thermal model.';
  }else if(next==='neighbourhood'||next==='network'){
    sun.color.set(0xffe4bd);scene.environmentIntensity=.58;Object.assign(sun.shadow.camera,{left:-20,right:20,top:20,bottom:-20});sun.shadow.camera.updateProjectionMatrix();sun.target.position.set(3,0,.3);
    orbit.minDistance=13;orbit.maxDistance=85;camera.fov=40;orbit.target.copy(neighbourhood.centre);const fit=Math.max(1,1.20/camera.aspect);camera.position.copy(neighbourhood.centre).add(new THREE.Vector3(27,24,33).multiplyScalar(fit));orbit.update();scene.background.set(0xd8dcd5);renderer.toneMappingExposure=1.04;
    $('#canvasNote').textContent=next==='network'?'Named dependencies around one case. Care relations are contextual.':'Constructed neighbourhood. Only Room 001 has a thermal model.';
    if(next==='neighbourhood')visitNeighbourhood(neighbourhoodCamera);
  }else if(next==='room'){
    camera.fov=56;look(positions.door.eye,positions.door.at);scene.background.set(0xd9e0d5);
    $('#canvasNote').textContent='One room temperature. Daylight is illustrative.';
  }else if(next==='section'){
    orbit.minDistance=4;orbit.maxDistance=18;orbit.target.set(0,1.0,-.3);camera.fov=40;camera.position.set(5.1,4.6,6.3);orbit.update();scene.background.set(0xd8dcd5);$('#canvasNote').textContent='Architectural section. The thermal envelope is unchanged.';
  }else{
    scene.background.set(0xeeeede);$('#canvasNote').textContent='Same geometry as the room. Opening shown from the selected interval.';
  }
  camera.updateProjectionMatrix();if(sample)applySample(sample);
  refreshWorldLabels();
  tell({type:'clinic-spatial-view',view:next});
}
function visitClinic(id='overview'){
  if(!ready||!clinic)return;
  clinicPose=CLINIC.cameras[id]?id:'overview';
  const p=CLINIC.cameras[clinicPose];camera.fov=p.fov;orbit.enabled=true;orbit.minDistance=.55;orbit.maxDistance=55;orbit.minPolarAngle=.12;orbit.maxPolarAngle=Math.PI*.49;
  orbit.target.set(...p.at);camera.position.set(...p.eye);
  if(camera.aspect<1)camera.position.sub(orbit.target).multiplyScalar(clinicPose==='overview'?1.45:1.12).add(orbit.target);
  camera.updateProjectionMatrix();orbit.update();clinic.setCutaway(clinicPose==='overview');ao.enabled=!['overview','arrival'].includes(clinicPose);
}
const clinicRay=new THREE.Raycaster(),clinicPointer=new THREE.Vector2();
canvas.addEventListener('click',e=>{
  if(view!=='clinic'||!ready)return;
  const b=canvas.getBoundingClientRect();clinicPointer.set((e.clientX-b.left)/b.width*2-1,-(e.clientY-b.top)/b.height*2+1);clinicRay.setFromCamera(clinicPointer,camera);
  if(clinicRay.intersectObjects(clinic.pickables||[],true).length)tell({type:'clinic-patient-pause'});
});

const dimensionLines=new THREE.Group();scene.add(dimensionLines);dimensionLines.visible=false;
function dim(a,b){const g=new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(...a),new THREE.Vector3(...b)]);dimensionLines.add(new THREE.Line(g,new THREE.LineBasicMaterial({color:0x68715c})));}
function dimLabel(value,x,z,rotation=0){const c=document.createElement('canvas');c.width=512;c.height=100;const g=c.getContext('2d');g.font='34px Arial';g.fillStyle='#43533e';g.textAlign='center';g.fillText(value,256,65);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;const o=new THREE.Sprite(new THREE.SpriteMaterial({map:t,transparent:true,depthTest:false}));o.scale.set(1.8,.352,1);o.position.set(x,3.2,z);o.material.rotation=rotation;dimensionLines.add(o);}
dim([-1.8,3.1,1.99],[1.8,3.1,1.99]);dim([-1.8,3.1,1.90],[-1.8,3.1,2.08]);dim([1.8,3.1,1.90],[1.8,3.1,2.08]);dimLabel('3.60 m',0,2.23);
dim([-2.15,3.1,-1.6],[-2.15,3.1,1.6]);dim([-2.24,3.1,-1.6],[-2.06,3.1,-1.6]);dim([-2.24,3.1,1.6],[-2.06,3.1,1.6]);dimLabel('3.20 m',-2.40,0,Math.PI/2);dimLabel('East window',2.45,0);

THREE.DefaultLoadingManager.onProgress=(_url,loaded)=>{if(ready)return;$('#loadProgress').removeAttribute('value');$('#loadText').textContent=loaded+' model and surface resources loaded';};
async function start(){
  const [materials,hdr]=await Promise.all([loadSurfaces(renderer),new RGBELoader().loadAsync('./assets/urban_courtyard_02.hdr')]);
  hdr.mapping=THREE.EquirectangularReflectionMapping;worldEnvironment=hdr;scene.environment=hdr;scene.environmentIntensity=.58;scene.environmentRotation.y=1.35;
  // The Clinic has its own neutral reflection rig. The patient-home views
  // retain the courtyard lighting and their existing illustrative time of day.
  const studio=new RoomEnvironment(),pmrem=new THREE.PMREMGenerator(renderer);
  clinicEnvironment=pmrem.fromScene(studio,.04).texture;studio.dispose();pmrem.dispose();
  [room,neighbourhood,clinic]=await Promise.all([makeRoom(materials),makeNeighbourhood(materials,renderer),makeClinic(materials)]);
  scene.add(room.root,neighbourhood.root,clinic.root);ready=true;setView(view);if(sample)applySample(sample);
  $('#loading').classList.add('done');$('#loading').setAttribute('aria-hidden','true');setTimeout(()=>{$('#loading').hidden=true;},650);tell({type:'clinic-viewer-ready'});
}
start().catch(error=>{console.error(error);$('#loading').innerHTML='<strong>The room could not finish loading</strong><span class="fail">A model or surface resource did not arrive. Reload the view to try again.</span><button class="retry">Reload the room</button>';$('.retry').onclick=()=>location.reload();tell({type:'clinic-viewer-error',message:'A spatial resource could not load.'});});

labels.forEach(l=>l.addEventListener('click',()=>{
  const id=l.dataset.anchor;
  if(id==='room'){setView('room');tell({type:'clinic-place',place:'room'});}
  else if(['window','logger','radiator'].includes(id)){choosePart(id);tell({type:'clinic-part',part:id});}
  else{selected=id;labels.forEach(a=>a.classList.toggle('selected',a===l));tell({type:'clinic-place',place:id==='nursery'?'garden':id});}
}));
addEventListener('message',e=>{
  if(e.origin!==location.origin||e.source!==parent)return;
  const d=e.data;
  if(d?.type==='clinic-sample'&&d.caseId===CASE.id&&Number.isFinite(d.sample?.indoor))applySample(d.sample);
  if(d?.type==='clinic-view'&&['neighbourhood','room','plan','section','network','clinic'].includes(d.view))setView(d.view);
  if(d?.type==='clinic-space'){const changed=clinicPose!==d.camera;clinicState={...clinicState,...d};if(clinic)clinic.setState(clinicState);if(view!=='clinic')setView('clinic');if(changed)visitClinic(d.camera);}
  if(d?.type==='clinic-network-layer')relations.setLayer(d.layer);
  if(d?.type==='clinic-network-selection')relations.select(d.node);
  if(d?.type==='clinic-neighbourhood-camera'&&view==='neighbourhood')visitNeighbourhood(d.camera);
  if(d?.type==='clinic-part')choosePart(d.part);
  if(d?.type==='clinic-save-view'&&ready){
    composer.render();
    canvas.toBlob(blob=>{if(blob)blob.arrayBuffer().then(bytes=>tell({type:'clinic-view-image',bytes}));},'image/png');
  }
});
canvas.addEventListener('pointerdown',e=>{if(view!=='room'||!ready)return;lookTween=null;canvas.focus({preventScroll:true});drag={x:e.clientX,y:e.clientY};canvas.setPointerCapture(e.pointerId);});
canvas.addEventListener('pointermove',e=>{if(!drag)return;yaw-=(e.clientX-drag.x)*.0035;pitch=THREE.MathUtils.clamp(pitch+(e.clientY-drag.y)*.003,-1.12,1.1);drag={x:e.clientX,y:e.clientY};updateLook();});
canvas.addEventListener('pointerup',()=>drag=null);canvas.addEventListener('pointercancel',()=>drag=null);
function move(dx,dz){
  const nx=THREE.MathUtils.clamp(camera.position.x+dx,-1.67,1.62),nz=THREE.MathUtils.clamp(camera.position.z+dz,-1.44,1.43);
  const blocked=(x,z)=>(x<-.33&&z>-1.31&&z<1.01)||(x>.75&&z>.88)||(x>1.40&&z>-.54&&z<.58)||(x>1.02&&z<-.86);
  if(!blocked(nx,camera.position.z))camera.position.x=nx;if(!blocked(camera.position.x,nz))camera.position.z=nz;updateLook();
}
canvas.addEventListener('wheel',e=>{if(view!=='room')return;e.preventDefault();const s=Math.sign(e.deltaY)*-.10;move(Math.sin(yaw)*s,Math.cos(yaw)*s);},{passive:false});
canvas.addEventListener('keydown',e=>{if(view!=='room')return;if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','w','a','s','d'].includes(e.key)){e.preventDefault();keys.add(e.key);}});addEventListener('keyup',e=>keys.delete(e.key));addEventListener('blur',()=>{keys.clear();drag=null;});
function resize(){const w=innerWidth,h=innerHeight;renderer.setSize(w,h);composer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix();const half=Math.max(2.65,3.2/(w/h));planCamera.left=-half*w/h;planCamera.right=half*w/h;planCamera.top=half;planCamera.bottom=-half;planCamera.updateProjectionMatrix();if(ready&&['neighbourhood','network'].includes(view))setView(view);else if(ready&&view==='clinic')visitClinic(clinicPose);}
addEventListener('resize',resize);resize();
function positionLabels(){
  const boxes=[];
  for(const l of labels){
    if(l.hidden)continue;
    const point=view==='neighbourhood'?(l.dataset.anchor==='nursery'?[-4.8,2.3,-5.55]:l.dataset.anchor==='clinic'&&neighbourhoodCamera==='entrance'?[6.60,1.3,8.02]:neighbourhood.anchors[l.dataset.anchor]):anchors[l.dataset.anchor];
    if(!point)continue;
    const p=new THREE.Vector3(...point).project(activeCamera);
    if(p.z>1||p.z< -1||Math.abs(p.x)>1.1||Math.abs(p.y)>1.05){l.style.visibility='hidden';continue;}
    l.style.left=((p.x+1)*.5*innerWidth)+'px';l.style.top=((-p.y+1)*.5*innerHeight)+'px';l.style.visibility='visible';
    const b=l.getBoundingClientRect();
    const outside=b.left<(view==='neighbourhood'&&innerWidth>700?205:10)||b.right>innerWidth-10||b.top<(view==='room'?85:42)||b.bottom>innerHeight-54;
    const overlap=outside||boxes.some(a=>b.left<a.right+7&&b.right>a.left-7&&b.top<a.bottom+8&&b.bottom>a.top-8);
    if(overlap)l.style.visibility='hidden';else boxes.push(b);
  }
}
function frame(now){
  requestAnimationFrame(frame);if(document.hidden||now-lastFrame<28)return;lastFrame=now;
  if(orbit.enabled)orbit.update();
  if(ready){
    if(view==='clinic')clinic.step(Math.min(.08,(now-(frame.lastClinicTime||now-30))/1000));frame.lastClinicTime=now;
    room.leaf.rotation.y=THREE.MathUtils.lerp(room.leaf.rotation.y,openingTarget,.16);
    if(lookTween){const t=Math.min(1,(now-lookTween.start)/650),e=t*t*(3-2*t);camera.position.lerpVectors(lookTween.eye,lookTween.end,e);let dy=lookTween.yaw1-lookTween.yaw0;dy=Math.atan2(Math.sin(dy),Math.cos(dy));yaw=lookTween.yaw0+dy*e;pitch=THREE.MathUtils.lerp(lookTween.pitch0,lookTween.pitch1,e);updateLook();if(t===1)lookTween=null;}
    if(view==='room'&&!lookTween){let f=0,s=0;if(keys.has('w')||keys.has('ArrowUp'))f+=.035;if(keys.has('s')||keys.has('ArrowDown'))f-=.035;if(keys.has('a')||keys.has('ArrowLeft'))s-=.035;if(keys.has('d')||keys.has('ArrowRight'))s+=.035;if(f||s)move(Math.sin(yaw)*f+Math.cos(yaw)*s,Math.cos(yaw)*f-Math.sin(yaw)*s);}
    positionLabels();
    relations.render(activeCamera,innerWidth,innerHeight);
  }
  composer.render();
}
requestAnimationFrame(frame);
canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();$('#loading').hidden=false;$('#loading').classList.remove('done');$('#loading').innerHTML='<strong>The graphics view paused</strong><span>Reload the room to restore the display.</span><button class="retry">Reload</button>';$('.retry').onclick=()=>location.reload();});
