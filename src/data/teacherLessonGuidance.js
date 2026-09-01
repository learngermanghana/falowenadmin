const GENERIC_GUIDANCE = Object.freeze({
  grammarSubtitle: "What the teacher should watch and reinforce during this lesson.",
  notesSubtitle: "Delivery guidance for this lesson.",
  guidedPracticeSubtitle: "Move from controlled practice to freer production.",
  speakingSubtitle: "Use these for pair work, follow-ups, or whole-class discussion.",
  mistakesSubtitle: "Correct selectively after the speaking phase instead of interrupting every answer.",
  wrapUpSubtitle: "Finish with one short production task that checks the lesson objective.",
});

const WORKBOOK_GUIDANCE = Object.freeze({
  grammarSubtitle: "Teach the same grammar decision students need in the workbook.",
  notesSubtitle: "Delivery guidance and workbook bridges for this lesson.",
  guidedPracticeSubtitle: "Move through the same thinking route students will need in their workbook tasks.",
  speakingSubtitle: "Use these to prepare and extend the workbook Sprechen task.",
  mistakesSubtitle: "Correct selectively after practice instead of interrupting every answer.",
  wrapUpSubtitle: "Finish with a short production task that checks readiness for the workbook.",
});

export function getTeacherLessonGuidance(slide = {}) {
  const hasWorkbookConnection = Boolean(slide?.workbookConnection);
  const guidance = hasWorkbookConnection ? WORKBOOK_GUIDANCE : GENERIC_GUIDANCE;
  const stepOffset = hasWorkbookConnection ? 1 : 0;
  const step = (base) => String(base + stepOffset).padStart(2, "0");

  return {
    hasWorkbookConnection,
    ...guidance,
    steps: {
      warmup: step(3),
      vocabulary: step(4),
      grammar: step(5),
      examples: step(6),
      notes: step(7),
      guidedPractice: step(8),
      speaking: step(9),
      mistakes: step(10),
      wrapUp: step(11),
    },
  };
}
