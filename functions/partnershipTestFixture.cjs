const crypto = require('node:crypto');
function fixture() {
 const data = new Map(), routes = new Map(); let pending = [];
 const snap = ref => ({ id:ref.id,ref,exists:data.has(ref.key),data:()=>data.get(ref.key) });
 const collection = name => ({
  doc(id) { const ref={id,key:name+'/'+id,get:async()=>snap(ref),set:async value=>data.set(ref.key,value),update:async value=>data.set(ref.key,{...data.get(ref.key),...value})};return ref; },
  where(field,op,value) { return {limit(n) { return {get:async()=> { const docs=[...data].filter(([key,item])=>key.startsWith(name+'/')&&item[field]===value).slice(0,n).map(([key])=>snap(collection(name).doc(key.slice(name.length+1))));return {docs,size:docs.length}; }};}};},
 });
 const tx={ get:async ref=>ref.get(),create:(ref,value)=>{if(data.has(ref.key))throw new Error('duplicate');pending.push([ref,value]);},set:(ref,value)=>pending.push([ref,value]),update:(ref,value)=>pending.push([ref,{...data.get(ref.key),...value}]) };
 const db={collection,runTransaction:async fn=>{pending=[];const result=await fn(tx);for(const [ref,value]of pending)data.set(ref.key,value);return result;}};
 const admin={firestore:{FieldValue:{serverTimestamp:()=> '2026-11-05T00:00:00Z'}},auth:()=>({verifyIdToken:async()=>({uid:'owner',email:'moxflex@gmail.com',email_verified:true})})};
 const app={get:(path,fn)=>routes.set(path,fn),post:(path,fn)=>routes.set(path,fn)};
 const call=async(path,body={},signed=false,id='',query={})=>{let status=200,result,headers={};await routes.get(path)({body,query,params:{id},ip:'test',headers:signed?{authorization:'Bearer test'}:{}},{set(key,val){headers[key]=val;},status(n){status=n;return this;},json(value){result=value;},send(value){result=value;}});return {status,result,headers};};
 return {data,db,admin,app,call,routes};
}
module.exports={fixture};
