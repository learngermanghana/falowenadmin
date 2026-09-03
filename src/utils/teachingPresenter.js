const B1_PRESENTER_V2_ASSIGNMENTS = new Set([
  "B1-1.1",
  "B1-1.2",
  "B1-1.3",
  "B1-2.4",
  "B1-2.5",
  "B1-2.6",
]);

export function isB1PresenterV2Slide(slide = {}) {
  return B1_PRESENTER_V2_ASSIGNMENTS.has(String(slide.assignmentId || "").trim().toUpperCase());
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

function buildB1PresenterV2Stages(slide = {}, topicLabel = "") {
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
  const stages = isB1PresenterV2Slide(slide)
    ? buildB1PresenterV2Stages(slide, topicLabel)
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
