// Update the existing enrollment-sync Apps Script web app and its deployment.
// Both actions use the same existing secret and spreadsheet ID.
function doPost(e) {
  try {
    const body=JSON.parse(e.postData.contents), props=PropertiesService.getScriptProperties();
    if(!props.getProperty("LEVEL_ENROLLMENT_SYNC_SECRET")||body.secret!==props.getProperty("LEVEL_ENROLLMENT_SYNC_SECRET")) throw new Error("Unauthorized");
    const isExam=body.action==="upsertExamSubscription";
    const isEnrollment=body.action==="upsertLevelEnrollment";
    if(!isExam&&!isEnrollment)throw new Error("Unsupported action");
    const headers=isExam?["Subscription ID","Student ID","Student Code","Student Name","Email","Language","Exam Level","Product Type","Base Subscription Amount","Transaction Fees","Gross Amount Paid","Currency","Payment Reference","Payment Date","Subscription Start","Subscription Expiry","Status","Last Synchronized Time"]:["Enrollment ID","Student ID","Student Code","Language","Level","Class","Tuition","Paid","Balance","Payment Status","Contract Start","Contract End","Payment Deadline","Status","Version"];
    if(!Array.isArray(body.row)||body.row.length!==headers.length||!body.row[0])throw new Error("Invalid sheet record");
    if(isExam&&(!/^[A-Za-z0-9._-]{1,150}$/.test(String(body.row[12]))||body.row[0]!=="exam:"+body.row[12]))throw new Error("Invalid exam reference");
    const lock=LockService.getScriptLock();lock.waitLock(10000);
    try {
      const book=SpreadsheetApp.openById(props.getProperty("STUDENT_SPREADSHEET_ID"));
      const title=isExam?"Exam Subscriptions":"Level Enrollments";
      const sheet=book.getSheetByName(title)||book.insertSheet(title);
      if(!sheet.getLastRow())sheet.getRange(1,1,1,headers.length).setValues([headers]);
      if(sheet.getRange(1,1,1,headers.length).getValues()[0].join("|")!==headers.join("|"))throw new Error("Unexpected "+title+" headers");
      const match=sheet.getLastRow()>1?sheet.getRange(2,1,sheet.getLastRow()-1,1).createTextFinder(String(body.row[0])).matchEntireCell(true).findNext():null;
      const row=match?match.getRow():sheet.getLastRow()+1;
      const lastColumn=headers.length;
      const incoming=isExam?Date.parse(body.row[17]):Number(body.row[14]);
      if(!Number.isFinite(incoming))throw new Error("Invalid record version");
      const previous=match?sheet.getRange(row,lastColumn).getValue():null;
      const existingVersion=isExam?Date.parse(previous):Number(previous);
      if(!match||!Number.isFinite(existingVersion)||existingVersion<=incoming){
        const safe=body.row.map(v=>typeof v==="string"&&/^\s*[=+@-]/.test(v)?"'"+v:v);
        sheet.getRange(row,1,1,lastColumn).setValues([safe]);
      }
      let primaryPaymentSynced=false,levelPaymentsSynced=false;
      if(isEnrollment&&body.primaryPayment){
        const p=body.primaryPayment;
        if(p.studentCode!==body.row[2]||p.level!==body.row[4]||p.paid!==body.row[7]||p.balance!==body.row[8]||!Number.isFinite(p.paid)||!Number.isFinite(p.balance))throw new Error("Invalid primary payment mirror");
        // A delayed older enrollment event must not overwrite a newer balance.
        if(!match||!Number.isFinite(existingVersion)||existingVersion<=incoming){
          const students=book.getSheetByName("students");
          if(!students||students.getLastRow()<2)throw new Error("Main student sheet missing");
          const h=students.getRange(1,1,1,13).getValues()[0];
          if(h[4]!=="Level"||h[5]!=="Paid"||h[6]!=="Balance"||h[9]!=="StudentCode"||h[12]!=="Status")throw new Error("Unexpected students headers");
          const matches=students.getRange(2,10,students.getLastRow()-1,1).createTextFinder(String(p.studentCode)).matchEntireCell(true).findAll();
          if(matches.length!==1)throw new Error("Expected one matching student code in students tab");
          const studentRow=matches[0].getRow();
          if(String(students.getRange(studentRow,5).getValue()).toUpperCase()!==String(p.level).toUpperCase())throw new Error("Main sheet level differs; review primary enrollment before mirroring");
          students.getRange(studentRow,6,1,2).setValues([[p.paid,p.balance]]);
          const status=students.getRange(studentRow,13);
          if(p.balance===0&&["active","paid","partially paid"].includes(String(status.getValue()).toLowerCase()))status.setValue("Paid");
        }
        primaryPaymentSynced=true;
      }
      if(isEnrollment&&Array.isArray(body.levelPayments)&&body.levelPayments.length){
        const ledgerHeaders=["Payment Reference","Student ID","Enrollment ID","Language","Level","Tuition Credit","Processing Surcharge","Gross Amount","Currency","Payment Date","Status"];
        const ledger=book.getSheetByName("Level Payments")||book.insertSheet("Level Payments");
        if(!ledger.getLastRow())ledger.getRange(1,1,1,ledgerHeaders.length).setValues([ledgerHeaders]);
        if(ledger.getRange(1,1,1,ledgerHeaders.length).getValues()[0].join("|")!==ledgerHeaders.join("|"))throw new Error("Unexpected Level Payments headers");
        for(const payment of body.levelPayments){
          if(!Array.isArray(payment)||payment.length!==11||!/^[A-Za-z0-9._-]{3,150}$/.test(String(payment[0]))||payment[1]!==body.row[1]||payment[1]+":"+payment[2]!==body.row[0]||payment[3]!==body.row[3]||payment[4]!==body.row[4]||![payment[5],payment[6],payment[7]].every(Number.isFinite)||payment[5]<=0||payment[6]<0||Math.abs(payment[5]+payment[6]-payment[7])>0.005||payment[8]!=="GHS"||payment[10]!=="Paid")throw new Error("Invalid level payment ledger row");
          const found=ledger.getLastRow()>1?ledger.getRange(2,1,ledger.getLastRow()-1,1).createTextFinder(String(payment[0])).matchEntireCell(true).findAll():[];
          if(found.length>1)throw new Error("Duplicate payment references in sheet");
          if(found.length&&String(ledger.getRange(found[0].getRow(),2).getValue())!==payment[1])throw new Error("Payment reference belongs to another student");
          const safe=payment.map(v=>typeof v==="string"&&/^\s*[=+@-]/.test(v)?"'"+v:v);
          ledger.getRange(found.length?found[0].getRow():ledger.getLastRow()+1,1,1,ledgerHeaders.length).setValues([safe]);
        }
        levelPaymentsSynced=true;
      }
      let terminationArchived=false;
      if(isEnrollment&&((String(body.row[9]).toLowerCase()==="forfeited"&&String(body.row[13]).toLowerCase()==="cancelled")||(body.terminationReason==="paid_contract_expired"&&String(body.row[9]).toLowerCase()==="paid"&&String(body.row[13]).toLowerCase()==="completed"&&Number(body.row[8])===0))){
        const completedId=props.getProperty("COMPLETED_SPREADSHEET_ID");
        if(!completedId)throw new Error("COMPLETED_SPREADSHEET_ID is not configured; no account will be purged.");
        const completed=SpreadsheetApp.openById(completedId);
        const archive=completed.getSheetByName("Terminated Enrollments")||completed.insertSheet("Terminated Enrollments");
        const archiveHeaders=headers.concat(["Transferable Credit","Archived At","Notice Email","Notice Recipient","Student Name","Organisation Billing","Recovery End"]);
        if(!archive.getLastRow())archive.getRange(1,1,1,archiveHeaders.length).setValues([archiveHeaders]);
        if(archive.getRange(1,1,1,archiveHeaders.length).getValues()[0].join("|")!==archiveHeaders.join("|"))throw new Error("Unexpected Terminated Enrollments headers");
        const found=archive.getLastRow()>1?archive.getRange(2,1,archive.getLastRow()-1,1).createTextFinder(String(body.row[0])).matchEntireCell(true).findNext():null;
        if(!found){
          const notice=body.terminationNotice||{};
          const values=body.row.concat([0,new Date(),String(notice.email||""),String(notice.recipient||""),String(notice.studentName||""),notice.organisation===true?"yes":"no",String(notice.recoveryEnd||"")]).map(v=>typeof v==="string"&&/^\s*[=+@-]/.test(v)?"'"+v:v);
          archive.getRange(archive.getLastRow()+1,1,1,archiveHeaders.length).setValues([values]);
        }
        terminationArchived=true;
      }
      SpreadsheetApp.flush();
      return enrollmentResponse({ok:true,action:body.action,terminationArchived,primaryPaymentSynced,levelPaymentsSynced});
    } finally {lock.releaseLock();}
  }catch(e){return enrollmentResponse({ok:false,error:String(e.message)});}
}
function enrollmentResponse(body){return ContentService.createTextOutput(JSON.stringify(body)).setMimeType(ContentService.MimeType.JSON);}
