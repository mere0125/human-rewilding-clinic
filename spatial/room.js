import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { block, mesh, pipe, cylinder, lathe, surface, fitModel, random } from './spatial.js';
import { CASE } from '../case.mjs';

export async function makeRoom(m) {
  const root = new THREE.Group(); root.name = 'Room 001';
  const shell = new THREE.Group(); root.add(shell);
  const details = new THREE.Group(); root.add(details);
  const outside = new THREE.Group();
  const rand = random(193);
  const ceiling = block(shell, m.wall, [3.88, 0.12, 3.48], [0, 2.76, 0]);
  block(shell, m.chalk, [3.88, 0.15, 3.48], [0, -0.075, 0]);
  const {length,width}=CASE.geometry;
  const floor = mesh(new THREE.PlaneGeometry(length, width), m.floor, shell, [0, 0.002, 0], 'oak floor');
  floor.rotation.x = -Math.PI / 2;
  const westWall = block(shell, m.wall, [0.14, 2.7, 3.48], [-1.87, 1.35, 0]);
  block(shell, m.wall, [3.6, 2.7, 0.14], [0, 1.35, -1.67]);
  // South wall is framed around a closed door, so the room has a plausible entrance.
  const southWalls = [
    block(shell, m.wall, [1.7, 2.7, 0.14], [-0.95, 1.35, 1.67]),
    block(shell, m.wall, [1.1, 2.7, 0.14], [1.25, 1.35, 1.67]),
    block(shell, m.wall, [0.8, 0.56, 0.14], [0.3, 2.42, 1.67])
  ];
  const east = new THREE.Group(); shell.add(east);
  block(east, m.wall, [0.18, 0.76, 3.2], [1.89, 0.38, 0]);
  block(east, m.wall, [0.18, 0.74, 3.2], [1.89, 2.33, 0]);
  block(east, m.wall, [0.18, 1.2, 0.85], [1.89, 1.36, -1.175]);
  block(east, m.wall, [0.18, 1.2, 0.85], [1.89, 1.36, 1.175]);

  // Shadow gaps and skirting share a single floor datum.
  for (const z of [-1.592, 1.592]) {
    if (z < 0) block(details, m.chalk, [3.59, 0.09, 0.018], [0, 0.045, z], 0.002);
    else {
      block(details, m.chalk, [1.67, 0.09, 0.018], [-0.965, 0.045, z], 0.002);
      block(details, m.chalk, [1.07, 0.09, 0.018], [1.265, 0.045, z], 0.002);
    }
  }
  for (const x of [-1.792, 1.792]) block(details, m.chalk, [0.018, 0.09, 3.18], [x, 0.045, 0], 0.002);

  // Door, recessed panel, stops, lever, key plate, hinges and floor transition.
  block(details, m.oak, [0.775, 2.105, 0.04], [0.3, 1.067, 1.64], 0.003, 'door');
  const doorInset = m.oak.clone(); doorInset.color.set(0x7f7562);
  block(details, doorInset, [0.59, 1.72, 0.014], [0.3, 1.12, 1.612], 0.002);
  for (const x of [-0.116, 0.716]) block(details, m.chalk, [0.045, 2.19, 0.065], [x, 1.095, 1.592]);
  block(details, m.chalk, [0.88, 0.045, 0.065], [0.3, 2.175, 1.592]);
  block(details, m.chrome, [0.045, 0.18, 0.012], [0.59, 1.03, 1.606], 0.008);
  pipe(details, m.chrome, [[0.59, 1.08, 1.6], [0.59, 1.08, 1.55], [0.46, 1.08, 1.55]], 0.009);
  for (const y of [0.24, 1.05, 1.86]) cylinder(details, m.chrome, 0.008, 0.075, [-0.095, y, 1.61], 16);
  block(details, m.chrome, [0.8, 0.005, 0.13], [0.3, 0.006, 1.58]);

  // Window assembly is full size and contains separate frame, gaskets and glazing.
  const window = new THREE.Group(); window.name = 'east window'; details.add(window);
  const frameMat = m.black.clone(); frameMat.color.set(0x3a403a); frameMat.roughness = 0.48;
  for (const y of [0.778, 1.942]) {
    block(window, frameMat, [0.11, 0.047, 1.5], [1.785, y, 0]);
    block(window, m.rubber, [0.009, 0.008, 1.43], [1.721, y + (y < 1 ? 0.023 : -0.023), 0], 0.001);
  }
  for (const z of [-0.726, 0.726]) block(window, frameMat, [0.11, 1.164, 0.047], [1.785, 1.36, z]);
  block(window, frameMat, [0.1, 1.14, 0.047], [1.78, 1.36, 0.02]);
  block(window, m.chalk, [0.34, 0.04, 1.7], [1.68, 0.735, 0], 0.003);
  block(window, m.chalk, [0.11, 0.03, 1.65], [1.8, 1.99, 0]);
  const fixedGlass = mesh(new THREE.BoxGeometry(0.009, 1.09, 0.655), m.glass, window, [1.8, 1.36, 0.365]);
  fixedGlass.castShadow = false;
  const leaf = new THREE.Group(); leaf.position.set(1.76, 1.36, -0.704); window.add(leaf);
  for (const y of [-0.548, 0.548]) block(leaf, frameMat, [0.042, 0.035, 0.682], [0, y, 0.342]);
  for (const z of [0.019, 0.666]) block(leaf, frameMat, [0.042, 1.12, 0.035], [0, 0, z]);
  const operableGlass = mesh(new THREE.BoxGeometry(0.008, 1.055, 0.609), m.glass, leaf, [0, 0, 0.342]); operableGlass.castShadow = false;
  block(leaf, m.chrome, [0.016, 0.11, 0.026], [-0.032, 0.035, 0.65], 0.007);
  pipe(leaf, m.chrome, [[-0.04, 0.045, 0.65], [-0.082, 0.045, 0.65], [-0.082, -0.035, 0.65]], 0.009);
  for (const y of [-0.44, 0.44]) cylinder(leaf, m.chrome, 0.011, 0.065, [-0.026, y, 0.005], 20);
  leaf.rotation.y = -0.3;
  // Curtain rod, wall brackets and rings remain connected to the pleated cloth.
  const rod = cylinder(details, m.black, 0.009, 2.14, [1.55, 2.46, 0]); rod.rotation.x = Math.PI / 2;
  for (const z of [-0.98, 0.98]) pipe(details, m.black, [[1.81, 2.43, z], [1.57, 2.43, z], [1.55, 2.46, z]], 0.009);
  const curtains = [];
  for (const sign of [-1, 1]) {
    const panel = surface(details, m.curtain, 0.58, 2.28, 48, 104, (u, v) => {
      const t = (v + 1.14) / 2.28;
      const wave = Math.sin((u + 0.29) * 64 + sign * 0.5);
      return [1.53 - wave * (0.025 + t * 0.007) + Math.sin(t * 2.8) * 0.012, 2.405 - t * 2.27 + Math.sin(u * 19) * 0.007 * t, sign * 1.08 + u + Math.sin(t * 3.1) * 0.025 * sign];
    }, 'linen curtain');
    curtains.push(panel);
    for (let n = 0; n < 9; n++) {
      const ring = mesh(new THREE.TorusGeometry(0.015, 0.002, 8, 20), m.chrome, details, [1.55, 2.445, sign * 1.08 - 0.27 + n * 0.067]);
      ring.rotation.y = Math.PI / 2;
    }
  }

  // Bed geometry includes a thick frame, slats, piped mattress and a draped duvet.
  const bed = new THREE.Group(); bed.position.set(-0.99, 0, -0.13); details.add(bed);
  for (const x of [-0.565, 0.565]) block(bed, m.oak, [0.045, 0.16, 2.04], [x, 0.305, 0], 0.005);
  for (const z of [-1, 1]) block(bed, m.oak, [1.15, 0.16, 0.045], [0, 0.305, z], 0.005);
  for (const x of [-0.52, 0.52]) for (const z of [-0.9, 0.9]) block(bed, m.oak, [0.055, 0.28, 0.055], [x, 0.14, z], 0.004);
  for (let z = -0.88; z <= 0.9; z += 0.12) block(bed, m.oak, [1.08, 0.018, 0.06], [0, 0.344, z]);
  block(bed, m.oak, [1.2, 0.79, 0.05], [0, 0.54, -1.035], 0.012);
  block(bed, m.linen, [1.1, 0.2, 1.95], [0, 0.465, 0], 0.055, 'mattress');
  const seam = [];
  for (let i = 0; i <= 160; i++) { const a = i / 160 * Math.PI * 2; seam.push([Math.sign(Math.cos(a)) * Math.abs(Math.cos(a)) ** 0.18 * 0.548, 0.48, Math.sign(Math.sin(a)) * Math.abs(Math.sin(a)) ** 0.18 * 0.973]); }
  pipe(bed, m.linen, seam, 0.002, true);

  surface(bed, m.linen, 1.47, 1.77, 104, 132, (u, v) => {
    const side = Math.max(0, Math.abs(u) - 0.51);
    const end = Math.max(0, v - 0.77);
    const fold = Math.sin(u * 18 + v * 4) * 0.012 + Math.sin(v * 27 + u * 9) * 0.006;
    const rumple = Math.exp(-((u + 0.29) ** 2 + (v + 0.34) ** 2) / 0.08) * Math.sin(u * 14 + v * 17) * 0.035;
    const angle = Math.min(side / 0.225, 1) * Math.PI / 2;
    const x = side > 0 ? Math.sign(u) * (0.51 + Math.sin(angle) * 0.075) : u;
    return [x, 0.621 + fold + rumple - (1 - Math.cos(angle)) * 0.27 - end * 1.3, v + 0.13];
  }, 'draped duvet');
  surface(bed, m.moss, 1.45, 0.49, 96, 44, (u, v) => {
    const edge = Math.max(0, Math.abs(u) - 0.52);
    return [u - Math.sign(u) * edge * 0.56, 0.675 - edge * 1.22 + Math.sin(u * 21 + v * 5) * 0.012 + Math.sin(v * 47) * 0.003, 0.59 + v];
  }, 'folded cover');

  // Two irregular pillow surfaces with stitched perimeter and fine textile normals.
  const pillowDrafts = [];
  for (let p = 0; p < 2; p++) {
    const pillow = new THREE.Group(); pillow.position.set(p === 0 ? -0.025 : 0.045, 0.584 + p * 0.063, -0.68 + p * 0.1); pillow.rotation.y = p === 0 ? -0.055 : 0.1; bed.add(pillow);
    pillowDrafts.push(pillow);
    const pillowShape = (u, v) => {
      const a = u / 0.385, b = v / 0.25;
      const loft = Math.max(0, 1 - a ** 4) * Math.max(0, 1 - b ** 4);
      const wrinkle = Math.sin(u * 54 + v * 20) * 0.004 * (1 - loft) + Math.sin(v * 48 + u * 6) * 0.002;
      return [u, 0.017 + Math.pow(loft, 0.46) * 0.108 + wrinkle, v];
    };
    surface(pillow, m.linen, 0.77, 0.5, 64, 44, pillowShape, 'stitched pillow');
    block(pillow, m.linen, [0.765, 0.023, 0.49], [0, 0.01, 0], 0.03);
    const edge = [];
    for (let i = 0; i <= 128; i++) { const a = i / 128 * Math.PI * 2; edge.push([Math.sign(Math.cos(a)) * Math.abs(Math.cos(a)) ** 0.24 * 0.383, 0.017, Math.sign(Math.sin(a)) * Math.abs(Math.sin(a)) ** 0.24 * 0.247]); }
    pipe(pillow, m.linen, edge, 0.0017, true);
  }

  // Small table, open drawer reveal and realistic turned-leg connections.
  const desk = new THREE.Group(); desk.position.set(1.21, 0, 1.21); details.add(desk);
  block(desk, m.oak, [0.82, 0.032, 0.59], [0, 0.745, 0], 0.006);
  for (const x of [-0.35, 0.35]) for (const z of [-0.23, 0.23]) block(desk, m.oak, [0.041, 0.728, 0.041], [x, 0.364, z], 0.003);
  block(desk, m.oak, [0.72, 0.083, 0.028], [0, 0.685, -0.25]);
  block(desk, m.oak, [0.68, 0.062, 0.018], [0, 0.684, -0.269]);
  cylinder(desk, m.chrome, 0.012, 0.012, [0, 0.686, -0.286]).rotation.x = Math.PI / 2;
  const cup = lathe(desk, m.chalk, [[0, 0], [0.033, 0], [0.036, 0.005], [0.041, 0.094], [0.038, 0.1], [0.035, 0.096], [0.03, 0.008], [0, 0.008]], [0.18, 0.763, -0.1]);
  const tea = mesh(new THREE.CircleGeometry(0.034, 40), new THREE.MeshStandardMaterial({ color: 0x30291b, roughness: 0.13 }), desk, [0.18, 0.846, -0.1]); tea.rotation.x = -Math.PI / 2;
  pipe(desk, m.chalk, [[0.214, 0.791, -0.1], [0.244, 0.797, -0.1], [0.246, 0.826, -0.1], [0.218, 0.837, -0.1]], 0.006);
  for (let i = 0; i < 3; i++) {
    const bookMat = new THREE.MeshStandardMaterial({ color: [0x59604e, 0x77685a, 0xa4a293][i], roughness: 0.92 });
    const book = new THREE.Group(); book.position.set(-0.15, 0.763 + i * 0.027, -0.07); book.rotation.y = i * 0.075 - 0.05; desk.add(book);
    block(book, m.paper, [0.192, 0.019, 0.14], [0, 0.012, 0]);
    for (const y of [0, 0.025]) block(book, bookMat, [0.203, 0.003, 0.151], [0, y, 0]);
    block(book, bookMat, [0.006, 0.025, 0.151], [-0.1, 0.012, 0]);
  }
  // Brushed metal task lamp has a weighted base, joint, shade and visible cord.
  lathe(desk, m.black, [[0, 0], [0.071, 0], [0.078, 0.009], [0.071, 0.016], [0, 0.016]], [0.18, 0.762, 0.14]);
  pipe(desk, m.chrome, [[0.18, 0.775, 0.14], [0.18, 1.13, 0.14], [0.14, 1.23, 0.14], [0.035, 1.25, 0.14]], 0.005);
  const shade = lathe(desk, m.black, [[0.014, 0], [0.026, 0.016], [0.078, 0.096], [0.077, 0.1], [0.071, 0.095], [0.021, 0.016]], [0.032, 1.23, 0.14]); shade.rotation.z = -1.92;
  pipe(desk, m.rubber, [[0.18, 0.763, 0.14], [0.28, 0.765, 0.16], [0.39, 0.76, 0.2], [0.41, 0.58, 0.22], [0.41, 0.18, 0.23]], 0.0025);

  // Cast iron radiator: individual cast sections, tie rods, feet and service pipework.
  const rad = new THREE.Group(); rad.position.set(1.63, 0, 0.03); details.add(rad);
  for (let i = 0; i < 13; i++) {
    const z = -0.43 + i * 0.071;
    pipe(rad, m.enamel, [[0.003, 0.17, z], [-0.038, 0.23, z], [-0.038, 0.57, z], [0, 0.64, z], [0.044, 0.58, z], [0.044, 0.24, z], [0.003, 0.17, z]], 0.019, true);
    for (const y of [0.2, 0.61]) { const nipple = cylinder(rad, m.enamel, 0.021, 0.073, [0, y, z]); nipple.rotation.x = Math.PI / 2; }
  }
  for (const z of [-0.36, 0.35]) block(rad, m.enamel, [0.14, 0.15, 0.032], [0, 0.075, z], 0.006);
  pipe(rad, m.chrome, [[0, 0.2, 0.49], [0, 0.2, 0.58], [0, 0.04, 0.58], [0.12, 0.04, 0.58]], 0.012);
  const valve = cylinder(rad, m.chalk, 0.029, 0.075, [-0.005, 0.23, 0.51]); valve.rotation.x = Math.PI / 2;
  for (let n = 0; n < 10; n++) { const a = n / 10 * Math.PI * 2; block(rad, m.chalk, [0.008, 0.013, 0.074], [-0.005 + Math.cos(a) * 0.028, 0.23 + Math.sin(a) * 0.028, 0.51], 0.002); }

  // A cooling unit makes both conditioning modes legible in the room.
  const coolingUnit=new THREE.Group();coolingUnit.position.set(-.88,2.31,-1.48);details.add(coolingUnit);
  block(coolingUnit,m.enamel,[.85,.265,.195],[0,0,0],.024);
  block(coolingUnit,m.chalk,[.80,.20,.02],[0,.012,.104],.012);
  for(let n=0;n<7;n++)block(coolingUnit,m.black,[.72,.007,.055],[0,-.068+n*.008,.108],.001);
  const coolingIndicator=mesh(new THREE.SphereGeometry(.005,12,8),new THREE.MeshBasicMaterial({color:0x52604d}),coolingUnit,[.33,-.025,.12]);
  pipe(details,m.chalk,[[-1.30,2.32,-1.49],[-1.49,2.32,-1.49],[-1.65,2.17,-1.49],[-1.65,.15,-1.49]],.014);

  // Quiet evidence of occupancy: controls, wallplate screws, print, pencil and room logger.
  for (const pos of [[-1.785, 0.29, 0.95], [1.785, 0.29, 1.3]]) {
    const sign = pos[0] > 0 ? -1 : 1;
    block(details, m.chalk, [0.008, 0.105, 0.075], pos, 0.005);
    for (const y of [-0.027, 0.027]) for (const z of [-0.009, 0.009]) block(details, m.rubber, [0.001, 0.012, 0.002], [pos[0] + sign * 0.005, pos[1] + y, pos[2] + z], 0);
  }
  const logger = new THREE.Group(); logger.position.set(0.65, 1.42, -1.575); logger.rotation.y = Math.PI / 2; details.add(logger);
  block(logger, m.chalk, [0.045, 0.12, 0.075], [0, 0, 0], 0.006);
  const display = mesh(new THREE.PlaneGeometry(0.046, 0.035), new THREE.MeshStandardMaterial({ color: 0x4b6051, roughness: 0.42 }), logger, [-0.023, 0.013, 0]); display.rotation.y = -Math.PI / 2;
  for (let i = 0; i < 5; i++) block(logger, m.rubber, [0.001, 0.002, 0.021], [-0.023, -0.018 - i * 0.004, 0], 0);
  pipe(details, m.rubber, [[0.65, 1.36, -1.552], [0.65, 1.3, -1.552], [0.665, 1.27, -1.552], [0.665, 0.1, -1.552]], 0.0015);

  // North wall artwork is printed physical paper behind real glazing.
  const art = new THREE.Group(); art.position.set(-0.47, 1.69, -1.582); details.add(art);
  block(art, m.oak, [0.48, 0.62, 0.022], [0, 0, 0]);
  block(art, m.paper, [0.443, 0.583, 0.002], [0, 0, 0.013]);
  const artMat = new THREE.MeshStandardMaterial({ color: 0x465844, roughness: 0.96 });
  for (let j = 0; j < 19; j++) {
    const x = (rand() - 0.5) * 0.26, y = (rand() - 0.5) * 0.34;
    pipe(art, artMat, [[x, y - 0.08, 0.015], [x + 0.025, y, 0.015], [x - 0.013, y + 0.09, 0.015]], 0.0007);
  }

  // Real assets have detailed geometry and photographed albedo, roughness and normal maps.
  const loader = new GLTFLoader();
  const [plant1, plant2, chair, fern, cushions] = await Promise.all([
    loader.loadAsync('./assets/potted_plant_01/potted_plant_01.gltf'),
    loader.loadAsync('./assets/potted_plant_02/potted_plant_02.gltf'),
    loader.loadAsync('./assets/dining_chair_02/dining_chair_02.gltf'),
    loader.loadAsync('./assets/fern_02/fern_02.gltf'),
    loader.loadAsync('./assets/throw_pillows_01/throw_pillows_01.gltf')
  ]);
  const tallPlant = fitModel(plant1.scene, 1.12, [1.34, 0.002, -1.18], -0.32); details.add(tallPlant);
  const smallPlant = fitModel(plant2.scene, 0.36, [1.56, 0.759, 0.52], 0.38); details.add(smallPlant);
  const chairObject = fitModel(chair.scene, 0.84, [1.17, 0.002, 0.59], Math.PI); details.add(chairObject);
  const cushionMeshes = []; cushions.scene.traverse(o => { if (o.isMesh) cushionMeshes.push(o); });
  for (let p = 0; p < Math.min(2, cushionMeshes.length); p++) {
    const geometry = cushionMeshes[p].geometry.clone(); geometry.computeBoundingBox();
    const original = geometry.boundingBox;
    const dims = original.getSize(new THREE.Vector3()).toArray();
    const center = original.getCenter(new THREE.Vector3()).toArray();
    const axes = [0, 1, 2].sort((a, b) => dims[a] - dims[b]);
    const a = geometry.attributes.position;
    for (let n = 0; n < a.count; n++) {
      const v = [a.getX(n), a.getY(n), a.getZ(n)].map((v, k) => v - center[k]);
      a.setXYZ(n, v[axes[2]] / dims[axes[2]] * 0.76, v[axes[0]] / dims[axes[0]] * 0.125, v[axes[1]] / dims[axes[1]] * 0.48);
    }
    geometry.computeVertexNormals(); geometry.computeBoundingBox(); geometry.computeBoundingSphere();
    const pillow = mesh(geometry, m.linen, bed, [p === 0 ? -0.025 : 0.045, 0.674 + p * 0.065, -0.68 + p * 0.1]);
    pillow.rotation.y = p === 0 ? -0.055 : 0.1; pillowDrafts[p].visible = false;
  }

  // A shallow exterior threshold and real fern meshes create near-field parallax.
  block(outside, m.chalk, [0.42, 0.08, 2.1], [2.12, 0.7, 0], 0.005);
  block(outside, m.dirt, [3.4, 0.08, 6], [3.3, -0.04, 0]);
  for (let i = 0; i < 8; i++) {
    const f = fitModel(fern.scene.clone(true), 0.27 + rand() * 0.32, [2.55 + rand() * 1.8, 0, -2.3 + i * 0.68], rand() * Math.PI * 2);
    outside.add(f);
  }
  return { root, outside, shell, details, ceiling, eastWall:east, leaf, window, curtains, tallPlant, floor, bed, radiator:rad, coolingUnit,coolingIndicator,logger, loggerDisplay: display, cutawayWalls: [westWall, ...southWalls] };
}
