// Course-wide A1 slide-quality gate. This checks *all* twenty-four class
// days and all twenty-eight published lesson blocks, not only the newest pack.
// It reads teaching metadata; never alters submissions, progress or scores.
import { getSlidesByCourse } from "../src/data/teachingSlides.js";
import { getCourseSessionGroups } from "../src/data/courseSessionGroups.js";
import { getA1GrammarChecks } from "../src/data/a1GrammarChecks.js";
import { getA1PresenterUnderstandingChecks } from "../src/data/a1PresenterUnderstandingChecks.js";
import { buildTeacherSlideSupport } from "../src/data/teacherSlideSupport.js";
import { buildA1SlideReviewChecks } from "../src/data/a1SlideReview.js";
import { getA1LearningPath } from "../src/data/a1LearningPath.js";
import { A1_PUBLISHED_WORKBOOK_BY_ASSIGNMENT } from "../src/data/a1PublishedWorkbookRoutes.js";
import { getA1Days1To5QuickChecks, getA1Days1To5ApplicationChecks } from "../src/data/a1Days1To5Understanding.js";
import { getA1Days6To10QuickChecks, getA1Days6To10ApplicationChecks } from "../src/data/a1Days6To10Understanding.js";
import { getA1Days11To15QuickChecks, getA1Days11To15ApplicationChecks } from "../src/data/a1Days11To15Understanding.js";
import { getA1Days16To20QuickChecks, getA1Days16To20ApplicationChecks } from "../src/data/a1Days16To20Understanding.js";
import { getA1Days21To24QuickChecks, getA1Days21To24ApplicationChecks } from "../src/data/a1Days21To24Understanding.js";

const quickResolvers = [
  getA1Days1To5QuickChecks,
  getA1Days6To10QuickChecks,
  getA1Days11To15QuickChecks,
  getA1Days16To20QuickChecks,
  getA1Days21To24QuickChecks,
];
const appliedResolvers = [
  getA1Days1To5ApplicationChecks,
  getA1Days6To10ApplicationChecks,
  getA1Days11To15ApplicationChecks,
  getA1Days16To20ApplicationChecks,
  getA1Days21To24ApplicationChecks,
];
const getCurated = (lookups, id) => lookups.map(get => get(id)).find(Boolean) || null;
const text = v => String(v || "").trim();
const normalized = v => text(v).toLocaleLowerCase("de-DE");
const slides = getSlidesByCourse("A1");
const lessons = slides.filter(s => text(s.assignmentId).toUpperCase() !== "A1-TUTORIAL");
const groups = getCourseSessionGroups("A1");
const error = [];
let teacherAnswers = 0;
let readyReviews = 0;

if (lessons.length !== 28) error.push("Expected exactly 28 A1 published teaching blocks, found " + lessons.length);
if (groups.length !== 25) error.push("Expected Day 0 orientation + 24 class days, found " + groups.length);
const ids = lessons.map(s => text(s.assignmentId).toUpperCase());
if (new Set(ids).size !== ids.length) error.push("Duplicate A1 assignment identifiers");

for (const day of Array.from({ length: 24 }, (_, i) => i + 1)) {
  const matching = lessons.filter(s => Number(s.dayNumber) === day);
  if (!matching.length) error.push("No presentation for A1 class Day " + day);
  if (day === 16 && matching.length !== 2) error.push("Day 16 must have distinct A1-9 and A1-10");
  if (day === 18 && matching.length !== 2) error.push("Day 18 must have distinct A1-12.1 and A1-12.2");
  const group = groups.find(g => g.day === day);
  if (!group) error.push("No curriculum session group on Day " + day);
  else for (const s of matching) if (!group.assignmentIds.some(id => normalized(id) === normalized(s.assignmentId))) {
    error.push("Day " + day + " presentation " + s.assignmentId + " not aligned to course session");
  }
}

