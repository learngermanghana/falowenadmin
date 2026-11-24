const HEADERS=["Enrollment ID","Student ID","Student Code","Language","Level","Class","Tuition","Paid","Balance","Payment Status","Contract Start","Contract End","Payment Deadline","Status","Version"];
function sheetRow(id,studentId,record){
 return [studentId+":"+id,studentId,record.studentCode||studentId,record.program,record.level,record.className||"",record.tuitionFee??"",record.paid??0,record.balanceDue??"",record.paymentStatus,record.contractStart||"",record.contractEnd||"",record.paymentDeadline||"",record.status||"planned",Number(record.sheetVersion||1)];
}
async function syncEnrollmentSheet({id,studentId,record,url,secret,fetchImpl=fetch}){
 if(!url||!secret)throw new Error("Enrollment sheet integration not configured");
 const response=await fetchImpl(url,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"upsertLevelEnrollment",secret,row:sheetRow(id,studentId,record)})});
 const body=await response.json().catch(()=>({}));
 if(!response.ok||body.ok!==true||body.action!=="upsertLevelEnrollment")throw new Error(body.error||"Enrollment sheet did not acknowledge update");
 return body;
}
module.exports={HEADERS,sheetRow,syncEnrollmentSheet};

function resolveEnrollmentSyncConfig(env=process.env){
 let config={};
 try {config=JSON.parse(env.CLOUD_RUNTIME_CONFIG_B64?Buffer.from(env.CLOUD_RUNTIME_CONFIG_B64,"base64").toString("utf8"):env.CLOUD_RUNTIME_CONFIG||"{}").level_enrollment||{};}catch{}
 return {url:env.LEVEL_ENROLLMENT_SYNC_URL||config.url||"",secret:env.LEVEL_ENROLLMENT_SYNC_SECRET||config.secret||""};
}
async function syncEnrollmentRef({ref,db,admin,url=resolveEnrollmentSyncConfig().url,secret=resolveEnrollmentSyncConfig().secret}){
 const snap=await ref.get();if(!snap.exists)return {status:"missing"};
 const record=snap.data(),version=Number(record.sheetVersion||1);
 // Missing configuration leaves the record pending, without an outbound call or extra write.
 if(!url||!secret)return {status:"not_configured",error:"Enrollment sheet integration not configured"};
 if(record.sheetSyncStatus==="synced")return {status:"synced"};
 try {
  await syncEnrollmentSheet({id:ref.id,studentId:ref.parent.parent.id,record,url,secret});
  await db.runTransaction(async tx=>{const current=await tx.get(ref);if(current.exists&&Number(current.data().sheetVersion||1)===version)tx.update(ref,{sheetSyncStatus:"synced",sheetSyncedAt:admin.firestore.FieldValue.serverTimestamp(),sheetSyncError:""});});
  return {status:"synced"};
 } catch(e){
  const message=String(e.message||"Sheet sync failed").slice(0,250);
  await db.runTransaction(async tx=>{const current=await tx.get(ref);if(current.exists&&Number(current.data().sheetVersion||1)===version&&current.data().sheetSyncStatus!=="synced")tx.update(ref,{sheetSyncStatus:"failed",sheetSyncError:message});});
  return {status:"failed",error:message};
 }
}
module.exports.syncEnrollmentRef=syncEnrollmentRef;
module.exports.resolveEnrollmentSyncConfig=resolveEnrollmentSyncConfig;
