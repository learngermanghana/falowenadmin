import test from "node:test";
import assert from "node:assert/strict";
import {
  buildRescheduleAnnouncement,
  cleanRescheduleLessonTitle,
  resolveRescheduleLessonNumber,
} from "../src/utils/liveClassRescheduleEmail.js";

test("reschedule email uses Day 20 instead of the zero-based Day 19 value", () => {
  const payload = buildRescheduleAnnouncement({
    klass: { name: "A2 Koln Klasse" },
    session: {
      topic: "Lesson 20: Reklamationssituationen",
      curriculumDay: 19,
      curriculumIndex: 20,
      assignmentIds: ["A2-7.20"],
    },
    previousTime: "Tuesday, 14 July 2026 at 19:00",
    newTime: "Wednesday, 15 July 2026 at 19:00",
  });

  assert.equal(payload.topic, "Class rescheduled: A2 Koln Klasse — Day 20");
  assert.equal(payload.lesson, "Day 20: Reklamationssituationen");
  assert.equal(payload.lessonNumber, 20);
  assert.deepEqual(payload.assignmentIds, ["A2-7.20"]);
  assert.doesNotMatch(payload.announcement, /Day 19/);
  assert.doesNotMatch(payload.announcement, /Lesson 20: Reklamationssituationen — Assignment/);
});

test("reschedule email keeps the headline out of the body", () => {
  const payload = buildRescheduleAnnouncement({
    klass: { name: "A2 Koln Klasse" },
    session: {
      topic: "Lesson 20: Reklamationssituationen",
      curriculumIndex: 20,
      assignmentIds: ["A2-7.20"],
    },
    previousTime: "Tuesday, 14 July 2026 at 19:00",
    newTime: "Wednesday, 15 July 2026 at 19:00",
  });

  assert.equal(payload.announcement, [
    "Hello everyone,",
    "The live class for A2 Koln Klasse has been rescheduled.",
    "Lesson: Day 20: Reklamationssituationen",
    "Assignment: A2-7.20",
    "Previous time: Tuesday, 14 July 2026 at 19:00",
    "New time: Wednesday, 15 July 2026 at 19:00",
    "Please check your Falowen homepage for the updated class time.",
  ].join("\n\n"));
  assert.equal(payload.announcement.includes(payload.topic), false);
  assert.equal((payload.announcement.match(/A2 Koln Klasse/g) || []).length, 1);
});

test("one reschedule announcement summarizes all following shifted lessons", () => {
  const payload = buildRescheduleAnnouncement({
    klass: { name: "A2 Koln Klasse" },
    session: {
      topic: "Lesson 20: Reklamationssituationen",
      curriculumIndex: 20,
      assignmentIds: ["A2-7.20"],
    },
    previousTime: "Tuesday, 14 July 2026 at 19:00",
    newTime: "Wednesday, 15 July 2026 at 19:00",
    affectedCount: 9,
    lastAffectedSession: {
      topic: "Lesson 28: Über die Zukunft sprechen",
      curriculumIndex: 28,
      assignmentIds: ["A2-10.28"],
    },
    lastAffectedTime: "Tuesday, 04 August 2026 at 19:00",
  });

  assert.equal(payload.affectedCount, 9);
  assert.equal(payload.followingCount, 8);
  assert.equal(payload.lastAffectedLesson, "Lesson 28: Über die Zukunft sprechen");
  assert.match(payload.announcement, /8 following lessons were also shifted/);
  assert.match(payload.announcement, /Last affected lesson: Lesson 28: Über die Zukunft sprechen/);
  assert.match(payload.announcement, /Last affected time: Tuesday, 04 August 2026 at 19:00/);
  assert.equal((payload.announcement.match(/Class rescheduled:/g) || []).length, 0);
  assert.equal((payload.announcement.match(/Reklamationssituationen/g) || []).length, 1);
});

test("topic numbering wins for orientation and assignment IDs provide a fallback", () => {
  assert.equal(resolveRescheduleLessonNumber({
    topic: "Day 0: Orientation and Tutorial",
    curriculumIndex: 1,
    assignmentIds: ["A1-TUTORIAL"],
  }), 0);

  assert.equal(resolveRescheduleLessonNumber({
    topic: "Reklamationssituationen",
    assignmentIds: ["A2-7.20"],
  }), 20);

  assert.equal(
    cleanRescheduleLessonTitle({ topic: "Day 20 — Reklamationssituationen — Assignment A2-7.20" }),
    "Reklamationssituationen",
  );
});
