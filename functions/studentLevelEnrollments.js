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
function moneyCents(value){
 const raw=String(value??"").trim();
 if(!/^\d+(\.\d{1,2})?$/.test(raw)||!Number.isSafeInteger(Math.round(Number(raw)*100))) fail("Invalid amount");
 return Math.round(Number(raw)*100);
}
function paymentPatch(enrollment,amount){
 const fee=moneyCents(enrollment.tuitionFee),paid=moneyCents(enrollment.paid),balance=moneyCents(enrollment.balanceDue),credit=moneyCents(amount);
 if(paid+balance!==fee||!credit||credit>balance) fail("Payment exceeds remaining tuition or ledger requires review",409);
 const due=balance-credit;
 return {paid:(paid+credit)/100,balanceDue:due/100,paymentStatus:due?"Partially Paid":"Paid",sheetVersion:Number(enrollment.sheetVersion||1)+1,sheetSyncStatus:"pending"};
}
function paymentDate(value){
 const date=String(value||"");
 if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||!Number.isFinite(Date.parse(date))||new Date(date).toISOString().slice(0,10)!==date||date>new Date().toISOString().slice(0,10)) fail("Enter actual payment date");
 return date;
}
function registerStudentLevelEnrollments({app,db,admin,requireAuth,isEditor}){
 const route="/students/:studentId/level-enrollments";
 const authorize=async req=>{const user=await requireAuth(req);if(!isEditor(user))fail("Staff authorization required",403);return user;};
 const refs=req=>{const studentId=String(req.params.studentId||"");if(!studentId||studentId.includes("/"))fail("Invalid student");const student=db.collection("students").doc(studentId);return {studentId,student,collection:student.collection("levelEnrollments")};};
 const error=(res,e)=>res.status(e.statusCode||500).json({ok:false,error:e.message});
 app.get(route,async(req,res)=>{try{await authorize(req);const {student,collection}=refs(req);if(!(await student.get()).exists)fail("Student not found",404);const snap=await collection.get();return res.json({ok:true,enrollments:snap.docs.map(d=>({id:d.id,...d.data()}))});}catch(e){return error(res,e);}});
 app.post(route,async(req,res)=>{try{const user=await authorize(req);const {studentId,student,collection}=refs(req);const data=normalizeEnrollment(req.body);const id=data.program+"-"+data.level;const ref=collection.doc(id);
 const result=await db.runTransaction(async tx=>{const [parent,existing]=await Promise.all([tx.get(student),tx.get(ref)]);if(!parent.exists)fail("Student not found",404);if(existing.exists)fail("Level already exists",409);
 const enrollment={...data,studentId,studentCode:parent.data().studentCode||studentId,paid:0,balanceDue:data.tuitionFee,paymentStatus:data.tuitionFee?"Unpaid":"Paid",status:"planned",accountingMode:"independent_pending_integration",sheetVersion:1,sheetSyncStatus:"pending"};
 const stamp=admin.firestore.FieldValue.serverTimestamp();tx.set(ref,{...enrollment,createdAt:stamp,createdBy:user.uid});tx.set(db.collection("auditLogs").doc(),{type:"student.levelEnrollmentCreated",studentId,enrollmentId:id,actorId:user.uid,createdAt:stamp});return {id,...enrollment};});return res.json({ok:true,enrollment:result});}catch(e){return error(res,e);}});
 app.post(route+"/:enrollmentId/sync-sheet",async(req,res)=>{try{
 await authorize(req);const {studentId,collection}=refs(req);const ref=enrollmentRef(req,collection);const snap=await ref.get();if(!snap.exists)fail("Enrollment not found",404);
 const record=snap.data();
 await require("./levelEnrollmentSheetSync").syncEnrollmentSheet({id:ref.id,studentId,record,url:process.env.LEVEL_ENROLLMENT_SYNC_URL,secret:process.env.LEVEL_ENROLLMENT_SYNC_SECRET});
 await db.runTransaction(async tx=>{const current=await tx.get(ref);if(current.exists&&current.data().sheetVersion===record.sheetVersion)tx.update(ref,{sheetSyncStatus:"synced",sheetSyncedAt:admin.firestore.FieldValue.serverTimestamp()});});
 return res.json({ok:true});
 }catch(e){return error(res,e);}});
 const paymentRoute=route+"/:enrollmentId/payments";
 const enrollmentRef=(req,collection)=>{const id=String(req.params.enrollmentId||"");if(!/^(german|swahili)-(A1|A2|B1|B2|C1|C2)$/.test(id))fail("Invalid enrollment");return collection.doc(id);};
 app.get(paymentRoute,async(req,res)=>{try{await authorize(req);const {collection}=refs(req);const ref=enrollmentRef(req,collection);if(!(await ref.get()).exists)fail("Enrollment not found",404);const snap=await ref.collection("payments").get();return res.json({ok:true,payments:snap.docs.map(d=>({id:d.id,...d.data()}))});}catch(e){return error(res,e);}});
 app.post(paymentRoute,async(req,res)=>{try{
 const user=await authorize(req);const {studentId,student,collection}=refs(req);const ref=enrollmentRef(req,collection);
 const {method,reference,amount,receivedDate}=req.body||{};
 const raw=String(reference||"").trim();if(!["momo","bank","cash","paystack"].includes(method)||raw.length<3||raw.length>150||raw.includes("/"))fail("Enter a valid payment method and reference");
 const key=crypto.createHash("sha256").update(raw.toLowerCase().replace(/\s+/g,"")).digest("hex");
 const unique=db.collection("levelPaymentReferences").doc(key);
 const oldManual=db.collection("manualUpgradePayments").doc(key);
 const oldMethodManual=db.collection("manualUpgradePayments").doc(crypto.createHash("sha256").update(method+":"+raw.toLowerCase().replace(/\s+/g,"")).digest("hex"));
 const source=db.collection("payments").doc(raw);
 const result=await db.runTransaction(async tx=>{
 const [parent,enrollment,duplicate,old,oldMethod,existing]=await Promise.all([tx.get(student),tx.get(ref),tx.get(unique),tx.get(oldManual),tx.get(oldMethodManual),tx.get(source)]);
 if(!parent.exists||!enrollment.exists)fail("Enrollment not found",404);
 if(duplicate.exists||old.exists||oldMethod.exists)fail("Payment reference already allocated",409);
 const data=existing.data()||{};
 if(existing.exists&&(data.studentId!==studentId||String(data.status).toLowerCase()!=="paid"||data.manualUpgradeAllocation||data.levelEnrollmentAllocation||data.purpose!=="balance"))fail("Payment is not an eligible unallocated balance payment",409);
 if(!existing.exists&&(method==="paystack"||/^FAL-/i.test(raw)))fail("Existing Paystack payment not found",404);
 const credit=existing.exists?moneyCents(data.tuitionCredit)/100:moneyCents(amount)/100;
 const date=paymentDate(existing.exists?(typeof data.paidAt?.toDate==="function"?data.paidAt.toDate().toISOString().slice(0,10):String(data.paidAt||"").slice(0,10)):receivedDate);
 const patch=paymentPatch(enrollment.data(),credit);
 const stamp=admin.firestore.FieldValue.serverTimestamp();
 const payment={studentId,enrollmentId:ref.id,reference:raw,amount:credit,receivedDate:date,method:existing.exists?"paystack":method,source:existing.exists?"legacy_payment":"manual",createdBy:user.uid};
 tx.set(unique,{...payment,createdAt:stamp});tx.set(ref.collection("payments").doc(key),{...payment,createdAt:stamp});
 if(existing.exists)tx.update(source,{levelEnrollmentAllocation:ref.id});
 tx.update(ref,{...patch,updatedAt:stamp});
 tx.set(db.collection("auditLogs").doc(),{...payment,type:"student.levelPaymentRecorded",before:{paid:enrollment.data().paid,balanceDue:enrollment.data().balanceDue},after:patch,createdAt:stamp});
 return {payment:{id:key,...payment},enrollment:{id:ref.id,...enrollment.data(),...patch}};
 });return res.json({ok:true,...result});
 }catch(e){return error(res,e);}});

}
module.exports={normalizeEnrollment,paymentPatch,paymentDate,registerStudentLevelEnrollments};

