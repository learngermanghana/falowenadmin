// Install in a separate Apps Script web app, using the existing student spreadsheet ID.
function doPost(e) {
  try {
    const body=JSON.parse(e.postData.contents), props=PropertiesService.getScriptProperties();
    if(!props.getProperty("LEVEL_ENROLLMENT_SYNC_SECRET")||body.secret!==props.getProperty("LEVEL_ENROLLMENT_SYNC_SECRET")) throw new Error("Unauthorized");
    if(body.action!=="upsertLevelEnrollment"||!Array.isArray(body.row)||body.row.length!==15)throw new Error("Invalid enrollment");
    const lock=LockService.getScriptLock();lock.waitLock(10000);
    try {
      const book=SpreadsheetApp.openById(props.getProperty("STUDENT_SPREADSHEET_ID"));
      const sheet=book.getSheetByName("Level Enrollments")||book.insertSheet("Level Enrollments");
      const headers=["Enrollment ID","Student ID","Student Code","Language","Level","Class","Tuition","Paid","Balance","Payment Status","Contract Start","Contract End","Payment Deadline","Status","Version"];
      if(!sheet.getLastRow())sheet.getRange(1,1,1,15).setValues([headers]);
      if(sheet.getRange(1,1,1,15).getValues()[0].join("|")!==headers.join("|"))throw new Error("Unexpected enrollment sheet headers");
      const match=sheet.getLastRow()>1?sheet.getRange(2,1,sheet.getLastRow()-1,1).createTextFinder(String(body.row[0])).matchEntireCell(true).findNext():null;
      const row=match?match.getRow():sheet.getLastRow()+1;
      if(!match||Number(sheet.getRange(row,15).getValue())<=Number(body.row[14])){
        const safe=body.row.map(v=>typeof v==="string"&&/^[=+@-]/.test(v)?"'"+v:v);
        sheet.getRange(row,1,1,15).setValues([safe]);
      }
      SpreadsheetApp.flush();
      return enrollmentResponse({ok:true,action:body.action});
    } finally {lock.releaseLock();}
  }catch(e){return enrollmentResponse({ok:false,error:String(e.message)});}
}
function enrollmentResponse(body){return ContentService.createTextOutput(JSON.stringify(body)).setMimeType(ContentService.MimeType.JSON);}
