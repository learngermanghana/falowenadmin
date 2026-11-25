const crypto=require("node:crypto");
const {paymentLifecycle,payableStatus,isManagedUpgrade}=require("./levelUpgradeLifecycle");
const levels=new Set(["A1","A2","B1","B2","C1","C2"]);
const fail=(message,statusCode=400)=>{throw Object.assign(new Error(message),{statusCode});};
function normalizeEnrollment(input={}){
 const program=String(input.program||"").toLowerCase(),level=String(input.level||"").toUpperCase();
 if(!["german","swahili"].includes(program)||!levels.has(level)) fail("Select a language and level");
 const raw=String(input.tuitionFee??"").trim();
 const tuitionFee=raw===""?null:moneyCents(raw)/100;
 const contractStart=String(input.contractStart||""),contractEnd=String(input.contractEnd||""),paymentDeadline=String(input.paymentDeadline||"");
 for(const date of [contractStart,contractEnd,paymentDeadline]) if(date && (!/^\d{4}-\d{2}-\d{2}$/.test(date)||!Number.isFinite(Date.parse(date))||new Date(date).toISOString().slice(0,10)!==date)) fail("Invalid date");
 if(contractStart&&contractEnd&&contractEnd<contractStart) fail("Contract end precedes start");
 const accessType=String(input.accessType||"paid").toLowerCase();
 if(!["paid","complimentary"].includes(accessType))fail("Select paid or complimentary access");
 if(accessType==="complimentary"&&(tuitionFee!==0||!contractStart||!contractEnd))fail("Complimentary access requires zero tuition and explicit dates");
 return {program,level,tuitionFee,contractStart,contractEnd,paymentDeadline,accessType,className:String(input.className||"").trim().slice(0,120)};
}
function moneyCents(value){
 const raw=String(value??"").trim();
 if(!/^\d+(\.\d{1,2})?$/.test(raw)||!Number.isSafeInteger(Math.round(Number(raw)*100))) fail("Invalid amount");
 return Math.round(Number(raw)*100);
}
// Staff-entered historical totals are not new transactions or payment receipts.
function manualTotals(input){
 const paid=String(input.paid??"").trim()===""?0:moneyCents(input.paid);
 if(String(input.tuitionFee??"").trim()==="")return {tuitionFee:null,paid:paid/100,balanceDue:null,paymentStatus:paid?"Fee not set":"Unpaid"};
 const fee=moneyCents(input.tuitionFee);
 if(paid>fee)fail("Amount paid cannot exceed the fee. Enter the agreed fee for this level.");
 const balance=fee-paid;
 return {tuitionFee:fee/100,paid:paid/100,balanceDue:balance/100,paymentStatus:balance?(paid?"Partially Paid":"Unpaid"):"Paid"};
}
function paymentPatch(enrollment,amount,date){
 if(enrollment.accessType==="complimentary"||enrollment.status==="cancelled")fail("This enrollment does not accept payments",409);
 if(enrollment.tuitionFee==null||enrollment.balanceDue==null)fail("Set the tuition fee before recording a new payment",409);
 const fee=moneyCents(enrollment.tuitionFee),paid=moneyCents(enrollment.paid),balance=moneyCents(enrollment.balanceDue),credit=moneyCents(amount);
 if(paid+balance!==fee||!credit||credit>balance) fail("Payment exceeds remaining tuition or ledger requires review",409);
 const due=balance-credit;
 return {...(date?paymentLifecycle(enrollment,due/100,date):{}),paid:(paid+credit)/100,balanceDue:due/100,paymentStatus:due?"Partially Paid":"Paid",sheetVersion:Number(enrollment.sheetVersion||1)+1,sheetSyncStatus:"pending"};
}
function paymentDate(value){
 const date=String(value||"");
 if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||!Number.isFinite(Date.parse(date))||new Date(date).toISOString().slice(0,10)!==date||date>new Date().toISOString().slice(0,10)) fail("Enter actual payment date");
 return date;
}
function legacyOpeningEnrollment(student){
 const program=String(student.program||student.language||"").toLowerCase();
 const level=String(student.level||"").toUpperCase();
 if(!["german","swahili"].includes(program)||!levels.has(level)||student.upgradeId||student.upgradeStatus||student.upgradeFromLevel||student.upgradeToLevel||(student.paidLevel&&String(student.paidLevel).toUpperCase()!==level))fail("Historical or upgraded account needs level-by-level allocation",409);
 const fee=moneyCents(student.tuitionFee),paid=moneyCents(student.paid),balance=moneyCents(student.balanceDue??student.balance);
 if(fee<=0||paid+balance!==fee)fail("Legacy tuition does not reconcile; review payment history",409);
 const {isoDate}=require("./studentContractLifecycle");
 const data=normalizeEnrollment({program,level,tuitionFee:fee/100,className:student.className,contractStart:isoDate(student.contractStart),contractEnd:isoDate(student.contractEnd),paymentDeadline:isoDate(student.paymentDeadline)});
 return {...data,paid:paid/100,balanceDue:balance/100,paymentStatus:balance?(paid?"Partially Paid":"Unpaid"):"Paid",status:"planned",openingBalanceImported:true,accountingMode:"independent_pending_integration",sheetVersion:1,sheetSyncStatus:"pending"};
}
function legacyUpgradeEnrollment(student){
 const program=String(student.program||student.language||"").toLowerCase(),level=String(student.upgradeToLevel||"").toUpperCase();
 if(!student.upgradeId||!["awaiting_payment","pending","expired","completed"].includes(String(student.upgradeStatus||"").toLowerCase()))fail("No recorded upgrade to import",409);
 const fee=moneyCents(student.upgradeTuitionFee),paid=moneyCents(student.upgradePaid??0),balance=moneyCents(student.upgradeBalanceDue);
 if(fee<=0||paid+balance!==fee)fail("Upgrade ledger does not reconcile",409);
 const {isoDate}=require("./studentContractLifecycle");
 const data=normalizeEnrollment({program,level,tuitionFee:fee/100,className:student.upgradeTargetClassName||"",contractStart:isoDate(student.upgradeStartedAt),contractEnd:"",paymentDeadline:isoDate(student.upgradeGraceEnd)});
 return {...data,paid:paid/100,balanceDue:balance/100,paymentStatus:balance?(paid?"Partially Paid":"Unpaid"):"Paid",status:"planned",openingBalanceImported:paid>0,legacyUpgradeId:student.upgradeId,accountingMode:"independent_pending_integration",sheetVersion:1,sheetSyncStatus:"pending"};
}
function enrollmentStatus(value="planned"){
 const status=String(value||"planned").toLowerCase();
 if(!["planned","active","completed","expired","cancelled"].includes(status))fail("Invalid enrollment status");
 return status;
}
function contractPatch(record,input){
 const status=enrollmentStatus(input.status??record.status);
 const data=normalizeEnrollment({...record,contractStart:input.contractStart??record.contractStart,contractEnd:input.contractEnd??record.contractEnd,paymentDeadline:input.paymentDeadline??record.paymentDeadline,className:input.className??record.className,accessType:input.accessType??record.accessType});
 return {contractStart:data.contractStart,contractEnd:data.contractEnd,paymentDeadline:data.paymentDeadline,className:data.className,accessType:data.accessType,status,sheetVersion:Number(record.sheetVersion||1)+1,sheetSyncStatus:"pending"};
}

