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
});

test("navigation restores mock monitoring and preserves timed attempt resets", () => {
  const app=fs.readFileSync("src/App.jsx","utf8");
  const page=fs.readFileSync("src/pages/TimedAssignmentAttemptsPage.jsx","utf8");
  assert.match(app,/to="\/timed-attempts"[^>]*>Mock Monitoring & Timers<\/Link>/);
  assert.match(page,/data-testid="mock-monitoring"/);
  assert.match(page,/data-testid="timed-assignments"/);
  assert.match(page,/Reset timed attempt/);
  assert.match(page,/progressSource|mockSectionProgress/);
  assert.match(page,/mockActivityLabel/);
});
