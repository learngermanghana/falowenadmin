const HEADERS=["Enrollment ID","Student ID","Student Code","Language","Level","Class","Tuition","Paid","Balance","Payment Status","Contract Start","Contract End","Payment Deadline","Status","Version"];
function sheetRow(id,studentId,record){
 return [studentId+":"+id,studentId,record.studentCode||studentId,record.program,record.level,record.className||"",record.tuitionFee??"",record.paid??0,record.balanceDue??"",record.paymentStatus,record.contractStart||"",record.contractEnd||"",record.paymentDeadline||"",record.status||"planned",Number(record.sheetVersion||1)];
}
async function syncEnrollmentSheet({id,studentId,record,url,secret,terminationNotice,primaryPayment,levelPayments,fetchImpl=fetch}){
 if(!url||!secret)throw new Error("Enrollment sheet integration not configured");
 const response=await fetchImpl(url,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"upsertLevelEnrollment",secret,row:sheetRow(id,studentId,record),...(record.terminationReason?{terminationReason:record.terminationReason}:{}),...(terminationNotice?{terminationNotice}:{}),...(primaryPayment?{primaryPayment}:{}),...(levelPayments?.length?{levelPayments}:{})})});
 const body=await response.json().catch(()=>({}));
 if(!response.ok||body.ok!==true||body.action!=="upsertLevelEnrollment")throw new Error(body.error||"Enrollment sheet did not acknowledge update");
 if(["partial_tuition_recovery_expired","paid_contract_expired"].includes(record.terminationReason)&&body.terminationArchived!==true)throw new Error("Completed spreadsheet did not acknowledge the terminated enrollment archive; update the existing Apps Script deployment.");
 if(primaryPayment&&body.primaryPaymentSynced!==true)throw new Error("Main student sheet did not acknowledge payment mirror; update existing Apps Script deployment");
 if(levelPayments?.length&&body.levelPaymentsSynced!==true)throw new Error("Level payment ledger did not acknowledge references; update existing Apps Script deployment");
 return body;
}
module.exports={HEADERS,sheetRow,syncEnrollmentSheet};

function resolveEnrollmentSyncConfig(env=process.env){
 let config={};
 try {config=JSON.parse(env.CLOUD_RUNTIME_CONFIG_B64?Buffer.from(env.CLOUD_RUNTIME_CONFIG_B64,"base64").toString("utf8"):env.CLOUD_RUNTIME_CONFIG||"{}").level_enrollment||{};}catch{}
 return {url:env.LEVEL_ENROLLMENT_SYNC_URL||config.url||"",secret:env.LEVEL_ENROLLMENT_SYNC_SECRET||config.secret||""};
}
async function syncEnrollmentRef({ref,db,admin,url=resolveEnrollmentSyncConfig().url,secret=resolveEnrollmentSyncConfig().secret,force=false}){
 const snap=await ref.get();if(!snap.exists)return {status:"missing"};
 const record=snap.data(),version=Number(record.sheetVersion||1);
 // Missing configuration leaves the record pending, without an outbound call or extra write.
 if(!url||!secret)return {status:"not_configured",error:"Enrollment sheet integration not configured"};
 if(!force&&record.sheetSyncStatus==="synced")return {status:"synced"};
 try {
  let terminationNotice;
  if(["partial_tuition_recovery_expired","paid_contract_expired"].includes(record.terminationReason)){
    const parent=await ref.parent.parent.get(),student=parent.data()||{};
    let email=String(student.email||"").trim(),recipient=String(student.name||student.fullName||"Student");
    const organisation=Boolean(student.organisationSubmissionId||student.billingResponsibility==="organisation");
    if(organisation){
      email="";recipient="Organisation partner";
      if(student.organisationSubmissionId){
        const batch=await db.collection("organisationEnrolments").doc(student.organisationSubmissionId).get(),org=batch.data()?.organisation;
        if(org){email=String(org.billingEmail||org.email||"").trim();recipient=String(org.name||recipient);}
      }
    }
    terminationNotice={email:/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)?email:"",recipient,studentName:String(student.name||student.fullName||""),organisation,recoveryEnd:record.partialTuitionRecoveryEnd||""};
  }
  let primaryPayment,levelPayments;
  if(record.lastPaystackReference||force){
    const parent=ref.parent.parent,studentId=parent.id;
    await require("./effectiveEnrollmentProfile").reconcileEnrollmentProfile({db,admin,studentId});
    const student=(await parent.get()).data()||{};
    // Only project the effective primary enrollment; never overwrite another language/level.
    if(student.effectiveEnrollmentId===ref.id&&student.paid===record.paid&&student.balanceDue===record.balanceDue){
      primaryPayment={studentCode:record.studentCode||studentId,level:record.level,paid:record.paid,balance:record.balanceDue};
    }
    const history=await ref.collection("payments").get();
    levelPayments=[];
    for(const doc of history.docs){
      const p=doc.data();
      if(p.source!=="enrollment_checkout"||p.method!=="paystack")continue;
      let gross=p.checkoutAmount,surcharge=p.processingSurcharge;
      if(!Number.isFinite(gross)||!Number.isFinite(surcharge)){
        const intent=(await db.collection("payments").doc(p.reference).get()).data()||{};
        if(intent.studentId!==studentId||intent.enrollmentId!==ref.id||intent.status!=="paid"||!Number.isFinite(intent.checkoutAmount))throw Error("Missing verified checkout totals for "+p.reference);
        gross=intent.checkoutAmount;surcharge=Math.round((gross-p.amount)*100)/100;
      }
      levelPayments.push([p.reference,studentId,ref.id,record.program,record.level,p.amount,surcharge,gross,"GHS",p.receivedDate,"Paid"]);
    }
  }
  await syncEnrollmentSheet({id:ref.id,studentId:ref.parent.parent.id,record,url,secret,terminationNotice,primaryPayment,levelPayments});
  await db.runTransaction(async tx=>{const current=await tx.get(ref);if(current.exists&&Number(current.data().sheetVersion||1)===version)tx.update(ref,{sheetSyncStatus:"synced",sheetSyncedAt:admin.firestore.FieldValue.serverTimestamp(),sheetSyncError:""});});
  return {status:"synced"};
 } catch(e){
  const message=String(e.message||"Sheet sync failed").slice(0,250);
  await db.runTransaction(async tx=>{const current=await tx.get(ref);if(current.exists&&Number(current.data().sheetVersion||1)===version&&(force||current.data().sheetSyncStatus!=="synced"))tx.update(ref,{sheetSyncStatus:"failed",sheetSyncError:message});});
  return {status:"failed",error:message};
 }
}
module.exports.syncEnrollmentRef=syncEnrollmentRef;
module.exports.resolveEnrollmentSyncConfig=resolveEnrollmentSyncConfig;
