function planEnrollmentTransfer({program,previous,target,rows,studentId,studentCode,disposition}){
 const levels=["A1","A2","B1","B2","C1","C2"];
 const from=String(previous.level||"").toUpperCase(),to=String(target.level||from).toUpperCase();
 if(!levels.includes(from)||!levels.includes(to))return [];
 const source=rows.find(r=>r.id===program+"-"+from);
 const dest=rows.find(r=>r.id===program+"-"+to);
 const fail=message=>{throw Object.assign(new Error(message),{statusCode:409});};
 const next=(record,patch)=>({id:record.id,patch:{...patch,sheetVersion:Number(record.sheetVersion||1)+1,sheetSyncStatus:"pending"}});
 if(from===to)return dest&&dest.className!==target.className?[next(dest,{className:target.className})]:[];
 // Do not fabricate an earlier payment or original contract date from a mixed student-wide balance.
 if(!source)fail("Record the verified "+from+" contract in Level enrollments before transferring levels.");
 const down=levels.indexOf(to)<levels.indexOf(from);
 const changes=[];
 if(down){
  if(!["retain","cancel"].includes(disposition))fail("Choose whether to retain the old level's payment reminders or cancel them.");
  if(!dest)fail("Record the original "+to+" contract in Level enrollments before downgrading.");
  if(!["active","completed"].includes(dest.status))fail("Review and activate the destination level contract before downgrading.");
  changes.push(next(source,{status:disposition==="retain"?"expired":"cancelled"}));
 }
 if(dest){
  if(!["active","completed","planned"].includes(dest.status))fail("Review and reactivate the destination level contract before transferring.");
  changes.push(next(dest,{className:target.className,status:"active"}));
 }else{
  changes.push({id:program+"-"+to,create:true,patch:{program,level:to,studentId,studentCode,className:target.className,tuitionFee:null,paid:0,balanceDue:null,paymentStatus:"Unpaid",contractStart:"",contractEnd:"",paymentDeadline:"",status:"active",accountingMode:"independent_pending_integration",openingBalanceImported:false,manualOpeningPaid:0,sheetVersion:1,sheetSyncStatus:"pending"}});
 }
 return changes;
}
module.exports={planEnrollmentTransfer};
