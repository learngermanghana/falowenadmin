"use strict";
const {isoDate}=require("./studentContractLifecycle");
const {activePaidRow}=require("./effectiveEnrollmentProfile");
const {hasExamLedgerProtection,hasOtherCourseProtection}=require("./enrollmentCleanupProtection");
const DAY=86400000;
const norm=v=>String(v||"").trim().toLowerCase();
const day=v=>typeof v==="string"&&/^\d{4}-\d{2}-\d{2}$/.test(v)&&isoDate(v)===v?v:"";
const money=v=>v!==null&&v!==undefined&&String(v).trim()!==""&&Number.isFinite(Number(v))&&Number(v)>=0?Math.round(Number(v)*100):null;
const partial=r=>money(r.paid)>0&&money(r.balanceDue??r.balance)>0&&money(r.tuitionFee)===money(r.paid)+money(r.balanceDue??r.balance)&&r.accessType!=="complimentary";
const datePlus=(d,n)=>new Date(Date.parse(d)+n*DAY).toISOString().slice(0,10);
function recoveryDates(r){
 const start=day(r.contractStart),end=day(r.contractEnd),deadline=day(r.paymentDeadline);
 if(!partial(r)||!start||!end||!deadline||end<start||deadline<start)return null;
 const lastAccess=end<deadline?end:deadline,anchor=end>deadline?end:deadline;
 return {lastAccess,recoveryEnd:datePlus(anchor,30),terminateOn:datePlus(anchor,31)};
}
function phase(r,today){
 const dates=recoveryDates(r);
 if(!dates||!["active","expired"].includes(norm(r.status)))return "";
 return today>=dates.terminateOn?"terminate":today>dates.lastAccess?"recovery":"active";
}
function rootCandidate(student,today){
 if(student.partialTuitionTermination?.state==="pending_purge")return true;
 if(["admin","staff","teacher","tutor"].includes(norm(student.role))||["archived","deleted","purged","withdrawn","suspended","blocked","inactive"].includes(norm(student.status))||student.accountType==="exam_only")return false;
 const root={...student,contractStart:isoDate(student.contractStart),contractEnd:isoDate(student.contractEnd),paymentDeadline:isoDate(student.paymentDeadline),status:"active"};
 const state=phase(root,today),dates=recoveryDates(root);
 if(!student.effectiveEnrollmentId||student.partialTuitionClosedEnrollmentId===student.effectiveEnrollmentId)return false;
 // Do not repeatedly occupy the daily batch for already-suspended students.
 return state==="terminate"||(state==="recovery"&&student.partialTuitionRecoveryEnd!==dates.recoveryEnd);
}
function matchesRoot(student,row){
 return student.effectiveEnrollmentId===row.id&&norm(student.program||student.language||"german").replace(/^kiswahili$/,"swahili")===row.program&&String(student.level||"").toUpperCase()===row.level&&
 ["paid","tuitionFee"].every(k=>money(student[k])===money(row[k]))&&money(student.balanceDue??student.balance)===money(row.balanceDue)&&
 ["contractStart","contractEnd","paymentDeadline"].every(k=>isoDate(student[k])===row[k]);
}
function otherCourseRisk(student,rows,target,today){
 if(hasOtherCourseProtection(student)||student.institutionId||student.institutionVerification||student.upgradeId||student.upgradeStatus)return true;
 return rows.some(r=>r.id!==target.id&&(
   activePaidRow([r],r.program,today)||!["completed","expired","cancelled"].includes(norm(r.status))||
   !day(r.contractEnd)||r.contractEnd>=today||money(r.balanceDue)!==0
 ));
}
const unresolved=p=>["pending","initializing","processing","paid_unallocated","paid_needs_review"].includes(norm(p.status));
async function paymentRisk(db,studentId,student,tx){
 const read=q=>tx?tx.get(q):q.get();
 const checks=[read(db.collection("payments").where("studentId","==",studentId))];
 if(student.organisationSubmissionId)checks.push(read(db.collection("payments").where("organisationSubmissionId","==",student.organisationSubmissionId)));
 const snaps=await Promise.all(checks);
 return snaps.some((s,i)=>s.docs.some(d=>{const p=d.data();return unresolved(p)&&(i===0||p.lines?.some(l=>l.studentId===studentId));}));
}
async function advancePartialTuition({db,admin,ref,today}){
 const stamp=()=>admin.firestore.FieldValue.serverTimestamp();
 return db.runTransaction(async tx=>{
  const [parent,ledger]=await Promise.all([tx.get(ref),tx.get(ref.collection("levelEnrollments"))]);
  if(!parent.exists)return {skipped:"missing"};
  const student=parent.data(),rows=ledger.docs.map(d=>({id:d.id,...d.data()}));
  if(student.partialTuitionTermination?.state==="pending_purge")return {purge:true};
  if(!rootCandidate(student,today))return {skipped:"not_due"};
  const target=rows.find(r=>r.id===student.effectiveEnrollmentId);
  if(!target||!matchesRoot(student,target))return {skipped:"ledger_mismatch"};
  if(require("./levelUpgradeLifecycle").isManagedUpgrade(target))return {skipped:"upgrade_has_independent_lifecycle"};
  const state=phase(target,today),dates=recoveryDates(target);
  if(state==="recovery"){
   if(target.status==="expired"){tx.update(ref,{partialTuitionRecoveryEnd:dates.recoveryEnd});return {skipped:"already_in_recovery"};}
   tx.update(ref.collection("levelEnrollments").doc(target.id),{status:"expired",partialTuitionRecoveryEnd:dates.recoveryEnd,sheetVersion:Number(target.sheetVersion||1)+1,sheetSyncStatus:"pending",updatedAt:stamp()});
   tx.update(ref,{partialTuitionRecoveryEnd:dates.recoveryEnd});
   return {recovery:true};
  }
  if(state!=="terminate")return {skipped:"not_due"};
  if(await paymentRisk(db,ref.id,student,tx))return {skipped:"unresolved_payment"};
  // Preserve the original financial record; cancellation is not a refund or a zero-paid reset.
  const rowRef=ref.collection("levelEnrollments").doc(target.id);
  const protectedAccount=otherCourseRisk(student,rows,target,today)||await hasExamLedgerProtection(ref,student);
  const archivedRows=protectedAccount?[target]:rows;
  const archives=await Promise.all(archivedRows.map(async r=>{const a=db.collection("terminatedLevelEnrollments").doc(ref.id+"_"+r.id);const [snapshot,financial]=await Promise.all([tx.get(a),tx.get(ref.collection("levelEnrollments").doc(r.id).collection("payments"))]);return {r,a,snapshot,financial};}));
  for(const {r,a,snapshot,financial} of archives){
   if(snapshot.exists)continue;
   tx.create(a,{studentId:ref.id,studentCode:student.studentCode||student.studentcode||ref.id,studentName:student.name||student.fullName||"",email:student.email||"",organisationSubmissionId:student.organisationSubmissionId||"",enrollment:r,forfeitedAmount:r.id===target.id?target.paid:0,uncollectableBalance:r.id===target.id?target.balanceDue:0,transferableCredit:0,...dates,terminatedAt:stamp()});
   financial.docs.forEach(d=>tx.create(a.collection("payments").doc(d.id),d.data()));
  }
  tx.update(rowRef,{status:"cancelled",paymentStatus:"Forfeited",terminationReason:"partial_tuition_recovery_expired",terminatedAt:stamp(),forfeitedAmount:target.paid,transferableCredit:0,partialTuitionRecoveryEnd:dates.recoveryEnd,sheetVersion:Number(target.sheetVersion||1)+1,sheetSyncStatus:"pending",updatedAt:stamp()});
  if(!protectedAccount)tx.update(ref,{status:"archived",accessType:"pending",partialTuitionTermination:{state:"pending_purge",enrollmentId:target.id,recoveryEnd:dates.recoveryEnd,terminateOn:dates.terminateOn},updatedAt:stamp()});
  else tx.update(ref,{partialTuitionClosedEnrollmentId:target.id,updatedAt:stamp()});
  return {terminated:true,purge:!protectedAccount,protectedAccount};
 });
}
async function readTerminatedCandidate(ref,db,today){
 const snap=await ref.get();if(!snap.exists)return null;
 const student=snap.data(),mark=student.partialTuitionTermination;
 if(mark?.state!=="pending_purge"||mark.terminateOn>today||norm(student.status)!=="archived"||["admin","staff","teacher","tutor"].includes(norm(student.role)))return null;
 const ledger=await ref.collection("levelEnrollments").get(),rows=ledger.docs.map(d=>({id:d.id,...d.data()})),target=rows.find(r=>r.id===mark.enrollmentId);
 if(!target||target.status!=="cancelled"||target.terminationReason!=="partial_tuition_recovery_expired"||!matchesRoot(student,target)||otherCourseRisk(student,rows,target,today)||await hasExamLedgerProtection(ref,student)||await paymentRisk(db,ref.id,student))return null;
 const archive=await db.collection("terminatedLevelEnrollments").doc(ref.id+"_"+target.id).get();
 if(!archive.exists)return null;
 // Acknowledged level sheet sync is mandatory before deleting its source.
 if(target.sheetSyncStatus!=="synced")return null;
 return student;
}
module.exports={recoveryDates,phase,rootCandidate,matchesRoot,otherCourseRisk,advancePartialTuition,readTerminatedCandidate};
