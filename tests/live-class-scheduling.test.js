import test from "node:test";
import assert from "node:assert/strict";
import { buildClassUrl, calculateClassProgress, calculateCountdown, generateSessionOccurrences, resolveChapterDictionary, selectNextSession, sessionStatusDoesNotArchiveClass, shouldSendReminderForSession, slugifyClassName, zonedLocalToUtcIso } from "../src/utils/liveClassScheduling.js";

test("Ghana timezone conversion stores UTC without one-hour shift", () => {
  assert.equal(zonedLocalToUtcIso("2026-06-20", "09:00", "Africa/Accra"), "2026-06-20T09:00:00.000Z");
});

test("cancelled sessions do not appear as next sessions", () => {
  const next = selectNextSession([
    { startsAt: "2026-06-20T09:00:00.000Z", status: "cancelled" },
    { startsAt: "2026-06-27T09:00:00.000Z", status: "scheduled" },
  ], new Date("2026-06-19T00:00:00.000Z"));
  assert.equal(next.startsAt, "2026-06-27T09:00:00.000Z");
});

test("generated sessions are deterministic for idempotent writes", () => {
  const input = { classId: "abc", startDate: "2026-06-01", endDate: "2026-06-30", timezone: "Africa/Accra", scheduleRules: [{ day: "Sat", startTime: "09:00", durationMinutes: 120 }] };
  assert.deepEqual(generateSessionOccurrences(input), generateSessionOccurrences(input));
  assert.equal(new Set(generateSessionOccurrences(input).map((s) => s.id)).size, generateSessionOccurrences(input).length);
});

test("class remains active after an individual session completes", () => {
  assert.equal(sessionStatusDoesNotArchiveClass("active", "completed"), "active");
});

test("countdown calculation returns days hours and minutes", () => {
  assert.deepEqual(calculateCountdown("2026-06-21T10:30:00.000Z", "2026-06-20T09:00:00.000Z"), { totalMs: 91800000, days: 1, hours: 1, minutes: 30 });
});

test("calendar cancellation and rescheduling sequence data can be represented", () => {
  const cancelled = { uid: "stable", status: "cancelled", sequence: 2 };
  const rescheduled = { uid: "stable", startsAt: "2026-06-21T09:00:00.000Z", sequence: 3 };
  assert.equal(cancelled.uid, rescheduled.uid);
  assert.equal(cancelled.status, "cancelled");
  assert.equal(rescheduled.sequence, 3);
});

test("reminders are not sent for cancelled sessions", () => {
  assert.equal(shouldSendReminderForSession({ status: "cancelled" }), false);
  assert.equal(shouldSendReminderForSession({ status: "scheduled" }), true);
});

test("automatic URL generation is stable from slug", () => {
  assert.equal(slugifyClassName("A1 Dortmund Klasse"), "a1-dortmund-klasse");
  assert.equal(buildClassUrl({ slug: "a1-dortmund-klasse" }), "/classes/a1-dortmund-klasse");
});

test("chapter dictionary resolution loads titles by IDs", () => {
  const chapters = resolveChapterDictionary("A1", ["1.1"]);
  assert.equal(chapters[0].en, "Personal Pronouns and Verb Conjugation");
});

test("progress ignores cancelled sessions", () => {
  assert.equal(calculateClassProgress([{ status: "completed" }, { status: "scheduled" }, { status: "cancelled" }]), 50);
});
