import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { mockSectionProgress, remainingSeconds, clockLabel, mockActivityLabel, filterMockAttempts, filterTimedAttempts, timedAttemptStatus, timedAttemptStatusLabel } from "../src/utils/mockAttemptMonitoring.js";

test("mock monitor shows four-section progress and true section remaining time", () => {
  assert.deepEqual(mockSectionProgress({completedSections:["lesen","hoeren"]}), {
    completed:["lesen","hoeren"], count:2, total:4,
  });
  assert.equal(remainingSeconds(1720000025000,1720000000000),25);
  assert.equal(remainingSeconds(1720000000000,1720000010000),0);
  assert.equal(remainingSeconds(null,1720000000000),null);
  assert.equal(clockLabel(125),"02:05");
  assert.equal(clockLabel(null),"Not recorded");
});

test("stale in-progress progress never pretends the student is online", () => {
  const now=1720000000000;
  assert.match(mockActivityLabel({status:"in_progress",updatedAt:new Date(now-11*60000).toISOString()},now),/no recent update/);
  assert.equal(mockActivityLabel({status:"completed"},now),"Completed");
  const rows=[{level:"A1",mockId:"a1-mock-01",studentEmail:"a@domain.com",status:"completed"},
    {level:"A2",mockId:"a2-mock-02",studentEmail:"b@domain.com",status:"in_progress"}];
  assert.equal(filterMockAttempts(rows,"A2","in_progress").length,1);
  assert.equal(filterMockAttempts(rows,"A1","in_progress").length,0);
  assert.equal(filterMockAttempts([{...rows[0],studentName:"Ama Mensah"}],"mensah").length,1);
});

test("navigation restores mock monitoring and preserves timed attempt resets", () => {
  const app=fs.readFileSync("src/App.jsx","utf8");
  const page=fs.readFileSync("src/pages/TimedAssignmentAttemptsPage.jsx","utf8");
  assert.equal(app.split("\n").filter(line => line.includes('to="/timed-attempts"') && line.includes("Mock Monitoring & Timers</Link>")).length, 2, "both staff and administrator navigation must include the monitoring link");
  assert.match(page,/data-testid="mock-monitoring"/);
  assert.match(page, /key=\{receipt\.path\}/, "multi-layout receipt cards need unique full-path keys");
  assert.match(page,/data-testid="timed-assignments"/);
  assert.match(page,/Reset timed attempt/);
  assert.match(page,/progressSource|mockSectionProgress/);
  assert.match(page,/mockActivityLabel/);
  assert.match(page,/\/api\/internal\/mock-attempts/);
  assert.match(page,/getIdToken\(\)/);
  assert.doesNotMatch(page,/collectionGroup\(/, "student mock records must not be queried directly from the Admin browser");
});

test("mock dashboard shows name above email and preserves email fallback", () => {
  const page = fs.readFileSync("src/pages/TimedAssignmentAttemptsPage.jsx", "utf8");
  assert.match(page, /attempt\.studentName \|\| attempt\.studentEmail/);
  assert.match(page, /attempt\.studentName && attempt\.studentEmail/);
  assert.match(page, /Student name, email, ID/);
});

test("Exam Room and Campus filters are independent, visible and accessible", () => {
  const page = fs.readFileSync("src/pages/TimedAssignmentAttemptsPage.jsx", "utf8");
  const css = fs.readFileSync("src/pages/TimedAssignmentAttemptsPage.css", "utf8");
  assert.match(page, /useState\("mocks"\)/, "open Exam Room first");
  assert.match(page, /role="tablist"/);
  assert.match(page, /Exam Room mocks/);
  assert.match(page, /Campus timed tests/);
  assert.match(page, /aria-selected=\{showMocks\}/);
  assert.match(page, /aria-selected=\{showTimed\}/);
  assert.match(page, /Filter Exam Room mock status/);
  assert.match(page, /Filter Campus timed test status/);
  assert.match(page, /onClick=\{\(\) => setMockStatus\(value\)\}/);
  assert.match(page, /onClick=\{\(\) => setTimedStatus\(value\)\}/);
  assert.match(page, /filterTimedAttempts\(attempts, query, timedStatus\)/);
  assert.match(page, /aria-pressed=\{mockStatus === value\}/);
  assert.match(page, /aria-pressed=\{timedStatus === value\}/);
  assert.match(css, /button\.monitor-status-button\s*\{[^}]*background-color: #fff;[^}]*color: #253650/s);
  assert.match(css, /button\.monitor-status-button\[aria-pressed="true"\]\s*\{[^}]*background-color: #1d4ed8;[^}]*color: #fff/s);
  assert.match(css, /@media \(max-width: 670px\)/);
});

test("Campus timed tests correctly filter submitted vs unfinished or expired locks", () => {
  const timed = [
    {id: "a", studentName: "Ama", assignmentKey: "A1-1", status: "active"},
    {id: "b", studentEmail: "kojo@example.com", assignmentKey: "B1-5", status: "submitted"},
    {id: "c", studentName: "Kate", assignmentKey: "A2-3", status: "expired"},
    {id: "d", fullName: "Mia", assignmentKey: "A1-2", status: "completed"},
  ];
  assert.equal(timedAttemptStatus(timed[0]), "in_progress");
  assert.equal(timedAttemptStatus(timed[1]), "completed");
  assert.equal(timedAttemptStatus(timed[2]), "in_progress", "expired does not mean submitted");
  assert.equal(timedAttemptStatus(timed[3]), "completed");
  assert.equal(timedAttemptStatusLabel(timed[2]), "Time expired · not submitted");
  assert.equal(timedAttemptStatusLabel({status:"active", startedAt:1720000000000, durationSeconds:60},1720000061000),
    "Time expired · not submitted");
  assert.equal(filterTimedAttempts(timed,"","in_progress").length,2);
  assert.equal(filterTimedAttempts(timed,"","completed").length,2);
  assert.deepEqual(filterTimedAttempts(timed,"kojo@example.com","completed").map(row => row.id), ["b"]);
  assert.deepEqual(filterTimedAttempts(timed,"mia","all").map(row => row.id), ["d"]);
  assert.equal(filterTimedAttempts(timed,"B1","in_progress").length,0);
});

test("staff fetches completed mock backups only on demand, without loading speech media", () => {
  const page=fs.readFileSync("src/pages/TimedAssignmentAttemptsPage.jsx","utf8");
  assert.match(page,/mock-answer-backup/);
  assert.match(page,/data-testid="mock-answer-backup-recovery"/);
  assert.match(page,/lookupMockAnswerBackup/);
  assert.match(page,/Recover submitted choices and writing/);
  assert.match(page,/No audio or speech transcripts are stored/);
  assert.match(page,/startVisiblePolling\(loadMocks, 120000\)/);
  const lookup=page.slice(page.indexOf("const lookupMockAnswerBackup"),page.indexOf("  useEffect(() => {",page.indexOf("const lookupMockAnswerBackup")));
  assert.match(lookup,/getIdToken\(\)/);
  assert.match(lookup,/cache:"no-store"/);
  assert.doesNotMatch(lookup,/setInterval/);
});
