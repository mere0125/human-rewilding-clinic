import * as THREE from 'three';
import { block, pipe, mesh, cylinder, surface } from './spatial.js';

export function makeChamber(m) {
  const root = new THREE.Group(); root.name = 'ERC-01';
  const metal = m.chrome.clone(); metal.roughness = 0.38;
  const ground = mesh(new THREE.PlaneGeometry(200, 200), new THREE.MeshStandardMaterial({ color: 0xaaa89c, roughness: 0.86 }), root);
  ground.rotation.x = -Math.PI / 2;
  block(root, metal, [1.2, 0.14, 2.65], [0, 0.29, 0], 0.055);
  for (const x of [-0.48, 0.48]) for (const z of [-1.0, 1.0]) {
    cylinder(root, m.black, 0.03, 0.23, [x, 0.115, z]);
    cylinder(root, m.rubber, 0.055, 0.012, [x, 0.006, z]);
  }
  block(root, m.linen, [1.0, 0.11, 2.42], [0, 0.415, 0], 0.05);
  const crossSection = angle => [Math.sin(angle) * 0.64, 0.46 + Math.cos(angle) * 0.87];
  const minAngle = -1.65, maxAngle = 1.65;
  for (let z = -1.22; z <= 1.23; z += 0.244) {
    const points = [];
    for (let n = 0; n <= 48; n++) { const [x, y] = crossSection(minAngle + (maxAngle - minAngle) * n / 48); points.push([x, y, z]); }
    pipe(root, metal, points, 0.012);
    for (const sign of [-1, 1]) {
      block(root, m.black, [0.055, 0.045, 0.065], [sign * 0.64, 0.43, z], 0.003);
      const bolt = cylinder(root, m.chrome, 0.006, 0.008, [sign * 0.67, 0.44, z], 6); bolt.rotation.z = Math.PI / 2;
    }
  }
  for (const sign of [-1, 1]) block(root, m.black, [0.035, 0.065, 2.56], [sign * 0.63, 0.425, 0], 0.008);
  const membraneMat = new THREE.MeshPhysicalMaterial({ color: 0xc7d4c6, transmission: 0.78, roughness: 0.22, thickness: 0.001, side: THREE.DoubleSide, transparent: true, opacity: 0.76 });
  surface(root, membraneMat, 1, 2.42, 96, 84, (u, z) => {
    const a = -1.59 + (u + 0.5) * 2.84;
    const [x, y] = crossSection(a);
    const slack = Math.sin((z + 1.22) / 0.244 * Math.PI) * 0.003;
    return [x + slack, y - slack, z];
  }, 'partial membrane');
  const rolled = cylinder(root, membraneMat, 0.027, 2.42, [0.62, 0.76, 0]); rolled.rotation.x = Math.PI / 2;
  // The scale figure is intentionally neutral; the apparatus is the designed artifact.
  const skin = new THREE.MeshStandardMaterial({ color: 0x9a9383, roughness: 0.86 });
  const figure = new THREE.Group(); figure.position.y = 0.55; root.add(figure);
  const torso = mesh(new THREE.CapsuleGeometry(0.2, 0.54, 10, 24), m.moss, figure, [0, 0, -0.21]); torso.rotation.x = Math.PI / 2; torso.scale.x = 1.05; torso.scale.z = 0.65;
  const head = mesh(new THREE.SphereGeometry(0.138, 32, 24), skin, figure, [0, 0.012, -0.79]); head.scale.set(0.86, 0.8, 1.12);
  for (const s of [-1, 1]) {
    pipe(figure, skin, [[s * 0.2, 0, -0.42], [s * 0.28, -0.03, -0.08], [s * 0.29, -0.04, 0.29]], 0.047);
    pipe(figure, skin, [[s * 0.11, 0, 0.23], [s * 0.1, 0, 0.63], [s * 0.105, -0.02, 1.05]], 0.068);
    block(figure, skin, [0.1, 0.08, 0.2], [s * 0.105, -0.015, 1.13], 0.035);
  }
  surface(figure, m.moss, 0.6, 0.9, 44, 60, (u, v) => [u, 0.18 - Math.max(0, Math.abs(u) - 0.19) * 1.15 + Math.sin(u * 27 + v * 13) * 0.008, v - 0.08]);
  block(root, metal, [0.19, 0.99, 0.27], [-0.92, 0.495, 0.68], 0.025);
  for (let n = 0; n < 9; n++) block(root, m.black, [0.003, 0.008, 0.16], [-0.821, 0.25 + n * 0.027, 0.68], 0.001);
  pipe(root, m.rubber, [[-0.83, 0.25, 0.65], [-1.08, 0.09, 0.45], [-1.1, 0.07, -0.5], [-0.65, 0.4, -0.8]], 0.025);
  pipe(root, metal, [[-0.9, 0.94, 0.66], [-0.86, 1.21, 0.4], [-0.57, 1.47, 0.2], [-0.21, 1.39, 0.03]], 0.014);
  block(root, m.black, [0.17, 0.04, 0.1], [-0.16, 1.36, 0.03], 0.014);
  return root;
}
