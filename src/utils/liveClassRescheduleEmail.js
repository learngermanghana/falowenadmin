function normalize(value) {
  return String(value || "").trim();
}

function assignmentIds(session = {}) {
  const values = [
    ...(Array.isArray(session.assignmentIds) ? session.assignmentIds : []),
    ...(Array.isArray(session.chapterIds) ? session.chapterIds : []),
    ...(Array.isArray(session.curriculumIds) ? session.curriculumIds : []),
    session.assignment_id,
  ];

  return [...new Set(
    values
      .map((value) => normalize(value).toUpperCase())
      .filter(Boolean),
  )];
}

function numberFromTopic(topic = "") {
  const match = normalize(topic).match(/^(?:day|lesson)\s*(\d+)\b/i);
  return match ? Number(match[1]) : null;
}

function numberFromAssignmentId(value = "") {
  const match = normalize(value).match(/(?:\.|-)(\d+)$/);
  return match ? Number(match[1]) : null;
}

export function resolveRescheduleLessonNumber(session = {}) {
  const topicNumber = numberFromTopic(session.topic || session.title || session.sessionLabel);
  if (Number.isInteger(topicNumber) && topicNumber >= 0) return topicNumber;

  const curriculumIndex = Number(session.curriculumIndex);
  if (Number.isInteger(curriculumIndex) && curriculumIndex >= 0) return curriculumIndex;

  const assignmentNumber = assignmentIds(session)
    .map(numberFromAssignmentId)
    .find((value) => Number.isInteger(value) && value >= 0);
  if (Number.isInteger(assignmentNumber)) return assignmentNumber;

  const curriculumDay = Number(session.curriculumDay);
  return Number.isInteger(curriculumDay) && curriculumDay >= 0 ? curriculumDay : null;
}

export function cleanRescheduleLessonTitle(session = {}) {
  const raw = normalize(session.topic || session.title || session.sessionLabel);
  if (!raw) return "Live class lesson";

  return raw
    .replace(/^(?:day|lesson)\s*\d+\s*[:.\-–—]?\s*/i, "")
    .replace(/\s*[—-]\s*assignment\s+[A-Z0-9.,\-\s]+$/i, "")
    .trim() || "Live class lesson";
}

function affectedLessonLabel(session = {}) {
  const lessonNumber = resolveRescheduleLessonNumber(session);
  const lessonTitle = cleanRescheduleLessonTitle(session);
  return lessonNumber === null
    ? lessonTitle
    : `Lesson ${lessonNumber}: ${lessonTitle}`;
}

export function buildRescheduleAnnouncement({
  klass = {},
  session = {},
  previousTime = "",
  newTime = "",
  affectedCount = 1,
  lastAffectedSession = null,
  lastAffectedTime = "",
} = {}) {
  const className = normalize(klass.name || klass.className || session.className) || "Falowen class";
  const lessonNumber = resolveRescheduleLessonNumber(session);
  const lessonTitle = cleanRescheduleLessonTitle(session);
  const ids = assignmentIds(session);
  const lesson = lessonNumber === null
    ? lessonTitle
    : `Day ${lessonNumber}: ${lessonTitle}`;
  const topic = `Class rescheduled: ${className}${lessonNumber === null ? "" : ` — Day ${lessonNumber}`}`;
  const normalizedAffectedCount = Math.max(1, Number(affectedCount || 1));
  const followingCount = Math.max(0, normalizedAffectedCount - 1);
  const lastAffectedLabel = lastAffectedSession && followingCount > 0
    ? affectedLessonLabel(lastAffectedSession)
    : "";

  const announcement = [
    "Hello everyone,",
    `The live class for ${className} has been rescheduled.`,
    `Lesson: ${lesson}`,
    ids.length ? `Assignment: ${ids.join(", ")}` : "",
    previousTime ? `Previous time: ${previousTime}` : "",
    newTime ? `New time: ${newTime}` : "",
    followingCount > 0
      ? `${followingCount} following lesson${followingCount === 1 ? " was" : "s were"} also shifted to preserve the curriculum order.`
      : "",
    lastAffectedLabel ? `Last affected lesson: ${lastAffectedLabel}` : "",
    lastAffectedLabel && lastAffectedTime ? `Last affected time: ${lastAffectedTime}` : "",
    followingCount > 0
      ? "Please check your Falowen homepage for the updated class times."
      : "Please check your Falowen homepage for the updated class time.",
  ].filter(Boolean).join("\n\n");

  return {
    topic,
    subject: topic,
    announcement,
    className,
    lesson,
    lessonNumber,
    assignmentIds: ids,
    affectedCount: normalizedAffectedCount,
    followingCount,
    lastAffectedLesson: lastAffectedLabel,
  };
}
