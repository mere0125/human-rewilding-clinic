import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';
import { RectAreaLightUniformsLib } from 'three/addons/lights/RectAreaLightUniformsLib.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { GTAOPass } from 'three/addons/postprocessing/GTAOPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { SMAAPass } from 'three/addons/postprocessing/SMAAPass.js';
import { FullScreenQuad } from 'three/addons/postprocessing/Pass.js';
import { loadSurfaces } from './surfaces.js';
import { makeRoom } from './room.js';
import { makeChamber } from './chamber.js';
import { CASE } from '../case.mjs';

const $ = selector => document.querySelector(selector);
const embedded = new URLSearchParams(location.search).get('embedded') === '1';
document.body.classList.toggle('embedded',embedded);
let linkedSample=null, openingTarget=0;
const loggerCanvas=document.createElement('canvas');loggerCanvas.width=256;loggerCanvas.height=128;
const loggerTexture=new THREE.CanvasTexture(loggerCanvas);loggerTexture.colorSpace=THREE.SRGBColorSpace;
function showLinkedSample(sample){
  linkedSample=sample;if(!room)return;
  openingTarget=sample.window!==null&&sample.window>0.5?-Math.PI/4:0;
  $('#linkedState').hidden=currentView==='erc';
  $('#linkedSource').textContent=sample.source;
  $('#linkedTemperature').textContent=sample.indoor.toFixed(1)+'°C';
  $('#linkedOpening').textContent=sample.window===null?'Opening not recorded':sample.window>0.5?'Opening shown at 45°':'Opening closed';
  const g=loggerCanvas.getContext('2d');g.fillStyle='#b6c3a4';g.fillRect(0,0,256,128);g.fillStyle='#2c3e2b';g.font='64px monospace';g.textAlign='center';g.fillText(sample.indoor.toFixed(1),128,87);loggerTexture.needsUpdate=true;
  room.loggerDisplay.material.map=loggerTexture;room.loggerDisplay.material.color.set(0xffffff);room.loggerDisplay.material.needsUpdate=true;
  canvas.dataset.sampleTime=String(sample.t);canvas.dataset.sampleSource=sample.source;canvas.dataset.windowState=sample.window===null?'unknown':sample.window>0.5?'open':'closed';
}
addEventListener('message',e=>{if(!embedded||e.origin!==location.origin||e.source!==parent)return;if(e.data?.type==='clinic-sample'&&e.data.caseId===CASE.id&&Number.isFinite(e.data.sample?.indoor))showLinkedSample(e.data.sample);if(e.data?.type==='clinic-view'&&['interior','plan','erc'].includes(e.data.view))setView(e.data.view);});
const canvas = $('#scene');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
renderer.setSize(innerWidth, innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.12;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
RectAreaLightUniformsLib.init();

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(56, innerWidth / innerHeight, 0.025, 90);
const planCamera = new THREE.OrthographicCamera(-3.3, 3.3, 2.4, -2.4, 0.1, 40);
planCamera.position.set(0, 12, 0.0001); planCamera.up.set(0, 0, -1); planCamera.lookAt(0, 0, 0);
let activeCamera = camera;
const orbit = new OrbitControls(camera, canvas);
orbit.enabled = false; orbit.enableDamping = true; orbit.minDistance = 0.7; orbit.maxDistance = 10; orbit.maxPolarAngle = Math.PI * 0.49;

const target = new THREE.WebGLRenderTarget(innerWidth, innerHeight, { type: THREE.HalfFloatType, samples: 2 });
const composer = new EffectComposer(renderer, target);
const renderPass = new RenderPass(scene, camera);
composer.addPass(renderPass);
const ao = new GTAOPass(scene, camera, innerWidth, innerHeight, undefined, {
  radius: 0.18, thickness: 0.4, distanceExponent: 1.2, distanceFallOff: 0.8, scale: 0.85, samples: 16
});
ao.blendIntensity = 0.68;
const visibilityOverride = ao.overrideVisibility.bind(ao);
ao.overrideVisibility = () => {
  visibilityOverride();
  scene.traverse(o => { if (o.isMesh && o.material?.transmission > 0.1) o.visible = false; });
};
composer.addPass(ao);
composer.addPass(new OutputPass());
composer.addPass(new SMAAPass());

let room, chamber, hdr, currentView = 'interior', currentPosition = 'door';
let ready = false, overview = false, exporting = false;
let yaw = 0, pitch = 0;
let drag = null;
let tracer = null, tracing = false, geometryDirty = true, tracePending = false;
let movementTime = performance.now();
const status = $('#renderStatus');
const pressed = new Set();

THREE.DefaultLoadingManager.onProgress = (url, loaded, total) => {
  $('#loadProgress').style.width = `${Math.min(95, loaded / total * 88 + 7)}%`;
  $('#loadText').textContent = /gltf|bin/.test(url) ? 'Placing the plants and furniture' : 'Loading surfaces and daylight';
};

const positions = {
  door: { eye: [0.22, 1.59, 1.36], at: [0.64, 1.08, -0.48] },
  window: { eye: [0.18, 1.55, 0.56], at: [1.82, 1.32, -0.08] },
  bed: { eye: [0.22, 1.57, 0.48], at: [-0.98, 0.71, -0.66] },
  plant: { eye: [0.64, 1.2, -0.27], at: [1.31, 0.85, -1.15] },
  overview: { eye: [-4.3, 3.65, 4.65], at: [0, 0.9, 0] }
};

function setLook(eye, at) {
  camera.position.set(...eye);
  const d = new THREE.Vector3(...at).sub(camera.position).normalize();
  yaw = Math.atan2(d.x, d.z); pitch = Math.asin(d.y);
  updateLook();
}
function updateLook() {
  const direction = new THREE.Vector3(Math.sin(yaw) * Math.cos(pitch), Math.sin(pitch), Math.cos(yaw) * Math.cos(pitch));
  camera.lookAt(camera.position.clone().add(direction));
}
function markChanged(geometry = false) {
  movementTime = performance.now(); geometryDirty ||= geometry;
  if (tracer && tracing) tracer.updateCamera();
}
function move(dx, dz) {
  const nx = THREE.MathUtils.clamp(camera.position.x + dx, -1.67, 1.63);
  const nz = THREE.MathUtils.clamp(camera.position.z + dz, -1.45, 1.44);
  // Bed, table, radiator and floor plant remain physical obstacles.
  const occupied = (x, z) => (x < -0.33 && z > -1.31 && z < 1.01) ||
    (x > 0.75 && z > 0.88) || (x > 1.40 && z > -0.54 && z < 0.58) || (x > 1.02 && z < -0.86);
  if (!occupied(nx, camera.position.z)) camera.position.x = nx;
  if (!occupied(camera.position.x, nz)) camera.position.z = nz;
  camera.position.y = THREE.MathUtils.lerp(camera.position.y, 1.59, 0.03);
  updateLook(); markChanged();
}

function choosePosition(id) {
  if (!ready || currentView !== 'interior') return;
  currentPosition = id; overview = id === 'overview';
  const p = positions[id];
  room.ceiling.visible = !overview;
  room.cutawayWalls.forEach(w => w.visible = !overview);
  camera.fov = overview ? 39 : 56; camera.updateProjectionMatrix();
  orbit.enabled = overview;
  if (overview) { camera.position.set(...p.eye); orbit.target.set(...p.at); orbit.update(); }
  else setLook(p.eye, p.at);
  document.querySelectorAll('[data-position]').forEach(b => b.classList.toggle('active', b.dataset.position === id));
  $('#gesture').textContent = overview ? 'Drag to rotate the model. Scroll to move closer.' : 'Drag to look around. Scroll or use the arrow keys to move.';
  markChanged(true);
}

const planOverlay = new THREE.Group(); scene.add(planOverlay); planOverlay.visible = false;
function planLine(points) {
  const g = new THREE.BufferGeometry().setFromPoints(points.map(p => new THREE.Vector3(p[0], 3.1, p[1])));
  planOverlay.add(new THREE.Line(g, new THREE.LineBasicMaterial({ color: 0x52594b })));
}
function planLabel(text, x, z, scale = 1) {
  const c = document.createElement('canvas'); c.width = 640; c.height = 112;
  const g = c.getContext('2d'); g.font = '36px Arial'; g.fillStyle = '#40483a'; g.textAlign = 'center'; g.fillText(text, 320, 69);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true, depthTest: false }));
  sprite.position.set(x, 3.2, z); sprite.scale.set(1.8 * scale, 0.315 * scale, 1); planOverlay.add(sprite);
  return sprite;
}
planLine([[-1.8, 2.0], [1.8, 2.0]]); planLine([[-1.8, 1.91], [-1.8, 2.09]]); planLine([[1.8, 1.91], [1.8, 2.09]]);
planLine([[-2.15, -1.6], [-2.15, 1.6]]); planLine([[-2.24, -1.6], [-2.06, -1.6]]); planLine([[-2.24, 1.6], [-2.06, 1.6]]);
planLabel('3.60 m', 0, 2.18); planLabel('3.20 m', -2.4, 0).material.rotation = Math.PI / 2;
planLabel('East', 2.42, -0.1, 0.85); planLine([[2.04, 0.1], [2.56, 0.1], [2.43, 0.03]]); planLine([[2.56, 0.1], [2.43, 0.17]]);
planLabel('Room 001', -0.1, -2.08, 0.8);

