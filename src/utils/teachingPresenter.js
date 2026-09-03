function isB1Presenter2Eligible(slide = {}) {
  const course = String(slide.course || "").trim().toUpperCase();
  const dayNumber = Number(slide.dayNumber || String(slide.day || "").match(/\d+/)?.[0] || 0);
  return course === "B1" && dayNumber >= 1 && dayNumber <= 12;
}

function list(value) {
  return Array.isArray(value) ? value.filter(Boolean) : [];
}

function guidedPracticeItems(slide = {}) {
  return list(slide.interactionFlow).map((item) => {
    const phase = String(item?.phase || "").trim();
    const detail = String(item?.detailEn || item?.detailDe || "").trim();
    if (!phase) return detail;
    if (!detail) return phase;
    return `${phase}: ${detail}`;
  }).filter(Boolean);
}

function workbookItems(slide = {}) {
  return list(slide.workbookConnection?.parts).map((part) => {
    const label = String(part?.label || "").trim();
    const detail = String(part?.detailEn || part?.detailDe || "").trim();
    if (!label) return detail;
    if (!detail) return label;
    return `${label}: ${detail}`;
  }).filter(Boolean);
}

export function buildTeachingPresenterStages(slide = {}, topicLabel = "") {
  const presenter2 = isB1Presenter2Eligible(slide);
  const support = slide.teacherSupport || {};
  const stages = [
    {
      id: "intro",
      type: "intro",
      kicker: `${slide.course || ""}${slide.day ? ` · ${slide.day}` : ""}`.trim(),
      title: slide.title || "Lesson",
      topic: topicLabel || slide.topic || "",
      objective: slide.objective || "",
      duration: slide.estimatedDuration || "",
      suggestedMinutes: 2,
    },
    {
      id: "warmup",
      type: "list",
      kicker: "Warm-up",
      title: "Warm-up",
      items: list(slide.warmupQuestionsDe),
      suggestedMinutes: 5,
    },
    {
      id: "phrases",
      type: "list",
      kicker: "Redemittel",
      title: "Key phrases",
      items: list(slide.keyPhrasesDe),
      suggestedMinutes: 6,
    },
    ...(presenter2 ? [
      {
        id: "grammar",
        type: "list",
        kicker: "Grammatik",
        title: "Grammar focus",
        items: list(support.grammarFocusEn),
        suggestedMinutes: 10,
      },
      {
        id: "examples",
        type: "list",
        kicker: "Beispiele",
        title: "Model examples",
        items: list(support.modelExamplesDe),
        suggestedMinutes: 6,
      },
      {
        id: "guided-practice",
        type: "numbered-list",
        kicker: "Übung",
        title: "Guided practice",
        items: guidedPracticeItems(slide),
        suggestedMinutes: 10,
      },
    ] : []),
    {
      id: "questions",
      type: presenter2 ? "question-reveal" : "numbered-list",
      kicker: "Sprechen",
      title: "Student questions",
      items: list(slide.studentQuestionsDe),
      modelItems: presenter2 ? list(support.modelExamplesDe) : [],
      suggestedMinutes: 10,
    },
    ...(presenter2 ? [
      {
        id: "workbook",
        type: "numbered-list",
        kicker: "Arbeitsbuch",
        title: "Workbook connection",
        items: workbookItems(slide),
        suggestedMinutes: 7,
      },
      {
        id: "mistakes",
        type: "list",
        kicker: "Achtung",
        title: "Common mistakes to avoid",
        items: list(support.commonMistakesEn),
        suggestedMinutes: 5,
      },
    ] : []),
    {
      id: "wrapup",
      type: "task",
      kicker: "Abschluss",
      title: "Wrap-up task",
      body: slide.wrapUpTaskDe || "",
      suggestedMinutes: 3,
    },
  ];

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
