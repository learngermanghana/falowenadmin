const A2_PRESENTER_V2_ASSIGNMENTS = new Set([
  "A2-1.1", "A2-1.2", "A2-1.3", "A2-2.4", "A2-2.5", "A2-3.6", "A2-3.7", "A2-3.8", "A2-4.9",
  "A2-4.10", "A2-4.11", "A2-5.12", "A2-5.13", "A2-5.14", "A2-6.15", "A2-6.16", "A2-6.17",
  "A2-7.18", "A2-7.19", "A2-7.20", "A2-8.21", "A2-8.22", "A2-9.23", "A2-9.24", "A2-9.25",
  "A2-10.26", "A2-10.27", "A2-10.28",
]);

const B1_PRESENTER_V2_ASSIGNMENTS = new Set([
  "B1-1.1", "B1-1.2", "B1-1.3", "B1-2.4", "B1-2.5", "B1-2.6", "B1-3.7", "B1-3.8", "B1-3.9",
  "B1-4.10", "B1-4.11", "B1-4.12", "B1-4.13", "B1-5.14", "B1-5.15", "B1-5.16", "B1-5.17",
  "B1-6.18", "B1-6.19", "B1-6.20", "B1-7.21", "B1-7.22", "B1-7.23", "B1-8.24", "B1-8.25",
  "B1-9.26", "B1-10.27", "B1-10.28",
]);

const B2_PRESENTER_V2_ASSIGNMENTS = new Set(
  Array.from({ length: 28 }, (_, index) => {
    const day = index + 1;
    return `B2-${Math.ceil(day / 4)}.${day}`;
  }),
);

function normalizedAssignmentId(slide = {}) {
  return String(slide.assignmentId || "").trim().toUpperCase();
}

export function isA2PresenterV2Slide(slide = {}) {
  return A2_PRESENTER_V2_ASSIGNMENTS.has(normalizedAssignmentId(slide));
}

export function isB1PresenterV2Slide(slide = {}) {
  return B1_PRESENTER_V2_ASSIGNMENTS.has(normalizedAssignmentId(slide));
}

export function isB2PresenterV2Slide(slide = {}) {
  return B2_PRESENTER_V2_ASSIGNMENTS.has(normalizedAssignmentId(slide));
}

export function isTeachingPresenterV2Slide(slide = {}) {
  return isA2PresenterV2Slide(slide) || isB1PresenterV2Slide(slide) || isB2PresenterV2Slide(slide);
}

export function parsePresenterMinutes(value = "") {
  const match = String(value || "").match(/(\d+)\s*min/i);
  return match ? Number(match[1]) : 0;
}

function interactionMinutes(slide = {}, index = 0) {
  return parsePresenterMinutes(slide.interactionFlow?.[index]?.detailEn || "");
}

function buildClassicStages(slide = {}, topicLabel = "") {
  return [
    {
      id: "intro",
      type: "intro",
      kicker: `${slide.course || ""}${slide.day ? ` · ${slide.day}` : ""}`.trim(),
      title: slide.title || "Lesson",
      topic: topicLabel || slide.topic || "",
      objective: slide.objective || "",
      duration: slide.estimatedDuration || "",
    },
    {
      id: "warmup",
      type: "list",
      kicker: "Warm-up",
      title: "Warm-up",
      items: Array.isArray(slide.warmupQuestionsDe) ? slide.warmupQuestionsDe : [],
    },
    {
      id: "phrases",
      type: "list",
      kicker: "Redemittel",
      title: "Key phrases",
      items: Array.isArray(slide.keyPhrasesDe) ? slide.keyPhrasesDe : [],
    },
    {
      id: "questions",
      type: "numbered-list",
      kicker: "Sprechen",
      title: "Student questions",
      items: Array.isArray(slide.studentQuestionsDe) ? slide.studentQuestionsDe : [],
    },
    {
      id: "wrapup",
      type: "task",
      kicker: "Abschluss",
      title: "Wrap-up task",
      body: slide.wrapUpTaskDe || "",
    },
  ];
}

