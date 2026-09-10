import { belongsToSelectedClass } from "./liveClassSessionOwnership.js";

// Mutations must see legacy timetable neighbours as well as canonical records.
// Do not continue with a partial timetable if any query fails.
export async function loadMutationClassSessions(classId, klass, querySessions) {
  const identifiers = [...new Set([
    classId, klass.id, klass.name, klass.classId, klass.className, klass.slug,
  ].map((value) => String(value || "").trim()).filter(Boolean))];
  const results = await Promise.all(identifiers.flatMap((identifier) => (
    ["classId", "classRecordId", "className"].map((field) => querySessions(field, identifier))
  )));
  const found = new Map();
  results.flat().forEach((session) => {
    if (belongsToSelectedClass(session, classId, identifiers)) found.set(session.id, session);
  });
  return [...found.values()];
}
