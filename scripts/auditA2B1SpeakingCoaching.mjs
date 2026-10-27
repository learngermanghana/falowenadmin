import { getSlidesByCourse } from "../src/data/teachingSlides.js";
import { buildA2B1SpeakingCoaching } from "../src/data/a2B1SpeakingCoaching.js";

// Lesson-by-lesson quality gate. This uses published slide content; it does not
// invent model answers, contact student accounts or mark student submissions.
let questionsAudited = 0;
let lessonsAudited = 0;
let hintsAudited = 0;
let feedbackAudited = 0;
const issues = [];

for (const level of ["A2", "B1"]) {
  const slides = getSlidesByCourse(level);
  if (slides.length !== 28) issues.push(level + ": expected 28 lessons, found " + slides.length);
  for (const slide of slides) {
    lessonsAudited += 1;
    const id = String(slide.assignmentId || "");
    const questions = slide.studentQuestionsDe || [];
    const models = slide.speakingModels || [];
    const coaching = buildA2B1SpeakingCoaching(slide, questions);
    const lessonIssues = [];
    if (questions.length < 3) lessonIssues.push("fewer than 3 speaking questions");
    if (models.length !== questions.length) lessonIssues.push("question/model count mismatch");
    if (coaching.length !== questions.length) lessonIssues.push("question/coach count mismatch");
    for (let i = 0; i < questions.length; i += 1) {
      const item = coaching[i];
      const model = models.find((entry) => entry.questionDe === questions[i]);
      questionsAudited += 1;
      if (!model?.modelAnswerDe) lessonIssues.push("Q" + (i + 1) + " lacks an authored model");
      if (!item) {
        lessonIssues.push("Q" + (i + 1) + " lacks grounded coaching");
        continue;
      }
      if (!item.hintDe || item.hintDe === model?.modelAnswerDe) lessonIssues.push("Q" + (i + 1) + " hint missing or reveals full model");
      else hintsAudited += 1;
      if (!item.referenceIdeaDe || !model?.modelAnswerDe.startsWith(item.referenceIdeaDe)) lessonIssues.push("Q" + (i + 1) + " content evidence not in model");
      else if (!item.taskChecksDe?.length || !item.retryDe?.includes(questions[i])) lessonIssues.push("Q" + (i + 1) + " lacks task checks or targeted retry");
      else feedbackAudited += 1;
      if (item.supportingIdeaDe && !model?.modelAnswerDe.includes(item.supportingIdeaDe)) {
        lessonIssues.push("Q" + (i + 1) + " second example is not in its model");
      }
      if (slide.teacherSupport?.grammarFocusEn?.length
        && !slide.teacherSupport.grammarFocusEn.includes(item.lessonGrammarFocusEn)) {
        lessonIssues.push("Q" + (i + 1) + " teacher grammar note not from lesson");
      }
      if (slide.teacherSupport?.commonMistakesEn?.length
        && !slide.teacherSupport.commonMistakesEn.includes(item.lessonPitfallEn)) {
        lessonIssues.push("Q" + (i + 1) + " error warning not from lesson");
      }
    }
    const result = lessonIssues.length ? "REVIEW" : "PASS";
    console.log(result + " " + id + " — " + questions.length + " speaking prompts" +
      (lessonIssues.length ? ": " + lessonIssues.join("; ") : ""));
    issues.push(...lessonIssues.map((issue) => id + ": " + issue));
  }
}
console.log("A2/B1 speaking audit: " + lessonsAudited + " lessons; " + questionsAudited +
  " questions; " + hintsAudited + " grounded hints; " + feedbackAudited + " grounded feedback slots.");
if (issues.length) {
  console.error("Audit failed with " + issues.length + " issues.");
  process.exitCode = 1;
}
