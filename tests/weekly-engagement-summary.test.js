import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import handler from "../api/weekly-engagement-summary.js";
import {dateOf, weekWindow, held, attendanceStatus, participationFor, classEmailMode, enrolledBefore, elapsedManualCandidate, hasRecordedAttendance, manualReportWeekStarts} from "../api/weekly-engagement-summary.js";

const tutor={studentCode:"FLW-123",email:"student@example.com"};
const finished={status:"completed",startsAt:"2026-11-16T18:00:00Z",endsAt:"2026-11-16T19:00:00Z"};

test("weekly window is Monday through Sunday",()=>{
  assert.deepEqual(weekWindow(new Date("2026-11-22T20:00:00Z")),{weekStart:"2026-11-16",weekEnd:"2026-11-22"});
  assert.equal(dateOf("2026-11-16"),"2026-11-16");
  assert.equal(dateOf("2026-11-16T18:00:00Z"),"2026-11-16");
  assert.deepEqual(weekWindow(new Date("2026-11-16T12:00:00Z"),1),{weekStart:"2026-11-09",weekEnd:"2026-11-15"});
});
test("only completed non-cancelled sessions count, after end time",()=>{
  const now=Date.parse("2026-11-16T19:10:00Z");
  assert.equal(held(finished,now),true);
  assert.equal(held({...finished,status:"cancelled"},now),false);
  assert.equal(held({...finished,status:"scheduled"},now),false);
  assert.equal(held({...finished,endsAt:"2026-11-16T21:00:00Z"},now),false);
});
test("manual register overrides a student's checkin, including excused",()=>{
  assert.equal(attendanceStatus({session:finished,student:tutor,attendance:{students:{"FLW-123":{status:"excused"}}},
    checkins:[{studentCode:"FLW-123",checkedInAt:"2026-11-16T18:01:00Z"}]}),"excused");
  assert.equal(attendanceStatus({session:finished,student:tutor,attendance:{students:{"FLW-123":{status:"absent"}}},
    checkins:[{studentCode:"FLW-123",checkedInAt:"2026-11-16T18:01:00Z"}]}),"absent");
});
test("checkin timestamps classify late and present correctly",()=>{
  assert.equal(attendanceStatus({session:finished,student:tutor,checkins:[{email:tutor.email,checkedInAt:"2026-11-16T18:16:00Z"}]}),"late");
  assert.equal(attendanceStatus({session:finished,student:tutor,checkins:[{email:tutor.email,checkedInAt:"2026-11-16T18:12:00Z"}]}),"present");
  assert.equal(attendanceStatus({session:finished,student:tutor}),"absent");
});
test("enrollment start excludes attendance before enrolment",()=>{
  assert.equal(enrolledBefore({...tutor,enrollmentDate:"2026-11-17T00:00:00Z"},finished),false);
  assert.equal(enrolledBefore({...tutor,enrollmentDate:"2026-11-12T00:00:00Z"},finished),true);
});
test("class email settings remain authoritative",()=>{
  assert.equal(classEmailMode({attendanceConfirmationEmailEnabled:false}),"off");
  assert.equal(classEmailMode({attendanceConfirmationEmailMode:"each_class"}),"each_class");
  assert.equal(classEmailMode({attendanceConfirmationEmailMode:"weekly"}),"weekly");
});
test("participation respects both class and student and reporting period",()=>{
 const rows=[
 {classId:"class-a",studentEmailNormalized:tutor.email,sessionDate:"2026-11-16",classSessionId:"s1",turns:4,correct:3,needsReview:1},
 {classId:"class-a",studentEmailNormalized:"other@example.com",sessionDate:"2026-11-16",classSessionId:"s2",turns:9},
 {classId:"class-b",studentEmailNormalized:tutor.email,sessionDate:"2026-11-16",classSessionId:"s3",turns:9},
 {classId:"class-a",studentEmailNormalized:tutor.email,sessionDate:"2026-11-01",classSessionId:"s4",turns:9}
 ];
 assert.deepEqual(participationFor(rows,tutor,{_id:"class-a",name:"A1 Stuttgart Klasse"},"2026-11-16","2026-11-22"),{participatedSessions:1,turns:4,correct:3,needsReview:1});
});

test("weekly digest has no cron entry and old scheduled requests cannot send",async()=>{
  const config=JSON.parse(fs.readFileSync(new URL("../vercel.json",import.meta.url),"utf8"));
  assert.ok(!(config.crons||[]).some(job=>job.path==="/api/weekly-engagement-summary"));
  const res={code:0,body:null,setHeader(){},status(code){this.code=code;return this;},json(body){this.body=body;return this;}};
  await handler({method:"GET",query:{},headers:{authorization:"Bearer old-cron"}},res);
  assert.equal(res.code,405);
  const source=fs.readFileSync(new URL("../api/weekly-engagement-summary.js",import.meta.url),"utf8");
  assert.match(source,/verifyFirebaseAdminUser\(bearerToken\(req\)\)/);
  assert.match(source,/manualSend && !classId && req\.query\?\.period!=="previous"/);
  assert.match(source,/req\.query\?\.weekStart!==report\.weekStart/);
  assert.match(source,/result\.sent\+result\.skipped!==recipients\.length/);
  assert.match(source,/await markWeeklySent\(token,id,period,recipients\.length\)/);
});
test("optional learning nudge is no longer exported or deployed",()=>{
  const main=fs.readFileSync(new URL("../functions/main.js",import.meta.url),"utf8");
  const workflow=fs.readFileSync(new URL("../.github/workflows/deploy-student-learning-nudge.yml",import.meta.url),"utf8");
  assert.doesNotMatch(main,/module\.exports\.sendStudentLearningNudges\s*=/);
  assert.doesNotMatch(workflow,/firebase deploy/);
});

test("manual date selection accepts current or earlier Monday-based weeks, never future or unbounded ranges",()=>{
  const now=new Date("2026-11-25T21:00:00Z");
  assert.deepEqual(manualReportWeekStarts("2026-11-02","2026-11-23",now),["2026-11-02","2026-11-09","2026-11-16","2026-11-23"]);
  assert.deepEqual(manualReportWeekStarts("2026-11-23","2026-11-30",now),[]);
  assert.deepEqual(manualReportWeekStarts("2026-11-24","2026-11-24",now),[]);
  assert.deepEqual(manualReportWeekStarts("2026-11-23","2026-11-16",now),[]);
  assert.deepEqual(manualReportWeekStarts("2026-01-05","2026-11-23",now),[]);
});
test("manual reporting can use elapsed sessions with real attendance but not cancelled, future or app assessment lessons",()=>{
  const now=Date.parse("2026-11-16T19:10:00Z");
  const scheduled={...finished,status:"scheduled"};
  assert.equal(held(scheduled,now),false);
  assert.equal(elapsedManualCandidate(scheduled,now),true);
  assert.equal(hasRecordedAttendance({checkins:[{studentCode:"test"}]}),true);
  assert.equal(hasRecordedAttendance({attendance:{students:{test:{present:false}}}}),true);
  assert.equal(hasRecordedAttendance({attendance:{opened:false},checkins:[]}),false);
  assert.equal(elapsedManualCandidate({...scheduled,status:"cancelled"},now),false);
  assert.equal(elapsedManualCandidate({...scheduled,endsAt:"2026-11-16T21:00:00Z"},now),false);
  assert.equal(elapsedManualCandidate({...scheduled,sessionType:"app_assessment"},now),false);
});
