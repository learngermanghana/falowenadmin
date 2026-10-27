import { getSlidesByCourse } from "../src/data/teachingSlides.js";
import { getA1LearningPath } from "../src/data/a1LearningPath.js";
import {
  A1_DAYS1_TO5_ASSIGNMENTS,
  getA1Days1To5UnderstandingChecks,
  getA1Days1To5QuickChecks,
  getA1Days1To5ApplicationChecks,
} from "../src/data/a1Days1To5Understanding.js";

const slides = getSlidesByCourse("A1");
let totalQuestions = 0;
const problems = [];

for (const id of A1_DAYS1_TO5_ASSIGNMENTS) {
  const slide = slides.find((entry) => String(entry.assignmentId || "").toUpperCase() === id);
  if (!slide || slide.dayNumber < 1 || slide.dayNumber > 5) {
    problems.push(id + ": no matching Day 1–5 lesson");
    continue;
  }
  const items = getA1Days1To5UnderstandingChecks(id) || [];
  const quick = getA1Days1To5QuickChecks(id) || [];
  const application = getA1Days1To5ApplicationChecks(id) || [];
  if (items.length !== 11 || quick.length !== 2 || application.length !== 2) {
    problems.push(id + ": expected 10 class + 1 exit, 2 recall and 2 application checks");
  }
  for (const [index, check] of [...items, ...quick, ...application].entries()) {
    if (!check?.questionDe || !check?.answerDe || !check?.noteEn) {
      problems.push(id + ": check " + (index + 1) + " lacks an exact prompt, answer or explanation");
    }
  }
  if (!String(items[10]?.questionDe || "").startsWith("Exit-Check:")) {
    problems.push(id + ": the exit check must be fresh and unaided");
  }
  const path = getA1LearningPath(slide);
  if (path?.activityUrl !== slide.workbookConnection?.workbookUrl) {
    problems.push(id + ": the activity destination differs from the published lesson");
  }
  if (!["tutor-marked", "self-practice"].includes(path?.kind)) {
    problems.push(id + ": assignment status not established");
  }
  if (id === "A1-2") {
    const text = JSON.stringify([...items, ...quick, ...application]);
    if (/telefonnummer|adresse|mache einen kurzen dialog/i.test(text)) {
      problems.push(id + ": unrelated contact-dialogue prompts in Day 4 number checks");
    }
  }
  if (id === "A1-1.3" || id === "A1-1.1-PRACTICE") {
    const text = JSON.stringify([...items, ...quick, ...application]);
    if (/indefinite article|ein\/eine|ein or eine/i.test(text)) {
      problems.push(id + ": premature indefinite articles in definite-article self-practice");
    }
  }
  totalQuestions += items.length + quick.length + application.length;
  const label = problems.some((p) => p.startsWith(id + ":")) ? "REVIEW" : "PASS";
  console.log(label + " " + id + " · Day " + slide.dayNumber + " · " + path?.kind
    + " · 10 understanding + 1 exit + 2 quick + 2 applied");
}

console.log("A1 Days 1–5 quality audit: " + A1_DAYS1_TO5_ASSIGNMENTS.length +
  " lessons and " + totalQuestions + " source-authored questions with answers/explanations.");
if (problems.length) {
  problems.forEach((problem) => console.error("ERROR " + problem));
  process.exitCode = 1;
}
