import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  isExamRoomPracticeResult, asExamRoomPractice, normalizeExamRoomPractices,
  filterExamRoomPractices, studentHasPractice, unpractisedStudents,
} from "../src/utils/examRoomPracticeMonitoring.js";

const examples = [
  ["A1 Hören Sample 1","A1-EXAMS-HOEREN-A1-HOEREN-SAMPLE-1",100,15,15,"2026-10-19T09:26:38.830Z"],
  ["A1 Lesen Sample 3","A1-EXAMS-LESEN-A1-READING-SAMPLE-03",80,12,15,"2026-10-19T09:17:19.632Z"],
  ["A1 Lesen Sample 2","A1-EXAMS-LESEN-A1-READING-SAMPLE-02",100,15,15,"2026-10-19T09:09:37.211Z"],
  ["A1 Lesen Sample 1","A1-EXAMS-LESEN-A1-READING-SAMPLE-01",80,12,15,"2026-10-19T09:01:40.580Z"],
].map(([assignment,assignmentId,score,rawScore,total,date],index)=>({
  id:"saved-"+index, assignment, assignmentId, score, rawScore, total, date,
  level:"A1", source:"exam_room_practice", studentCode:"Stu01", email:"learner@example.com",
}));

test("the four supplied Hören/Lesen sample scores are classified as saved practice, not ordinary course results", () => {
  const practice = normalizeExamRoomPractices(examples);
  assert.equal(practice.length, 4);
  assert.deepEqual(practice.map(row=>row.title),examples.map(row=>row.assignment));
  assert.deepEqual(practice.map(row=>row.percent),[100,80,100,80]);
  assert.deepEqual(practice.map(row=>row.rawScore),[15,12,15,12]);
  assert.deepEqual(practice.map(row=>row.total),[15,15,15,15]);
  assert.equal(practice[0].section,"hoeren");
  assert.equal(practice[1].section,"lesen");
  assert.deepEqual(filterExamRoomPractices(practice,{section:"hoeren"}).map(row=>row.title),["A1 Hören Sample 1"]);
  assert.equal(filterExamRoomPractices(practice,{search:"sample 3"}).length,1);
});

test("score classification keeps full mocks, class assignments and unsubmitted drafts out", () => {
  assert.equal(isExamRoomPracticeResult({assignmentId:"A1-6"}),false);
  assert.equal(isExamRoomPracticeResult({assignmentId:"B1-7.22"}),false);
  assert.equal(isExamRoomPracticeResult({assignmentId:"A1-FINAL-MOCK",source:"a1_final_mock"}),false);
  assert.equal(isExamRoomPracticeResult({assignmentId:"A1-EXAMS-LESEN-SAMPLE",resultType:"final_mock"}),false);
  assert.equal(asExamRoomPractice({source:"exam_room_practice",assignmentId:"A1-EXAMS-LESEN-1",score:null}),null);
  assert.equal(asExamRoomPractice({source:"exam_room_practice",assignmentId:"A1-EXAMS-LESEN-1",score:0}).percent,0);
});

test("not-practised roster comparison uses saved submissions, never assumes page views", () => {
  const practice=normalizeExamRoomPractices(examples);
  const students=[
    {id:"one",studentCode:"Stu01",name:"Learner",level:"A1"},
    {id:"two",studentCode:"Stu02",name:"No attempt",level:"A1"},
    {id:"three",studentCode:"Stu03",name:"A2 learner",level:"A2"},
  ];
  assert.equal(studentHasPractice(students[0],practice),true);
  assert.equal(studentHasPractice(students[1],practice),false);
  assert.deepEqual(unpractisedStudents(students,practice,"A1").map(row=>row.name),["No attempt"]);
  assert.equal(unpractisedStudents(students,practice,"all").length,2);
});

test("Admin Results separates Exams Room samples on both Firestore and Sheet tabs",()=>{
  const service=readFileSync(new URL("../src/services/studentResultsService.js",import.meta.url),"utf8");
  assert.match(service,/firestoreRawRows\.filter\(row => !isExamRoomPracticeResult\(row\)\)/);
  assert.match(service,/sheetResult\.rows\.filter\(row => !isExamRoomPracticeResult\(row\)\)/);
  assert.match(service,/where\("source", "==", "exam_room_practice"\)/);
  assert.match(service,/limit\(count\)/);
});

test("Mock page loads practice results once, roster only on request, and never invokes marking",()=>{
  const ui=readFileSync(new URL("../src/pages/TimedAssignmentAttemptsPage.jsx",import.meta.url),"utf8");
  assert.match(ui,/data-testid="exam-room-practice-monitor"/);
  assert.match(ui,/loadExamRoomPracticeSubmissions\(\)/);
  assert.match(ui,/Compare with student roster/);
  assert.match(ui,/if \(!practiceRequested\.current\)/);
  assert.match(ui,/if \(!mockRequested\.current\)/);
  assert.doesNotMatch(ui,/startVisiblePolling\(/);
  assert.doesNotMatch(ui,/onSnapshot\([^\)]*scores/);
  assert.match(ui,/practiceRows\.filter\(row => practiceSection === "all" \|\| row\.section === practiceSection\)/);
  assert.match(ui,/practiceRosterLoading \|\| !practiceFetchedAt/);
  assert.doesNotMatch(ui,/markExam|markingApi|Gemini|OpenAI/);
});
