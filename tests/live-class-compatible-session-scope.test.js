import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { belongsToSelectedClass } from "../src/utils/liveClassSessionOwnership.js";

const compatibilityServicePath = new URL(
  "../src/services/liveClassCompatibilityServiceBase.js",
  import.meta.url,
);

test("compatible session ownership rejects foreign cohorts but preserves legacy aliases", () => {
  const selectedClassId = "Y4xjoaF5wK0RmDyIEvkY";
  const aliases = [selectedClassId, "A2 Munich Klasse", "a2-munich"];

  assert.equal(belongsToSelectedClass({
    id: "selected-session",
    classId: selectedClassId,
    classRecordId: selectedClassId,
    className: "A2 Munich Klasse",
  }, selectedClassId, aliases), true);

  assert.equal(belongsToSelectedClass({
    id: "foreign-session",
    classId: "A2 Munich Klasse",
    classRecordId: "another-a2-cohort",
    className: "A2 Munich Klasse",
  }, selectedClassId, aliases), false);

  assert.equal(belongsToSelectedClass({
    id: "legacy-ownerless-session",
    className: "A2 Munich Klasse",
  }, selectedClassId, aliases), true);

  assert.equal(belongsToSelectedClass({
    id: "legacy-name-owned-session",
    classId: "A2 Munich Klasse",
    className: "A2 Munich Klasse",
  }, selectedClassId, aliases), true);

  assert.equal(belongsToSelectedClass({
    id: "legacy-slug-owned-session",
    classId: "a2-munich",
    className: "A2 Munich Klasse",
  }, selectedClassId, aliases), true);

  // Canonical ownership wins even if the legacy classId happens to match an alias.
  assert.equal(belongsToSelectedClass({
    id: "legacy-canonical-session",
    classId: "A2 Munich Klasse",
    classRecordId: selectedClassId,
    className: "A2 Munich Klasse",
  }, selectedClassId, aliases), true);
});

test("Live Classes and attendance filter discovered sessions before dedupe using compatible aliases", async () => {
  const source = await readFile(compatibilityServicePath, "utf8");

  assert.match(source, /import \{ belongsToSelectedClass \} from "\.\.\/utils\/liveClassSessionOwnership\.js"/);
  assert.match(
    source,
    /const visibleSessions = \[\.\.\.found\.values\(\)\][\s\S]*?\.filter\(isVisibleSession\)[\s\S]*?\.filter\(\(session\) => belongsToSelectedClass\(session, classId, identifiers\)\);/,
  );
  assert.match(source, /return dedupeCompatibleSessionRecords\(visibleSessions, \{ classId \}\);/);
});
