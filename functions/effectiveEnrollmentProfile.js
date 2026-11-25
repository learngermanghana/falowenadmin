"use strict";
const LEVELS=["A1","A2","B1","B2","C1","C2"];
const norm=v=>String(v||"").trim().toLowerCase();
const language=v=>norm(v||"german").replace(/^kiswahili$/,"swahili");
const date=v=>typeof v==="string"&&/^\d{4}-\d{2}-\d{2}$/.test(v)&&Number.isFinite(Date.parse(v))&&new Date(v).toISOString().slice(0,10)===v;
function activePaidRow(rows,program,today=new Date().toISOString().slice(0,10)){
 return rows.filter(r=>r.program===language(program)&&LEVELS.includes(r.level)&&["active","completed"].includes(r.status)&&date(r.contractStart)&&date(r.contractEnd)&&r.contractStart<=today&&r.contractEnd>=today&&[r.tuitionFee,r.paid,r.balanceDue].every(n=>typeof n==="number"&&Number.isFinite(n)&&n>=0)&&(r.paid>0||r.accessType==="complimentary"&&r.tuitionFee===0&&r.paid===0&&r.balanceDue===0)&&Math.abs(r.paid+r.balanceDue-r.tuitionFee)<0.011&&(r.balanceDue===0||(r.status==="active"&&date(r.paymentDeadline)&&r.paymentDeadline>=today))).sort((a,b)=>LEVELS.indexOf(b.level)-LEVELS.indexOf(a.level))[0]||null;
}
function effectiveEnrollmentPatch(student,rows,today){
 if(student.accountType==="exam_only"||["archived","inactive","deleted","withdrawn","suspended","blocked","purged"].includes(norm(student.status))||["admin","tutor","teacher","staff"].includes(norm(student.role)))return {};
 const primary=language(student.program||student.language),other=primary==="german"?"swahili":"german";
 const row=activePaidRow(rows,primary,today),secondary=activePaidRow(rows,other,today);
 const projection=r=>{
  const free=r.accessType==="complimentary"&&r.tuitionFee===0,paid=r.balanceDue===0;
  return {level:r.level,levelId:r.level,className:r.className||"",contractStart:r.contractStart,contractEnd:r.contractEnd,paymentDeadline:paid?"":r.paymentDeadline||"",tuitionFee:r.tuitionFee,paid:r.paid,balanceDue:r.balanceDue,balance:r.balanceDue,paymentStatus:free?"complimentary":paid?"paid":"partial",accessType:free?"complimentary":paid?"paid":"partial",effectiveEnrollmentId:r.id||r.program+"-"+r.level};
 };
 const patch={};
 // Existing un-migrated language placements and institutional invitations are preserved.
 if(row&&student.institutionVerification!=="pending"){
  Object.assign(patch,projection(row),{status:row.accessType==="complimentary"?"Active":row.balanceDue===0?"Paid":"Active"});
  if(student.className!==row.className||student.level!==row.level)for(const key of ["classId","classRecordId","assignedClassId","groupId"])if(student[key])patch[key]="";
  if(student.trialStatus||student.trialStartedAt||student.trialEndsAt||["trial_active","trial_expired"].includes(norm(student.status))){
   if(row.paid>0)Object.assign(patch,{trialStatus:"converted",trialRetentionStatus:"converted",trialPurgeAt:"",trialAccessBlockedAt:""});
  }
 }
 if(!row&&student.effectiveEnrollmentId&&rows.some(r=>r.program===primary)&&student.accessType!=="pending")patch.accessType="pending";
 if(secondary&&student.institutionVerification!=="pending"){
  const previous=student.coursePlacements?.[other]||{},next={...previous,...projection(secondary)};
  if(previous.className!==next.className||previous.level!==next.level)for(const key of ["classId","classRecordId","assignedClassId","groupId","cohortId"])delete next[key];
  if(student.secondaryProgram!==other)patch.secondaryProgram=other;
  if(JSON.stringify(previous)!==JSON.stringify(next))patch.coursePlacements={...student.coursePlacements,[other]:next};
 }
 // A managed secondary enrollment without a valid contract must not fall back to stale paid access.
 if(!secondary&&student.coursePlacements?.[other]?.effectiveEnrollmentId&&rows.some(r=>r.program===other)){
  const previous=student.coursePlacements[other];
  if(previous.accessType!=="pending")patch.coursePlacements={...student.coursePlacements,[other]:{...previous,accessType:"pending"}};
 }

 return Object.fromEntries(Object.entries(patch).filter(([k,v])=>student[k]!==v));
}
async function reconcileEnrollmentProfile({db,admin,studentId}){
 const ref=db.collection("students").doc(studentId);
 return db.runTransaction(async tx=>{
  const [parent,ledger]=await Promise.all([tx.get(ref),tx.get(ref.collection("levelEnrollments"))]);
  if(!parent.exists)return {};
  const student=parent.data(),patch=effectiveEnrollmentPatch(student,ledger.docs.map(d=>({...d.data(),id:d.id})));
  if(patch.trialStatus==="converted"&&!student.trialConvertedAt)patch.trialConvertedAt=admin.firestore.FieldValue.serverTimestamp();
  if(Object.keys(patch).length)tx.update(ref,patch);
  return patch;
 });
}
module.exports={activePaidRow,effectiveEnrollmentPatch,reconcileEnrollmentProfile};
