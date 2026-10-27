import test from "node:test";
import assert from "node:assert/strict";
import {
  buildBulkPresentRepair,
  isBulkRepairEligibleSession,
} from "../src/utils/bulkAttendanceRepair.js";

test("bulk repair marks selected students present across multiple sessions", () => {
  const attendance = {
    day1: {
      id: "day1",
      status: "completed",
      students: {
        A1: { name: "Ama", present: false },
        A2: { name: "Kojo", present: true },
      },
    },
    day2: {
      id: "day2",
      status: "scheduled",
      students: {
        A1: { name: "Ama", present: false },
        A2: { name: "Kojo", present: false },
      },
    },
  };

  const result = buildBulkPresentRepair({
    attendance,
    sessionIds: ["day1", "day2"],
    studentCodes: ["A1", "A2"],
  });

  assert.equal(result.changedRecords, 3);
  assert.deepEqual(result.changedSessionIds, ["day1", "day2"]);
  assert.equal(result.attendance.day1.students.A1.present, true);
  assert.equal(result.attendance.day1.students.A2.present, true);
  assert.equal(result.attendance.day2.students.A1.present, true);
  assert.equal(result.attendance.day2.students.A2.present, true);
});

test("bulk repair never changes cancelled sessions", () => {
  const attendance = {
    cancelledDay: {
      id: "cancelledDay",
      status: "cancelled",
      students: { A1: { name: "Ama", present: false } },
    },
  };

  const result = buildBulkPresentRepair({
    attendance,
    sessionIds: ["cancelledDay"],
    studentCodes: ["A1"],
  });

  assert.equal(result.changedRecords, 0);
  assert.deepEqual(result.changedSessionIds, []);
  assert.equal(result.attendance.cancelledDay.students.A1.present, false);
  assert.equal(isBulkRepairEligibleSession(attendance.cancelledDay), false);
});
