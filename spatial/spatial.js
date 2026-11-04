import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

export function mesh(geometry, material, parent, position = [0, 0, 0], name = '') {
  const object = new THREE.Mesh(geometry, material);
  object.position.set(...position);
  object.name = name;
  object.castShadow = true;
  object.receiveShadow = true;
  parent.add(object);
  return object;
}

export function block(parent, material, size, position, radius = 0.003, name = '') {
  const r = Math.min(radius, Math.min(...size) * 0.44);
  return mesh(new RoundedBoxGeometry(...size, 3, r), material, parent, position, name);
}

export function pipe(parent, material, points, radius = 0.01, closed = false) {
  const controls = points.map(p => new THREE.Vector3(...p));
  if (closed && controls[0].distanceToSquared(controls[controls.length - 1]) < 1e-10) controls.pop();
  const path = new THREE.CatmullRomCurve3(controls, closed, 'centripetal', 0.4);
  return mesh(new THREE.TubeGeometry(path, Math.max(24, points.length * 8), radius, 8, closed), material, parent);
}

export function cylinder(parent, material, radius, height, position, segments = 32) {
  return mesh(new THREE.CylinderGeometry(radius, radius, height, segments), material, parent, position);
}

export function lathe(parent, material, points, position, segments = 64) {
  return mesh(new THREE.LatheGeometry(points.map(p => new THREE.Vector2(...p)), segments), material, parent, position);
}

export function surface(parent, material, width, depth, xSteps, zSteps, fn, name = '') {
  const geo = new THREE.PlaneGeometry(width, depth, xSteps, zSteps);
  const a = geo.attributes.position;
  for (let i = 0; i < a.count; i++) {
    const u = a.getX(i), v = -a.getY(i);
    const point = fn(u, v);
    a.setXYZ(i, point[0], point[1], point[2]);
  }
  geo.computeVertexNormals();
  return mesh(geo, material, parent, [0, 0, 0], name);
}

export function fitModel(object, height, position, rotation = 0) {
  const bounds = new THREE.Box3().setFromObject(object);
  const size = bounds.getSize(new THREE.Vector3());
  const center = bounds.getCenter(new THREE.Vector3());
  const holder = new THREE.Group();
  object.position.sub(new THREE.Vector3(center.x, bounds.min.y, center.z));
  holder.add(object);
  holder.scale.setScalar(height / size.y);
  holder.position.set(...position);
  holder.rotation.y = rotation;
  holder.traverse(child => {
    if (!child.isMesh) return;
    child.castShadow = true;
    child.receiveShadow = true;
    const materials = Array.isArray(child.material) ? child.material : [child.material];
    for (const mat of materials) {
      mat.envMapIntensity = 0.5;
      if (mat.alphaTest > 0) { mat.alphaToCoverage = true; mat.side = THREE.DoubleSide; }
    }
  });
  return holder;
}

export function random(seed = 87) {
  let x = seed;
  return () => ((x = (Math.imul(1664525, x) + 1013904223) | 0) >>> 0) / 4294967296;
}
