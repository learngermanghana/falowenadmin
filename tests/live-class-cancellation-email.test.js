import test from "node:test";
import assert from "node:assert/strict";
import {
  buildCancellationAnnouncement,
  findNextScheduledSession,
  getCancellationRecipients,
  isEligibleCancellationRecipient,
} from "../src/utils/liveClassCancellationEmail.js";

test("cancellation recipients include active students with email only", () => {
  assert.equal(isEligibleCancellationRecipient({ email: "student@example.com", status: "active", role: "student" }), true);
  assert.equal(isEligibleCancellationRecipient({ email: "", status: "active", role: "student" }), false);
  assert.equal(isEligibleCancellationRecipient({ email: "staff@example.com", status: "active", role: "staff" }), false);
  assert.equal(isEligibleCancellationRecipient({ email: "old@example.com", status: "archived", role: "student" }), false);
});

test("cancellation recipients are deduplicated by normalized email", () => {
  const recipients = getCancellationRecipients([
    { name: "Ama", email: " AMA@example.com ", status: "paid" },
    { name: "Ama duplicate", email: "ama@example.com", status: "active" },
    { name: "Kojo", contactEmail: "kojo@example.com", status: "enrolled" },
    { name: "Inactive", email: "inactive@example.com", status: "inactive" },
  ]);

  assert.deepEqual(recipients.map((recipient) => recipient.email), ["ama@example.com", "kojo@example.com"]);
});

test("next scheduled session ignores cancelled and completed sessions", () => {
  const nextSession = findNextScheduledSession([
    { id: "current", startsAt: "2026-06-20T09:00:00.000Z", status: "scheduled" },
    { id: "cancelled", startsAt: "2026-06-21T09:00:00.000Z", status: "cancelled" },
    { id: "completed", startsAt: "2026-06-22T09:00:00.000Z", status: "completed" },
    { id: "next", startsAt: "2026-06-23T09:00:00.000Z", status: "scheduled" },
  ], { id: "current", startsAt: "2026-06-20T09:00:00.000Z" });

  assert.equal(nextSession.id, "next");
});

test("cancellation announcement contains class, reason, cancelled time and next class", () => {
  const payload = buildCancellationAnnouncement({
    klass: { name: "A1 Berlin Klasse", slug: "a1-berlin-klasse" },
    session: { startsAt: "2026-06-20T09:00:00.000Z" },
    reason: "Tutor is unwell.",
    nextSession: { startsAt: "2026-06-23T09:00:00.000Z" },
  });

  assert.match(payload.topic, /Class Cancelled: A1 Berlin Klasse/);
  assert.match(payload.announcement, /Tutor is unwell/);
  assert.match(payload.announcement, /Saturday, 20 June 2026 at 09:00/);
  assert.match(payload.announcement, /Tuesday, 23 June 2026 at 09:00/);
  assert.equal(payload.link, "/classes/a1-berlin-klasse");
  assert.equal(payload.date, "2026-06-20");
});