function buildPresenterV2Stages(slide = {}, topicLabel = "") {
  const support = slide.teacherSupport || {};
  const flow = Array.isArray(slide.interactionFlow) ? slide.interactionFlow : [];
  const workbookParts = Array.isArray(slide.workbookConnection?.parts) ? slide.workbookConnection.parts : [];

  return [
    {
      id: "intro",
      type: "intro",
      kicker: `${slide.course || ""}${slide.day ? ` · ${slide.day}` : ""}`.trim(),
      title: slide.title || "Lesson",
      topic: topicLabel || slide.topic || "",
      objective: slide.objective || "",
      duration: slide.estimatedDuration || "",
    },
    {
      id: "warmup",
      type: "list",
      kicker: "Warm-up",
      title: "Warm-up",
      items: Array.isArray(slide.warmupQuestionsDe) ? slide.warmupQuestionsDe : [],
      suggestedMinutes: interactionMinutes(slide, 0) || 5,
    },
    {
      id: "phrases",
      type: "list",
      kicker: "Redemittel",
      title: "Key phrases",
      items: Array.isArray(slide.keyPhrasesDe) ? slide.keyPhrasesDe : [],
    },
    {
      id: "grammar",
      type: "list",
      kicker: "Grammatik",
      title: "Grammar focus",
      items: Array.isArray(support.grammarFocusEn) ? support.grammarFocusEn : [],
      suggestedMinutes: interactionMinutes(slide, 1) || 10,
    },
    {
      id: "examples",
      type: "list",
      kicker: "Beispiele",
      title: "Model examples",
      items: Array.isArray(support.modelExamplesDe) ? support.modelExamplesDe : [],
      suggestedMinutes: interactionMinutes(slide, 2) || 8,
    },
    {
      id: "practice",
      type: "flow",
      kicker: "Übung",
      title: "Guided practice",
      items: flow.map((item) => ({
        title: item.phase,
        detail: item.detailEn,
        minutes: parsePresenterMinutes(item.detailEn),
      })),
    },
    {
      id: "workbook",
      type: "workbook",
      kicker: "Workbook",
      title: "Workbook connection",
      items: workbookParts.map((part) => ({ label: part.label, detail: part.detailEn })),
      grammarUrl: slide.workbookConnection?.grammarUrl || "",
      workbookUrl: slide.workbookConnection?.workbookUrl || "",
      suggestedMinutes: interactionMinutes(slide, Math.max(0, flow.length - 1)) || 7,
    },
    {
      id: "mistakes",
      type: "list",
      kicker: "Achtung",
      title: "Common mistakes",
      items: Array.isArray(support.commonMistakesEn) ? support.commonMistakesEn : [],
    },
    {
      id: "questions",
      type: "question-reveal",
      kicker: "Sprechen",
      title: "Speaking questions",
      items: Array.isArray(slide.studentQuestionsDe) ? slide.studentQuestionsDe : [],
      supportItems: Array.isArray(support.modelExamplesDe) ? support.modelExamplesDe : [],
      suggestedMinutes: interactionMinutes(slide, 3) || 10,
    },
    {
      id: "wrapup",
      type: "task",
      kicker: "Abschluss",
      title: "Wrap-up task",
      body: slide.wrapUpTaskDe || "",
      suggestedMinutes: 5,
    },
  ];
}

export function buildTeachingPresenterStages(slide = {}, topicLabel = "") {
  const stages = isTeachingPresenterV2Slide(slide)
    ? buildPresenterV2Stages(slide, topicLabel)
    : buildClassicStages(slide, topicLabel);

  return stages.filter((stage) => {
    if (stage.type === "intro") return Boolean(stage.title || stage.topic || stage.objective);
    if (stage.type === "task") return Boolean(stage.body);
    return Array.isArray(stage.items) && stage.items.length > 0;
  });
}

export function clampPresenterIndex(index, stageCount) {
  const lastIndex = Math.max(0, Number(stageCount || 0) - 1);
  return Math.min(lastIndex, Math.max(0, Number(index || 0)));
}
