// Label an A1 Course Book activity only when its teacher-authored lesson
// metadata establishes whether it is tutor-marked or self-practice.
// The route stays the exact link from that lesson; a published page alone
// never proves that submitting it for marking is required.
const clean = (value) => String(value || "").trim();
const SELF_PRACTICE = /self[-\s]?practic|self[-\s]?learning|no (?:formal |separate )?(?:tutor[-\s]?marked|scored)(?: progression)? submission|interactive self[-\s]?practic/i;
const TUTOR_MARKED = /\btutor[-\s]?marked\b/i;

export function getA1LearningPath(slide = {}) {
  if (clean(slide.course).toUpperCase() !== "A1") return null;
  const id = clean(slide.assignmentId).toUpperCase();
  if (id === "A1-TUTORIAL") return null;
  if (id === "A1-5.9") return {
    kind: "graded-speaking", assignmentId: id,
    label: "Required speaking assignment",
    instruction: "Complete Teil 1, Teil 2 and Teil 3 with the AI examiner. Submit the complete assessment to save your score and feedback.",
    actionLabel: "Open speaking assignment",
    reviewLabel: "Teacher: confirm that all three verified speaking parts and the final score are saved.",
    activityUrl: "https://www.falowen.app/campus/course/verboten-erlaubt-5-9",
  };

  const connection = slide.workbookConnection || {};
  const sourceText = [
    connection.subtitle,
    ...(Array.isArray(slide.teacherNotesEn) ? slide.teacherNotesEn : []),
  ].map(clean).join(" ");
  const isExplicitSelfPractice = /-PRACTICE$/.test(id) || SELF_PRACTICE.test(sourceText);
  const kind = isExplicitSelfPractice
    ? "self-practice"
    : TUTOR_MARKED.test(clean(connection.subtitle))
      ? "tutor-marked"
      : "review";

  const modes = {
    "self-practice": {
      label: "Self-practice",
      instruction: "Complete this activity independently to check what you understood. Review mistakes and try again. This activity is not a tutor-marked submission.",
      actionLabel: "Open self-practice",
      reviewLabel: "Teacher: check understanding in class; do not request a marked submission for this activity.",
    },
    "tutor-marked": {
      label: "Tutor-marked assignment",
      instruction: "Complete the published assignment sections and submit them through Falowen for tutor marking. Check the required parts before submission.",
      actionLabel: "Open tutor-marked assignment",
      reviewLabel: "Teacher: check the lesson target in class; mark the student's actual submitted work through the existing marking system.",
    },
    review: {
      label: "Course Book activity",
      instruction: "Review this lesson's Course Book activity and follow its own instructions. Submission status has not been confirmed for this lesson.",
      actionLabel: "Open Course Book activity",
      reviewLabel: "Teacher: check understanding. Verify the learner page before asking for a scored submission.",
    },
  };

  return {
    kind,
    ...modes[kind],
    assignmentId: id,
    subtitle: clean(connection.subtitle),
    grammarUrl: clean(connection.grammarUrl),
    activityUrl: clean(connection.workbookUrl),
    parts: Array.isArray(connection.parts) ? connection.parts : [],
  };
}
