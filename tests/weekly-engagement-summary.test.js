import test from "node:test";
import assert from "node:assert/strict";
import {dateOf, weekWindow, held, attendanceStatus, participationFor, classEmailMode, enrolledBefore} from "../api/weekly-engagement-summary.js";

const tutor={studentCode:"FLW-123",email:"student@example.com"};
const finished={status:"completed",startsAt:"2026-11-16T18:00:00Z",endsAt:"2026-11-16T19:00:00Z"};

test("weekly window is Monday through Sunday",()=>{
  assert.deepEqual(weekWindow(new Date("2026-11-22T20:00:00Z")),{weekStart:"2026-11-16",weekEnd:"2026-11-22"});
  assert.equal(dateOf("2026-11-16"),"2026-11-16");
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