const sunlight = new THREE.DirectionalLight(0xffe2b8, 3.0);
sunlight.position.set(6.5, 3.4, 3.0); sunlight.target.position.set(-0.3, 0.3, -0.5);
sunlight.castShadow = true; sunlight.shadow.mapSize.set(4096, 4096);
Object.assign(sunlight.shadow.camera, { left: -4.5, right: 4.5, top: 4.5, bottom: -4.5, near: 0.5, far: 18 });
sunlight.shadow.bias = -0.00006; sunlight.shadow.normalBias = 0.012; sunlight.shadow.radius = 2;
scene.add(sunlight, sunlight.target);
const windowFill = new THREE.RectAreaLight(0xe2e5de, 10.5, 1.12, 1.45);
windowFill.position.set(1.79, 1.36, 0); windowFill.lookAt(-1.3, 1.2, 0); scene.add(windowFill);
const bounce = new THREE.PointLight(0xdcc8a2, 0.35, 4.8, 2); bounce.position.set(-0.6, 0.8, 0.1); scene.add(bounce);
const ambient = new THREE.HemisphereLight(0xe3e7e5, 0x88765d, 0.30); scene.add(ambient);
const chamberKey = new THREE.RectAreaLight(0xf4ecdb, 7.0, 3, 3); chamberKey.position.set(1.4, 3.8, 1.0); chamberKey.lookAt(0, 0.6, 0); scene.add(chamberKey);
const chamberRim = new THREE.RectAreaLight(0xc3d6c6, 5.0, 2, 3); chamberRim.position.set(-2.2, 2.2, -1.2); chamberRim.lookAt(0, 0.6, 0); scene.add(chamberRim);
chamberKey.visible = chamberRim.visible = false;

