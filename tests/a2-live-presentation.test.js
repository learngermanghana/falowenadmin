import test from "node:test";
import assert from "node:assert/strict";
import {createRequire} from "node:module";
import {readFileSync} from "node:fs";
import {A2_WORKBOOK_PRESENTATIONS} from "../src/data/a2WorkbookPresentations.js";
import {presentationPrompt,presentationContext} from "../src/utils/classPresentation.js";
const require=createRequire(import.meta.url);
const {teacherRole,studentInClass,validateOpen,validateResponse,registerClassPresentationRoutes}=require("../functions/classPresentationApi.js");

test("all 28 A2 workbook prompts are reused; restaurant and mock choices stay aligned",()=>{
 assert.equal(Object.keys(A2_WORKBOOK_PRESENTATIONS).length,28);
 for(const task of Object.values(A2_WORKBOOK_PRESENTATIONS)){
  const p=presentationPrompt(task);
  assert.ok(p.prompt);
  assert.ok(p.keywords.length||p.questions.length);
  assert.doesNotThrow(()=>validateOpen({...p,classId:"class123",sessionId:"session-1",sessionDate:"2026-11-25",assignmentId:"A2-1.1"}));
 }
 assert.equal(presentationPrompt(A2_WORKBOOK_PRESENTATIONS[8]).prompt,A2_WORKBOOK_PRESENTATIONS[8].presentationPractice.prompt);
 assert.notEqual(presentationPrompt(A2_WORKBOOK_PRESENTATIONS[22],0).choice,presentationPrompt(A2_WORKBOOK_PRESENTATIONS[22],1).choice);
 assert.equal(presentationContext("?classRecordId=abc&sessionId=session-1&sessionDate=2026-11-25","A2-4.10").classId,"abc");
 assert.equal(presentationContext("?classRecordId=abc","A2-4.10"),null);
});
test("student and staff identity checks reject unrelated class and staff without teaching access",()=>{
 const klass={id:"class123",name:"A2 Dortmund Klasse"};
 assert.equal(studentInClass({className:"A2 Dortmund Klasse"},klass),true);
 assert.equal(studentInClass({classId:"class123"},klass),true);
 assert.equal(studentInClass({className:"A2 Berlin Klasse"},klass),false);
 assert.equal(teacherRole({email:"staff@falowen.app",email_verified:false}),"");
 assert.equal(teacherRole({staff:true,staffLanguages:["swahili"]}),"");
 assert.equal(teacherRole({staff:true,staffPages:["marking"]}),"");
 assert.equal(teacherRole({staff:true,staffPages:["teaching-slides"]}),"staff");
 assert.throws(()=>validateResponse(" "));
 assert.throws(()=>validateResponse("x".repeat(3001)));
});
test("authenticated classroom responses are scoped to the session, editable and never expose other students",async()=>{
 const data=new Map([
  ["classes/class123",{name:"A2 Dortmund Klasse",level:"A2"}],
  ["students/one",{name:"One",classId:"class123"}],
  ["students/two",{name:"Two",classId:"class123"}],
  ["students/outsider",{name:"Other",classId:"other"}],
 ]);
 const users={teacher:{uid:"teacher",staff:true,staffPages:["teaching-slides"]},otherTeacher:{uid:"otherTeacher",staff:true},one:{uid:"one"},two:{uid:"two"},outsider:{uid:"outsider"}};
 const snap=p=>({id:p.split("/").at(-1),exists:data.has(p),data:()=>data.get(p)});
 const collection=p=>({doc:id=>ref(p+"/"+id),limit:()=>({get:async()=>({docs:[...data.keys()].filter(k=>k.startsWith(p+"/")&&k.split("/").length===p.split("/").length+1).map(snap)})})});
 const ref=p=>({path:p,get:async()=>snap(p),collection:name=>collection(p+"/"+name),set:async value=>{data.set(p,value);}});
 const db={collection,runTransaction:async cb=>cb({get:r=>r.get(),create:(r,v)=>data.set(r.path,v)})};
 const routes=new Map(),app={get:(p,h)=>routes.set("GET "+p,h),post:(p,h)=>routes.set("POST "+p,h)};
 const admin={auth:()=>({verifyIdToken:async token=>{if(!users[token])throw Error("invalid");return users[token];}})};
 registerClassPresentationRoutes({app,db,admin});
 async function call(method,path,token,body,id){
  let status=200,result;
  const res={set(){},status(n){status=n;return this;},json(value){result=value;}};
  await routes.get(method+" "+path)({headers:{authorization:token?"Bearer "+token:""},params:{id},body},res);
  return {status,...result};
 }
 const payload={classId:"class123",sessionId:"session-1",sessionDate:"2026-11-25",assignmentId:"A2-4.10",prompt:"Welche Stadt möchtest du kennenlernen?",keywords:["Stadt"],questions:["Warum?"]};
 const open=await call("POST","/class-presentation/open","teacher",payload);
 assert.equal(open.status,200);assert.equal(open.canEmail,false);
 const id=open.session.id;
 assert.equal((await call("POST","/class-presentation/open","teacher",payload)).session.id,id);
 assert.notEqual((await call("POST","/class-presentation/open","teacher",{...payload,sessionId:"session-2"})).session.id,id);
 assert.equal((await call("POST","/class-presentation/open","one",payload)).status,403);
 assert.equal((await call("GET","/class-presentation/student/:id","outsider",null,id)).status,403);
 assert.equal((await call("GET","/class-presentation/student/:id","",null,id)).status,401);
 await call("POST","/class-presentation/student/:id","one",{answer:"Ich möchte Berlin besuchen."},id);
 await call("POST","/class-presentation/student/:id","one",{answer:"Ich möchte Hamburg besuchen."},id);
 await call("POST","/class-presentation/student/:id","two",{answer:"Ich möchte Köln besuchen."},id);
 const own=await call("GET","/class-presentation/student/:id","one",null,id);
 assert.equal(own.answer,"Ich möchte Hamburg besuchen.");assert.equal(own.responses,undefined);
 assert.equal((await call("GET","/class-presentation/teacher/:id","one",null,id)).status,403);
 assert.equal((await call("GET","/class-presentation/teacher/:id","otherTeacher",null,id)).status,403);
 const list=await call("GET","/class-presentation/teacher/:id","teacher",null,id);
 assert.equal(list.responses.length,2);assert.ok(list.responses.every(r=>!r.email&&!r.uid));
});
test("presentation requests are explicit, no polling or grading writes",()=>{
 const ui=readFileSync(new URL("../src/components/A2LivePresentation.jsx",import.meta.url),"utf8");
 assert.match(ui,/QRCodeCanvas/);assert.match(ui,/Refresh answers/);assert.match(ui,/Copy Zoom link/);
 assert.doesNotMatch(ui,/setInterval|onSnapshot/);
 const backend=readFileSync(new URL("../functions/classPresentationApi.js",import.meta.url),"utf8");
 assert.doesNotMatch(backend,/collection\("(scores|submissions|classParticipationRecords)"\)/);
 assert.match(readFileSync(new URL("../functions/index.js",import.meta.url),"utf8"),/registerClassPresentationRoutes/);
});
