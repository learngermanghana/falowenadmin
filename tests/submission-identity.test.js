import test from "node:test";
import assert from "node:assert/strict";

import { inferSubmissionIdentity, inferSubmissionIdentityFromPath, submissionPathFromRow } from "../src/utils/submissionIdentity.js";

test("infers student code and level from nested submissions path", () => {
  assert.deepEqual(inferSubmissionIdentityFromPath("submissions/B1/STU-104/submission-1"), {
    level: "B1",
    studentCode: "STU-104",
  });
});

test("infers student code from a student-owned submissions path", () => {
  assert.deepEqual(inferSubmissionIdentityFromPath("students/STU-205/submissions/submission-2"), {
    level: "",
    studentCode: "STU-205",
  });
});

test("does not mistake a flat submission document id for a student code", () => {
  assert.deepEqual(inferSubmissionIdentityFromPath("submissions/submission-3"), {
    level: "",
    studentCode: "",
  });
});

test("finds a normalized submission row path", () => {
  assert.deepEqual(inferSubmissionIdentity({ path: "submissions/B1/STU-307/submission-5" }), {
    level: "B1",
    studentCode: "STU-307",
  });
});

test("finds nested submission paths on quality-check rows", () => {
  const row = { result: { submissionPath: "submissions/A2/STU-306/submission-4" } };

  assert.equal(submissionPathFromRow(row), "submissions/A2/STU-306/submission-4");
  assert.deepEqual(inferSubmissionIdentity(row), { level: "A2", studentCode: "STU-306" });
});