async function start() {
  const [materials, environment] = await Promise.all([
    loadSurfaces(renderer), new RGBELoader().loadAsync('./assets/urban_courtyard_02.hdr')
  ]);
  hdr = environment; hdr.mapping = THREE.EquirectangularReflectionMapping;
  scene.environment = hdr; scene.background = hdr;
  scene.environmentIntensity = 0.30; scene.backgroundIntensity = 0.82;
  scene.backgroundRotation.y = 1.35; scene.environmentRotation.y = 1.35;
  room = await makeRoom(materials);
  scene.add(room.root, room.outside);
  chamber = makeChamber(materials); chamber.visible = false; scene.add(chamber);
  ready = true;
  choosePosition('door');
  if(embedded){room.leaf.rotation.y=openingTarget;if(linkedSample)showLinkedSample(linkedSample);parent.postMessage({type:'clinic-viewer-ready'},location.origin);}
  $('#loadProgress').style.width = '100%'; $('#loadText').textContent = 'Ready'; $('#loading').classList.add('done');
  let triangles = 0, meshes = 0;
  room.root.traverse(o => { if (o.isMesh) { meshes++; triangles += o.geometry.index ? o.geometry.index.count / 3 : o.geometry.attributes.position.count / 3; } });
  canvas.dataset.triangles = String(Math.round(triangles)); canvas.dataset.meshes = String(meshes);
}