const legacyLanguage=v=>String(v||"").trim().toLowerCase().replace(/^kiswahili$/,"swahili");
function legacyMoney(v){
 if(v===undefined||v===null||String(v).trim()==="")return null;
 try{return moneyCents(String(v).replace(/,/g,""))/100;}catch{return null;}
}
function legacyCourseCandidates(student,rows=[]){
 if(student.accountType==="exam_only"||["archived","deleted","purged","withdrawn","suspended","blocked","inactive"].includes(String(student.status||"").toLowerCase()))return [];
 const primary=legacyLanguage(student.program||student.language||"german"),secondary=legacyLanguage(student.secondaryProgram);
 const {isoDate}=require("./studentContractLifecycle");
 return [[primary,student],[secondary,student.coursePlacements?.[secondary]]].filter(([p,s],i)=>s&&["german","swahili"].includes(p)&&(i===0||p!==primary)).flatMap(([program,s])=>{
  const level=String(s.level||s.levelId||"").toUpperCase(),id=program+"-"+level;
  if(!levels.has(level)||rows.some(r=>r.id===id||(r.program===program&&r.level===level)))return [];
  const paid=legacyMoney(s.paid),balance=legacyMoney(s.balanceDue??s.balance),fee=legacyMoney(s.tuitionFee);
  const tuitionFee=fee??(paid!==null&&balance!==null?Math.round((paid+balance)*100)/100:null);
  const reconciled=paid!==null&&balance!==null&&tuitionFee!==null&&Math.round((paid+balance)*100)===Math.round(tuitionFee*100);
  const protectedInstitution=Boolean(student.institutionId||student.institutionVerification||student.universityInvitationCode||s.institutionId||s.institutionVerification||s.universityInvitationCode);
  const upgrade=Boolean(student.upgradeId||student.upgradeFromLevel||student.upgradeToLevel||["awaiting_payment","pending","expired"].includes(String(student.upgradeStatus||"").toLowerCase())||(s.paidLevel&&String(s.paidLevel).toUpperCase()!==level));
  const status=String(s.status||"").toLowerCase();
  const explicitFree=s.accessType==="complimentary";
  const canFree=(paid===null||paid===0)&&(balance===null||balance===0)&&(tuitionFee===null||tuitionFee===0)&&!(paid===null&&["paid","partial","partially paid","partially_paid"].includes(String(s.paymentStatus||"").toLowerCase()));
  const record={id,program,level,className:String(s.className||s.classname||""),contractStart:isoDate(s.contractStart)||"",contractEnd:isoDate(s.contractEnd)||"",paymentDeadline:isoDate(s.paymentDeadline)||"",tuitionFee,paid,balanceDue:balance,accessType:explicitFree?"complimentary":"paid",paymentStatus:String(s.paymentStatus||""),canPaid:reconciled&&paid>0,canFree,blockedReason:protectedInstitution?"Institutional access must be managed through its approval workflow.":upgrade?"Historical upgrade payments need separate reconciliation before migration.":["blocked","suspended","cancelled","withdrawn","inactive"].includes(status)?"Inactive or blocked course requires review.":""};
  return [{...record,revision:crypto.createHash("sha256").update(JSON.stringify(record)).digest("hex")}];
 });
}
function legacyCourseRecord(candidate,input){
 if(!candidate||candidate.blockedReason)fail(candidate?.blockedReason||"Existing course not found or already managed",409);
 if(candidate.revision!==input.revision)fail("Existing course changed. Refresh and review before saving.",409);
 const accessType=input.accessType;
 if(accessType==="paid"&&!candidate.canPaid)fail("Existing paid totals do not reconcile. Verify the original course payments before importing.",409);
 if(accessType==="complimentary"&&(!candidate.canFree||input.confirmComplimentary!==true))fail("Confirm complimentary access without replacing existing tuition or payments.",409);
 if(!["paid","complimentary"].includes(accessType))fail("Select an access type");
 const free=accessType==="complimentary";
 const data=normalizeEnrollment({program:candidate.program,level:candidate.level,className:candidate.className,tuitionFee:free?0:candidate.tuitionFee,accessType,contractStart:input.contractStart,contractEnd:input.contractEnd,paymentDeadline:free?"":input.paymentDeadline});
 if(!data.contractStart||!data.contractEnd)fail("Enter explicit contract start and end dates");
 const totals=manualTotals({tuitionFee:data.tuitionFee,paid:free?0:candidate.paid});
 if(totals.balanceDue>0&&!data.paymentDeadline)fail("Set the existing payment deadline for outstanding tuition");
 const today=new Date().toISOString().slice(0,10);
 return {...data,...totals,paymentStatus:free?"Complimentary":totals.paymentStatus,status:data.contractEnd<today?"expired":"active",openingBalanceImported:totals.paid>0,manualOpeningPaid:totals.paid,accountingMode:"independent_pending_integration",sheetVersion:1,sheetSyncStatus:"pending",legacyCourseImported:true};
}

