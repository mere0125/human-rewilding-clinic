import * as THREE from 'three';

// One material family across the constructed neighbourhood, patient habitat
// and Clinic. Each call returns independent materials so scene changes do not
// recolour another place or alter any analytical input.
export const WORLD_COLOURS=Object.freeze({
  ivory:0xe2e4dc,pearl:0xe9ece5,mist:0xc7d1c9,
  aluminium:0xbfc8c8,green:0x405f51,dark:0x4f6059,
  mineral:0xb9c2b9,soil:0x514c3c
});

export function worldFinishes(){
  return {
    ivory:new THREE.MeshPhysicalMaterial({color:WORLD_COLOURS.ivory,roughness:.52,clearcoat:.12,clearcoatRoughness:.4}),
    pearl:new THREE.MeshPhysicalMaterial({color:WORLD_COLOURS.pearl,roughness:.39,transmission:.25,thickness:.006,ior:1.43,side:THREE.DoubleSide}),
    mist:new THREE.MeshStandardMaterial({color:WORLD_COLOURS.mist,roughness:.51}),
    silver:new THREE.MeshStandardMaterial({color:WORLD_COLOURS.aluminium,metalness:.89,roughness:.28}),
    green:new THREE.MeshPhysicalMaterial({color:WORLD_COLOURS.green,roughness:.58,sheen:.34,sheenColor:0x81988a}),
    dark:new THREE.MeshStandardMaterial({color:WORLD_COLOURS.dark,metalness:.45,roughness:.4}),
    mineral:new THREE.MeshStandardMaterial({color:WORLD_COLOURS.mineral,roughness:.66}),
    glass:new THREE.MeshPhysicalMaterial({color:0xe9f0eb,transmission:.82,roughness:.10,thickness:.012,ior:1.46,side:THREE.DoubleSide})
  };
}