function setView(view) {
  if (!ready) return;
  currentView = view;
  if(embedded){$('#linkedState').hidden=view==='erc';$('#chamberNote').hidden=view!=='erc';}
  room.root.visible = view !== 'erc'; room.outside.visible = view === 'interior'; chamber.visible = view === 'erc'; planOverlay.visible = view === 'plan';
  sunlight.visible = view !== 'erc'; windowFill.visible = view !== 'erc'; bounce.visible = view === 'interior';
  chamberKey.visible = chamberRim.visible = view === 'erc';
  room.cutawayWalls.forEach(w => w.visible = true);
  room.ceiling.visible = view === 'interior';
  $('#positions').hidden = view !== 'interior'; $('.study-controls').hidden = view !== 'interior';
  $('#roomCaption').hidden = view !== 'interior'; $('#viewTitle').textContent = view === 'erc' ? 'ERC-01' : 'Room 001';
  document.querySelectorAll('[data-view]').forEach(b => b.classList.toggle('active', b.dataset.view === view));
  activeCamera = view === 'plan' ? planCamera : camera;
  renderPass.camera = activeCamera; ao.camera = activeCamera;
  ao.enabled = view !== 'plan';
  $('#refine').disabled = view === 'plan';
  if (view === 'interior') {
    scene.background = hdr; scene.environmentIntensity = 0.30;
    choosePosition(currentPosition);
  } else if (view === 'erc') {
    scene.background = new THREE.Color(0xbab9ac); scene.environmentIntensity = 0.6;
    overview = true; orbit.enabled = true; camera.fov = 38; camera.position.set(3.45, 2.13, 3.7); orbit.target.set(0, 0.68, 0); orbit.update(); camera.updateProjectionMatrix();
    $('#gesture').textContent = 'Drag to rotate the model. Scroll to move closer.';
  } else {
    scene.background = new THREE.Color(0xeeeadd); scene.environmentIntensity = 0.35;
    overview = false; orbit.enabled = false; $('#gesture').textContent = 'The plan and interior share the same dimensional model.';
  }
  if (tracer) { tracer.setCamera(activeCamera); tracer.updateEnvironment(); }
  markChanged(true);
}

document.querySelectorAll('[data-view]').forEach(b => b.addEventListener('click', () => setView(b.dataset.view)));
document.querySelectorAll('[data-position]').forEach(b => b.addEventListener('click', () => choosePosition(b.dataset.position)));
$('#panelToggle').addEventListener('click', () => {
  const expanded = $('#panelToggle').getAttribute('aria-expanded') !== 'true';
  $('#panelToggle').setAttribute('aria-expanded', String(expanded)); $('#settings').hidden = !expanded; $('#panelToggle span').textContent = expanded ? '−' : '+';
});
$('#opening').addEventListener('input', e => {
  if (!ready) return;
  const degrees = Number(e.target.value); room.leaf.rotation.y = -degrees * Math.PI / 180; $('#openingValue').textContent = `${degrees}°`; markChanged(true);
});
$('#light').addEventListener('input', e => {
  if (!ready) return;
  const v = Number(e.target.value) / 100;
  sunlight.intensity = 0.7 + v * 4; windowFill.intensity = 5.5 + v * 8.6;
  renderer.toneMappingExposure = 0.9 + v * 0.38;
  $('#lightValue').textContent = v < 0.33 ? 'Soft' : v > 0.76 ? 'Bright' : 'Morning';
  if (tracer && tracing) tracer.updateLights(); markChanged();
});

