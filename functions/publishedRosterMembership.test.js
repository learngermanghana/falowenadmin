const test = require("node:test");
const assert = require("node:assert/strict");
const {
  parseCsv,
  publishedRosterContainsStudent,
} = require("./publishedRosterMembership.js");
const { buildCanonicalClassKeys } = require("./checkinClassMembership.js");

test("parses quoted published sheet rows", () => {
  const rows = parseCsv('Name,Email,Class Name,Status\n"Doe, Jane",jane@example.com,A2 Koln Klasse,active\n');
  assert.equal(rows.length, 1);
  assert.equal(rows[0].name, "Doe, Jane");
  assert.equal(rows[0].email, "jane@example.com");
  assert.equal(rows[0].classname, "A2 Koln Klasse");
});

test("accepts an active published-roster student for the canonical class", () => {
  const rows = [
    { email: "rahim@example.com", classname: "A1 Koln Klasse", status: "active" },
  ];
  const keys = buildCanonicalClassKeys("class-id", { name: "A1 Köln Klasse" }, "class-id");
  assert.equal(publishedRosterContainsStudent(rows, "RAHIM@example.com", keys), true);
});

test("rejects inactive or wrong-class published-roster rows", () => {
  const keys = buildCanonicalClassKeys("class-id", { name: "A2 Koln Klasse" }, "class-id");
  assert.equal(publishedRosterContainsStudent([
    { email: "student@example.com", classname: "A2 Koln Klasse", status: "withdrawn" },
  ], "student@example.com", keys), false);
  assert.equal(publishedRosterContainsStudent([
    { email: "student@example.com", classname: "A2 Hamburg Klasse", status: "active" },
  ], "student@example.com", keys), false);
});
