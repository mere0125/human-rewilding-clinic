import * as THREE from 'three';

// Visible neighbourhood fabric. These places are scene context, not extra
// monitored patients. Only the separate Room 001 model produces thermal data.
export function buildStreet({root,built,mat,materials,block,cylinder,rod,house,label,glow,rand}){
  const lamps=[],trees=[],planters=[];
  const asphalt=new THREE.MeshStandardMaterial({color:0x565b59,roughness:.96});
  const paint=new THREE.MeshStandardMaterial({color:0xc7c8ba,roughness:.92});
  const clear=new THREE.MeshPhysicalMaterial({color:0xb9d0c8,roughness:.22,metalness:.25,transparent:true,opacity:.28,depthWrite:false,side:THREE.DoubleSide});
  const roofGlass=new THREE.MeshStandardMaterial({color:0x73877c,roughness:.24,metalness:.5,transparent:true,opacity:.35,depthWrite:false,side:THREE.DoubleSide});
  const timber=mat.wood;
  // Street and pavement share one datum with the original courtyard.
  block(mat.stone,[40,.25,40],[1.5,-.145,3.5]);
  block(asphalt,[4.5,.045,33.8],[-10.4,.003,1.5]);
  block(asphalt,[35.8,.045,4.8],[2.5,.003,14.4]);
  for(const xx of [-12.76,-8.03])for(let z=-15;z<16.7;z+=.65)block(mat.stone,[.19,.14,.62],[xx,-.005,z]);
  for(let x=-15.2;x<20.3;x+=.65)for(const z of [11.88,16.92])block(mat.stone,[.62,.14,.19],[x,-.005,z]);
  for(let z=-14.5;z<11.5;z+=2.1)block(paint,[.055,.003,.70],[-10.4,.028,z]);
  for(let x=-13.8;x<20.1;x+=2.1)block(paint,[.70,.003,.055],[x,.028,14.4]);
  for(let i=0;i<7;i++)block(paint,[.32,.004,2.7],[-11.7+i*.43,.029,12.5]);
  for(const [x,z]of [[-7.8,-3],[-7.8,8],[9.6,11.6],[16.4,11.6]]){
    block(mat.iron,[.5,.028,.32],[x,.009,z]);
    for(let j=0;j<9;j++)block(mat.stone,[.023,.029,.29],[x-.22+j*.055,.013,z]);
  }
  // A varied surrounding street edge gives the courtyard a location.
  house({x:-15.5,z:-7.7,w:5.0,d:5.2,h:8.6,floors:3,brick:true,pitched:true});
  house({x:-15.5,z:-1.9,w:5.1,d:5.4,h:10.2,floors:3});
  house({x:-15.5,z:4.1,w:5.1,d:5.9,h:8.2,floors:3,brick:true,pitched:true});
  house({x:-15.5,z:9.8,w:5.0,d:5.0,h:6.1,floors:2,pitched:true});
  for(const [x,h,brick]of [[-5.6,6.6,true],[.2,8.2,false],[6.0,7.4,true],[11.8,9.1,false]])house({x,z:20.0,w:5.5,d:4.5,h,floors:3,brick,pitched:brick});
  // Canopied walk between the Clinic and case archive.
  for(let x=-1.5;x<3.0;x+=.65){
    rod(mat.green,[x,.04,9.9],[x,2.5,9.9],.028);rod(mat.green,[x,.04,11.0],[x,2.5,11.0],.028);
    rod(mat.green,[x,2.5,9.9],[x,2.5,11.0],.026);
  }
  for(const z of [9.9,11])rod(mat.green,[-1.5,2.5,z],[2.9,2.5,z],.035);
  block(roofGlass,[4.7,.025,1.4],[.65,2.55,10.45]);
  for(let x=-1.5;x<3.0;x+=.48)block(mat.cobbles,[.46,.023,1.32],[x,.015,10.45]);
  // A greenhouse has an open structural frame, glazing and potting bench.
  const gx=-4.8,gz=-7.45,gw=4.3,gd=3.7;
  block(mat.stone,[gw+.25,.22,gd+.25],[gx,.1,gz]);
  for(const side of [-1,1]){
    for(let i=0;i<=6;i++)rod(mat.green,[gx+side*gw*.5,.22,gz-gd*.5+i*gd/6],[gx+side*gw*.5,2.38,gz-gd*.5+i*gd/6],.024);
    for(const y of [.3,1.1,2.38])rod(mat.green,[gx+side*gw*.5,y,gz-gd*.5],[gx+side*gw*.5,y,gz+gd*.5],.026);
    block(clear,[.018,2.1,gd],[gx+side*gw*.5,1.30,gz]);
  }
  for(let i=0;i<=6;i++){
    const z=gz-gd*.5+i*gd/6;
    rod(mat.green,[gx-gw*.5,2.38,z],[gx,3.15,z],.026);rod(mat.green,[gx,3.15,z],[gx+gw*.5,2.38,z],.026);
  }
  rod(mat.green,[gx,3.15,gz-gd*.5],[gx,3.15,gz+gd*.5],.035);
  for(const side of [-1,1]){const panel=block(clear,[gw*.53,.016,gd],[gx+side*gw*.25,2.77,gz]);panel.rotation.z=-side*.345;}
  for(const x of [gx-1.35,gx+1.35]){
    block(timber,[.72,.06,2.8],[x,.84,gz]);
    for(const z of [gz-1.1,gz+1.1])block(mat.green,[.05,.8,.05],[x,.42,z]);
    for(let j=0;j<6;j++)planters.push([x,gz-1.1+j*.43,.87]);
  }
  label('Courtyard nursery',2.0,.24,[gx,2.15,gz+gd*.5+.03]);
  // Service workshop: shutter strips, tool wall, pipes and labelled entrance.
  const sx=12.8,sz=-5.34;
  block(mat.green,[2.2,2.38,.07],[sx,1.19,sz]);
  for(let y=.15;y<2.35;y+=.095)block(mat.iron,[2.17,.012,.025],[sx,y,sz+.045]);
  label('Maintenance',1.8,.28,[sx,2.73,sz+.04]);
  label('Case archive',2.2,.3,[-4.8,2.73,10.58]);
  for(let i=0;i<5;i++){
    const x=10.85+i*.14;rod(mat.copper,[x,.05,-5.1],[x,2.40,-5.1],.028);rod(mat.copper,[x,2.4,-5.1],[x+.08,2.4,-5.1],.027);
    cylinder(mat.iron,.048,.08,[x,1.15,-5.1],12);
  }
  // Weather instrument is a constructed source marker, not a live data feed.
  const wx=.2,wz=-4.7;
  cylinder(mat.stone,.24,.1,[wx,.05,wz],32);rod(materials.chrome,[wx,.1,wz],[wx,3.6,wz],.025);
  for(let i=0;i<7;i++)cylinder(materials.chalk,.15,.035,[wx,2.75+i*.055,wz],32);
  for(let i=0;i<3;i++){const a=i/3*Math.PI*2;rod(materials.chrome,[wx,3.6,wz],[wx+Math.cos(a)*.28,3.6,wz+Math.sin(a)*.28],.008);const cup=new THREE.Mesh(new THREE.SphereGeometry(.065,12,8,0,Math.PI),mat.iron);cup.position.set(wx+Math.cos(a)*.28,3.6,wz+Math.sin(a)*.28);built.add(cup);}
  // Front garden walls, gates and textured maintenance paths.
  for(const [x,z,w]of [[6.1,4.45,4.4],[5.0,-4.3,4.2],[-4.5,4.7,4.3]]){
    block(mat.brick,[w,.45,.22],[x,.225,z]);block(mat.stone,[w+.08,.06,.29],[x,.48,z]);
  }
  for(const z of [-2.9,2.8,7.4])for(const x of [-7.45,15.5]){
    block(mat.stone,[.33,1.02,.33],[x,.51,z]);
    for(let i=0;i<7;i++)rod(mat.iron,[x,.55,z+i*.12],[x,1.23,z+i*.12],.009);
  }
  // Public lighting, with small physical lamps and warm pools at the entrance.
  for(const [x,z]of [[-7.3,-5.4],[-7.3,5.4],[-2.2,11.1],[8.8,10.7],[15.6,4.5]]){
    cylinder(mat.iron,.12,.1,[x,.05,z]);rod(mat.iron,[x,.1,z],[x,3.7,z],.034);
    block(mat.iron,[.36,.06,.36],[x,3.85,z]);block(glow,[.24,.30,.24],[x,3.65,z]);
    const light=new THREE.PointLight(0xffc77e,0,7,2);light.position.set(x,3.6,z);root.add(light);lamps.push(light);
  }
  for(const [x,z]of [[-7.0,-10],[-7.0,.5],[-7.0,9.0],[1.2,11.1],[12.5,10.9],[15.8,-8.6],[15.8,.5]]){
    block(mat.stone,[1.45,.13,1.45],[x,.065,z]);block(mat.soil,[1.20,.035,1.20],[x,.15,z]);trees.push([x,z,3.4+rand()*1.6]);
  }
  // Roof planters and a service terrace are visible at the model scale.
  for(const [x,z,y]of [[2.4,-8.4,8.25],[4.5,-8.4,8.25],[7.0,-8.4,8.25],[10.8,2.0,6.05],[10.8,-.5,6.05]]){
    block(mat.stone,[1.5,.25,.55],[x,y+.1,z]);block(mat.soil,[1.35,.035,.45],[x,y+.25,z]);
    for(let n=0;n<3;n++)planters.push([x-.45+n*.45,z,y+.28]);
  }
  // A compact rainwater trough, hose coil and potting tools add visible use.
  block(mat.stone,[1.8,.40,.74],[9.4,.2,3.9]);block(mat.iron,[1.62,.03,.56],[9.4,.405,3.9]);
  for(let i=0;i<7;i++){const ring=new THREE.Mesh(new THREE.TorusGeometry(.21+i*.007,.009,6,36),mat.green);ring.position.set(14.34,.8,1.5+i*.01);ring.rotation.y=Math.PI/2;built.add(ring);}
  for(let i=0;i<9;i++){
    const x=-6.15+i*.055;block(timber,[.03,.04,.28],[x,.895,-7.45]);rod(mat.iron,[x,.895,-7.59],[x,.895,-7.73],.008);
  }
  return {lamps,trees,planters};
}
