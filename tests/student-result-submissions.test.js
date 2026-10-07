import test from "node:test";
import assert from "node:assert/strict";
import { matchingResultSubmissions, submittedWorkText, submittedWorkFiles } from "../src/utils/studentResultSubmissions.js";

test("matches assignments for the selected student and keeps attempts separate", () => {
  const rows = [
    { id: "a", studentCode: "ST-1", assignmentId: "A1-10", attempt: 1 },
    { id: "b", studentCode: "ST1", assignmentId: "A1_10", attempt: 2 },
    { id: "c", studentCode: "ST2", assignmentId: "A1-10" },
    { id: "d", studentCode: "ST1", assignmentId: "A1-11" },
  ];
  const matches = matchingResultSubmissions({ assignmentId: "A1-10", submissionId: "a" }, rows, "ST1");
  assert.deepEqual(matches.map((row) => row.id), ["a", "b"]);
  assert.equal(matches[0].linkedToResult, true);
  assert.equal(matches[1].linkedToResult, false);
  assert.equal(matchingResultSubmissions({}, rows, "ST1").length, 0);
});

test("an explicit submission path finds the work without assignment metadata", () => {
  const matches = matchingResultSubmissions({ submissionPath: "submissions/a" }, [{ id: "a", path: "submissions/a", studentCode: "ST1" }], "ST1");
  assert.equal(matches[0].linkedToResult, true);
});

test("renders structured answers without losing zero or false answers", () => {
  assert.equal(submittedWorkText({ raw: { answers: { q1: 0, q2: false } }, text: "[object Object]" }), '{\n  "q1": 0,\n  "q2": false\n}');
  assert.equal(submittedWorkText({ text: "Student writing\nSecond line" }), "Student writing\nSecond line");
});

test("submitted files expose only web links and remove duplicates", () => {
  const files = submittedWorkFiles({ raw: { attachments: [{ name: "essay.pdf", url: "https://example.org/essay.pdf" }, "javascript:alert(1)"], fileUrl: "https://example.org/essay.pdf", audioUrl: "https://example.org/voice.mp3" } });
  assert.equal(files.length, 2);
  assert.equal(files.every((file) => /^https:\/\//.test(file.url)), true);
});
