import { getSlidesByCourse } from "../src/data/teachingSlides.js";
import { buildTeachingPresenterStages } from "../src/utils/teachingPresenter.js";

const LEVEL = "A1";
const REQUIRED_CORE_STAGES = [
  "intro",
  "warmup",
  "phrases",
  "grammar",
  "examples",
  "practice",
  "mistakes",
  "questions",
  "wrapup",
];

const normalize = (value = "") => String(value || "").trim();
const isTutorial = (slide = {}) =>
  normalize(slide.assignmentId).toUpperCase() === "A1-TUTORIAL";

const slides = getSlidesByCourse(LEVEL);
const findings = [];
const rows = [];

for (const slide of slides) {
  const stages = buildTeachingPresenterStages(slide, slide.topic);
  const stageMap = new Map(stages.map((stage) => [stage.id, stage]));
  const tutorial = isTutorial(slide);

  if (!normalize(slide.assignmentId)) {
    findings.push({ severity: "error", id: slide.id || "unknown", message: "missing assignment identity" });
  }
  if (!normalize(slide.objective)) {
    findings.push({ severity: "error", id: slide.assignmentId, message: "missing lesson objective" });
  }
  if (!tutorial) {
    for (const stageId of REQUIRED_CORE_STAGES) {
      if (!stageMap.has(stageId)) {
        findings.push({ severity: "error", id: slide.assignmentId, message: "missing presenter stage: " + stageId });
      }
    }
  }

  const grammar = stageMap.get("grammar");
  const examples = stageMap.get("examples");
  const practice = stageMap.get("practice");
  const questions = stageMap.get("questions");
  const mistakes = stageMap.get("mistakes");
  const wrapup = stageMap.get("wrapup");
  const workbook = stageMap.get("workbook");

  const teach = tutorial || Boolean(grammar && examples);
  const check = tutorial || Boolean(
    questions &&
    Array.isArray(questions.supportItems) &&
    questions.supportItems.length >= 3 &&
    mistakes &&
    wrapup
  );
  const produce = tutorial || Boolean(
    practice &&
    Array.isArray(practice.items) &&
    practice.items.some((item) => Number(item.minutes || 0) > 0) &&
    questions
  );
  const transfer = tutorial || Boolean(
    workbook ||
    slide.workbookConnection ||
    normalize(slide.assignmentId)
  );
  const assess = tutorial || Boolean(wrapup && questions);

  const coverage = [teach, check, produce, transfer, assess].filter(Boolean).length;

  if (!tutorial && coverage < 5) {
    const missing = [
      ["teach", teach],
      ["check", check],
      ["produce", produce],
      ["transfer", transfer],
      ["assess", assess],
    ].filter(([, ok]) => !ok).map(([name]) => name);
    findings.push({
      severity: coverage <= 2 ? "error" : "warning",
      id: slide.assignmentId,
      message: "Teach→Check→Produce→Transfer→Assess coverage " + coverage + "/5; missing " + missing.join(", "),
    });
  }

  const hasExplicitWorkbookBridge = Boolean(slide.workbookConnection);
  const hasDirectTeacherSupport = Boolean(slide.teacherSupport);

  if (!tutorial && !hasExplicitWorkbookBridge) {
    findings.push({
      severity: "info",
      id: slide.assignmentId,
      message: "uses presenter transfer without an explicit workbookConnection block",
    });
  }
  if (!tutorial && !hasDirectTeacherSupport) {
    findings.push({
      severity: "info",
      id: slide.assignmentId,
      message: "uses shared teacher-support fallback rather than lesson-specific teacherSupport",
    });
  }

  rows.push({
    day: slide.dayNumber,
    assignmentId: slide.assignmentId,
    title: slide.title,
    teach,
    check,
    produce,
    transfer,
    assess,
    coverage,
    workbookBridge: hasExplicitWorkbookBridge,
    directSupport: hasDirectTeacherSupport,
  });
}

const errors = findings.filter((item) => item.severity === "error");
const warnings = findings.filter((item) => item.severity === "warning");
const info = findings.filter((item) => item.severity === "info");

console.log("# Falowen A1 teacher-material audit");
console.log("");
console.log("Rubric: Teach → Check → Produce → Transfer → Assess");
console.log("");
console.log("| Day | Assignment | Coverage | Workbook bridge | Lesson-specific support |");
console.log("| ---: | --- | ---: | :---: | :---: |");
for (const row of rows) {
  console.log(
    "| " + row.day + " | " + row.assignmentId + " · " + row.title.replaceAll("|", "\\|") +
    " | " + row.coverage + "/5 | " + (row.workbookBridge ? "✓" : "—") +
    " | " + (row.directSupport ? "✓" : "—") + " |"
  );
}
console.log("");
console.log("Summary: " + slides.length + " A1 slide(s), " + errors.length + " error(s), " + warnings.length + " warning(s), " + info.length + " improvement note(s).");

if (errors.length || warnings.length || info.length) {
  console.log("");
  console.log("## Findings");
  for (const item of findings) {
    console.log("- **" + item.severity.toUpperCase() + " · " + item.id + "** — " + item.message);
  }
}

if (process.env.GITHUB_STEP_SUMMARY) {
  const summary = [
    "# Falowen A1 teacher-material audit",
    "",
    "Rubric: **Teach → Check → Produce → Transfer → Assess**",
    "",
    "| Day | Assignment | Coverage | Workbook bridge | Lesson-specific support |",
    "| ---: | --- | ---: | :---: | :---: |",
    ...rows.map((row) =>
      "| " + row.day + " | " + row.assignmentId + " · " + row.title.replaceAll("|", "\\|") +
      " | " + row.coverage + "/5 | " + (row.workbookBridge ? "✓" : "—") +
      " | " + (row.directSupport ? "✓" : "—") + " |"
    ),
    "",
    "Summary: **" + slides.length + "** A1 slides · **" + errors.length + "** errors · **" + warnings.length + "** warnings · **" + info.length + "** improvement notes.",
    "",
    ...findings.map((item) => "- **" + item.severity.toUpperCase() + " · " + item.id + "** — " + item.message),
    "",
  ].join("\n");
  const fs = await import("node:fs");
  fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, summary);
}

if (errors.length || warnings.length) process.exit(1);
