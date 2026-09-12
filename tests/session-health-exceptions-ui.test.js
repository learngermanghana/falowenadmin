import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const wrapper = fs.readFileSync(new URL("../src/pages/LiveClassesPage.js", import.meta.url), "utf8");
const center = fs.readFileSync(new URL("../src/components/SessionHealthExceptionsCenter.jsx", import.meta.url), "utf8");
const service = fs.readFileSync(new URL("../src/services/sessionHealthExceptionsService.js", import.meta.url), "utf8");
const analyzer = fs.readFileSync(new URL("../src/utils/sessionHealthExceptions.js", import.meta.url), "utf8");

test("Live Classes exposes a dedicated Health & Exceptions tab", () => {
  assert.match(wrapper, /SessionHealthExceptionsCenter/);
  assert.match(wrapper, /const TAB_HEALTH = "health"/);
  assert.match(wrapper, /Health & Exceptions/);
  assert.match(wrapper, /live-classes-panel-health/);
});

test("health center cross-checks canonical dashboard and raw operational attendance state", () => {
  assert.match(center, /getCompatibleClassDashboard/);
  assert.match(center, /loadSessionOperationalState/);
  assert.match(center, /buildSessionHealthExceptions/);
  assert.match(center, /Action required/);
  assert.match(center, /Needs review/);
  assert.match(center, /Open this session in Attendance/);
});

test("operational loader preserves raw attendance and nested check-in fields", () => {
  assert.match(service, /collection\(db, "attendance", safeClassId, "sessions"\)/);
  assert.match(service, /"checkins"/);
  assert.match(service, /attendanceBySessionId\[item\.id\] = \{ id: item\.id, \.\.\.item\.data\(\) \}/);
  assert.match(service, /Promise\.allSettled/);
  assert.match(service, /checkinLoadFailures/);
});

test("health analyzer protects cancellation, check-in, attendance and communication invariants", () => {
  [
    "cancelled-reminder-leak",
    "cancelled-checkin-open",
    "checkin-after-cancellation",
    "attendance-time-mismatch",
    "checkin-not-reflected",
    "assignment-attendance-not-present",
    "checkin-did-not-open",
    "class-reminder-email",
    "attendance-email",
  ].forEach((marker) => assert.match(analyzer, new RegExp(marker)));
});