function registerEnrollmentCheckout({app,db,admin,requirePaymentAdmin,initializePaystackPayment,calculateStudentCheckoutAmount,createPaymentReference}){
 app.post("/payments/enrollment-link",async(req,res)=>{try{
 const user=await requirePaymentAdmin(req);
 const {studentId,enrollmentId,amount}=req.body||{};
 if(typeof studentId!=="string"||!studentId||studentId.includes("/")||! /^(german|swahili)-(A1|A2|B1|B2|C1|C2)$/.test(enrollmentId||""))fail("Select an enrollment");
 const parent=db.collection("students").doc(studentId),ref=parent.collection("levelEnrollments").doc(enrollmentId);
 const [student,enrollment]=await Promise.all([parent.get(),ref.get()]);
 if(!student.exists||!enrollment.exists)fail("Enrollment not found",404);
 const credit=moneyCents(amount)/100;paymentPatch(enrollment.data(),credit);
 const email=String(req.body.email||student.data().email||"").trim();if(!email.includes("@"))fail("Student email required");
 const reference=createPaymentReference(studentId),checkoutAmount=calculateStudentCheckoutAmount(credit);
 const metadata={studentId,enrollmentId,purpose:"level_enrollment",tuitionCredit:credit};
 const payment={...metadata,reference,email,provider:"Paystack",currency:"GHS",checkoutAmount,status:"pending",createdBy:user.uid,createdAt:admin.firestore.FieldValue.serverTimestamp()};
 const paymentRef=db.collection("payments").doc(reference);
 await paymentRef.create(payment);
 const gateway=await initializePaystackPayment({email,checkoutAmount,reference,metadata});
 await paymentRef.update({authorizationUrl:gateway.authorization_url,accessCode:gateway.access_code||""});
 return res.json({ok:true,payment:{reference,authorizationUrl:gateway.authorization_url,tuitionCredit:credit,checkoutAmount}});
 }catch(e){return res.status(e.statusCode||500).json({ok:false,error:e.message});}});
}
async function applyEnrollmentCheckout({transaction:tx,paymentRef,payment,eventData,db,admin}){
 const {studentId,enrollmentId,reference}=payment;
 if(String(payment.status).toLowerCase()==="paid"||payment.status==="paid_unallocated")return {duplicate:true,studentId,reference};
 if(eventData.status!=="success"||eventData.currency!=="GHS"||Number(eventData.amount)!==moneyCents(payment.checkoutAmount))fail("Paystack verification mismatch");
 const parent=db.collection("students").doc(studentId),ref=parent.collection("levelEnrollments").doc(enrollmentId);
 const key=crypto.createHash("sha256").update(reference.toLowerCase()).digest("hex"),unique=db.collection("levelPaymentReferences").doc(key);
 const [student,enrollment,duplicate]=await Promise.all([tx.get(parent),tx.get(ref),tx.get(unique)]);
 if(duplicate.exists)fail("Reference already allocated",409);
 const stamp=admin.firestore.FieldValue.serverTimestamp(),date=paymentDate(String(eventData.paid_at||eventData.paidAt||new Date().toISOString()).slice(0,10));
 const amount=moneyCents(payment.tuitionCredit)/100;
 const record={studentId,enrollmentId,reference,amount,receivedDate:date,method:"paystack",source:"enrollment_checkout"};
 let patch;
 try{if(!student.exists||!enrollment.exists)fail("Enrollment unavailable",409);patch=paymentPatch(enrollment.data(),amount);}catch(e){
 tx.update(paymentRef,{status:"paid_unallocated",allocationError:e.message,paidAt:stamp,paystackTransactionId:eventData.id||null});
 tx.set(db.collection("auditLogs").doc(),{...record,type:"student.levelPaymentNeedsAllocation",reason:e.message,createdAt:stamp});
 return {duplicate:false,studentId,reference,requiresAllocation:true};
 }
 tx.set(unique,{...record,createdAt:stamp});tx.set(ref.collection("payments").doc(key),{...record,createdAt:stamp});
 tx.update(ref,{...patch,updatedAt:stamp});tx.update(paymentRef,{status:"paid",paidAt:stamp,levelEnrollmentAllocation:enrollmentId,paystackTransactionId:eventData.id||null});
 tx.set(db.collection("auditLogs").doc(),{...record,type:"student.levelPaymentRecorded",after:patch,createdAt:stamp});
 return {duplicate:false,studentId,reference,nextBalance:patch.balanceDue,paymentStatus:patch.paymentStatus};
}
module.exports.registerEnrollmentCheckout=registerEnrollmentCheckout;
module.exports.applyEnrollmentCheckout=applyEnrollmentCheckout;
