import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { _test } = require("../functions/classSessionReminderEmails.js");

const {
  buildReminderMessage,
  rowForReminder,
  zoomDetails,
} = _test;

const JOIN_URL = "https://us06web.zoom.us/j/6886900916?pwd=bEdtR3RLQ2dGTytvYzNrMUV3eFJwUT09";
const CHAT_URL = "https://us06web.zoom.us/launch/jc/6886900916";

function reminderFixture() {
  return {
    student: { name: "Felix", email: "felix@example.com" },
    klass: {
      id: "a1-berlin",
      name: "A1 Berlin Klasse",
      levelId: "A1",
      timezone: "Africa/Accra",
      zoomUrl: "https://example.com/old-class-link",
      zoomMeetingId: "OLD-ID",
      zoomPasscode: "old-passcode",
    },
    session: {
      id: "a1-berlin-day-1",
      startsAt: "2026-07-22T17:00:00.000Z",
      topic: "German cases",
    },
  };
}

test("30-minute and 10-minute reminders always use the standard Zoom meeting", () => {
  const fixture = reminderFixture();
  const zoom = zoomDetails(fixture.klass, {
    joinUrl: "https://example.com/old-profile-link",
    meetingId: "OLD-PROFILE-ID",
  });

  assert.deepEqual(zoom, {
    url: JOIN_URL,
    chatUrl: CHAT_URL,
    meetingId: "688 690 0916",
    passcode: "german",
    sip: "6886900916@zoomcrc.com",
  });

  for (const leadMin of [30, 10]) {
    const message = buildReminderMessage({ ...fixture, leadMin, zoom });
    assert.match(message, new RegExp(`starts in ${leadMin} minutes`));
    assert.match(message, /Join Zoom Meeting/);
    assert.ok(message.includes(JOIN_URL));
    assert.match(message, /Meeting chat link/);
    assert.ok(message.includes(CHAT_URL));
    assert.match(message, /Meeting ID: 688 690 0916/);
    assert.match(message, /Passcode: german/);
    assert.match(message, /Join by SIP/);
    assert.match(message, /6886900916@zoomcrc\.com/);

    const row = rowForReminder({
      klass: fixture.klass,
      student: fixture.student,
      session: fixture.session,
      leadMin,
      message,
    });
    assert.equal(row.link, JOIN_URL);
  }
});
