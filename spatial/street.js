import * as THREE from 'three';
import {surface} from './spatial.js';

// Context buildings share the habitat's material and construction language.
// They are not additional monitored rooms or simulated environmental fields.
export function buildStreet({root,built,mat,materials,block,soft,cylinder,rod,house,label,glow,rand}){
  const lamps=[],trees=[],planters=[];
  const service=new THREE.MeshStandardMaterial({color:0x788b80,roughness:.73});
  const paint=new THREE.MeshStandardMaterial({color:0xdbe1d1,roughness:.7});
  block(mat.stone,[40,.20,40],[1.5,-.12,3.5]);
  // A slower service edge and a shared mineral walk have legible joints and
  // drainage, with a level crossing into the community rather than a kerb maze.
  block(service,[4.25,.035,33.8],[-10.4,.0,1.5]);
  block(service,[35.8,.035,4.5],[2.5,.0,14.4]);
  for(const xx of[-12.55,-8.25])block(mat.silver,[.045,.015,33.8],[xx,.017,1.5]);
  for(const z of[12.10,16.70])block(mat.silver,[35.8,.015,.045],[2.5,.017,z]);
  for(let z=-14;z<11.5;z+=3.2)block(paint,[.045,.003,.40],[-10.4,.019,z]);
  for(let x=-13;x<20;x+=3.2)block(paint,[.40,.003,.045],[x,.019,14.4]);
  block(mat.paving,[4.3,.025,2.45],[-10.4,.025,10.8]);
  for(let i=0;i<7;i++)block(mat.silver,[.022,.008,2.40],[-11.85+i*.48,.044,10.8]);
  for(const[x,z]of[[-7.8,-3],[-7.8,8],[9.6,11.6],[16.4,11.6]]){soft(mat.silver,[.5,.018,.32],[x,.012,z],.008);for(let j=0;j<9;j++)block(mat.iron,[.023,.008,.29],[x-.22+j*.055,.025,z]);}

  house({x:-15.5,z:-7.7,w:5.0,d:5.2,h:8.6,floors:3,brick:true});
  house({x:-15.5,z:-1.9,w:5.1,d:5.4,h:10.2,floors:3});
  house({x:-15.5,z:4.1,w:5.1,d:5.9,h:8.2,floors:3,brick:true});
  house({x:-15.5,z:9.8,w:5.0,d:5.0,h:6.1,floors:2});
  for(const[x,h,brick]of[[-5.6,6.6,true],[.2,8.2,false],[6.0,7.4,true],[11.8,9.1,false]])house({x,z:20,w:5.5,d:4.5,h,floors:3,brick});

  // The connecting walk is a light suspended sheet, with physical silver
  // supports, edge clamps and a clear path at the shared ground datum.
  for(const x of[-1.5,.65,2.8])for(const z of[9.95,10.95])rod(mat.silver,[x,.04,z],[x,2.55,z],.018);
  for(const z of[9.95,10.95])rod(mat.silver,[-1.55,2.55,z],[2.9,2.55,z],.018);
  const walk=surface(built,mat.pearl,4.7,1.3,48,24,(u,v)=>[.65+u,2.58-.045*(v/.65)**2+Math.sin(u*2)*.007,10.45+v],'shared walk membrane');walk.castShadow=false;
  for(let x=-1.6;x<3;x+=.78)block(mat.silver,[.008,.007,1.29],[x,2.59,10.45]);

  // The nursery is a pleated environmental threshold, sharing the Clinic's
  // soft shoulder profile, with open ends and sheltered working surfaces.
  const gx=-4.8,gz=-7.45,gw=4.3,gd=3.7;
  soft(mat.chalk,[gw+.25,.17,gd+.25],[gx,.085,gz],.07);
  for(const side of[-1,1]){
    for(const z of[gz-gd/2,gz,gz+gd/2])rod(mat.silver,[gx+side*gw/2,.17,z],[gx+side*gw/2,2.45,z],.019);
    for(const y of[.25,2.43])rod(mat.silver,[gx+side*gw/2,y,gz-gd/2],[gx+side*gw/2,y,gz+gd/2],.018);
    const s=surface(built,mat.pearl,gd,1.85,72,24,(u,v)=>[gx+side*(gw/2+.012*Math.cos(u*30)),1.37+v,gz+u],'nursery pleated screen');s.castShadow=false;
    for(const z of[gz-gd/2,gz+gd/2])rod(mat.silver,[gx+side*gw/2,.43,z],[gx+side*gw/2,2.30,z],.012);
  }
  const crown=x=>2.84-.38*(Math.abs(x)/(gw/2))**6;
  const roof=surface(built,mat.pearl,gw,gd+.20,64,48,(u,v)=>[gx+u,crown(u),gz+v],'nursery tailored crown');roof.castShadow=false;
  for(const z of[gz-gd/2-.10,gz+gd/2+.10]){for(let i=0;i<24;i++){const x=-gw/2+i/24*gw,nx=-gw/2+(i+1)/24*gw;rod(mat.silver,[gx+x,crown(x),z],[gx+nx,crown(nx),z],.012);}}
  for(const x of[gx-1.35,gx+1.35]){
    soft(mat.silver,[.72,.035,2.8],[x,.84,gz],.016);
    for(const z of[gz-1.1,gz+1.1])soft(mat.chalk,[.15,.70,.48],[x,.47,z],.05);
    for(let j=0;j<6;j++)planters.push([x,gz-1.1+j*.43,.86]);
  }
  label('Courtyard nursery',2,.23,[gx,2.21,gz+gd/2+.12]);

  // Maintenance and archive access are composed from the same inset panels.
  const sx=12.8,sz=-5.34;
  soft(mat.iron,[2.30,2.43,.08],[sx,1.215,sz],.035);
  soft(mat.green,[2.17,2.31,.035],[sx,1.20,sz+.05],.016);
  for(let y=.2;y<2.35;y+=.16)block(mat.silver,[2.05,.008,.016],[sx,y,sz+.073]);
  soft(mat.silver,[2.66,.055,.65],[sx,2.52,sz+.15],.025);
  label('Maintenance',1.8,.26,[sx,2.80,sz+.04]);
  label('Case archive',2.2,.28,[-4.8,2.70,10.58]);
  for(let i=0;i<5;i++){const x=10.85+i*.14;soft(mat.silver,[.075,2.36,.11],[x,1.20,-5.1],.025);soft(mat.iron,[.04,.12,.015],[x,1.15,-5.037],.005);}

  // A physical source marker, with no invented live connection or readout.
  const wx=.2,wz=-4.7;
  cylinder(mat.chalk,.23,.10,[wx,.05,wz],32);rod(mat.silver,[wx,.1,wz],[wx,3.6,wz],.023);
  for(let i=0;i<7;i++)cylinder(mat.chalk,.15,.035,[wx,2.75+i*.055,wz],32);
  for(let i=0;i<3;i++){const a=i/3*Math.PI*2;rod(mat.silver,[wx,3.6,wz],[wx+Math.cos(a)*.28,3.6,wz+Math.sin(a)*.28],.008);const cup=new THREE.Mesh(new THREE.SphereGeometry(.065,12,8,0,Math.PI),mat.iron);cup.position.set(wx+Math.cos(a)*.28,3.6,wz+Math.sin(a)*.28);built.add(cup);}

  for(const[x,z,w]of[[6.1,4.45,4.4],[5,-4.3,4.2],[-4.5,4.7,4.3]]){soft(mat.chalk,[w,.39,.20],[x,.195,z],.08);soft(mat.silver,[w+.03,.022,.23],[x,.405,z],.01);}
  for(const z of[-2.9,2.8,7.4])for(const x of[-7.45,15.5]){soft(mat.chalk,[.20,.78,.22],[x,.39,z],.07);for(let i=0;i<6;i++)rod(mat.silver,[x,.45,z+i*.13],[x,1.04,z+i*.13],.008);}
  // Diffused public fittings sit on precise mounts, rather than lanterns.
  for(const[x,z]of[[-7.3,-5.4],[-7.3,5.4],[-2.2,11.1],[8.8,10.7],[15.6,4.5]]){
    soft(mat.silver,[.20,.035,.26],[x,.018,z],.016);rod(mat.silver,[x,.04,z],[x,3.45,z],.022);
    soft(mat.silver,[.54,.045,.21],[x+.13,3.47,z],.020);soft(glow,[.44,.016,.12],[x+.13,3.437,z],.006);
    const light=new THREE.PointLight(0xe9efda,0,7,2);light.position.set(x+.13,3.40,z);root.add(light);lamps.push(light);
  }
  for(const[x,z]of[[-7,-10],[-7,.5],[-7,9],[1.2,11.1],[12.5,10.9],[15.8,-8.6],[15.8,.5]]){
    soft(mat.chalk,[1.45,.13,1.45],[x,.065,z],.06);block(mat.soil,[1.20,.035,1.20],[x,.15,z]);trees.push([x,z,3.4+rand()*1.6]);
  }
  for(const[x,z,y]of[[3.0,-5.9,8.56],[4.7,-5.9,8.56],[6.8,-5.9,8.56],[11.7,2,6.36],[11.7,-.5,6.36]]){
    soft(mat.chalk,[1.5,.21,.55],[x,y+.10,z],.07);block(mat.soil,[1.35,.035,.45],[x,y+.205,z]);
    for(let n=0;n<3;n++)planters.push([x-.45+n*.45,z,y+.23]);
  }
  soft(mat.chalk,[1.8,.36,.74],[9.4,.18,3.9],.13);soft(mat.iron,[1.62,.025,.56],[9.4,.365,3.9],.012);
  for(let i=0;i<7;i++){const ring=new THREE.Mesh(new THREE.TorusGeometry(.20+i*.007,.008,6,36),mat.green);ring.position.set(14.34,.8,1.5+i*.01);ring.rotation.y=Math.PI/2;built.add(ring);}
  for(let i=0;i<6;i++){const x=-6.0+i*.10;soft(mat.silver,[.045,.025,.23],[x,.873,-7.45],.009);rod(mat.iron,[x,.875,-7.56],[x,.875,-7.70],.007);}
  return {lamps,trees,planters};
}
