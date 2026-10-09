import { getSlidesByCourse } from "../src/data/teachingSlides.js";
import { getA1LearningPath } from "../src/data/a1LearningPath.js";
import { buildA1SlideReviewChecks } from "../src/data/a1SlideReview.js";
import { A1_DAYS6_TO10_ASSIGNMENTS, getA1Days6To10UnderstandingChecks,
  getA1Days6To10QuickChecks, getA1Days6To10ApplicationChecks } from "../src/data/a1Days6To10Understanding.js";

// Audit authoritative A1 lesson topic, verified answer/explanation and the
// correct learner activity type. No progress or marking data is accessed.
const slides = getSlidesByCourse("A1");
const errors = [];
let count = 0;
const expectedKind = { "A1-2.3": "self-practice", "A1-3": "tutor-marked",
  "A1-4": "tutor-marked", "A1-5": "tutor-marked", "A1-6": "tutor-marked" };
for (const id of A1_DAYS6_TO10_ASSIGNMENTS) {
  const slide = slides.find((s) => String(s.assignmentId || "").toUpperCase() === id);
  if (!slide || slide.dayNumber < 6 || slide.dayNumber > 10) {
    errors.push(id + ": missing official A1 Days 6–10 lesson"); continue;
  }
  const route = getA1LearningPath(slide);
  if (route?.kind !== expectedKind[id] || route?.activityUrl !== slide.workbookConnection?.workbookUrl) {
    errors.push(id + ": incorrect submission mode or invented learner route");
  }
  const checks = getA1Days6To10UnderstandingChecks(id) || [];
  const quick = getA1Days6To10QuickChecks(id) || [];
  const applied = getA1Days6To10ApplicationChecks(id) || [];
  if (checks.length !== 11 || quick.length !== 2 || applied.length !== 2) {
    errors.push(id + ": expected 10 class + 1 exit + 2 quick + 2 applied");
  }
  const all = [...checks, ...quick, ...applied];
  if (new Set(all.map((s) => s.questionDe?.trim().toLocaleLowerCase("de-DE"))).size !== all.length) {
    errors.push(id + ": repeat understanding questions across stages");
  }
  for (const [i, row] of all.entries()) {
    if (!row.questionDe || !row.answerDe || !row.noteEn) errors.push(id + ": check " + (i + 1) + " missing authored answer/explanation");
  }
  if (!String(checks[10]?.questionDe || "").startsWith("Exit-Check:")) errors.push(id + ": exit check not distinct");
  if (buildA1SlideReviewChecks(checks, 2).length !== 2) errors.push(id + ": no verified answer-reveal slide review");
  if (id === "A1-2.3" && route.kind !== "self-practice") errors.push(id + ": practice must never be tutor-marked");
  if (id === "A1-5" && slide.workbookConnection.parts.some((p) => /Hören/i.test(p.label))) {
    errors.push(id + ": invented Day 9 Hören section");
  }
  count += all.length;
  console.log((errors.some((e) => e.startsWith(id + ":")) ? "REVIEW " : "PASS ") + id +
    " · Day " + slide.dayNumber + " · " + route.kind + " · 15 authored checks");
}
console.log("A1 Days 6–10 audit: " + A1_DAYS6_TO10_ASSIGNMENTS.length + " lessons; " + count + " authored checks.");
if (errors.length) {
  errors.forEach((error) => console.error("ERROR " + error));
  process.exitCode = 1;
}
