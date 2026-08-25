import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { belongsToSelectedClass } from "../src/utils/liveClassSessionOwnership.js";

const compatibilityServicePath = new URL(
  "../src/services/liveClassCompatibilityServiceBase.js",
  import.meta.url,
);

test("compatible session ownership rejects explicitly foreign same-name cohorts", () => {
  const selectedClassId = "Y4xjoaF5wK0RmDyIEvkY";

  assert.equal(belongsToSelectedClass({
    id: "selected-session",
    classId: selectedClassId,
    classRecordId: selectedClassId,
    className: "A2 Munich Klasse",
  }, selectedClassId), true);

  assert.equal(belongsToSelectedClass({
    id: "foreign-session",
    classId: "another-a2-cohort",
    classRecordId: "another-a2-cohort",
    className: "A2 Munich Klasse",
  }, selectedClassId), false);

  assert.equal(belongsToSelectedClass({
    id: "legacy-ownerless-session",
    className: "A2 Munich Klasse",
  }, selectedClassId), true);

  // Legacy records can carry the class name in classId while classRecordId has
  // the canonical Firestore class ID. The canonical ID must keep the record.
  assert.equal(belongsToSelectedClass({
    id: "legacy-canonical-session",
    classId: "A2 Munich Klasse",
    classRecordId: selectedClassId,
    className: "A2 Munich Klasse",
  }, selectedClassId), true);
});

test("Live Classes and attendance filter discovered sessions before dedupe", async () => {
  const source = await readFile(compatibilityServicePath, "utf8");

  assert.match(source, /import \{ belongsToSelectedClass \} from "\.\.\/utils\/liveClassSessionOwnership\.js"/);
  assert.match(
    source,
    /const visibleSessions = \[\.\.\.found\.values\(\)\][\s\S]*?\.filter\(isVisibleSession\)[\s\S]*?\.filter\(\(session\) => belongsToSelectedClass\(session, classId\)\);/,
  );
  assert.match(source, /return dedupeCompatibleSessionRecords\(visibleSessions, \{ classId \}\);/);
});
