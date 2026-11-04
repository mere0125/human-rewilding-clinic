import * as THREE from 'three';

export async function loadSurfaces(renderer) {
  const loader = new THREE.TextureLoader();
  const anisotropy = Math.min(12, renderer.capabilities.getMaxAnisotropy());
  async function set(id, repeat) {
    const maps = await Promise.all(['Diffuse', 'nor_gl', 'Rough'].map(type => loader.loadAsync(`./assets/${id}/${type}.jpg`)));
    maps.forEach(map => { map.wrapS = map.wrapT = THREE.RepeatWrapping; map.repeat.set(...repeat); map.anisotropy = anisotropy; });
    maps[0].colorSpace = THREE.SRGBColorSpace;
    return { map: maps[0], normalMap: maps[1], roughnessMap: maps[2] };
  }
  const [wood, plaster, fabric] = await Promise.all([
    set('wood_floor', [2.1, 1.9]), set('plastered_wall_04', [1.6, 1.2]), set('rough_linen', [10, 10])
  ]);
  // The photographed linen is blue. Separate its fiber luminance from its dye
  // so the same measured weave can be used for undyed cloth in this room.
  const c = document.createElement('canvas'); c.width = fabric.map.image.width; c.height = fabric.map.image.height;
  const ctx = c.getContext('2d'); ctx.drawImage(fabric.map.image, 0, 0);
  const pixels = ctx.getImageData(0, 0, c.width, c.height);
  for (let i = 0; i < pixels.data.length; i += 4) {
    const l = Math.min(255, (pixels.data[i] * 0.2126 + pixels.data[i + 1] * 0.7152 + pixels.data[i + 2] * 0.0722) * 1.48);
    pixels.data[i] = pixels.data[i + 1] = pixels.data[i + 2] = l;
  }
  ctx.putImageData(pixels, 0, 0);
  const neutralWeave = new THREE.CanvasTexture(c); neutralWeave.wrapS = neutralWeave.wrapT = THREE.RepeatWrapping;
  neutralWeave.repeat.copy(fabric.map.repeat); neutralWeave.anisotropy = anisotropy; neutralWeave.colorSpace = THREE.SRGBColorSpace;
  fabric.map = neutralWeave;
  const wall = new THREE.MeshStandardMaterial({ ...plaster, color: 0xece6d8, normalScale: new THREE.Vector2(0.17, 0.17), roughness: 0.96, envMapIntensity: 0.08 });
  wall.color.setRGB(1.55, 1.45, 1.28);
  const floor = new THREE.MeshStandardMaterial({ ...wood, color: 0xb9a995, normalScale: new THREE.Vector2(0.38, 0.38), roughness: 0.8, envMapIntensity: 0.2 });
  const linen = new THREE.MeshPhysicalMaterial({ ...fabric, color: 0xd8d2c4, roughness: 0.97, normalScale: new THREE.Vector2(0.24, 0.24), sheen: 0.55, sheenRoughness: 0.9, sheenColor: new THREE.Color(0xd5cebd), side: THREE.DoubleSide, envMapIntensity: 0.1 });
  const moss = linen.clone(); moss.color.set(0x626b4c); moss.sheenColor.set(0x7f886b);
  const curtain = linen.clone(); curtain.color.set(0xe3dece); curtain.normalScale.set(0.16, 0.16); curtain.transmission = 0.16; curtain.thickness = 0.002; curtain.opacity = 0.96; curtain.transparent = true;
  return {
    wall, floor, linen, moss, curtain,
    chalk: new THREE.MeshStandardMaterial({ color: 0xc9c6b8, roughness: 0.76, envMapIntensity: 0.15 }),
    enamel: new THREE.MeshStandardMaterial({ color: 0xd2d0c3, roughness: 0.4, metalness: 0.12 }),
    oak: new THREE.MeshStandardMaterial({ ...wood, color: 0x93806a, normalScale: new THREE.Vector2(0.17, 0.17), roughness: 0.62, envMapIntensity: 0.2 }),
    black: new THREE.MeshStandardMaterial({ color: 0x242825, metalness: 0.68, roughness: 0.4, envMapIntensity: 0.45 }),
    chrome: new THREE.MeshStandardMaterial({ color: 0x9caaa6, metalness: 0.94, roughness: 0.28, envMapIntensity: 0.9 }),
    rubber: new THREE.MeshStandardMaterial({ color: 0x131814, roughness: 0.91, envMapIntensity: 0.1 }),
    glass: new THREE.MeshPhysicalMaterial({ color: 0xf3faf6, transmission: 1, roughness: 0.035, thickness: 0.012, ior: 1.48, metalness: 0, envMapIntensity: 0.4 }),
    paper: new THREE.MeshStandardMaterial({ color: 0xe8e3d5, roughness: 1, side: THREE.DoubleSide }),
    dirt: new THREE.MeshStandardMaterial({ color: 0x4b4132, roughness: 1 }),
  };
}
