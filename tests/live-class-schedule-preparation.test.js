import test from "node:test";
import assert from "node:assert/strict";
import { isHistoricalSchedulePayload } from "../src/utils/liveClassScheduleMode.js";

test("past live class dates do not implicitly force historical scheduling", () => {
  assert.equal(isHistoricalSchedulePayload({ startDate: "2026-06-01", endDate: "2026-06-02" }), false);
});

test("active classes ignore stale historical flags from older auto-detection", () => {
  assert.equal(isHistoricalSchedulePayload({ historical: true, status: "active", startDate: "2026-06-01", endDate: "2026-06-02" }), false);
  assert.equal(isHistoricalSchedulePayload({ historical: true, status: "upcoming", startDate: "2026-06-01", endDate: "2026-06-02" }), false);
});

test("historical scheduling remains explicit", () => {
  assert.equal(isHistoricalSchedulePayload({ historicalMode: true, status: "active", startDate: "2026-06-01", endDate: "2026-06-02" }), true);
  assert.equal(isHistoricalSchedulePayload({ historical: true, status: "graduated", startDate: "2026-06-01", endDate: "2026-06-02" }), true);
  assert.equal(isHistoricalSchedulePayload({ historical: true, status: "archived", startDate: "2026-06-01", endDate: "2026-06-02" }), true);
});
