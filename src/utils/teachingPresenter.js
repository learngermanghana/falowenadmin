export function buildTeachingPresenterStages(slide = {}, topicLabel = "") {
  const stages = [
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
