const A1_CANONICAL_TEACHING_DAY_BY_ASSIGNMENT = Object.freeze({
  "A1-TUTORIAL": 0,
  "A1-0.1": 1,
  "A1-0.2": 2,
  "A1-1.1": 2,
  "A1-1.1-PRACTICE": 3,
  "A1-1.2": 3,
  "A1-2": 4,
  "A1-1.3": 5,
  "A1-2.3": 6,
  "A1-3": 7,
  "A1-4": 8,
  "A1-5": 9,
  "A1-6": 10,
  "A1-7": 11,
  "A1-8": 12,
  "A1-3.5": 13,
  "A1-3.6": 14,
  "A1-4.7": 15,
  "A1-9": 16,
  "A1-10": 16,
  "A1-11": 17,
  "A1-12.1": 18,
  "A1-12.2": 18,
  "A1-5.9": 19,
  "A1-12.3": 20,
  "A1-13": 21,
  "A1-14.1": 22,
  "A1-14.2": 23,
  "A1-5.10": 24,
});

function normalizeAssignmentId(value = "") {
  return String(value || "").trim().toUpperCase();
}

export function getA1CanonicalTeachingDay(assignmentId) {
  const normalized = normalizeAssignmentId(assignmentId);
  const day = A1_CANONICAL_TEACHING_DAY_BY_ASSIGNMENT[normalized];
  return Number.isInteger(day) ? day : null;
}

export function alignA1TeachingSlideDay(slide = {}) {
  const dayNumber = getA1CanonicalTeachingDay(slide.assignmentId);
  if (!Number.isInteger(dayNumber)) return slide;

  const rawTitle = String(slide.title || "").trim();
  const titleBody = rawTitle
    .replace(/^A1\s+(?:Day|Lesson)\s+\d+\s*·\s*/i, "")
    .replace(/^A1\s*·\s*/i, "")
    .trim();

  return {
    ...slide,
    dayNumber,
    day: `Day ${dayNumber}`,
    title: titleBody ? `A1 Day ${dayNumber} · ${titleBody}` : rawTitle,
  };
}

export { A1_CANONICAL_TEACHING_DAY_BY_ASSIGNMENT };
