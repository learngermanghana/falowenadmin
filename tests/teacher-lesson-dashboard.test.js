import test from "node:test";
import assert from "node:assert/strict";

import { getSlidesByCourse } from "../src/data/teachingSlides.js";
import {
  buildTeacherRosterReadiness,
  grammarTargetForSlide,
  learnerLessonUrl,
  previousTeacherLesson,
  resolveTeacherLessonSlide,
  selectTeacherLessonSession,
  summarizeTeacherReadiness,
  writingFocusForSlide,
} from "../src/utils/teacherLessonDashboard.js";

test("teacher dashboard resolves the active session before the next session", () => {
  const now = new Date("2026-09-19T15:00:00.000Z");
  const active = { id: "active", startsAt: "2026-09-19T14:30:00.000Z", endsAt: "2026-09-19T16:00:00.000Z", status: "scheduled" };
  const next = { id: "next", startsAt: "2026-09-20T14:30:00.000Z", endsAt: "2026-09-20T16:00:00.000Z", status: "scheduled" };
  const selected = selectTeacherLessonSession({ sessions: [next, active], nextSession: next }, now);
  assert.equal(selected.id, "active");
});

test("teacher dashboard resolves a canonical teaching slide from session assignment ids", () => {
  const expected = getSlidesByCourse("C1")[0];
  const slide = resolveTeacherLessonSlide({
    dashboard: { klass: { resolvedLevelId: "C1" } },
    session: { assignmentIds: [expected.assignmentId] },
  });
  assert.equal(slide.id, expected.id);
  assert.equal(slide.title, expected.title);
});

test("teacher dashboard exposes learner link, grammar and writing focus", () => {
  const slide = getSlidesByCourse("C1")[0];
  assert.equal(learnerLessonUrl(slide), "https://www.falowen.app/campus/course/lesson/C1/1");
  assert.match(grammarTargetForSlide(slide), /Relativsätze mit Präpositionen/i);
  assert.ok(writingFocusForSlide(slide).length > 20);
  assert.equal(previousTeacherLesson(slide), null);

  const day2 = getSlidesByCourse("C1")[1];
  assert.equal(previousTeacherLesson(day2)?.id, slide.id);
});

test("roster readiness combines previous/current submissions, latest score and attendance", () => {
  const slides = getSlidesByCourse("B1");
  const previousSlide = slides[0];
  const currentSlide = slides[1];
  const students = [
    { studentCode: "ST001", name: "Ready Student" },
    { studentCode: "ST002", name: "Needs Attention" },
  ];
  const submissions = [
    { studentCode: "ST001", assignmentId: previousSlide.assignmentId, finalScore: 78, createdAt: new Date("2026-09-18T10:00:00Z") },
    { studentCode: "ST001", assignmentId: currentSlide.assignmentId, finalScore: 82, createdAt: new Date("2026-09-19T10:00:00Z") },
    { studentCode: "ST002", assignmentId: previousSlide.assignmentId, finalScore: 45, createdAt: new Date("2026-09-18T10:00:00Z") },
  ];
  const attendanceAnalytics = {
    studentSummaries: [
      { studentCode: "ST001", attendancePercent: 92, consecutiveAbsences: 0 },
      { studentCode: "ST002", attendancePercent: 55, consecutiveAbsences: 2 },
    ],
  };

  const rows = buildTeacherRosterReadiness({ students, submissions, currentSlide, previousSlide, attendanceAnalytics });
  const ready = rows.find((row) => row.studentCode === "ST001");
  const attention = rows.find((row) => row.studentCode === "ST002");

  assert.equal(ready.previousComplete, true);
  assert.equal(ready.currentStarted, true);
  assert.equal(ready.latestScore, 82);
  assert.equal(ready.attendancePercent, 92);

  assert.equal(attention.previousComplete, true);
  assert.equal(attention.currentStarted, false);
  assert.equal(attention.latestScore, 45);
  assert.equal(attention.consecutiveAbsences, 2);

  assert.deepEqual(summarizeTeacherReadiness(rows), {
    total: 2,
    previousReady: 2,
    currentStarted: 1,
    needsAttention: 1,
  });
});

test("Teacher Lesson Dashboard route and quick actions stay wired", async () => {
  const fs = await import("node:fs/promises");
  const [app, dashboard, page] = await Promise.all([
    fs.readFile(new URL("../src/App.jsx", import.meta.url), "utf8"),
    fs.readFile(new URL("../src/pages/DashboardPage.jsx", import.meta.url), "utf8"),
    fs.readFile(new URL("../src/pages/TeacherLessonDashboardPage.jsx", import.meta.url), "utf8"),
  ]);

  assert.match(app, /path="\/lesson-dashboard"/);
  assert.match(dashboard, /Teacher Lesson Dashboard/);
  assert.match(page, /Open student lesson/);
  assert.match(page, /Start class/);
  assert.match(page, /Fair Pick/);
  assert.match(page, /Next question/);
  assert.match(page, /Grammar → Speak → Write → Workbook\/Submit/);
});


test("teacher dashboard opens core lesson before expensive readiness scans", async () => {
  const fs = await import("node:fs/promises");
  const page = await fs.readFile(new URL("../src/pages/TeacherLessonDashboardPage.jsx", import.meta.url), "utf8");

  const coreLoad = page.indexOf("getCompatibleClassDashboard(selectedClassId)");
  const coreReady = page.indexOf("setLoadingLesson(false)", coreLoad);
  const readinessLoad = page.indexOf("loadSubmissions({ includeMarked: true })", coreLoad);

  assert.ok(coreLoad >= 0);
  assert.ok(coreReady > coreLoad);
  assert.ok(readinessLoad > coreReady);
  assert.match(page, /Promise\.allSettled\(\[/);
});
