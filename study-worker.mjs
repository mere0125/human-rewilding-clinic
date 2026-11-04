import {sensitivity} from './engine.mjs';
self.onmessage=({data})=>{
  try {const results=sensitivity(data.rows,data.scenario,n=>self.postMessage({id:data.id,progress:n}));self.postMessage({id:data.id,results});}
  catch(error){self.postMessage({id:data.id,error:error.message});}
};
