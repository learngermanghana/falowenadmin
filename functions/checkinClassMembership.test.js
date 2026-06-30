const test = require("node:test");
const assert = require("node:assert/strict");
const {
  normalizeClassMatchKey,
  buildCanonicalClassKeys,
  studentMatchesCanonicalClass,
} = require("./checkinClassMembership.js");

test("normalizes accents and spacing for class-name comparison", () => {
  assert.equal(normalizeClassMatchKey("  A1 Köln   Klasse "), "a1 koln klasse");
});

test("accepts a student whose classRecordId matches the canonical class document", () => {
  const keys = buildCanonicalClassKeys("Iggo4mbqxlma2XhGhkzJ", {
    name: "A1 Köln Klasse",
  }, "Iggo4mbqxlma2XhGhkzJ");

  assert.equal(studentMatchesCanonicalClass({
    classId: "old-class-id",
    classRecordId: "Iggo4mbqxlma2XhGhkzJ",
    className: "A1 Koln Klasse",
  }, keys), true);
});

test("accepts the canonical class name when an older classId is still stored", () => {
  const keys = buildCanonicalClassKeys("Iggo4mbqxlma2XhGhkzJ", {
    name: "A1 Köln Klasse",
  });

  assert.equal(studentMatchesCanonicalClass({
    classId: "old-class-id",
    className: "A1 Koln Klasse",
  }, keys), true);
});

test("rejects a student whose identifiers belong to another class", () => {
  const keys = buildCanonicalClassKeys("Iggo4mbqxlma2XhGhkzJ", {
    name: "A1 Köln Klasse",
  });

  assert.equal(studentMatchesCanonicalClass({
    classId: "another-class",
    className: "A1 Hamburg Klasse",
  }, keys), false);
});
