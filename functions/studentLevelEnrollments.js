const crypto=require("node:crypto");
const levels=new Set(["A1","A2","B1","B2","C1","C2"]);
const fail=(message,statusCode=400)=>{throw Object.assign(new Error(message),{statusCode});};
function normalizeEnrollment(input={}){
 const program=String(input.program||"").toLowerCase(),level=String(input.level||"").toUpperCase();
 if(!["german","swahili"].includes(program)||!levels.has(level)) fail("Select a language and level");
 const raw=String(input.tuitionFee??"");
 if(!/^\d+(\.\d{1,2})?$/.test(raw)||!Number.isSafeInteger(Math.round(Number(raw)*100))) fail("Enter tuition fee");
 const tuitionFee=Number(raw);
 const contractStart=String(input.contractStart||""),contractEnd=String(input.contractEnd||""),paymentDeadline=String(input.paymentDeadline||"");
 for(const date of [contractStart,contractEnd,paymentDeadline]) if(date && (!/^\d{4}-\d{2}-\d{2}$/.test(date)||!Number.isFinite(Date.parse(date))||new Date(date).toISOString().slice(0,10)!==date)) fail("Invalid date");
 if(contractStart&&contractEnd&&contractEnd<contractStart) fail("Contract end precedes start");
 return {program,level,tuitionFee,contractStart,contractEnd,paymentDeadline,className:String(input.className||"").trim().slice(0,120)};
}
function registerStudentLevelEnrollments({app,db,admin,requireAuth,isEditor}){
 const route="/students/:studentId/level-enrollments";
 const authorize=async req=>{const user=await requireAuth(req);if(!isEditor(user))fail("Staff authorization required",403);return user;};
 const refs=req=>{const studentId=String(req.params.studentId||"");if(!studentId||studentId.includes("/"))fail("Invalid student");const student=db.collection("students").doc(studentId);return {studentId,student,collection:student.collection("levelEnrollments")};};
 const error=(res,e)=>res.status(e.statusCode||500).json({ok:false,error:e.message});
 app.get(route,async(req,res)=>{try{await authorize(req);const {student,collection}=refs(req);if(!(await student.get()).exists)fail("Student not found",404);const snap=await collection.get();return res.json({ok:true,enrollments:snap.docs.map(d=>({id:d.id,...d.data()}))});}catch(e){return error(res,e);}});
 app.post(route,async(req,res)=>{try{const user=await authorize(req);const {studentId,student,collection}=refs(req);const data=normalizeEnrollment(req.body);const id=data.program+"-"+data.level;const ref=collection.doc(id);
 const result=await db.runTransaction(async tx=>{const [parent,existing]=await Promise.all([tx.get(student),tx.get(ref)]);if(!parent.exists)fail("Student not found",404);if(existing.exists)fail("Level already exists",409);
 const enrollment={...data,studentId,studentCode:parent.data().studentCode||studentId,paid:0,balanceDue:data.tuitionFee,paymentStatus:data.tuitionFee?"Unpaid":"Paid",status:"planned",accountingMode:"independent_pending_integration"};
 const stamp=admin.firestore.FieldValue.serverTimestamp();tx.set(ref,{...enrollment,createdAt:stamp,createdBy:user.uid});tx.set(db.collection("auditLogs").doc(),{type:"student.levelEnrollmentCreated",studentId,enrollmentId:id,actorId:user.uid,createdAt:stamp});return {id,...enrollment};});return res.json({ok:true,enrollment:result});}catch(e){return error(res,e);}});
}
module.exports={normalizeEnrollment,registerStudentLevelEnrollments};