canvas.addEventListener('pointerdown', e => {
  if (!ready || currentView !== 'interior' || overview) return;
  canvas.focus({ preventScroll: true });
  drag = { x: e.clientX, y: e.clientY }; canvas.setPointerCapture(e.pointerId);
});
canvas.addEventListener('pointermove', e => {
  if (!drag) return;
  yaw -= (e.clientX - drag.x) * 0.0033; pitch += (e.clientY - drag.y) * 0.0028;
  pitch = THREE.MathUtils.clamp(pitch, -1.12, 1.08); drag.x = e.clientX; drag.y = e.clientY; updateLook(); markChanged();
});
canvas.addEventListener('pointerup', () => { drag = null; });
canvas.addEventListener('pointercancel', () => { drag = null; });
canvas.addEventListener('wheel', e => {
  if (!ready || currentView !== 'interior' || overview) return;
  e.preventDefault(); const distance = THREE.MathUtils.clamp(-e.deltaY * 0.00075, -0.16, 0.16); move(Math.sin(yaw) * distance, Math.cos(yaw) * distance);
}, { passive: false });
addEventListener('keydown', e => {
  if (e.target.matches('input,button')) return;
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'a', 's', 'd'].includes(e.key)) { pressed.add(e.key); e.preventDefault(); }
});
addEventListener('keyup', e => pressed.delete(e.key));
addEventListener('blur', () => pressed.clear());
orbit.addEventListener('change', () => { if (orbit.enabled) markChanged(); });

function clean(value) {
  document.body.classList.toggle('clean', value); $('#clean').setAttribute('aria-pressed', String(value)); $('#returnUi').hidden = !value;
}
$('#clean').addEventListener('click', () => clean(true)); $('#returnUi').addEventListener('click', () => clean(false));
addEventListener('keydown', e => { if (e.key === 'Escape') clean(false); });

$('#refine').addEventListener('click', async () => {
  if (!ready || currentView === 'plan' || tracePending) return;
  if (tracing) { tracing = false; status.textContent = ''; $('#refine').setAttribute('aria-pressed', 'false'); $('#refine').textContent = 'Progressive light'; return; }
  tracePending = true; $('#refine').disabled = true; status.textContent = 'Preparing reflected light';
  try {
    const { WebGLPathTracer, DenoiseMaterial } = await import('./pathtracer.js');
    await new Promise(resolve => requestAnimationFrame(resolve));
    if (!tracer) {
      tracer = new WebGLPathTracer(renderer);
      tracer.bounces = 4; tracer.transmissiveBounces = 5; tracer.filterGlossyFactor = 0.65;
      tracer.tiles.set(2, 2); tracer.renderScale = 0.55; tracer.textureSize.set(1024, 1024);
      tracer.dynamicLowRes = false; tracer.minSamples = 4; tracer.fadeDuration = 500; tracer.renderDelay = 250;
      tracer.rasterizeSceneCallback = () => composer.render();
      const filter = new DenoiseMaterial({ sigma: 2.0, kSigma: 1.5, threshold: 0.22 });
      const filterQuad = new FullScreenQuad(filter);
      filter.transparent = true; filter.blending = THREE.NormalBlending;
      tracer.renderToCanvasCallback = (target, output, quad) => {
        const autoClear = output.autoClear; output.autoClear = false;
        filter.map = target.texture; filter.opacity = quad.material.opacity; filterQuad.render(output); output.autoClear = autoClear;
      };
    }
    tracer.setScene(scene, activeCamera); geometryDirty = false; tracing = true;
    $('#refine').setAttribute('aria-pressed', 'true'); $('#refine').textContent = 'Return to live view'; status.textContent = 'Refining the light';
  } catch (error) {
    console.warn('Progressive lighting unavailable:', error); status.textContent = 'Live view remains available';
  } finally { tracePending = false; $('#refine').disabled = false; }
});

