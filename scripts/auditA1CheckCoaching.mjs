import { getSlidesByCourse } from "../src/data/teachingSlides.js";
import { getA1GrammarChecks } from "../src/data/a1GrammarChecks.js";
import { getA1PresenterUnderstandingChecks } from "../src/data/a1PresenterUnderstandingChecks.js";
import { buildTeacherSlideSupport } from "../src/data/teacherSlideSupport.js";
import { buildA1CheckCoaching } from "../src/data/a1CheckCoaching.js";

// Audit the existing A1 grammar-diagnostic Presenter without generating answers,
// marking anyone, or inventing Course Book assignments.
let lessons = 0;
let checksAudited = 0;
let teacherAuthoredNotes = 0;
let openAnswerGuides = 0;
const problems = [];

for (const slide of getSlidesByCourse("A1")) {
  const id = String(slide.assignmentId || "").trim().toUpperCase();
  if (["A1-TUTORIAL", "A1-5.9"].includes(id)) continue;
  lessons++;
  const checks = getA1PresenterUnderstandingChecks(
    id, getA1GrammarChecks(id, slide), { slide, support: buildTeacherSlideSupport(slide) },
  );
  if (checks.length < 11) problems.push(id + ": fewer than 10 classroom checks and one exit check");
  let openPerLesson = 0;
  for (const [index, check] of checks.entries()) {
    const guidance = buildA1CheckCoaching(check, slide);
    checksAudited++;
    if (!guidance?.hintDe || !guidance?.checkDe || !guidance?.retryDe) {
      problems.push(id + ": check " + (index + 1) + " has incomplete guidance");
      continue;
    }
    if (guidance.questionDe !== check.questionDe || !guidance.feedbackQuestionDe.includes(check.questionDe)) {
      problems.push(id + ": check " + (index + 1) + " feedback is not attached to the actual question");
    }
    if (guidance.lessonGrammarEn || guidance.lessonPitfallEn) teacherAuthoredNotes++;
    if (guidance.flexibleAnswer) {
      openPerLesson++;
      openAnswerGuides++;
    }
  }
  console.log((problems.some((issue) => issue.startsWith(id + ":")) ? "REVIEW" : "PASS") +
    " " + id + ": " + checks.length + " check prompts, " + openPerLesson +
    " open-response reference guides");
}
console.log("A1 coaching audit: " + lessons + " lessons, " + checksAudited +
  " check prompts, " + teacherAuthoredNotes + " checks with direct authored lesson notes, " +
  openAnswerGuides + " flexible/open response guides.");
if (problems.length) {
  problems.forEach((problem) => console.error("ERROR: " + problem));
  process.exitCode = 1;
}
