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

test("accepts a student with class membership stored in an array", () => {
  const keys = buildCanonicalClassKeys("Iggo4mbqxlma2XhGhkzJ", {
    name: "A1 Köln Klasse",
  }, "Iggo4mbqxlma2XhGhkzJ");

  assert.equal(studentMatchesCanonicalClass({
    classIds: ["other-class", "Iggo4mbqxlma2XhGhkzJ"],
    classNames: ["A1 Hamburg Klasse", "A1 Koln Klasse"],
  }, keys), true);
});

test("accepts a student with class membership stored as an object", () => {
  const keys = buildCanonicalClassKeys("Iggo4mbqxlma2XhGhkzJ", {
    name: "A1 Köln Klasse",
  }, "Iggo4mbqxlma2XhGhkzJ");

  assert.equal(studentMatchesCanonicalClass({
    enrolledClasses: [
      { id: "other-class", name: "A1 Hamburg Klasse" },
      { id: "Iggo4mbqxlma2XhGhkzJ", name: "A1 Koln Klasse" },
    ],
  }, keys), true);
});

test("accepts a student whose legacy class id matches a class alias", () => {
  const keys = buildCanonicalClassKeys("Iggo4mbqxlma2XhGhkzJ", {
    name: "A1 Köln Klasse",
    legacyClassIds: ["old-class-id"],
    aliases: ["A1 Koln Klasse"],
  }, "Iggo4mbqxlma2XhGhkzJ");

  assert.equal(studentMatchesCanonicalClass({
    classId: "old-class-id",
  }, keys), true);
});
