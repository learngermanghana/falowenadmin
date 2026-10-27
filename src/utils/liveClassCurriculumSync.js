// Persist the same curriculum tuple that Admin displays. A corrected day alone
// leaves student readers with an old topic and assignment on the new day.
export function buildDisplayedCurriculumPatch(stored = {}, displayed = {}) {
  const day = displayed.curriculumDay;
  const index = displayed.curriculumIndex;
  const ids = displayed.assignmentIds;
  if (!Number.isInteger(day) || day < 1 || !Number.isInteger(index)
    || !Array.isArray(ids) || !ids.length || !displayed.topic) return null;
  const patch = {
    curriculumDay: day,
    curriculumIndex: index,
    topic: displayed.topic,
    assignmentIds: [...ids],
    chapterIds: [...ids],
    curriculumIds: [...ids],
    assignment_id: ids[0],
    curriculumSource: displayed.curriculumSource,
    curriculumVersion: displayed.curriculumVersion,
  };
  // Undefined optional metadata must not enter a Firestore update.
  Object.keys(patch).forEach((key) => { if (patch[key] === undefined) delete patch[key]; });
  return Object.entries(patch).some(([key, value]) => JSON.stringify(stored[key]) !== JSON.stringify(value))
    ? patch : null;
}
