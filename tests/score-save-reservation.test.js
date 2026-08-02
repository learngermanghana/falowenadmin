import test from "node:test";
import assert from "node:assert/strict";
import {
  SCORE_SAVE_RESERVATION_TTL_MS,
  buildScoreSaveReservation,
  isActiveScoreSaveReservation,
  shouldBlockScoreSave,
} from "../src/utils/scoreSaveReservation.js";

test("builds a bounded pending reservation", () => {
  const now = "2026-08-02T11:00:00.000Z";
  const reservation = buildScoreSaveReservation("token-1", now);
  assert.equal(reservation.saveReservationStatus, "pending");
  assert.equal(reservation.saveReservationToken, "token-1");
  assert.equal(reservation.saveReservationStartedAt, now);
  assert.equal(
    new Date(reservation.saveReservationExpiresAt).getTime() - new Date(now).getTime(),
    SCORE_SAVE_RESERVATION_TTL_MS,
  );
});

test("blocks a second request while the first reservation is active", () => {
  const now = Date.parse("2026-08-02T11:00:00.000Z");
  const existing = {
    saveReservationStatus: "pending",
    saveReservationExpiresAt: "2026-08-02T11:05:00.000Z",
  };
  assert.equal(isActiveScoreSaveReservation(existing, now), true);
  assert.equal(shouldBlockScoreSave(existing, 85, { blockAnyDuplicate: true, now }), true);
});

test("allows takeover after an abandoned reservation expires", () => {
  const now = Date.parse("2026-08-02T11:06:00.000Z");
  const existing = {
    saveReservationStatus: "pending",
    saveReservationExpiresAt: "2026-08-02T11:05:00.000Z",
    sheetSaved: false,
  };
  assert.equal(isActiveScoreSaveReservation(existing, now), false);
  assert.equal(shouldBlockScoreSave(existing, 85, { blockAnyDuplicate: true, now }), false);
});

test("strict duplicate mode blocks an already saved assignment score", () => {
  assert.equal(shouldBlockScoreSave({ sheetSaved: true, score: 72 }, 90, { blockAnyDuplicate: true }), true);
});

test("allowDuplicate bypasses saved-score policy but not an active reservation", () => {
  assert.equal(shouldBlockScoreSave({ sheetSaved: true, score: 72 }, 90, { allowDuplicate: true }), false);
  assert.equal(shouldBlockScoreSave({
    sheetSaved: true,
    score: 72,
    saveReservationStatus: "pending",
    saveReservationExpiresAt: new Date(Date.now() + 60_000).toISOString(),
  }, 90, { allowDuplicate: true }), true);
});
