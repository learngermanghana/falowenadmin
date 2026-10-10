import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("../src/components/PresenterStudentPicker.jsx", import.meta.url), "utf8");

test("presenter uses classRecordId and classId from the live class URL before a stale saved class", () => {
  assert.match(source, /function preferredPresenterClassId/);
  assert.match(source, /params\.get\("classRecordId"\)/);
  assert.match(source, /params\.get\("classId"\)/);
  assert.match(source, /preferredPresenterClassId\(matchingClasses, initialClassSearch\.current\)/);
  assert.match(source, /initialClassSearch\.current = ""/);
});

test("a stalled cloud participation restore does not lock Pick student indefinitely", () => {
  assert.match(source, /Promise\.race\(\[/);
  assert.match(source, /Participation sync timeout/);
  assert.match(source, /setSyncState\("offline"\)/);
  assert.match(source, /setHydratedIdentity\(sessionIdentity\)/);
});
