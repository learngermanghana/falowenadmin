import { courseDictionary, compareCourseDictionaryEntries } from "../data/courseDictionary.js";
import { getCourseSessionGroups } from "../data/courseSessionGroups.js";
import { c2CourseEntries } from "../data/c2PresenterSlides.js";

// The dictionary, not the student publishing endpoint, controls which lessons
// appear in the editor. The student API remains authoritative for publish rights.
export const STUDIO_COURSE_LEVELS = Object.freeze(["A1", "A2", "B1", "B2", "C1", "C2"]);
const canonicalId = value => String(value || "").trim().toUpperCase();

export function getStudioCourseCatalog(level, publishLessons = []) {
  const name = String(level || "").trim().toUpperCase();
  if (!STUDIO_COURSE_LEVELS.includes(name)) return [];
  // C2's dictionary is also inserted by the legacy build patch. The fallback
  // makes the studio complete even in clean development/test source checkouts.
  const entries = Object.values(courseDictionary[name] ||
    (name === "C2" ? Object.fromEntries(c2CourseEntries.map(item => [item.assignment_id, item])) : {}))
    .filter(entry => entry?.assignment_id && (entry.de || entry.en))
    .sort(compareCourseDictionaryEntries);
  const dayById = new Map(
    getCourseSessionGroups(name).flatMap(group =>
      group.assignmentIds.map(id => [canonicalId(id), group.day])),
  );
  const backendById = new Map(
    (Array.isArray(publishLessons) ? publishLessons : [])
      .filter(row => String(row?.level || "").toUpperCase() === name && row.assignmentKey)
      .map(row => [canonicalId(row.assignmentKey), row]),
  );
  return entries.map((entry, index) => {
    const assignmentKey = String(entry.assignment_id).trim();
    const title = String(name === "A1" ? entry.en || entry.de : entry.de || entry.en).trim();
    const germanTitle = String(entry.de || title).trim();
    const englishTitle = String(entry.en || title).trim();
    const chapter = String(entry.chapter || "").trim();
    const backend = backendById.get(canonicalId(assignmentKey));
    const backendDay = Number(backend?.day);
    const publishable = !!backend && Number.isInteger(backendDay) && backendDay >= 0;
    return {
      level: name,
      assignmentKey,
      chapter,
      title,
      germanTitle,
      englishTitle,
      label: `${chapter ? `Chapter ${chapter} · ` : ""}${title} (${assignmentKey})`,
      day: dayById.get(canonicalId(assignmentKey)) ?? index + 1,
      publishable,
      publishDay: publishable ? backendDay : null,
      publishRoute: publishable ? String(backend.route || "") : "",
    };
  });
}

export function getStudioCourseContext(entry) {
  if (!entry?.assignmentKey || !entry?.level) return null;
  return {
    assignmentKey: entry.assignmentKey,
    chapter: entry.chapter || "",
    title: entry.germanTitle || entry.title,
    englishTitle: entry.englishTitle || entry.title,
  };
}
