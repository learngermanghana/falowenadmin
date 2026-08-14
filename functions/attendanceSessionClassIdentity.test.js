const test = require("node:test");
const assert = require("node:assert/strict");

const { acceptClassNameSessionMatch } = require("./attendanceSessionClassIdentity.js");

test("class-name match is rejected when session belongs to a different canonical class", () => {
  const klass = {
    id: "class-a",
    classRecordId: "class-a",
    name: "A1 Berlin",
  };
  const session = {
    className: "A1 Berlin",
    classRecordId: "class-b",
    classId: "class-b",
  };

  assert.equal(acceptClassNameSessionMatch(session, klass), false);
});

test("name-valued classId is rejected when classRecordId proves another owner", () => {
  const klass = {
    id: "class-a",
    classRecordId: "class-a",
    name: "legacy-class-b",
  };
  const session = {
    className: "legacy-class-b",
    classId: "legacy-class-b",
    classRecordId: "class-b",
  };

  assert.equal(acceptClassNameSessionMatch(session, klass), false);
});

test("class-name match is accepted when canonical session id matches the class", () => {
  const klass = {
    id: "class-a",
    classRecordId: "class-a",
    name: "A1 Berlin",
  };
  const session = {
    className: "A1 Berlin",
    classRecordId: "class-a",
  };

  assert.equal(acceptClassNameSessionMatch(session, klass), true);
});

test("legacy name-only sessions remain discoverable", () => {
  const klass = {
    id: "class-a",
    name: "A1 Berlin",
  };

  assert.equal(acceptClassNameSessionMatch({ className: "A1 Berlin" }, klass), true);
  assert.equal(acceptClassNameSessionMatch({ className: "A1 Berlin", classId: "A1 Berlin" }, klass), true);
});
