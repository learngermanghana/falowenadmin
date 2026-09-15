import fs from "node:fs";

const presenterPath = new URL("../src/utils/teachingPresenter.js", import.meta.url);

// A2 lessons should begin by making the student speak, not by showing a
// one-minute reading passage. Keep this patch in the existing build hook so
// old build environments that still contain the knowledge stage are cleaned.
let source = fs.readFileSync(presenterPath, "utf8");

const knowledgeStage = `    {\n      id: "knowledge",\n      type: "task",\n      kicker: "1 Minute",\n      title: "1-Minute-Wissen",\n      body: slide.knowledgeTextDe || "",\n      suggestedMinutes: 1,\n    },\n`;

while (source.includes(knowledgeStage)) {
  source = source.replace(knowledgeStage, "");
}

const oldWarmup = `    {\n      id: "warmup",\n      type: "list",\n      kicker: "Warm-up",\n      title: advanced ? "Einstieg" : "Warm-up",\n      items: Array.isArray(slide.warmupQuestionsDe) ? slide.warmupQuestionsDe : [],\n      suggestedMinutes: interactionMinutes(slide, 0) || 5,\n    },`;

const questionWarmup = `    {\n      id: "warmup",\n      type: "list",\n      kicker: "Warm-up",\n      title: normalizedAssignmentId(slide).startsWith("A2-") ? "Warm-up question" : (advanced ? "Einstieg" : "Warm-up"),\n      items: normalizedAssignmentId(slide).startsWith("A2-")\n        ? (Array.isArray(slide.warmupQuestionsDe) ? slide.warmupQuestionsDe.slice(0, 1) : [])\n        : (Array.isArray(slide.warmupQuestionsDe) ? slide.warmupQuestionsDe : []),\n      suggestedMinutes: normalizedAssignmentId(slide).startsWith("A2-") ? 3 : (interactionMinutes(slide, 0) || 5),\n    },`;

if (source.includes(oldWarmup)) {
  source = source.replace(oldWarmup, questionWarmup);
} else if (!source.includes('title: normalizedAssignmentId(slide).startsWith("A2-") ? "Warm-up question"')) {
  throw new Error("A2 question warm-up patch anchor missing");
}

fs.writeFileSync(presenterPath, source);
console.log("A2 presenter: one speaking warm-up question; 1-Minute-Wissen removed.");
