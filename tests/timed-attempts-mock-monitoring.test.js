import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

test("admin navigation includes Mock & Timers for staff and administrators", () => {
 const source = fs.readFileSync("src/App.jsx", "utf8");
 assert.ok((source.match(/to="\/timed-attempts"/g) || []).length >= 2);
});
test("monitoring preserves timed reset and includes read-only mock tracking", () => {
 const source = fs.readFileSync("src/pages/TimedAssignmentAttemptsPage.jsx", "utf8");
 assert.match(source,/collectionGroup\(db, "attempts"\)/);
 assert.match(source,/MockExamUsers/);
 assert.match(source,/Mock progress/);
 assert.match(source,/Recorded progress/);
 assert.match(source,/durationSeconds/);
 assert.match(source,/deleteDoc\(doc\(db, COLLECTION, attempt.id\)\)/);
});