function registerStudentLevelEnrollments({app,db,admin,requireAuth,isEditor}){
 const route="/students/:studentId/level-enrollments";
 const authorize=async req=>{const user=await requireAuth(req);if(!isEditor(user))fail("Staff authorization required",403);return user;};
 const refs=req=>{const studentId=String(req.params.studentId||"");if(!studentId||studentId.includes("/"))fail("Invalid student");const student=db.collection("students").doc(studentId);return {studentId,student,collection:student.collection("levelEnrollments")};};
 const error=(res,e)=>res.status(e.statusCode||500).json({ok:false,error:e.message});
 app.post(route+"/reconcile-profile",async(req,res)=>{try{await authorize(req);const {studentId,student}=refs(req);await require("./effectiveEnrollmentProfile").reconcileEnrollmentProfile({db,admin,studentId});const snap=await student.get();if(!snap.exists)fail("Student not found",404);const p=snap.data();const keys=["level","className","contractStart","contractEnd","paymentDeadline","tuitionFee","paid","balanceDue","balance","paymentStatus","accessType","status","effectiveEnrollmentId","trialStatus","trialRetentionStatus","secondaryProgram","coursePlacements","levelId"];return res.json({ok:true,profile:Object.fromEntries(keys.filter(k=>p[k]!==undefined).map(k=>[k,p[k]]))});}catch(e){return error(res,e);}});
 app.get(route,async(req,res)=>{try{await authorize(req);const {student,collection}=refs(req);const parent=await student.get();if(!parent.exists)fail("Student not found",404);const snap=await collection.get();const enrollments=snap.docs.map(d=>({id:d.id,...d.data()}));return res.json({ok:true,enrollments,legacyCourses:legacyCourseCandidates(parent.data(),enrollments)});}catch(e){return error(res,e);}});
 app.post(route,async(req,res)=>{try{const user=await authorize(req);const {studentId,student,collection}=refs(req);const data=normalizeEnrollment(req.body);const totals=manualTotals(req.body||{});if(data.accessType==="complimentary"&&totals.paid!==0)fail("Complimentary access cannot contain payments");const id=data.program+"-"+data.level;const ref=collection.doc(id);
 const result=await db.runTransaction(async tx=>{const [parent,existing]=await Promise.all([tx.get(student),tx.get(ref)]);if(!parent.exists)fail("Student not found",404);if(existing.exists)fail("Level already exists",409);
 const enrollment={...data,studentId,studentCode:parent.data().studentCode||parent.data().studentcode||studentId,...totals,openingBalanceImported:totals.paid>0,manualOpeningPaid:totals.paid,status:enrollmentStatus(req.body?.status),accountingMode:"independent_pending_integration",sheetVersion:1,sheetSyncStatus:"pending"};
 const stamp=admin.firestore.FieldValue.serverTimestamp();tx.set(ref,{...enrollment,createdAt:stamp,createdBy:user.uid});tx.set(db.collection("auditLogs").doc(),{type:"student.levelEnrollmentCreated",studentId,enrollmentId:id,actorId:user.uid,openingTotals:totals,createdAt:stamp});return {id,...enrollment};});return res.json({ok:true,enrollment:result});}catch(e){return error(res,e);}});
 app.post(route+"/:enrollmentId/sync-sheet",async(req,res)=>{try{
 await authorize(req);const {studentId,collection}=refs(req);const ref=enrollmentRef(req,collection);const result=await require("./levelEnrollmentSheetSync").syncEnrollmentRef({ref,db,admin});
 if(result.status!=="synced")fail(result.error||"Enrollment not found",503);
 return res.json({ok:true});
 }catch(e){return error(res,e);}});

 app.post(route+"/edit-existing-course",async(req,res)=>{try{
 const user=await authorize(req);
 if(user.email_verified!==true||String(user.email||"").toLowerCase()!=="moxflex@gmail.com")fail("Verified owner access required for legacy contract migration",403);
 const {studentId,student,collection}=refs(req);const input=req.body||{};
 const result=await db.runTransaction(async tx=>{
  const [parent,ledger]=await Promise.all([tx.get(student),tx.get(collection)]);
  if(!parent.exists)fail("Student not found",404);
  const current=legacyCourseCandidates(parent.data(),ledger.docs.map(d=>({id:d.id,...d.data()}))).find(r=>r.id===input.id);
  const data=legacyCourseRecord(current,input);const ref=collection.doc(current.id);
  const enrollment={...data,studentId,studentCode:parent.data().studentCode||parent.data().studentcode||studentId};
  const stamp=admin.firestore.FieldValue.serverTimestamp();
  tx.set(ref,{...enrollment,createdAt:stamp,createdBy:user.uid});
  // Keep legacy readers current even when the selected contract is expired/future
  // or the account is staff. Never touch the other language or class IDs.
  const previous=parent.data(),primary=legacyLanguage(previous.program||previous.language||"german");
  const projected={contractStart:data.contractStart,contractEnd:data.contractEnd,paymentDeadline:data.paymentDeadline,tuitionFee:data.tuitionFee,paid:data.paid,balanceDue:data.balanceDue,balance:data.balanceDue,paymentStatus:data.accessType==="complimentary"?"complimentary":data.balanceDue===0?"paid":"partial",accessType:data.accessType,effectiveEnrollmentId:ref.id};
  if(current.program===primary)tx.update(student,projected);
  else tx.update(student,{coursePlacements:{...previous.coursePlacements,[current.program]:{...previous.coursePlacements?.[current.program],...projected}}});
  tx.set(db.collection("auditLogs").doc(),{type:"student.existingCourseImported",studentId,enrollmentId:ref.id,actorId:user.uid,before:{contractStart:current.contractStart,contractEnd:current.contractEnd,paid:current.paid,balanceDue:current.balanceDue,accessType:current.accessType},after:enrollment,createdAt:stamp});
  return {id:ref.id,...enrollment};
 });
 return res.json({ok:true,enrollment:result});
 }catch(e){return error(res,e);}});
 app.post(route+"/import-legacy",async(req,res)=>{try{
 const user=await authorize(req);const {studentId,student,collection}=refs(req);
 const result=await db.runTransaction(async tx=>{
 const parent=await tx.get(student);if(!parent.exists)fail("Student not found",404);
 const importingUpgrade=req.body?.kind==="upgrade";
 const data=importingUpgrade?legacyUpgradeEnrollment(parent.data()):legacyOpeningEnrollment(parent.data());const id=data.program+"-"+data.level;
 const existing=await tx.get(collection);if(!importingUpgrade&&!existing.empty)fail("Import only before creating independent records",409);
 if(existing.docs.some(doc=>doc.id===id))fail("Level already exists",409);
 const ref=collection.doc(id),record={...data,studentId,studentCode:parent.data().studentCode||studentId};
 const stamp=admin.firestore.FieldValue.serverTimestamp();
 tx.set(ref,{...record,createdAt:stamp,createdBy:user.uid});tx.set(db.collection("auditLogs").doc(),{type:"student.levelOpeningBalanceImported",studentId,enrollmentId:id,actorId:user.uid,openingPaid:data.paid,openingBalance:data.balanceDue,createdAt:stamp});return {id,...record};
 });return res.json({ok:true,enrollment:result});
 }catch(e){return error(res,e);}});
 app.post(route+"/:enrollmentId/contract",async(req,res)=>{try{
 const user=await authorize(req);const {studentId,collection}=refs(req);const ref=enrollmentRef(req,collection);
 const result=await db.runTransaction(async tx=>{const snap=await tx.get(ref);if(!snap.exists)fail("Enrollment not found",404);
 const record=snap.data(),input=req.body||{},stamp=admin.firestore.FieldValue.serverTimestamp();
 const hasTotals=input.tuitionFee!==undefined||input.paid!==undefined;
 const totals=hasTotals?manualTotals({tuitionFee:input.tuitionFee===undefined?record.tuitionFee:input.tuitionFee,paid:input.paid===undefined?record.paid:input.paid}):{};
 const changed=hasTotals&&(totals.tuitionFee!==record.tuitionFee||totals.paid!==record.paid);
 const patch={...contractPatch({...record,...totals},input),...totals,...(changed?{openingBalanceImported:record.openingBalanceImported===true||totals.paid>0,manualTotalsAdjustedAt:stamp,manualTotalsAdjustedBy:user.uid}:{})};
 if(patch.accessType==="complimentary"&&(Number(record.paid)>0||Number(patch.paid??record.paid)!==0||Number(patch.tuitionFee??record.tuitionFee)!==0))fail("Paid enrollment history cannot be replaced by complimentary access");
 tx.update(ref,{...patch,updatedAt:stamp});tx.set(db.collection("auditLogs").doc(),{type:changed?"student.levelTotalsAdjusted":"student.levelContractUpdated",studentId,enrollmentId:ref.id,actorId:user.uid,before:{tuitionFee:record.tuitionFee,paid:record.paid,balanceDue:record.balanceDue},after:patch,createdAt:stamp});return {id:ref.id,...record,...patch};});
 return res.json({ok:true,enrollment:result});
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
 if(existing.exists&&enrollment.data().openingBalanceImported)fail("Historical credit may already be in the opening balance; review before allocating",409);
 if(existing.exists&&(data.studentId!==studentId||String(data.status).toLowerCase()!=="paid"||data.manualUpgradeAllocation||data.levelEnrollmentAllocation||data.purpose!=="balance"))fail("Payment is not an eligible unallocated balance payment",409);
 if(!existing.exists&&(method==="paystack"||/^FAL-/i.test(raw)))fail("Existing Paystack payment not found",404);
 const credit=existing.exists?moneyCents(data.tuitionCredit)/100:moneyCents(amount)/100;
 const date=paymentDate(existing.exists?(typeof data.paidAt?.toDate==="function"?data.paidAt.toDate().toISOString().slice(0,10):String(data.paidAt||"").slice(0,10)):receivedDate);
 const patch=paymentPatch(enrollment.data(),credit,date);
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
module.exports={legacyCourseCandidates,legacyCourseRecord,normalizeEnrollment,manualTotals,enrollmentStatus,paymentPatch,paymentDate,legacyOpeningEnrollment,legacyUpgradeEnrollment,contractPatch,registerStudentLevelEnrollments};

function registerEnrollmentCheckout({app,db,admin,requirePaymentAdmin,initializePaystackPayment,calculateStudentCheckoutAmount,createPaymentReference}){
 app.post("/payments/enrollment-link",async(req,res)=>{try{
 const user=await requirePaymentAdmin(req);
 const {studentId,enrollmentId,amount}=req.body||{};
 if(typeof studentId!=="string"||!studentId||studentId.includes("/")||! /^(german|swahili)-(A1|A2|B1|B2|C1|C2)$/.test(enrollmentId||""))fail("Select an enrollment");
 const parent=db.collection("students").doc(studentId),ref=parent.collection("levelEnrollments").doc(enrollmentId);
 const [student,enrollment]=await Promise.all([parent.get(),ref.get()]);
 if(!student.exists||!enrollment.exists)fail("Enrollment not found",404);
 const credit=moneyCents(amount)/100;if(isManagedUpgrade(enrollment.data())&&!payableStatus(enrollment.data()))fail("Upgrade is not payable",409);paymentPatch(enrollment.data(),credit);
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
 try{if(!student.exists||!enrollment.exists)fail("Enrollment unavailable",409);patch=paymentPatch(enrollment.data(),amount,date);}catch(e){
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
