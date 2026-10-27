import { getSlidesByCourse } from "../src/data/teachingSlides.js";
import { getA1LearningPath } from "../src/data/a1LearningPath.js";
import {
  A1_DAYS11_TO15_ASSIGNMENTS,
  getA1Days11To15UnderstandingChecks,
  getA1Days11To15QuickChecks,
  getA1Days11To15ApplicationChecks,
} from "../src/data/a1Days11To15Understanding.js";
import { A1_PUBLISHED_WORKBOOK_BY_ASSIGNMENT } from "../src/data/a1PublishedWorkbookRoutes.js";

const slides = getSlidesByCourse("A1");
const expected = {
  "A1-7": [11, "tutor-marked"],
  "A1-8": [12, "tutor-marked"],
  "A1-3.5": [13, "review"],
  "A1-3.6": [14, "review"],
  "A1-4.7": [15, "review"],
};
const errors = [];
let checksCount = 0;
for (const id of A1_DAYS11_TO15_ASSIGNMENTS) {
  const slide = slides.find((s) => String(s.assignmentId || "").toUpperCase() === id);
  const requirement = expected[id];
  if (!slide || !requirement) { errors.push(id + ": lesson absent"); continue; }
  if (slide.dayNumber !== requirement[0]) errors.push(id + ": curriculum day mismatch");
  const mode = getA1LearningPath(slide);
  if (mode?.kind !== requirement[1]) errors.push(id + ": activity grading status unsupported");
  if (mode?.activityUrl !== A1_PUBLISHED_WORKBOOK_BY_ASSIGNMENT[id]) {
    errors.push(id + ": not using published learner route");
  }
  const rows = getA1Days11To15UnderstandingChecks(id) || [];
  const quick = getA1Days11To15QuickChecks(id) || [];
  const applied = getA1Days11To15ApplicationChecks(id) || [];
  if (rows.length !== 11 || quick.length !== 2 || applied.length !== 2) {
    errors.push(id + ": missing a 10+1+2+2 question stage");
  }
  if (!String(rows[10]?.questionDe || "").startsWith("Exit-Check:")) {
    errors.push(id + ": final check not independent");
  }
  const all = [...rows, ...quick, ...applied];
  const unique = new Set(all.map((x) => String(x.questionDe || "").trim().toLowerCase()));
  if (unique.size !== all.length) errors.push(id + ": duplicated check across stages");
  for (const [i, question] of all.entries()) {
    if (!question.questionDe || !question.answerDe || !question.noteEn) {
      errors.push(id + ": missing question, answer or explanation at " + (i + 1));
    }
  }
  if (id === "A1-8" && slide.workbookConnection?.parts?.length !== 2) {
    errors.push(id + ": extra invented Day 12 section");
  }
  if (id === "A1-4.7" && !slide.teacherNotesEn?.join(" ").includes("A1-5.9")) {
    errors.push(id + ": exam introduction confused with later mock");
  }
  checksCount += all.length;
  console.log((errors.some((e) => e.startsWith(id + ":")) ? "REVIEW " : "PASS ") +
    id + " · Day " + slide.dayNumber + " · " + mode?.kind + " · 15 sourced checks");
}
console.log("A1 Days 11–15 quality audit: " + A1_DAYS11_TO15_ASSIGNMENTS.length +
  " lessons; " + checksCount + " checks with answers and teacher guidance.");
if (errors.length) {
  for (const item of errors) console.error("ERROR " + item);
  process.exitCode = 1;
}