$('#save').addEventListener('click', async () => {
  if (!ready || exporting) return;
  exporting = true; const button = $('#save'); button.textContent = 'Saving';
  if (tracing && tracer && currentView !== 'plan' && tracer.samples > 0) {
    await new Promise(resolve => canvas.toBlob(blob => {
      const url = URL.createObjectURL(blob), link = document.createElement('a'); link.href = url;
      link.download = `Room-001-${currentView === 'erc' ? 'ERC-01' : currentPosition}-light-study.png`;
      link.click(); setTimeout(() => URL.revokeObjectURL(url), 3000); resolve();
    }, 'image/png'));
    button.textContent = 'Save image'; exporting = false; return;
  }
  const w = innerWidth, h = innerHeight, ratio = renderer.getPixelRatio();
  const oldAspect = camera.aspect;
  renderer.setPixelRatio(1); renderer.setSize(2400, 1350, false); composer.setPixelRatio(1); composer.setSize(2400, 1350);
  camera.aspect = 16 / 9; camera.updateProjectionMatrix();
  const oldPlan = { left: planCamera.left, right: planCamera.right, top: planCamera.top, bottom: planCamera.bottom };
  planCamera.left = -4.48; planCamera.right = 4.48; planCamera.top = 2.52; planCamera.bottom = -2.52; planCamera.updateProjectionMatrix();
  composer.render();
  await new Promise(resolve => canvas.toBlob(blob => {
    const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url;
    link.download = currentView === 'erc' ? 'ERC-01.png' : `Room-001-${currentView === 'plan' ? 'plan' : currentPosition}.png`; link.click(); setTimeout(() => URL.revokeObjectURL(url), 3000); resolve();
  }, 'image/png'));
  renderer.setPixelRatio(ratio); renderer.setSize(w, h, false); composer.setPixelRatio(ratio); composer.setSize(w, h);
  camera.aspect = oldAspect; camera.updateProjectionMatrix(); Object.assign(planCamera, oldPlan); planCamera.updateProjectionMatrix();
  button.textContent = 'Save image'; exporting = false; markChanged();
});

function resize() {
  const w = innerWidth, h = innerHeight; renderer.setSize(w, h); composer.setSize(w, h);
  camera.aspect = w / h; camera.updateProjectionMatrix(); const halfHeight = w < 600 ? 3.5 : 2.52;
  planCamera.left = -halfHeight * w / h; planCamera.right = halfHeight * w / h; planCamera.top = halfHeight; planCamera.bottom = -halfHeight; planCamera.updateProjectionMatrix();
  markChanged();
}
addEventListener('resize', resize);
resize();

let previousTime = performance.now();
let lastPaint=0;
function frame(now) {
  requestAnimationFrame(frame);
  if (!ready || exporting) return;
  if(embedded&&(document.hidden||now-lastPaint<33))return;
  lastPaint=now;
  if(embedded&&Math.abs(room.leaf.rotation.y-openingTarget)>.0001){room.leaf.rotation.y=THREE.MathUtils.lerp(room.leaf.rotation.y,openingTarget,.16);markChanged(true);}
  const dt = Math.min((now - previousTime) / 1000, 0.06); previousTime = now;
  if (currentView === 'interior' && !overview && pressed.size) {
    let forward = Number(pressed.has('w') || pressed.has('ArrowUp')) - Number(pressed.has('s') || pressed.has('ArrowDown'));
    let side = Number(pressed.has('d') || pressed.has('ArrowRight')) - Number(pressed.has('a') || pressed.has('ArrowLeft'));
    const speed = dt * 0.65;
    move((Math.sin(yaw) * forward - Math.cos(yaw) * side) * speed, (Math.cos(yaw) * forward + Math.sin(yaw) * side) * speed);
  }
  if (orbit.enabled) orbit.update();
  if (tracing && tracer && currentView !== 'plan') {
    if (geometryDirty && now - movementTime > 300) { tracer.setScene(scene, activeCamera); geometryDirty = false; }
    if (!geometryDirty) {
      tracer.renderSample();
      status.dataset.samples = String(tracer.samples);
      status.textContent = `Light study, ${Math.floor(tracer.samples)} samples`;
    } else composer.render();
  } else composer.render();
}
requestAnimationFrame(frame);
start().catch(error => {
  console.error(error); $('#loadText').textContent = 'A model asset did not load. Refresh to try again.';
});
