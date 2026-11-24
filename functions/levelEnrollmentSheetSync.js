const HEADERS=["Enrollment ID","Student ID","Student Code","Language","Level","Class","Tuition","Paid","Balance","Payment Status","Contract Start","Contract End","Payment Deadline","Status","Version"];
function sheetRow(id,studentId,record){
 return [studentId+":"+id,studentId,record.studentCode||studentId,record.program,record.level,record.className||"",record.tuitionFee,record.paid,record.balanceDue,record.paymentStatus,record.contractStart||"",record.contractEnd||"",record.paymentDeadline||"",record.status||"planned",Number(record.sheetVersion||1)];
}
async function syncEnrollmentSheet({id,studentId,record,url,secret,fetchImpl=fetch}){
 if(!url||!secret)throw new Error("Enrollment sheet integration not configured");
 const response=await fetchImpl(url,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"upsertLevelEnrollment",secret,row:sheetRow(id,studentId,record)})});
 const body=await response.json().catch(()=>({}));
 if(!response.ok||body.ok!==true||body.action!=="upsertLevelEnrollment")throw new Error(body.error||"Enrollment sheet did not acknowledge update");
 return body;
}
module.exports={HEADERS,sheetRow,syncEnrollmentSheet};
