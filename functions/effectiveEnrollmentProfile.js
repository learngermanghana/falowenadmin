"use strict";
const LEVELS=["A1","A2","B1","B2","C1","C2"];
const norm=v=>String(v||"").trim().toLowerCase();
const language=v=>norm(v||"german").replace(/^kiswahili$/,"swahili");
const date=v=>typeof v==="string"&&/^\d{4}-\d{2}-\d{2}$/.test(v)&&Number.isFinite(Date.parse(v))&&new Date(v).toISOString().slice(0,10)===v;
function activePaidRow(rows,program,today=new Date().toISOString().slice(0,10)){
 return rows.filter(r=>r.program===language(program)&&LEVELS.includes(r.level)&&["active","completed"].includes(r.status)&&date(r.contractStart)&&date(r.contractEnd)&&r.contractStart<=today&&r.contractEnd>=today&&[r.tuitionFee,r.paid,r.balanceDue].every(n=>typeof n==="number"&&Number.isFinite(n)&&n>=0)&&r.paid>0&&Math.abs(r.paid+r.balanceDue-r.tuitionFee)<0.011&&(r.balanceDue===0||(r.status==="active"&&date(r.paymentDeadline)&&r.paymentDeadline>=today))).sort((a,b)=>LEVELS.indexOf(b.level)-LEVELS.indexOf(a.level))[0]||null;
}
function effectiveEnrollmentPatch(student,rows,today){
 if(student.accountType==="exam_only"||["archived","inactive","deleted","withdrawn","suspended","blocked","purged"].includes(norm(student.status))||["admin","tutor","teacher","staff"].includes(norm(student.role)))return {};
 const row=activePaidRow(rows,student.program||student.language,today);
 if(!row)return {};
 const paid=row.balanceDue===0;
 // Compatibility fields mirror the current valid primary level, never a sum of historical payments.
 const patch={level:row.level,className:row.className||"",contractStart:row.contractStart,contractEnd:row.contractEnd,paymentDeadline:paid?"":row.paymentDeadline||"",tuitionFee:row.tuitionFee,paid:row.paid,balanceDue:row.balanceDue,balance:row.balanceDue,paymentStatus:paid?"paid":"partial",accessType:paid?"paid":"partial",status:paid?"Paid":"Active",effectiveEnrollmentId:row.id||row.program+"-"+row.level};
 if(student.trialStatus||student.trialStartedAt||student.trialEndsAt||["trial_active","trial_expired"].includes(norm(student.status))){patch.trialStatus="converted";patch.trialRetentionStatus="converted";patch.trialPurgeAt="";patch.trialAccessBlockedAt="";}
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
