import { getSlidesByCourse } from "../src/data/teachingSlides.js";
import { buildTeachingPresenterStages } from "../src/utils/teachingPresenter.js";
import { getCourseTaskDay } from "../src/data/courseSessionGroups.js";

const args = new Map(
  process.argv.slice(2).map((arg) => {
    const [key, ...rest] = String(arg).split("=");
    return [key.replace(/^--/, ""), rest.length ? rest.join("=") : true];
  }),
);

const LEVEL = String(args.get("level") || "A1").trim().toUpperCase();
const SUPPORTED_LEVELS = new Set(["A1", "A2"]);
if (!SUPPORTED_LEVELS.has(LEVEL)) {
  throw new Error("Teacher-material audit currently supports A1 and A2. Received: " + LEVEL);
}

const REQUIRED_CORE_STAGES = [
  "intro",
  "warmup",
  "phrases",
  "grammar",
  "examples",
  "practice",
  "mistakes",
  "questions",
  ...(LEVEL === "A1" ? ["wrapup"] : []),
];

const normalize = (value = "") => String(value || "").trim();
const normalizedAssignment = (slide = {}) => normalize(slide.assignmentId).toUpperCase();
const isTutorial = (slide = {}) => {
  const id = normalizedAssignment(slide);
  return id.endsWith("-TUTORIAL") || id.endsWith("-ORIENTATION");
};

function expectedTeachingDay(slide, index) {
  if (LEVEL === "A1") return getCourseTaskDay("A1", slide.assignmentId, index);
  return index + 1;
}

const slides = getSlidesByCourse(LEVEL);
const findings = [];
const rows = [];

for (const [index, slide] of slides.entries()) {
  const stages = buildTeachingPresenterStages(slide, slide.topic);
  const stageMap = new Map(stages.map((stage) => [stage.id, stage]));
  const tutorial = isTutorial(slide);

  if (!normalize(slide.assignmentId)) {
    findings.push({ severity: "error", id: slide.id || "unknown", message: "missing assignment identity" });
  }
  if (!normalize(slide.objective)) {
    findings.push({ severity: "error", id: slide.assignmentId, message: "missing lesson objective" });
  }

  const expectedDay = expectedTeachingDay(slide, index);
  if (Number.isInteger(expectedDay) && Number(slide.dayNumber) !== expectedDay) {
    findings.push({
      severity: "error",
      id: slide.assignmentId,
      message: "teacher slide day " + slide.dayNumber + " does not match canonical Course Book day " + expectedDay,
    });
  }
  if (Number.isInteger(expectedDay) && normalize(slide.day) !== "Day " + expectedDay) {
    findings.push({
      severity: "error",
      id: slide.assignmentId,
      message: "teacher slide label '" + normalize(slide.day) + "' does not match Day " + expectedDay,
    });
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
  const warmup = stageMap.get("warmup");
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
    (LEVEL === "A2" ? warmup : wrapup)
  );
  const produce = tutorial || Boolean(
    practice &&
    Array.isArray(practice.items) &&
    practice.items.some((item) => Number(item.minutes || 0) > 0) &&
    questions
  );

  // A2 is fully workbook-aligned, so transfer must be explicit. A1 still has
  // a few legacy presenter-transfer lessons that intentionally use the shared
  // assignment identity while their workbook bridge is being upgraded.
  const transfer = tutorial || Boolean(
    workbook ||
    slide.workbookConnection ||
    (LEVEL === "A1" && normalize(slide.assignmentId))
  );
  // A2 deliberately removes the duplicate mini-presentation wrap-up page.
  // Its warm-up plus question-reveal speaking checks already provide the
  // learner production/assessment evidence that the old page duplicated.
  const assess = tutorial || Boolean(
    LEVEL === "A2"
      ? warmup && Array.isArray(warmup.items) && warmup.items.length > 0 && questions
      : wrapup && questions
  );

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
      severity: LEVEL === "A2" ? "warning" : "info",
      id: slide.assignmentId,
      message: "uses presenter transfer without an explicit workbookConnection block",
    });
  }
  if (!tutorial && !hasDirectTeacherSupport) {
    findings.push({
      severity: LEVEL === "A2" ? "warning" : "info",
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

const heading = "# Falowen " + LEVEL + " teacher-material audit";
console.log(heading);
console.log("");
console.log("Rubric: Teach → Check → Produce → Transfer → Assess");
console.log("");
console.log("| Day | Assignment | Teach | Check | Produce | Transfer | Assess | Coverage | Workbook bridge | Lesson-specific support |");
console.log("| ---: | --- | :---: | :---: | :---: | :---: | :---: | ---: | :---: | :---: |");
for (const row of rows) {
  console.log(
    "| " + row.day + " | " + row.assignmentId + " · " + row.title.replaceAll("|", "\\|") +
    " | " + (row.teach ? "✓" : "—") +
    " | " + (row.check ? "✓" : "—") +
    " | " + (row.produce ? "✓" : "—") +
    " | " + (row.transfer ? "✓" : "—") +
    " | " + (row.assess ? "✓" : "—") +
    " | " + row.coverage + "/5 | " + (row.workbookBridge ? "✓" : "—") +
    " | " + (row.directSupport ? "✓" : "—") + " |"
  );
}
console.log("");
console.log(
  "Summary: " + slides.length + " " + LEVEL + " slide(s), " +
  errors.length + " error(s), " + warnings.length + " warning(s), " +
  info.length + " improvement note(s)."
);

if (errors.length || warnings.length || info.length) {
  console.log("");
  console.log("## Findings");
  for (const item of findings) {
    console.log("- **" + item.severity.toUpperCase() + " · " + item.id + "** — " + item.message);
  }
}

if (process.env.GITHUB_STEP_SUMMARY) {
  const summary = [
    heading,
    "",
    "Rubric: **Teach → Check → Produce → Transfer → Assess**",
    "",
    "| Day | Assignment | Teach | Check | Produce | Transfer | Assess | Coverage | Workbook bridge | Lesson-specific support |",
    "| ---: | --- | :---: | :---: | :---: | :---: | :---: | ---: | :---: | :---: |",
    ...rows.map((row) =>
      "| " + row.day + " | " + row.assignmentId + " · " + row.title.replaceAll("|", "\\|") +
      " | " + (row.teach ? "✓" : "—") +
      " | " + (row.check ? "✓" : "—") +
      " | " + (row.produce ? "✓" : "—") +
      " | " + (row.transfer ? "✓" : "—") +
      " | " + (row.assess ? "✓" : "—") +
      " | " + row.coverage + "/5 | " + (row.workbookBridge ? "✓" : "—") +
      " | " + (row.directSupport ? "✓" : "—") + " |"
    ),
    "",
    "Summary: **" + slides.length + "** " + LEVEL + " slides · **" +
      errors.length + "** errors · **" + warnings.length + "** warnings · **" +
      info.length + "** improvement notes.",
    "",
    ...findings.map((item) => "- **" + item.severity.toUpperCase() + " · " + item.id + "** — " + item.message),
    "",
  ].join("\n");
  const fs = await import("node:fs");
  fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, summary);
}

if (errors.length || warnings.length) process.exit(1);
