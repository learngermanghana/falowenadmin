import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { mockSectionProgress, remainingSeconds, clockLabel, mockActivityLabel, filterMockAttempts } from "../src/utils/mockAttemptMonitoring.js";

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

test("A1 integrity flags are visible to Admin as unverified activity, not cheating verdicts", () => {
  const page = fs.readFileSync("src/pages/TimedAssignmentAttemptsPage.jsx", "utf8");
  assert.match(page, /data-testid="mock-integrity-review"/);
  assert.match(page, /"A1", "A2", "B1", "B2", "C1"/);
  assert.match(page, /attempt.integrityOnly/);
  assert.match(page, /attempt\.integrity\?\.counts/);
  assert.match(page, /not proof of ChatGPT use or misconduct/);
  assert.match(page, /Recent activity log/);
});
