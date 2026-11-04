import * as THREE from 'three';
import {RELATION_NODES,RELATION_EDGES,RELATION_LAYERS,relatedNodes} from '../relations.mjs';

export function createRelationView(onSelect){
  const host=document.querySelector('#networkLabels'),svg=document.querySelector('#networkEdges');
  const $=s=>host.querySelector(s),colour=layer=>RELATION_LAYERS.find(l=>l.id===layer)?.colour||'#698b82';
  let layer='all',selected='room',active=false,sample=null;
  host.innerHTML=RELATION_NODES.map(n=>'<button class="relation-node" data-node="'+n.id+'" style="--node:'+colour(n.kind)+'"><span>'+n.name+'</span><small></small></button>').join('');
  const elements=new Map([...host.querySelectorAll('[data-node]')].map(e=>[e.dataset.node,e]));
  elements.forEach((el,id)=>el.onclick=()=>{select(id);onSelect(id);});
  function select(id){selected=id;elements.forEach((el,key)=>el.classList.toggle('selected',key===id));}
  function update(value){
    sample=value;
    const text={weather:value.outdoor.toFixed(1)+'°C outdoors',room:value.indoor.toFixed(1)+'°C indoors',window:value.window===null?'State unknown':value.window>.5?'Opening scheduled':'Closed',equipment:value.hvac===null?'Operation unknown':(value.hvac*100).toFixed(0)+'% interval active',logger:value.provenance||'Modelled record',resident:value.review?.resident==='accepted'?'Proposal accepted':value.review?.resident==='declined'?'Proposal declined':'Response unrecorded',office:value.review?.opening==='unverified'?'Permission unresolved':'Opening '+value.review?.opening,clinic:value.classification||'Trial criteria',archive:'Case and source export',maintenance:'Repair context',garden:'Shared care context'};
    for(const [id,el]of elements)el.querySelector('small').textContent=text[id];
  }
  function show(value){active=value;host.hidden=!value;svg.toggleAttribute('hidden',!value);}
  function setLayer(value){layer=value;const ids=relatedNodes(layer);elements.forEach((el,id)=>el.hidden=!ids.has(id));}
  function render(camera,w,h){
    if(!active)return;
    const minimum=w>700?214:12,maximum=w-12;
    const positions=[];
    for(const node of RELATION_NODES){
      const el=elements.get(node.id);if(el.hidden)continue;
      const point=new THREE.Vector3(...node.at).project(camera),ww=el.offsetWidth,hh=el.offsetHeight;
      const px=(point.x+1)*w*.5,py=(-point.y+1)*h*.5;
      positions.push({node,el,w:ww,h:hh,anchorX:px,anchorY:py,x:Math.max(minimum+ww*.5,Math.min(maximum-ww*.5,px)),y:Math.max(76,Math.min(h-55,py-25))});
    }
    // Stable label separation in screen space. Leaders retain the 3D anchor.
    if(w<600){const rows=Math.ceil(positions.length/2),step=(h-215)/Math.max(1,rows-1);positions.forEach((p,i)=>{p.x=w*(i%2?.75:.25);p.y=78+Math.floor(i/2)*step;});}
    else{
      const layout={weather:[.32,.18],logger:[.52,.27],archive:[.88,.18],clinic:[.72,.39],room:[.51,.54],resident:[.28,.40],window:[.46,.74],equipment:[.29,.82],office:[.89,.59],maintenance:[.88,.84],garden:[.68,.86]};
      positions.forEach(p=>{const xy=layout[p.node.id];p.x=w*xy[0];p.y=h*xy[1];});
    }
    if(w>=600)for(let k=0;k<36;k++){
      for(let i=0;i<positions.length;i++)for(let j=i+1;j<positions.length;j++){
        const a=positions[i],b=positions[j],dx=a.x-b.x,dy=a.y-b.y,ox=(a.w+b.w)*.5+12-Math.abs(dx),oy=(a.h+b.h)*.5+12-Math.abs(dy);
        if(ox>0&&oy>0){if(ox<oy){const push=ox*.52*(dx>=0?1:-1);a.x+=push;b.x-=push;}else{const push=oy*.52*(dy>=0?1:-1);a.y+=push;b.y-=push;}}
      }
      for(const p of positions){p.x=Math.max(minimum+p.w*.5,Math.min(maximum-p.w*.5,p.x));p.y=Math.max(76,Math.min(h-55,p.y));}
    }
    const byId=new Map(positions.map(p=>[p.node.id,p]));
    let paths='<defs><marker id="relationArrow" viewBox="0 0 6 6" refX="5" refY="3" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 0L6 3L0 6" fill="#6e816e"/></marker></defs>';
    for(const p of positions){p.el.style.left=p.x+'px';p.el.style.top=p.y+'px';p.el.classList.toggle('selected',p.node.id===selected);paths+='<path d="M'+p.x+' '+(p.y+p.h*.5)+'L'+p.anchorX+' '+p.anchorY+'" class="anchor-leader"/><circle cx="'+p.anchorX+'" cy="'+p.anchorY+'" r="2" fill="'+colour(p.node.kind)+'"/>';}
    const boundary=(a,b)=>{const dx=b.x-a.x,dy=b.y-a.y,s=Math.min((a.w*.5+5)/Math.max(.001,Math.abs(dx)),(a.h*.5+5)/Math.max(.001,Math.abs(dy)));return {x:a.x+dx*s,y:a.y+dy*s};};
    for(const e of RELATION_EDGES){if(layer!=='all'&&e.layer!==layer)continue;const a=byId.get(e.from),b=byId.get(e.to);if(!a||!b)continue;const involved=e.from===selected||e.to===selected,start=boundary(a,b),end=boundary(b,a),dy=end.y-start.y,mid=(start.x+end.x)*.5,d='M'+start.x+' '+start.y+'C'+mid+' '+(start.y-dy*.10)+' '+mid+' '+(end.y+dy*.10)+' '+end.x+' '+end.y;paths+='<path d="'+d+'" fill="none" stroke="#edf0e8" stroke-width="4" opacity=".65"/><path d="'+d+'" fill="none" stroke="'+colour(e.layer)+'" stroke-width="'+(involved?2:1.2)+'" opacity="'+(involved?1:.8)+'" '+(e.layer==='authority'?'stroke-dasharray="5 4"':e.layer==='care'?'stroke-dasharray="2 4"':'')+' marker-end="url(#relationArrow)"><title>'+e.label+'</title></path>';}
    svg.setAttribute('viewBox','0 0 '+w+' '+h);svg.innerHTML=paths;
  }
  select(selected);setLayer(layer);
  return {show,setLayer,select,update,render};
}
