import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {completeAttendanceSession} from "../src/services/assignedTutorAttendanceService.js";
import {readyWeeklyPeriods,receiptKey,manualAttendanceWeeks} from "../src/utils/weeklyAttendanceOutbox.js";
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

test("manual end-class timestamp makes final lesson immediately ready and app assessments do not block",()=>{
  const rows=[session("2026-11-23"),{...session("2026-11-27"),completionSource:"manual",completedAt:"2026-11-27T18:30:00Z"},{...session("2026-11-28","scheduled"),sessionType:"app_assessment"}];
  assert.equal(readyWeeklyPeriods(klass,rows,Date.parse("2026-11-27T18:31:00Z")).length,1);
});

test("lobby completion uses the authenticated exact-session end transaction", async () => {
  const requests = [];
  const user = {getIdToken: async () => "test-token"};
  const identity = {classId:"class-a",sessionId:"lesson-3",date:"2026-11-27"};
  const result = await completeAttendanceSession(user, identity, {
    env:{VITE_API_BASE_URL:"https://example.test/api/"},
    fetchImpl: async (url, options) => {
      requests.push({url, options});
      return {ok:true,json:async()=>({ok:true,opened:false,status:"completed"})};
    },
  });
  assert.equal(result.status,"completed");
  assert.equal(requests.length,1);
  assert.equal(requests[0].url,"https://example.test/api/openSession");
  assert.equal(requests[0].options.headers.Authorization,"Bearer test-token");
  assert.deepEqual(JSON.parse(requests[0].options.body),{...identity,action:"end"});
  await assert.rejects(completeAttendanceSession(user,identity,{
    env:{VITE_OPEN_SESSION_API_URL:"https://example.test/open"},
    fetchImpl:async()=>({ok:true,json:async()=>({ok:true,opened:false})}),
  }),/did not confirm/);
  await assert.rejects(completeAttendanceSession(null,identity),/Sign in/);
});
test("lobby ends canonical session before publishing the presenter end; weekly email stays in Attendance",()=>{
  const page=readFileSync(new URL("../src/pages/CheckinDisplayPage.jsx",import.meta.url),"utf8");
  const end=page.slice(page.indexOf("const syncPresenterEnd"),page.indexOf("const handleEndClass"));
  assert.ok(end.indexOf("await completionRequest.request") > 0);
  assert.ok(end.indexOf("await completionRequest.request") < end.indexOf("await endPresenterLiveSession"));
  assert.match(end,/attendanceCompletionConfirmed: true/);
  assert.match(page,/Attendance &amp; weekly email/);
  assert.match(page,/Completion not verified/);
  const outbox=readFileSync(new URL("../src/components/AttendanceWeeklyEmailOutbox.jsx",import.meta.url),"utf8");
  assert.match(outbox,/Refresh reports/);
});

test("course week picker exposes earlier and current weeks without requiring completed sessions",()=>{
  const course={...klass,startDate:"2026-10-20",endDate:"2026-12-15"};
  const weeks=manualAttendanceWeeks(course,[],Date.parse("2026-11-25T21:00:00Z"));
  assert.equal(weeks[0].week,1);
  assert.equal(weeks[0].weekStart,"2026-10-19");
  assert.equal(weeks.at(-1).week,6);
  assert.equal(weeks.at(-1).weekStart,"2026-11-23");
  assert.deepEqual(manualAttendanceWeeks({...course,startDate:"2026-12-03"},[],Date.parse("2026-11-25T21:00:00Z")),[]);
});
