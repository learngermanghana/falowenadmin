import test from "node:test";
import assert from "node:assert/strict";
import { sessionBelongsToVerifiedClass } from "../api/checkin-session-class.js";

const classId = "cFN8Qtu6tsCUHGjvgbKL";
const klass = {
  name: "A2 Dortmund Klasse",
  slug: "a2-dortmund-klasse",
  classId: classId,
};

test("allows a session with an exact canonical class owner", () => {
  assert.equal(sessionBelongsToVerifiedClass({ classRecordId: classId, classId }, klass, classId), true);
});

test("accepts legacy class names and slugs already recognized by Live Classes", () => {
  assert.equal(sessionBelongsToVerifiedClass({ classId: "A2 Dortmund Klasse" }, klass, classId), true);
  assert.equal(sessionBelongsToVerifiedClass({ classRecordId: "A2 Dortmund Klasse" }, klass, classId), true);
  assert.equal(sessionBelongsToVerifiedClass({ classId: "a2-dortmund-klasse" }, klass, classId), true);
});

test("a conflicting canonical owner cannot be overridden by a matching legacy classId", () => {
  assert.equal(
    sessionBelongsToVerifiedClass({ classRecordId: "another-class-record", classId }, klass, classId),
    false,
  );
});

test("rejects unrelated classes and ownerless records", () => {
  assert.equal(sessionBelongsToVerifiedClass({ classId: "A2 Berlin Klasse" }, klass, classId), false);
  assert.equal(sessionBelongsToVerifiedClass({}, klass, classId), false);
  assert.equal(sessionBelongsToVerifiedClass({ classId }, klass, ""), false);
});

test("only class-record-backed aliases count, not the session's self-reported name", () => {
  assert.equal(
    sessionBelongsToVerifiedClass({ classId: "other-cohort", className: klass.name }, klass, classId),
    false,
  );
});
