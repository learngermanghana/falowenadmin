import fs from "node:fs";

const target = new URL("../src/utils/liveClassSessionDedupe.js", import.meta.url);
let source = fs.readFileSync(target, "utf8");

const before = `export function resolveSessionCourseGroup(session = {}, groups = [], fallbackIndex = 0) {
  const canUseStoredMapping = hasManualScheduleChange(session);
  const ids = canUseStoredMapping ? assignmentIdsForSession(session) : [];
  if (ids.length) {
    const exactMatch = groups.find((group) => sameAssignmentSet(ids, group.assignmentIds || []));
    if (exactMatch) return exactMatch;

    const overlappingMatch = groups.find((group) => (group.assignmentIds || [])
      .some((assignmentId) => ids.includes(normalize(assignmentId).toUpperCase())));
    if (overlappingMatch) return overlappingMatch;
  }

  if (canUseStoredMapping) {
    const storedIndex = Number(session.curriculumIndex || 0);
    if (Number.isFinite(storedIndex) && storedIndex > 0 && groups[storedIndex - 1]) {
      return groups[storedIndex - 1];
    }
  }

  return groups[fallbackIndex] || null;
}`;

const after = `export function resolveSessionCourseGroup(session = {}, groups = [], fallbackIndex = 0) {
  const canUseStoredMapping = hasManualScheduleChange(session);

  // A reschedule changes only the date/time of a lesson. Its canonical curriculum
  // day must stay authoritative even when an older session record still carries
  // stale assignment IDs or a stale topic from another day.
  if (canUseStoredMapping) {
    const storedDay = Number(session.curriculumDay);
    if (Number.isFinite(storedDay) && storedDay >= 0) {
      const dayMatch = groups.find((group) => Number(group.day) === storedDay);
      if (dayMatch) return dayMatch;
    }

    const storedIndex = Number(session.curriculumIndex || 0);
    if (Number.isFinite(storedIndex) && storedIndex > 0 && groups[storedIndex - 1]) {
      return groups[storedIndex - 1];
    }
  }

  const ids = canUseStoredMapping ? assignmentIdsForSession(session) : [];
  if (ids.length) {
    const exactMatch = groups.find((group) => sameAssignmentSet(ids, group.assignmentIds || []));
    if (exactMatch) return exactMatch;

    const overlappingMatch = groups.find((group) => (group.assignmentIds || [])
      .some((assignmentId) => ids.includes(normalize(assignmentId).toUpperCase())));
    if (overlappingMatch) return overlappingMatch;
  }

  return groups[fallbackIndex] || null;
}`;

if (!source.includes(after)) {
  if (!source.includes(before)) {
    throw new Error("Attendance curriculum mapping anchor changed; update patchAttendanceCurriculumMapping.mjs");
  }
  source = source.replace(before, after);
}

fs.writeFileSync(target, source);
console.log("Rescheduled attendance sessions now keep their canonical curriculum day before stale assignment IDs.");
