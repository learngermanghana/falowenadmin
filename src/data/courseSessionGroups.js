import { courseDictionary } from "./courseDictionary.js";

const A1_DAY_BY_ASSIGNMENT_ID = Object.freeze({
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

function normalizeLevel(value) {
  return String(value || "").trim().toUpperCase();
}

function normalizeAssignmentId(value) {
  return String(value || "").trim().toUpperCase();
}

function entryTitle(levelId, entry = {}) {
  return normalizeLevel(levelId) === "A1"
    ? String(entry.en || entry.de || "").trim()
    : String(entry.de || entry.en || "").trim();
}

export function getCourseTaskDay(levelId, assignmentId, fallbackIndex = 0) {
  const level = normalizeLevel(levelId);
  const id = normalizeAssignmentId(assignmentId);
  if (level === "A1" && Object.prototype.hasOwnProperty.call(A1_DAY_BY_ASSIGNMENT_ID, id)) {
    return A1_DAY_BY_ASSIGNMENT_ID[id];
  }
  return fallbackIndex;
}

export function getCourseSessionGroups(levelId) {
  const level = normalizeLevel(levelId);
  const entries = Object.values(courseDictionary[level] || {});
  const groups = new Map();

  entries.forEach((entry, index) => {
    const assignmentId = normalizeAssignmentId(entry.assignment_id);
    const day = getCourseTaskDay(level, assignmentId, index);
    const key = level === "A1" ? `day:${day}` : `task:${index}`;
    if (!groups.has(key)) groups.set(key, { key, day, entries: [] });
    groups.get(key).entries.push(entry);
  });

  return [...groups.values()].map((group, index) => {
    const assignmentIds = group.entries
      .map((entry) => String(entry.assignment_id || "").trim())
      .filter(Boolean);
    const titles = group.entries.map((entry) => entryTitle(level, entry)).filter(Boolean);
    const chapters = group.entries.map((entry) => String(entry.chapter || "").trim()).filter(Boolean);
    const dayLabel = level === "A1" ? `Day ${group.day}` : `Lesson ${index + 1}`;
    const topic = `${dayLabel}: ${titles.join(" + ")}`;

    return {
      ...group,
      index,
      assignmentIds,
      chapterIds: assignmentIds,
      curriculumIds: assignmentIds,
      chapters,
      titles,
      topic,
      label: `${dayLabel} — ${chapters.join(" + ")} — ${titles.join(" + ")}`,
    };
  });
}

export function getCourseSessionGroup(levelId, sessionIndex) {
  return getCourseSessionGroups(levelId)[Number(sessionIndex)] || null;
}

export function getCourseSessionCount(levelId) {
  return getCourseSessionGroups(levelId).length;
}

export function findCourseSessionGroup(levelId, assignmentIds = []) {
  const ids = new Set((Array.isArray(assignmentIds) ? assignmentIds : [assignmentIds])
    .map(normalizeAssignmentId)
    .filter(Boolean));
  if (!ids.size) return null;
  return getCourseSessionGroups(levelId).find((group) =>
    group.assignmentIds.some((id) => ids.has(normalizeAssignmentId(id))),
  ) || null;
}
