const APP_ASSESSMENT_IDS = new Set(["A2-8.22", "B1-7.23"]);

function isAppAssessment(session = {}) {
  const ids = [session.assignmentId, session.assignment_id,
    ...[session.assignmentIds, session.chapterIds, session.curriculumIds].flatMap(value => Array.isArray(value) ? value : [])]
    .filter(Boolean).map(value => String(value).trim().toUpperCase());
  // A mixed session with other teaching tasks must retain live attendance.
  return ids.length ? ids.every(id => APP_ASSESSMENT_IDS.has(id))
    : session.sessionType === "app_assessment";
}

export { isAppAssessment };