for (const slide of lessons) {
  const id = text(slide.assignmentId).toUpperCase();
  const support = buildTeacherSlideSupport(slide);
  const grammar = getA1GrammarChecks(id,slide);
  const checks = getA1PresenterUnderstandingChecks(id,grammar,{ slide, support });
  const isSpeakingMock = id === "A1-5.9";
  if (checks.length !== 11) error.push(id+": expected ten student questions plus one final check");
  if (new Set(checks.map(row=>normalized(row.questionDe))).size !== checks.length) {
    error.push(id+": duplicate or repeated final question");
  }
  if (!checks.every(row=>text(row.questionDe)&&text(row.answerDe))) error.push(id+": empty question or answer");
  if (!slide.title || !slide.topic || !slide.objective) error.push(id+": lesson title/topic/objective missing");
  if (!Array.isArray(slide.teacherNotesEn) || !slide.teacherNotesEn.length) {
    error.push(id+": no lesson-specific teacher notes");
  }
  if (!Array.isArray(slide.interactionFlow) || slide.interactionFlow.length < 3) {
    error.push(id+": insufficient teaching sequence");
  }
  if (!isSpeakingMock) {
    const quick = getCurated(quickResolvers,id);
    const applied = getCurated(appliedResolvers,id);
    if (quick?.length !== 2 || applied?.length !== 2) {
      error.push(id+": no separate two-question recall and application stage");
    }
    const all=[...checks,...(quick||[]),...(applied||[])];
    if (new Set(all.map(row=>normalized(row.questionDe))).size !== all.length) {
      error.push(id+": class, quick and application questions overlap");
    }
    if (!all.every(row=>text(row.noteEn)&&text(row.answerDe))) {
      error.push(id+": missing question-specific teacher explanation");
    }
    if (!/^Exit-Check:/.test(checks.at(-1)?.questionDe || "")) {
      error.push(id+": unaided exit check missing or not labelled");
    }
    teacherAnswers += all.length;
    if (buildA1SlideReviewChecks(checks,2).length === 2) readyReviews++;
    else error.push(id+": requires two safe teacher-reveal review cards");
    const learning = getA1LearningPath(slide);
    if (!learning) error.push(id+": regular lesson not linked to A1 activity metadata");
    const expectedRoute = A1_PUBLISHED_WORKBOOK_BY_ASSIGNMENT[id] || "";
    if (id === "A1-5.10") {
      if (learning?.activityUrl || learning?.grammarUrl !== "/campus/course/conjunctions-5-10") {
        error.push(id+": interactive weil lesson must never link to the separate final mock");
      }
      if (slide.workbookConnection?.parts?.length !== 9) error.push(id+": original nine interactive steps lost");
    } else if (id === "A1-14.2") {
      if (learning?.activityUrl) error.push(id+": no verified external workbook link; do not fabricate one");
    } else if (expectedRoute && learning?.activityUrl !== expectedRoute) {
      error.push(id+": learner link differs from verified registry route");
    } else if (!expectedRoute) {
      error.push(id+": no known route; document as a deliberate gap");
    }
    if (learning?.kind === "tutor-marked" && !/tutor-marked/i.test(slide.workbookConnection?.subtitle||"")) {
      error.push(id+": unsupported tutor-marked claim");
    }
  } else {
    if (Number(slide.dayNumber) !== 19 || slide.interactionFlow.length !== 7) {
      error.push("A1-5.9 speaking readiness must remain on Day 19 in the dedicated flow");
    }
    if (getA1LearningPath(slide) !== null) error.push(id+": Goethe mock got normal assignment mode");
  }
}

console.log("A1 course-wide quality audit: " + lessons.length + " lesson blocks over 24 teaching days.");
console.log("  Regular comprehension lessons: " + (lessons.length - 1) + " · Total question/answer/explanation checks: " + teacherAnswers);
console.log("  Two teacher-reveal review cards: " + readyReviews + " lesson blocks.");
console.log("  Goethe A1-5.9: dedicated 60-minute speaking mock protected.");
console.log("  Known route gaps: A1-14.2 has no verified learner page; A1-5.10 uses its existing conjunctions grammar page.");
if (error.length) {
  error.forEach(message => console.error("ERROR " + message));
  process.exitCode = 1;
} else console.log("PASS All 24 A1 days meet the curriculum, teacher-answer and routing checks.");
