import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { block, mesh, pipe, cylinder, lathe, surface, fitModel, random } from './spatial.js';
import { CASE } from '../case.mjs';
import { worldFinishes } from './world-finishes.js?v=20';

export async function makeRoom(sourceMaterials) {
  const finish=worldFinishes();
  const bedLinen=sourceMaterials.linen.clone();bedLinen.color.set(0xd3d9cc);bedLinen.normalScale.set(.10,.10);bedLinen.roughness=.79;
  const cover=sourceMaterials.linen.clone();cover.color.set(0x4c6759);cover.normalScale.set(.10,.10);cover.roughness=.74;
  const filterCloth=sourceMaterials.curtain.clone();filterCloth.color.set(0xe4e8dc);filterCloth.normalScale.set(.055,.055);filterCloth.roughness=.62;filterCloth.opacity=1;filterCloth.transmission=.25;
  const m={...sourceMaterials,wall:finish.ivory,chalk:finish.ivory,oak:finish.silver,chrome:finish.silver,enamel:finish.mist,black:finish.dark,linen:bedLinen,moss:cover,curtain:filterCloth,floor:finish.mineral,glass:finish.glass};

  const root = new THREE.Group(); root.name = 'Room 001';
  const shell = new THREE.Group(); root.add(shell);
  const details = new THREE.Group(); root.add(details);
  const outside = new THREE.Group();
  const rand = random(193);
  const ceiling = block(shell, m.wall, [3.88, 0.12, 3.48], [0, 2.76, 0]);
  block(shell, m.chalk, [3.88, 0.15, 3.48], [0, -0.075, 0]);
  const {length,width}=CASE.geometry;
  const floor = mesh(new THREE.PlaneGeometry(length, width), m.floor, shell, [0, 0.002, 0], 'honed modular floor');
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

  // The habitat keeps its registered envelope. Fine jointed finishes and
  // replaceable service panels express the same local infrastructure as the Clinic.
  for(const x of [-1.16,-.56,.04,.64,1.24])block(details,finish.mist,[.0016,.0018,3.18],[x,.004,0],.0005);
  for(const z of [-.99,-.39,.21,.81,1.41])block(details,finish.mist,[3.58,.0018,.0016],[0,.004,z],.0005);
  for(const x of [-1.20,-.45,.30,1.05])block(details,finish.mist,[.002,2.45,.003],[x,1.34,-1.592],.0005);
  for(const z of [-1.13,-.38,.37,1.12])block(details,finish.mist,[.003,2.45,.002],[-1.793,1.34,z],.0005);
  block(details,finish.silver,[3.57,.045,.019],[0,2.605,-1.583],.004,'north service datum');
  block(details,finish.silver,[.019,.045,3.15],[-1.784,2.605,0],.004,'west service datum');
  block(details,finish.mist,[3.53,.13,.022],[0,.235,-1.578],.008,'low service skirting');
  for(const x of [-1.4,-.65,.10,.85,1.45])block(details,finish.silver,[.003,.10,.026],[x,.235,-1.563],.0005);

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
  block(details, finish.ivory, [0.775, 2.105, 0.04], [0.3, 1.067, 1.64], 0.015, 'sealed habitat door');
  const doorInset = finish.mist.clone();
  block(details, doorInset, [0.59, 1.72, 0.008], [0.3, 1.12, 1.615], 0.003);
  block(details,finish.silver,[.035,1.80,.014],[.615,1.12,1.604],.004,'door service edge');
  for (const x of [-0.116, 0.716]) block(details, m.chalk, [0.045, 2.19, 0.065], [x, 1.095, 1.592]);
  block(details, m.chalk, [0.88, 0.045, 0.065], [0.3, 2.175, 1.592]);
  block(details, m.chrome, [0.045, 0.18, 0.012], [0.59, 1.03, 1.606], 0.008);
  pipe(details, m.chrome, [[0.59, 1.08, 1.6], [0.59, 1.08, 1.55], [0.46, 1.08, 1.55]], 0.009);
  for (const y of [0.24, 1.05, 1.86]) cylinder(details, m.chrome, 0.008, 0.075, [-0.095, y, 1.61], 16);
  block(details, m.chrome, [0.8, 0.005, 0.13], [0.3, 0.006, 1.58]);

  // Window assembly is full size and contains separate frame, gaskets and glazing.
  const window = new THREE.Group(); window.name = 'east window'; details.add(window);
  const frameMat = finish.silver.clone(); frameMat.roughness = .29;
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
  // The operating aperture is unchanged. Added trim is outside the registered
  // clear opening and carries no quantified filtration or energy claim.
  for(const y of [.718,2.025])block(window,finish.ivory,[.14,.044,1.73],[1.75,y,0],.008);
  for(const z of [-.83,.83])block(window,finish.silver,[.052,1.35,.018],[1.73,1.37,z],.003);
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

  // A formed residential bed base and tailored soft headboard remain distinct
  // from the Clinic body platform while sharing its material family.
  const bed = new THREE.Group(); bed.position.set(-0.99, 0, -0.13); details.add(bed);
  block(bed,finish.mist,[.77,.253,1.60],[0,.1285,0],.07,'recessed bed plinth');
  block(bed,finish.silver,[1.21,.10,2.15],[0,.305,0],.038,'formed bed edge');
  const bedDeck=block(bed,finish.ivory,[1.15,.040,2.06],[0,.345,0],.018,'inset mattress deck');
  for(const x of [-.52,.52])block(bed,finish.dark,[.012,.008,1.95],[x,.404,0],.001,'mattress ventilation reveal');
  block(bed,finish.silver,[1.24,.69,.055],[0,.64,-1.04],.024,'headboard shell');
  block(bed,cover,[1.16,.59,.065],[0,.665,-1.022],.028,'tailored residential headboard');
  for(const x of [-.36,0,.36])pipe(bed,bedLinen,[[x,.43,-.986],[x,.89,-.986]],.0013);
  const mattress=block(bed, m.linen, [1.1, 0.2, 1.95], [0, 0.465, 0], 0.055, 'mattress');
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

  // A thin formed desk has a supported drawer and a clear seating approach.
  const desk = new THREE.Group(); desk.position.set(1.21, 0, 1.21); details.add(desk);
  const deskShell=block(desk,finish.silver,[.82,.035,.59],[0,.745,0],.014,'formed desk edge');
  const writingSurface=block(desk,finish.ivory,[.78,.013,.55],[0,.770,0],.005,'inset writing surface');
  for(const x of [-.32,.32]){
    block(desk,finish.silver,[.025,.7075,.40],[x,.37375,.03],.008,'folded desk side support');
    block(desk,finish.silver,[.14,.018,.48],[x,.011,.03],.007,'desk foot');
  }
  block(desk,finish.ivory,[.59,.075,.28],[0,.684,.11],.016,'shallow supported drawer');
  for(const x of [-.275,.275])block(desk,finish.silver,[.012,.012,.25],[x,.7265,.11],.002,'drawer support runner');
  block(desk,finish.dark,[.25,.009,.009],[0,.685,-.039],.002,'inset drawer pull');
  const cup = lathe(desk, m.chalk, [[0, 0], [0.033, 0], [0.036, 0.005], [0.041, 0.094], [0.038, 0.1], [0.035, 0.096], [0.03, 0.008], [0, 0.008]], [0.18, 0.7765, -0.1]);
  const tea = mesh(new THREE.CircleGeometry(0.034, 40), new THREE.MeshStandardMaterial({ color: 0x30291b, roughness: 0.13 }), desk, [0.18, 0.8595, -0.1]); tea.rotation.x = -Math.PI / 2;
  pipe(desk, m.chalk, [[0.214, 0.8045, -0.1], [0.244, 0.8105, -0.1], [0.246, 0.8395, -0.1], [0.218, 0.8505, -0.1]], 0.006);
  for (let i = 0; i < 3; i++) {
    const bookMat = new THREE.MeshStandardMaterial({ color: [0x59604e, 0x77685a, 0xa4a293][i], roughness: 0.92 });
    const book = new THREE.Group(); book.position.set(-0.15, 0.778 + i * 0.028, -0.07); book.rotation.y = i * 0.075 - 0.05; desk.add(book);
    block(book, m.paper, [0.192, 0.019, 0.14], [0, 0.012, 0]);
    for (const y of [0, 0.025]) block(book, bookMat, [0.203, 0.003, 0.151], [0, y, 0]);
    block(book, bookMat, [0.006, 0.025, 0.151], [-0.1, 0.012, 0]);
  }
  // A jointed task light has a weighted base, cable route and a physical shade.
  cylinder(desk,finish.silver,.069,.018,[.18,.7855,.14],48);
  pipe(desk,finish.silver,[[.18,.800,.14],[.18,1.10,.14],[.10,1.18,.14],[-.015,1.18,.14]],.006);
  cylinder(desk,finish.dark,.015,.038,[.18,1.09,.14],24).rotation.z=Math.PI/2;
  const lampHead=block(desk,finish.ivory,[.18,.035,.11],[-.04,1.17,.14],.014,'articulated task light');lampHead.rotation.z=-.17;
  const diffuser=block(desk,new THREE.MeshStandardMaterial({color:0xf1f0df,emissive:0xc6cdb5,emissiveIntensity:.18}),[.15,.003,.08],[-.04,1.15,.14],.001);diffuser.rotation.z=-.17;
  pipe(desk,finish.dark,[[.18,.779,.14],[.28,.779,.16],[.39,.778,.2],[.405,.56,.22],[.405,.20,.22]],.002);

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

  // The heat emitter sits behind a replaceable service cassette. The cover
  // changes representation only; the computational heat balance is unchanged.
  for(const z of [-.515,.575])block(rad,finish.ivory,[.255,.61,.025],[-.015,.37,z],.009,'convector end cap');
  block(rad,finish.silver,[.25,.018,1.10],[-.015,.687,.03],.007,'service cassette top');
  block(rad,finish.mist,[.25,.075,1.10],[-.015,.044,.03],.018,'service cassette base');
  for(let i=0;i<16;i++)block(rad,finish.silver,[.018,.48,.032],[-.145,.38,-.48+i*.067],.005,'open convector grille');
  for(let i=0;i<13;i++)block(rad,finish.dark,[.17,.003,.016],[-.015,.698,-.43+i*.074],.001,'top return slots');

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

  // An occupant's physical habitat register links the room to the local
  // service network. It contains the registered room facts, not a fake reading.
  const art = new THREE.Group(); art.position.set(-0.47,1.69,-1.582);details.add(art);
  block(art,finish.silver,[.48,.62,.022],[0,0,0],.009,'habitat register sleeve');
  block(art,m.paper,[.443,.583,.002],[0,0,.013],.0005);
  const register=document.createElement('canvas');register.width=640;register.height=840;
  const rg=register.getContext('2d');rg.fillStyle='#eaede2';rg.fillRect(0,0,640,840);rg.fillStyle='#405b4d';rg.font='25px Arial';rg.fillText('Habitat register',52,75);rg.font='45px Arial';rg.fillText('Room 001',52,140);
  rg.strokeStyle='#93a294';rg.lineWidth=2;rg.strokeRect(120,235,365,325);rg.beginPath();rg.moveTo(486,335);rg.lineTo(486,462);rg.strokeStyle='#405b4d';rg.lineWidth=8;rg.stroke();rg.font='23px Arial';rg.fillText('3.60 × 3.20 m',52,650);rg.fillText('East opening',52,700);rg.font='20px Arial';rg.fillText('Resident copy',52,775);
  const registerTexture=new THREE.CanvasTexture(register);registerTexture.colorSpace=THREE.SRGBColorSpace;
  const registerFace=mesh(new THREE.PlaneGeometry(.43,.57),new THREE.MeshStandardMaterial({map:registerTexture,roughness:.78}),art,[0,0,.015]);registerFace.castShadow=false;
  for(const y of [-.27,.27])block(art,finish.silver,[.035,.012,.015],[.18,y,.023],.002,'register clip');

  // Real assets have detailed geometry and photographed albedo, roughness and normal maps.
  const loader = new GLTFLoader();
  const [plant1, plant2, fern, cushions] = await Promise.all([
    loader.loadAsync('./assets/potted_plant_01/potted_plant_01.gltf'),
    loader.loadAsync('./assets/potted_plant_02/potted_plant_02.gltf'),
    loader.loadAsync('./assets/fern_02/fern_02.gltf'),
    loader.loadAsync('./assets/throw_pillows_01/throw_pillows_01.gltf')
  ]);
  // Preserve scanned foliage geometry and replace only the old terracotta pots.
  for(const asset of [plant1,plant2])asset.scene.traverse(o=>{if(!o.isMesh)return;const mats=Array.isArray(o.material)?o.material:[o.material];const recoloured=mats.map(mat=>mat.name?.endsWith('_pot')?finish.mist.clone():mat);o.material=Array.isArray(o.material)?recoloured:recoloured[0];});
  const tallPlant = fitModel(plant1.scene, 1.12, [1.34, 0.002, -1.18], -0.32); details.add(tallPlant);
  const smallPlant = fitModel(plant2.scene, 0.36, [1.56, 0.755, 0.52], 0.38); details.add(smallPlant);
  // The seat's forward vector is +Z; derive its yaw towards the writing surface.
  const seat=new THREE.Group();seat.position.set(1.17,.002,.59);seat.rotation.y=Math.atan2(1.21-1.17,1.21-.59);details.add(seat);
  block(seat,finish.silver,[.53,.025,.54],[0,.0125,0],.011,'task seat foot');
  cylinder(seat,finish.silver,.027,.36,[0,.205,0],32);
  block(seat,finish.silver,[.49,.032,.47],[0,.40,0],.012,'task seat shell');
  const seatPad=block(seat,cover,[.455,.075,.44],[0,.452,0],.027,'tailored task seat');
  block(seat,finish.silver,[.49,.39,.025],[0,.67,-.205],.011,'task seat back shell');
  block(seat,cover,[.455,.355,.045],[0,.67,-.184],.019,'task seat back');
  for(const side of [-1,1]){pipe(seat,finish.silver,[[side*.22,.42,.16],[side*.25,.61,.08],[side*.25,.61,-.15],[side*.22,.46,-.20]],.007);pipe(seat,finish.silver,[[side*.19,.405,-.19],[side*.19,.53,-.205]],.008);}
  seat.userData={forward:[Math.sin(seat.rotation.y),0,Math.cos(seat.rotation.y)],target:[1.21,.745,1.21]};
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
  block(outside, finish.silver, [0.42, 0.05, 2.1], [2.12, 0.715, 0], 0.012,'exterior threshold tray');
  block(outside, m.dirt, [3.4, 0.08, 6], [3.3, -0.04, 0]);
  for (let i = 0; i < 8; i++) {
    const f = fitModel(fern.scene.clone(true), 0.27 + rand() * 0.32, [2.55 + rand() * 1.8, 0, -2.3 + i * 0.68], rand() * Math.PI * 2);
    outside.add(f);
  }
  root.updateMatrixWorld(true);
  const bounds=o=>new THREE.Box3().setFromObject(o),seatBounds=bounds(seat),floorBounds=bounds(floor),bedBounds=bounds(bed);
  const forward=new THREE.Vector3(0,0,1).applyQuaternion(seat.getWorldQuaternion(new THREE.Quaternion()));
  const targetDirection=new THREE.Vector3(desk.position.x-seat.position.x,0,desk.position.z-seat.position.z).normalize();
  root.userData={caseId:CASE.id,scope:'Constructed habitat; visual finishes do not alter thermal parameters',layout:{
    taskSeat:{position:seat.position.toArray(),yaw:seat.rotation.y,forward:forward.toArray(),target:seat.userData.target,facingDot:forward.dot(targetDirection),footMinY:seatBounds.min.y,bounds:{min:seatBounds.min.toArray(),max:seatBounds.max.toArray()}},
    floorTop:floorBounds.max.y,deskSurfaceY:bounds(writingSurface).max.y,mugBaseY:bounds(cup).min.y,
    mattressBottomY:bounds(mattress).min.y,mattressDeckTopY:bounds(bedDeck).max.y,
    bedBounds:{min:bedBounds.min.toArray(),max:bedBounds.max.toArray()},
    seatToDeskFrontGap:bounds(deskShell).min.z-bounds(seatPad).max.z,clearKneeHeight:bounds(deskShell).min.y-bounds(seatPad).max.y
  }};
  return { root, outside, shell, details, ceiling, eastWall:east, leaf, window, curtains, tallPlant, floor, bed, radiator:rad, coolingUnit,coolingIndicator,logger, loggerDisplay: display, cutawayWalls: [westWall, ...southWalls] };
}
