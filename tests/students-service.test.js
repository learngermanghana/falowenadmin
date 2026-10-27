import test from "node:test";
import assert from "node:assert/strict";

import {
  listPublishedStudentsByClassWithLoader,
  listStudentsByClass,
  listStudentsByClassWithDeps,
} from "../src/services/studentsService.js";

test("matches by full className when present", async () => {
  const rows = [
    { classname: "A2 Stuttgart Klasse", level: "A2", status: "Active", studentcode: "S-001", name: "Student One" },
    { classname: "A2 Berlin Klasse", level: "A2", status: "Active", studentcode: "S-002", name: "Student Two" },
  ];

  const result = await listPublishedStudentsByClassWithLoader("A2 Stuttgart Klasse", async () => rows);

  assert.deepEqual(result.map((s) => s.name), ["Student One"]);
});

test("does not fall back to level matching when class name does not match", async () => {
  const rows = [
    { classname: "", level: "A2", status: "Active", studentcode: "S-001", name: "Student One" },
    { classname: "", level: "B1", status: "Active", studentcode: "S-002", name: "Student Two" },
  ];

  const result = await listPublishedStudentsByClassWithLoader("A2 Stuttgart Klasse", async () => rows);

  assert.deepEqual(result.map((s) => s.name), []);
});

test("normalizes spacing in class name matching", async () => {
  const rows = [
    { classname: "A2   Stuttgart   Klasse", level: "A2", status: "Active", studentcode: "S-001", name: "Student One" },
  ];

  const result = await listPublishedStudentsByClassWithLoader("A2 Stuttgart Klasse", async () => rows);

  assert.equal(result.length, 1);
});

test("excludes inactive students from attendance rosters", async () => {
  const rows = [
    { classname: "A2 Stuttgart Klasse", level: "A2", status: "Paid", studentcode: "S-003", name: "Paid Student" },
    { classname: "A2 Stuttgart Klasse", level: "A2", status: "Inactive", studentcode: "S-004", name: "Inactive Student" },
  ];

  const result = await listPublishedStudentsByClassWithLoader("A2 Stuttgart Klasse", async () => rows);

  assert.deepEqual(result.map((s) => s.name), ["Paid Student"]);
});

test("maps published student email for attendance email selection", async () => {
  const rows = [
    {
      classname: "A2 Stuttgart Klasse",
      level: "A2",
      status: "Active",
      studentcode: "S-005",
      name: "Email Student",
      email: "email.student@example.com",
    },
  ];

  const [student] = await listPublishedStudentsByClassWithLoader("A2 Stuttgart Klasse", async () => rows);

  assert.equal(student.email, "email.student@example.com");
});

test("merges Firestore and published students into one complete roster", async () => {
  const result = await listStudentsByClassWithDeps("class-record-id", {
    className: "A1 Hamburg Klasse",
    loadStudentsByField: async (field, identifier) => {
      if (field === "classId" && identifier === "class-record-id") {
        return [{ id: "current", studentCode: "S-001", name: "Current Student" }];
      }
      return [];
    },
    loadPublishedStudentsByClass: async (identifier) => (
      identifier === "A1 Hamburg Klasse"
        ? [{ id: "sheet", studentCode: "S-002", name: "Sheet Student" }]
        : []
    ),
  });

  assert.deepEqual(result.map((student) => student.name), ["Current Student", "Sheet Student"]);
});

test("deduplicates the same student returned by Firestore and the published sheet", async () => {
  const result = await listStudentsByClassWithDeps("class-record-id", {
    className: "A1 Hamburg Klasse",
    loadStudentsByField: async () => [
      { id: "firestore-doc", studentCode: "S-001", email: "student@example.com", name: "Current Student" },
    ],
    loadPublishedStudentsByClass: async () => [
      { id: "S-001", studentCode: "S-001", email: "student@example.com", name: "Current Student" },
    ],
  });

  assert.equal(result.length, 1);
});

test("public class roster function forwards className and dependency options", async () => {
  const calls = [];
  const result = await listStudentsByClass("class-record-id", {
    className: "A1 Hamburg Klasse",
    loadStudentsByField: async (field, identifier) => {
      calls.push(`${field}:${identifier}`);
      return [];
    },
    loadPublishedStudentsByClass: async (identifier) => (
      identifier === "A1 Hamburg Klasse"
        ? [{ id: "sheet", studentCode: "S-002", name: "Sheet Student" }]
        : []
    ),
  });

  assert.equal(result[0]?.name, "Sheet Student");
  assert.ok(calls.includes("className:A1 Hamburg Klasse"));
});

test("continues loading other roster sources when one Firestore query fails", async () => {
  const result = await listStudentsByClassWithDeps("A1 Hamburg Klasse", {
    loadStudentsByField: async (field) => {
      if (field === "classId") throw new Error("Missing index");
      if (field === "className") return [{ id: "current", name: "Current Student" }];
      return [];
    },
    loadPublishedStudentsByClass: async () => [],
  });

  assert.deepEqual(result.map((student) => student.name), ["Current Student"]);
});

test("falls back to the published sheet when Firestore has no class students", async () => {
  const result = await listStudentsByClassWithDeps("A1 Hamburg Klasse", {
    loadStudentsByField: async () => [],
    loadPublishedStudentsByClass: async () => [{ id: "sheet", name: "Sheet Student" }],
  });

  assert.deepEqual(result.map((student) => student.name), ["Sheet Student"]);
});

test("falls back to the published sheet when Firestore fails", async () => {
  const result = await listStudentsByClassWithDeps("A1 Hamburg Klasse", {
    loadStudentsByField: async () => {
      throw new Error("Firestore unavailable");
    },
    loadPublishedStudentsByClass: async () => [{ id: "sheet", name: "Sheet Student" }],
  });

  assert.deepEqual(result.map((student) => student.name), ["Sheet Student"]);
});
