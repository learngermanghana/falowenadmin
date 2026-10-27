import test from "node:test";
import assert from "node:assert/strict";
import { parseStudentDeletionResponse } from "../src/services/studentsService.js";

test("student deletion returns successful JSON details", () => {
  const result = parseStudentDeletionResponse(
    { ok: true, status: 200, statusText: "OK" },
    JSON.stringify({ ok: true, message: "Student account deletion completed successfully.", firestore: { deleted: 4 } }),
  );

  assert.equal(result.firestore.deleted, 4);
});

test("student deletion surfaces a JSON error message", () => {
  assert.throws(
    () => parseStudentDeletionResponse(
      { ok: false, status: 500, statusText: "Internal Server Error" },
      JSON.stringify({ ok: false, error: "Invalid Firestore document path" }),
    ),
    /Invalid Firestore document path/,
  );
});

test("student deletion surfaces proxy messages instead of a generic error", () => {
  assert.throws(
    () => parseStudentDeletionResponse(
      { ok: false, status: 502, statusText: "Bad Gateway" },
      JSON.stringify({ status: "error", message: "Falowen function proxy failed" }),
    ),
    /Falowen function proxy failed/,
  );
});

test("student deletion explains a missing Firebase route without showing HTML", () => {
  assert.throws(
    () => parseStudentDeletionResponse(
      { ok: false, status: 404, statusText: "Not Found" },
      "<!doctype html><html><body>Not found</body></html>",
    ),
    /endpoint is not deployed yet/i,
  );
});
