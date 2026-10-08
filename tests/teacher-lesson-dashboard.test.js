import test from "node:test";
import assert from "node:assert/strict";

import { getSlidesByCourse } from "../src/data/teachingSlides.js";
import {
  buildTeacherRosterReadiness,
  grammarTargetForSlide,
  learnerLessonUrl,
  learnerLessonLinksForAttendanceSession,
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

test("Teacher Lesson Dashboard stays available by route but is hidden from normal Admin navigation", async () => {
  const fs = await import("node:fs/promises");
  const [app, dashboard, page] = await Promise.all([
    fs.readFile(new URL("../src/App.jsx", import.meta.url), "utf8"),
    fs.readFile(new URL("../src/pages/DashboardPage.jsx", import.meta.url), "utf8"),
    fs.readFile(new URL("../src/pages/TeacherLessonDashboardPage.jsx", import.meta.url), "utf8"),
  ]);

  assert.match(app, /path="\/lesson-dashboard"/);
  assert.doesNotMatch(app, />Lesson Dashboard<\/Link>/);
  assert.doesNotMatch(app, />Participation<\/Link>/);
  assert.doesNotMatch(dashboard, /Teacher Lesson Dashboard/);
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


test("Admin top bar exposes the deployed commit badge", async () => {
  const fs = await import("node:fs/promises");
  const [app, vite, css] = await Promise.all([
    fs.readFile(new URL("../src/App.jsx", import.meta.url), "utf8"),
    fs.readFile(new URL("../vite.config.js", import.meta.url), "utf8"),
    fs.readFile(new URL("../src/App.css", import.meta.url), "utf8"),
  ]);

  assert.match(vite, /VERCEL_GIT_COMMIT_SHA/);
  assert.match(vite, /VITE_FALOWEN_BUILD_SHA/);
  assert.match(app, /ADMIN_BUILD_LABEL/);
  assert.match(app, /Admin · \{ADMIN_BUILD_LABEL\}/);
  assert.match(app, /Falowen Admin build/);
  assert.match(css, /\.topbar-build-badge/);
});

test("attendance learner links use A1 chapters and mapped A2 lesson days", () => {
  assert.equal(learnerLessonUrl({ course: "A1", assignmentId: "A1-3.5", dayNumber: 13 }), "https://www.falowen.app/campus/course/a1-day-13-revision-numbers-time-and-prices-workbook");
  assert.equal(learnerLessonUrl({ course: "A1", assignmentId: "A1-1.1-PRACTICE", dayNumber: 4 }), "https://www.falowen.app/campus/course/a1-day-3-schreiben-sprechen-kapitel-1-1-workbook");
  const a2 = resolveTeacherLessonSlide({ session: { assignmentIds: ["A2-3.6"] } });
  assert.equal(learnerLessonUrl(a2), "https://www.falowen.app/campus/course/a2-day-6-moebel-und-raeume-workbook");
  assert.equal(learnerLessonUrl({ course: "A1", assignmentId: "unknown", dayNumber: 13 }), "https://www.falowen.app/campus/course");
});

test("Attendance Open lesson uses registered workbook destinations instead of generic lesson hubs", () => {
  const examples = [
    ["A1", "A1-0.2"],
    ["A2", "A2-3.6"],
    ["B1", "B1-6.18"],
  ];
  for (const [course, assignmentId] of examples) {
    const slide = getSlidesByCourse(course).find((item) => item.assignmentId === assignmentId);
    assert.ok(slide, `${assignmentId} teaching slide is required`);
    assert.ok(slide.workbookConnection?.workbookUrl, `${assignmentId} needs an exact workbook destination`);
    assert.equal(
      learnerLessonUrl(slide),
      `https://www.falowen.app${slide.workbookConnection.workbookUrl}`,
      `${assignmentId} must open its assigned workbook page, not an adjacent course day`,
    );
  }
});

test("Attendance falls back to the learner A1 catalog when the Admin slide has no workbook URL", () => {
  const a1Day16 = getSlidesByCourse("A1").find((item) => item.assignmentId === "A1-9");
  assert.ok(a1Day16);
  assert.equal(learnerLessonUrl(a1Day16), "https://www.falowen.app/campus/course/a1-day-16-food-and-negation-food-and-daily-life-workbook");
});

test("Attendance exposes both A1 lessons on one class day instead of dropping the second chapter", () => {
  const links = learnerLessonLinksForAttendanceSession({
    session: { assignmentIds: ["A1-0.2", "A1-1.1"] },
    dashboard: { klass: { levelId: "A1" } },
  });
  assert.deepEqual(links.map((link) => link.assignmentId), ["A1-0.2", "A1-1.1"]);
  assert.deepEqual(links.map((link) => link.label), ["Open Chapter 0.2", "Open Chapter 1.1"]);
  assert.equal(new Set(links.map((link) => link.url)).size, 2);
  assert.ok(links.every((link) => link.url.startsWith("https://www.falowen.app/campus/course/")));
});

test("Attendance resolves a lesson from its class/day when assignment IDs are missing", () => {
  const links = learnerLessonLinksForAttendanceSession({
    session: { assignmentIds: [], curriculumDay: 18 },
    dashboard: { klass: { levelId: "B1" } },
  });
  assert.equal(links.length, 1);
  assert.equal(links[0].assignmentId, "B1-6.18");
  assert.match(links[0].url, /\/campus\/course\/lesson\/B1\/18\?view=workbook$/);
});

test("A1 chapter 9 and chapter 10 open their distinct published Day 16 workbook pages", () => {
  const chapter9 = learnerLessonUrl({ course: "A1", assignmentId: "A1-9", dayNumber: 16 });
  const chapter10 = learnerLessonUrl({ course: "A1", assignmentId: "A1-10", dayNumber: 16 });
  assert.equal(chapter9, "https://www.falowen.app/campus/course/a1-day-16-food-and-negation-food-and-daily-life-workbook");
  assert.equal(chapter10, "https://www.falowen.app/campus/course/a1-day-16-food-and-negation-kapitel-10-workbook");
  assert.notEqual(chapter9, chapter10);
  assert.equal(learnerLessonUrl({ course: "A1", assignmentId: "A1-99", dayNumber: 16 }), "https://www.falowen.app/campus/course");
});

test("Attendance refuses off-site lesson destinations", () => {
  const slide = {
    course: "B1",
    dayNumber: 18,
    assignmentId: "B1-6.18",
    workbookConnection: { workbookUrl: "https://other.example/attacker-lesson" },
  };
  assert.equal(learnerLessonUrl(slide), "https://www.falowen.app/campus/course/lesson/B1/18");
});

test("Both attendance screens render links to the same exact Course Book URLs", async () => {
  const fs = await import("node:fs/promises");
  const dashboard = await fs.readFile(new URL("../src/pages/CanonicalAttendancePageV3.jsx", import.meta.url), "utf8");
  const display = await fs.readFile(new URL("../src/pages/CheckinDisplayPage.jsx", import.meta.url), "utf8");
  assert.match(dashboard, /learnerLessonLinksForAttendanceSession/);
  assert.match(dashboard, /lessonLinks\.map/);
  assert.match(display, /learnerLessonUrl\(slide\)/);
  assert.match(display, /url\.startsWith\("https:\/\/www\.falowen\.app\/campus\/course\/"\)/);
  assert.doesNotMatch(display, /url\.includes\("\/course\/lesson\/"\)/);
});
