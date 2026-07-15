import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const overviewPath = new URL("../src/pages/AttendanceOverviewPage.jsx", import.meta.url);
const trackerPath = new URL("../src/components/ClassAttendanceTracker.jsx", import.meta.url);
const studentsPath = new URL("../src/components/LiveClassStudentsPanel.jsx", import.meta.url);
const servicePath = new URL("../src/services/attendanceAnalyticsService.js", import.meta.url);
const attendanceServicePath = new URL("../src/services/attendanceService.js", import.meta.url);

async function source(path) {
  return readFile(path, "utf8");
}

test("Attendance overview opens and focuses the selected-class tracker", async () => {
  const overview = await source(overviewPath);
  assert.match(overview, /ClassAttendanceTracker/);
  assert.match(overview, /View attendance tracker/);
  assert.match(overview, /Class shown in tracker/);
  assert.match(overview, /Track QR check-ins, manual attendance, late arrivals and absence patterns/);
  assert.match(overview, /id="attendance-tracker-panel"/);
  assert.match(overview, /scrollIntoView\(\{ behavior: "smooth", block: "start" \}\)/);
  assert.match(overview, /trackerHeadingRef\.current\?\.focus/);
  assert.match(overview, /aria-controls="attendance-tracker-panel"/);
});

test("Attendance overview explains and displays automatic email delivery status", async () => {
  const overview = await source(overviewPath);
  assert.match(overview, /loadAttendanceEmailSettings/);
  assert.match(overview, /Attendance email:/);
  assert.match(overview, /The job checks every 15 minutes/);
  assert.match(overview, /after class ends/);
  assert.match(overview, /QR check-in window closes/);
  assert.match(overview, /Delivery:/);
  assert.match(overview, /Configured/);
  assert.match(overview, /Not configured/);
  assert.match(overview, /Last job:/);
  assert.match(overview, /Last send:/);
  assert.match(overview, /Last status:/);
  assert.match(overview, /Delivery job error:/);
  assert.match(overview, /Open email settings/);
});

test("class tracker provides check-in visibility, alerts, filters and CSV", async () => {
  const tracker = await source(trackerPath);
  assert.match(tracker, /Refresh check-ins/);
  assert.match(tracker, /Checked in today/);
  assert.match(tracker, /Missing today/);
  assert.match(tracker, /Consecutive absence alerts/);
  assert.match(tracker, /Student attendance summary/);
  assert.match(tracker, /Session register/);
  assert.match(tracker, /Detailed attendance data/);
  assert.match(tracker, /Export filtered CSV/);
  assert.match(tracker, /Check-in time/);
});

test("Live Classes student profile shows attendance history", async () => {
  const students = await source(studentsPath);
  assert.match(students, /loadClassAttendanceAnalytics/);
  assert.match(students, /Attendance history/);
  assert.match(students, /Sessions held/);
  assert.match(students, /Consecutive absences/);
  assert.match(students, /Last check-in/);
  assert.match(students, /QR scans and manual attendance/);
});

test("analytics loader merges saved attendance and QR check-ins", async () => {
  const [service, attendanceService] = await Promise.all([
    source(servicePath),
    source(attendanceServicePath),
  ]);
  assert.match(service, /loadAttendanceFromFirestore/);
  assert.match(service, /listClassCheckins/);
  assert.match(service, /buildAttendanceAnalytics/);
  assert.match(attendanceService, /collectionGroup\(db, "checkins"\)/);
  assert.match(attendanceService, /listClassCheckinsBySessionPaths/);
});
