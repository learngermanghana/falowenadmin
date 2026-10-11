import test from "node:test";
import assert from "node:assert/strict";
import { loadStudentSubmissionsWithSelection } from "../src/utils/selectedStudentSubmissions.js";
const student = { level: "A1", studentCode: "B" };
test("student reload retains exact nested attempt missing from student query", async () => {
  const requested = { path: "students/B/posts/attempt2", text: "Requested work" };
  const other = { path: "submissions/attempt1", text: "Other attempt" };
  const rows = await loadStudentSubmissionsWithSelection({ student, exactPath: requested.path,
    fetchSubmissions: async (level, code) => { assert.equal(level, "A1"); assert.equal(code, "B"); return [other]; },
    fetchSubmissionByPath: async (path) => { assert.equal(path, requested.path); return requested; } });
  assert.deepEqual(rows, [requested, other]);
  assert.equal(rows.find((row) => row.path === requested.path).text, "Requested work");
});
test("does not duplicate a row already returned by student query", async () => {
  const row = { path: "submissions/one" };
  assert.deepEqual(await loadStudentSubmissionsWithSelection({ student, exactPath: row.path,
    fetchSubmissions: async () => [row], fetchSubmissionByPath: async () => assert.fail("unneeded lookup") }), [row]);
});
test("another student's reload does not fetch a previous queue selection", async () => {
  assert.deepEqual(await loadStudentSubmissionsWithSelection({ student, exactPath: "",
    fetchSubmissions: async () => [], fetchSubmissionByPath: async () => assert.fail("cross-student lookup") }), []);
});
test("deleted exact document is not resurrected and lookup errors propagate", async () => {
  const args = { student, exactPath: "nested/removed", fetchSubmissions: async () => [] };
  assert.deepEqual(await loadStudentSubmissionsWithSelection({ ...args, fetchSubmissionByPath: async () => null }), []);
  await assert.rejects(loadStudentSubmissionsWithSelection({ ...args, fetchSubmissionByPath: async () => { throw new Error("permission denied"); } }), /permission denied/);
});
