import { getCourseSessionGroups } from "../data/courseSessionGroups.js";
import { belongsToSelectedClass } from "./liveClassSessionOwnership.js";
import {
  dedupeCompatibleSessionRecords,
  enrichSessionsWithStableCurriculum,
} from "./liveClassSessionDedupe.js";

function normalize(value) {
  return String(value || "").trim();
}

function resolveLevel(klass = {}) {
  const source = [
    klass.levelId,
    klass.level,
    klass.courseLevel,
    klass.name,
    klass.className,
    klass.slug,
  ].map(normalize).join(" ");
  return source.match(/\b(A1|A2|B1|B2|C1|C2)\b/i)?.[1]?.toUpperCase() || "";
}

function isSupersededAlias(session = {}) {
  return normalize(session.status).toLowerCase() === "superseded" || session.superseded === true;
}

// Mutations must see the same canonical timetable the Live Classes dashboard shows.
// Load every legacy identity for ownership safety, then dedupe and enrich active records
// before planning a move. Superseded repair aliases must be removed before enrichment;
// otherwise an alias consumes a curriculum slot and shifts later active lessons.
export async function loadMutationClassSessions(classId, klass, querySessions) {
  const identifiers = [...new Set([
    classId, klass.id, klass.name, klass.classId, klass.className, klass.slug,
  ].map(normalize).filter(Boolean))];
  const results = await Promise.all(identifiers.flatMap((identifier) => (
    ["classId", "classRecordId", "className"].map((field) => querySessions(field, identifier))
  )));
  const found = new Map();
  results.flat().forEach((session) => {
    if (belongsToSelectedClass(session, classId, identifiers)) found.set(session.id, session);
  });

  const scoped = dedupeCompatibleSessionRecords([...found.values()], { classId })
    .filter((session) => !isSupersededAlias(session));
  const levelId = resolveLevel(klass);
  const groups = getCourseSessionGroups(levelId);
  return groups.length
    ? enrichSessionsWithStableCurriculum(klass, scoped, groups)
    : scoped;
}
