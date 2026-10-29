import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
const require=createRequire(import.meta.url);
const {validKey,validLyrics,createLyricsHandlers}=require("../functions/musicStudioLyrics.js");

function fakeDb() {
  const store=new Map();
  return {
    store,
    collection(name) {
      assert.equal(name,"musicStudioLyrics");
      return {doc(key) {
        return {
          async get(){return {exists:store.has(key),data:()=>store.get(key)};},
          async set(value){store.set(key,value);}
        };
      }};
    },
  };
}
function fakeRes() {
  return {
    statusCode:200,
    headers:{},
    set(key,value){this.headers[key]=value;return this;},
    status(code){this.statusCode=code;return this;},
    json(data){this.result=data;return this;},
  };
}
const ownerUid="owner_test_uid";
function handler(db=fakeDb()){
  return { db, ...createLyricsHandlers({
    db,verifyToken:async token=>{if(token!=="good-token")throw Error("unauthorized");return {uid:ownerUid};},
    runtimeConfig:{ai_studio:{owner_uid:ownerUid}}
  })};
}
test("lesson lyric overwrites validate known lesson formats and bounded text",()=>{
  assert.equal(validKey("a1-3.5"),"A1-3.5");
  assert.equal(validKey("a1-1.1-practice"),"A1-1.1-PRACTICE");
  assert.throws(()=>validKey("../../private"),/valid course lesson/);
  assert.throws(()=>validKey("A9-22"),/valid course lesson/);
  assert.equal(validLyrics("[Verse]\r\nIch komme morgen.\n"),"[Verse]\nIch komme morgen.");
  assert.throws(()=>validLyrics(" "),/1–5,500/);
  assert.throws(()=>validLyrics("x".repeat(5501)),/1–5,500/);
});
test("only the verified owner can overwrite; public response contains only the approved text",async()=>{
  const {db,owner,publicRead}=handler();
  const get={method:"GET",query:{assignmentKey:"A1-3.5"},headers:{authorization:"Bearer good-token"}};
  const empty=fakeRes();await owner(get,empty);
  assert.equal(empty.result.found,false);
  let blocked=fakeRes();await owner({...get,method:"POST",headers:{},body:{assignmentKey:"A1-3.5",lyrics:"hacked"}},blocked);
  assert.equal(blocked.statusCode,401);
  assert.equal(db.store.size,0);
  let saved=fakeRes();await owner({...get,method:"POST",body:{assignmentKey:"A1-3.5",lyrics:"Zwei Tees, vier Euro."}},saved);
  assert.equal(saved.statusCode,200);
  assert.equal(saved.result.saved,true);
  let fetched=fakeRes();await owner(get,fetched);
  assert.equal(fetched.result.lyrics,"Zwei Tees, vier Euro.");
  let pub=fakeRes();await publicRead({method:"GET",query:{assignmentKey:"A1-3.5"}},pub);
  assert.deepEqual(Object.keys(pub.result).sort(),["assignmentKey","found","lyrics","ok","updatedAt"]);
  assert.equal(pub.result.lyrics,"Zwei Tees, vier Euro.");
  await owner({...get,method:"POST",body:{assignmentKey:"A1-3.5",lyrics:"Noch ein Tee."}},fakeRes());
  const updated=fakeRes();await publicRead({method:"GET",query:{assignmentKey:"A1-3.5"}},updated);
  assert.equal(updated.result.lyrics,"Noch ein Tee.");
  assert.equal(db.store.size,1);
});
test("unpublished Firestore documents never leak via public route",async()=>{
  const {db,publicRead}=handler();
  db.store.set("A1-3.5",{lyrics:"Hidden draft",publicReference:false});
  const res=fakeRes();await publicRead({method:"GET",query:{assignmentKey:"A1-3.5"}},res);
  assert.equal(res.result.found,false);
});
test("Music Studio shows per-lesson Overwrite Lyrics, cloud load and undo in editor",()=>{
  const ui=readFileSync(new URL("../src/pages/MusicStudioPage.jsx",import.meta.url),"utf8");
  const service=readFileSync(new URL("../src/services/musicStudioService.js",import.meta.url),"utf8");
  assert.match(ui,/Overwrite Lyrics · Save permanently/);
  assert.match(ui,/loadSavedMusicLyrics\(assignmentKey\)/);
  assert.match(ui,/overwriteSavedMusicLyrics\(key, text\)/);
  assert.match(ui,/setLyrics\(draft.lyrics\)/);
  assert.match(service,/auth\.currentUser\.getIdToken/);
  assert.match(service,/BASE \+ '\/lyrics'/);
});
