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
      let terminationArchived=false;
      if(isEnrollment&&String(body.row[9]).toLowerCase()==="forfeited"&&String(body.row[13]).toLowerCase()==="cancelled"){
        const completedId=props.getProperty("COMPLETED_SPREADSHEET_ID");
        if(!completedId)throw new Error("COMPLETED_SPREADSHEET_ID is not configured; no account will be purged.");
        const completed=SpreadsheetApp.openById(completedId);
        const archive=completed.getSheetByName("Terminated Enrollments")||completed.insertSheet("Terminated Enrollments");
        const archiveHeaders=headers.concat(["Transferable Credit","Archived At"]);
        if(!archive.getLastRow())archive.getRange(1,1,1,archiveHeaders.length).setValues([archiveHeaders]);
        if(archive.getRange(1,1,1,archiveHeaders.length).getValues()[0].join("|")!==archiveHeaders.join("|"))throw new Error("Unexpected Terminated Enrollments headers");
        const found=archive.getLastRow()>1?archive.getRange(2,1,archive.getLastRow()-1,1).createTextFinder(String(body.row[0])).matchEntireCell(true).findNext():null;
        if(!found){
          const values=body.row.concat([0,new Date()]).map(v=>typeof v==="string"&&/^\s*[=+@-]/.test(v)?"'"+v:v);
          archive.getRange(archive.getLastRow()+1,1,1,archiveHeaders.length).setValues([values]);
        }
        terminationArchived=true;
      }
      SpreadsheetApp.flush();
      return enrollmentResponse({ok:true,action:body.action,terminationArchived});
    } finally {lock.releaseLock();}
  }catch(e){return enrollmentResponse({ok:false,error:String(e.message)});}
}
function enrollmentResponse(body){return ContentService.createTextOutput(JSON.stringify(body)).setMimeType(ContentService.MimeType.JSON);}
