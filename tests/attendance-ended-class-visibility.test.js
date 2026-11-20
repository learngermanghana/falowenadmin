import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  chooseAttendanceSession,
  isActiveCheckinSession,
  isActiveLiveClass,
} from "../src/utils/attendanceClassVisibility.js";
import { classTimingSummary } from "../src/utils/attendanceClassTiming.js";

const now = new Date("2026-11-20T18:00:00.000Z");
const bonn = {
  id: "b1-bonn", name: "B1 Bonn Klasse", status: "active", levelId: "B1",
  timezone: "Africa/Accra", startDate: "2026-08-30", endDate: "2026-11-14",
};
const speakingMock = {
  id: "b1-speaking-mock", assignmentIds: ["B1-7.23"],
  topic: "Day 23: Goethe B1 Speaking Mock",
  status: "completed", startsAt: "2026-11-21T07:00:00.000Z",
  endsAt: "2026-11-21T08:30:00.000Z",
};

test("an active flag cannot keep B1 Bonn open after its official end date", () => {
  assert.equal(isActiveLiveClass(bonn, now), false);
  assert.equal(isActiveLiveClass({ ...bonn, status: "graduated", endDate: "2026-12-20" }, now), false);
  assert.equal(isActiveLiveClass({ ...bonn, endDate: "2026-11-20" }, now), true);
  assert.equal(isActiveLiveClass({ ...bonn, endDate: "2026-11-21" }, now), true);
});

test("ended class has no default attendance even when a completed app mock is dated later", () => {
  assert.equal(isActiveCheckinSession(speakingMock, bonn, now), false);
  assert.equal(chooseAttendanceSession([speakingMock], bonn, "", now), null);
  assert.equal(chooseAttendanceSession([speakingMock], bonn, speakingMock.id, now)?.id, speakingMock.id);
  assert.equal(classTimingSummary(bonn, [speakingMock], now).label, "No upcoming class");
});

test("app-only assessments are not live check-ins in ongoing classes", () => {
  const klass = { ...bonn, endDate: "2026-12-20" };
  const upcomingMock = { ...speakingMock, status: "scheduled" };
  const teaching = {
    id: "b1-day-24", status: "scheduled", assignmentIds: ["B1-8.24"],
    startsAt: "2026-11-22T18:00:00.000Z", endsAt: "2026-11-22T19:30:00.000Z",
  };
  assert.equal(isActiveCheckinSession(upcomingMock, klass, now), false);
  assert.equal(chooseAttendanceSession([upcomingMock, teaching], klass, "", now)?.id, teaching.id);
  assert.equal(classTimingSummary(klass, [upcomingMock, teaching], now).label, "Sun · 18:00");
});

test("out-of-term sessions cannot appear as live attendance despite a scheduled status", () => {
  const klass = { ...bonn, endDate: "2026-11-20" };
  const extra = { id: "extra", assignmentIds: ["B1-8.24"], status: "scheduled",
    startsAt: "2026-11-21T18:00:00Z", endsAt: "2026-11-21T19:30:00Z" };
  assert.equal(isActiveCheckinSession(extra, klass, now), false);
  assert.equal(chooseAttendanceSession([extra], klass, "", now), null);
  assert.equal(classTimingSummary(klass, [extra], now).label, "No upcoming class");
});

test("an overdue live session stays available for staff to end it", () => {
  const klass = { ...bonn, endDate: "2026-11-20" };
  const live = { id: "ongoing", assignmentIds: ["B1-7.22"], status: "live",
    startsAt: "2026-11-20T15:00:00Z", endsAt: "2026-11-20T16:30:00Z" };
  assert.equal(isActiveCheckinSession(live, klass, now), true);
  assert.equal(chooseAttendanceSession([live], klass, "", now)?.id, "ongoing");
});

test("attendance overview and session page keep history, but do not auto-pick past sessions", async () => {
  const [overview, checkin] = await Promise.all([
    readFile(new URL("../src/pages/AttendanceOverviewPage.jsx", import.meta.url), "utf8"),
    readFile(new URL("../src/pages/CanonicalAttendancePageV3.jsx", import.meta.url), "utf8"),
  ]);
  assert.match(overview, /isActiveLiveClass\(klass, todayAnchor\)/);
  assert.match(checkin, /chooseAttendanceSession\(visibleSessions, dashboard\.klass, requestedId\)/);
  assert.match(checkin, /View past sessions/);
  assert.match(checkin, /No new check-in can be opened/);
  assert.match(checkin, /selectedIsActiveCheckin/);
  assert.match(checkin, /setSelectedId\(chooseAttendanceSession\(nextSessions, klass\)\?\.id \|\| ""\)/);
});
