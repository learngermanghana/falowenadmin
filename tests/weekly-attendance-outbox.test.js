import test from "node:test";
import assert from "node:assert/strict";
import {readyWeeklyPeriods,receiptKey} from "../src/utils/weeklyAttendanceOutbox.js";
const klass={id:"class-a",name:"A1",attendanceConfirmationEmailMode:"weekly"};
const session=(day,status="completed")=>({startsAt:day+"T18:00:00Z",endsAt:day+"T19:00:00Z",status});
const now=Date.parse("2026-11-27T20:00:00Z");
test("only after the final scheduled lesson ends and completes",()=>{
  const first=session("2026-11-23"),last=session("2026-11-27","scheduled");
  assert.equal(readyWeeklyPeriods(klass,[first,last],now).length,0);
  assert.equal(readyWeeklyPeriods(klass,[first,{...last,status:"completed"}],now)[0].weekStart,"2026-11-23");
  assert.equal(readyWeeklyPeriods(klass,[first,{...last,status:"completed"}],Date.parse("2026-11-27T18:30:00Z")).length,0);
});
test("sent receipt removes only that week, cancelled sessions do not block",()=>{
 const rows=[session("2026-11-23"),session("2026-11-27","cancelled"),session("2026-11-30")];
 const sent={...klass,weeklyEngagementSentWeeks:{[receiptKey("2026-11-23")]:{status:"sent"}}};
 assert.deepEqual(readyWeeklyPeriods(sent,rows,Date.parse("2026-12-01T20:00:00Z")).map(r=>r.weekStart),["2026-11-30"]);
 assert.equal(readyWeeklyPeriods({...klass,attendanceConfirmationEmailMode:"off"},rows,now).length,0);
});
