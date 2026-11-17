const test=require("node:test");
const assert=require("node:assert/strict");
const { validKey, validLyrics, createLyricsHandlers }=require("../functions/musicStudioLyrics");

test("Swahili keys are namespaced and validated alongside German keys",()=>{
  assert.equal(validKey("swahili-a1-day-02"),"SWAHILI-A1-DAY-02");
  assert.equal(validKey("SWAHILI-B1-DAY-28"),"SWAHILI-B1-DAY-28");
  assert.equal(validKey("A2-3.8"),"A2-3.8");
  for(const key of ["SWAHILI-A1-DAY-00","SWAHILI-A1-DAY-29","SWAHILI-C2-DAY-01","SWAHILI-A1-DAY-01/other"])assert.throws(()=>validKey(key));
  assert.equal(validLyrics("Salamu!\r\nKaribu!"),"Salamu!\nKaribu!");
});
function mockResponse(){
  return {statusCode:200,headers:{},set(key,value){this.headers[key]=value;return this;},
    status(value){this.statusCode=value;return this;},json(value){this.body=value;return this;}};
}
test("authorized Swahili teacher can save and reload lyrics while draft stays private",async()=>{
  const documents=new Map();const permissions=[];
  const db={collection(name){assert.equal(name,"musicStudioLyrics");return {
    doc(id){return {async get(){return {exists:documents.has(id),data(){return documents.get(id);}};},
      async set(value){documents.set(id,value);}};}
  };}};
  const handlers=createLyricsHandlers({db,runtimeConfig:{},verifyToken:async()=>({uid:"staff-user",role:"staff",staff:true,staffPages:["music-studio"],staffLanguages:["swahili"]})});
  // StudioAccess checks staff permissions in a separate access collection, so mock that collection.
  const originalCollection=db.collection;
  db.collection=name=>name==="falowenStaffAccess"?{doc:()=>({get:async()=>({data:()=>({active:true,pages:["music-studio"],languages:["swahili"]})})})}:originalCollection(name);
  const post=mockResponse();
  await handlers.owner({method:"POST",headers:{authorization:"Bearer valid"},body:{assignmentKey:"swahili-a1-day-02",lyrics:"[Verse 1]\nHabari yako?\nNzuri, asante."}},post);
  assert.equal(post.statusCode,200);assert.equal(post.body.saved,true);
  assert.equal(documents.get("SWAHILI-A1-DAY-02").publicReference,false);
  const get=mockResponse();
  await handlers.owner({method:"GET",headers:{authorization:"Bearer valid"},query:{assignmentKey:"SWAHILI-A1-DAY-02"}},get);
  assert.equal(get.body.lyrics,post.body.lyrics);
  const publicRead=mockResponse();
  await handlers.publicRead({method:"GET",query:{assignmentKey:"SWAHILI-A1-DAY-02"}},publicRead);
  assert.equal(publicRead.body.found,false);
  const blocked=mockResponse();
  await handlers.owner({method:"GET",headers:{authorization:"Bearer valid"},query:{assignmentKey:"A1-1"}},blocked);
  assert.equal(blocked.statusCode,403);
});
