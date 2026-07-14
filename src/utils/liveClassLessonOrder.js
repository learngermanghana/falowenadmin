function normalize(value) {
  return String(value || "").trim();
}

function toDate(value) {
  if (!value) return null;
  if (typeof value?.toDate === "function") return value.toDate();
  if (typeof value?.toMillis === "function") return new Date(value.toMillis());
  if (typeof value === "object" && Number.isFinite(value.seconds)) {
    return new Date((Number(value.seconds) * 1000) + Math.round(Number(value.nanoseconds || 0) / 1000000));
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function sessionLessonNumber(session = {}) {
  const curriculumIndex = Number(session.curriculumIndex || 0);
  if (Number.isFinite(curriculumIndex) && curriculumIndex > 0) return curriculumIndex;

  const topicMatch = normalize(session.topic || session.title).match(/\bLesson\s+(\d+)\b/i);
  if (topicMatch) return Number(topicMatch[1]);

  const ids = [
    ...(Array.isArray(session.assignmentIds) ? session.assignmentIds : []),
    ...(Array.isArray(session.chapterIds) ? session.chapterIds : []),
    ...(Array.isArray(session.curriculumIds) ? session.curriculumIds : []),
    session.assignment_id,
  ];

  for (const value of ids) {
    const match = normalize(value).match(/(?:^|[.-])(\d+)$/);
    if (match) return Number(match[1]);
  }

  return null;
}

export function compareSessionsByLesson(left = {}, right = {}) {
  const leftLesson = sessionLessonNumber(left);
  const rightLesson = sessionLessonNumber(right);

  if (leftLesson !== null && rightLesson !== null && leftLesson !== rightLesson) {
    return leftLesson - rightLesson;
  }
  if (leftLesson !== null && rightLesson === null) return -1;
  if (leftLesson === null && rightLesson !== null) return 1;

  const leftDate = toDate(left.startsAt)?.getTime() ?? Number.MAX_SAFE_INTEGER;
  const rightDate = toDate(right.startsAt)?.getTime() ?? Number.MAX_SAFE_INTEGER;
  return leftDate - rightDate;
}

export function buildLessonDateRepairPlan(sessions = []) {
  const eligible = sessions
    .filter((session) => String(session.status || "scheduled").toLowerCase() !== "cancelled")
    .map((session) => ({
      session,
      lessonNumber: sessionLessonNumber(session),
      startsAtDate: toDate(session.startsAt),
      endsAtDate: toDate(session.endsAt),
    }))
    .filter((item) => item.lessonNumber !== null && item.startsAtDate);

  const lessons = [...eligible].sort((left, right) => {
    if (left.lessonNumber !== right.lessonNumber) return left.lessonNumber - right.lessonNumber;
    return left.startsAtDate.getTime() - right.startsAtDate.getTime();
  });
  const slots = [...eligible].sort((left, right) => left.startsAtDate.getTime() - right.startsAtDate.getTime());

  return lessons.map((lesson, index) => {
    const slot = slots[index];
    const fallbackDuration = Math.max(
      1,
      Math.round(((lesson.endsAtDate?.getTime() || lesson.startsAtDate.getTime() + 7200000) - lesson.startsAtDate.getTime()) / 60000),
    );
    const slotDuration = Math.max(
      1,
      Math.round(((slot.endsAtDate?.getTime() || slot.startsAtDate.getTime() + fallbackDuration * 60000) - slot.startsAtDate.getTime()) / 60000),
    );
    const targetStartsAt = slot.startsAtDate.toISOString();
    const targetEndsAt = new Date(slot.startsAtDate.getTime() + slotDuration * 60000).toISOString();
    const currentStartsAt = lesson.startsAtDate.toISOString();
    const currentEndsAt = lesson.endsAtDate?.toISOString() || "";

    return {
      session: lesson.session,
      lessonNumber: lesson.lessonNumber,
      targetStartsAt,
      targetEndsAt,
      durationMinutes: slotDuration,
      changed: currentStartsAt !== targetStartsAt || currentEndsAt !== targetEndsAt,
    };
  });
}
