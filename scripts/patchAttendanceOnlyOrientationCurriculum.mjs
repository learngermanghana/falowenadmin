import fs from "node:fs";

function replaceOnce(source, before, after, label) {
  if (source.includes(after)) return source;
  if (!source.includes(before)) {
    throw new Error(`${label} anchor changed; update patchAttendanceOnlyOrientationCurriculum.mjs`);
  }
  return source.replace(before, after);
}

function patchFile(relativePath, transform) {
  const target = new URL(`../${relativePath}`, import.meta.url);
  const source = fs.readFileSync(target, "utf8");
  const next = transform(source);
  fs.writeFileSync(target, next);
}

patchFile("src/data/courseDictionary.js", (source) => {
  const a2Before = [
    "  A2: {",
    '    "A2-1.1": { assignment_id: "A2-1.1", chapter: "1.1", de: "Small Talk", en: "Small Talk" },',
  ].join("\n");
  const a2After = [
    "  A2: {",
    '    "A2-Tutorial": { assignment_id: "A2-Tutorial", chapter: "0", de: "Einführung und Orientierung", en: "Orientation and Tutorial", attendanceOnly: true },',
    '    "A2-1.1": { assignment_id: "A2-1.1", chapter: "1.1", de: "Small Talk", en: "Small Talk" },',
  ].join("\n");

  const b1Before = [
    "  B1: {",
    '    "B1-1.1": { assignment_id: "B1-1.1", chapter: "1.1", de: "Traumwelten", en: "Dream Worlds" },',
  ].join("\n");
  const b1After = [
    "  B1: {",
    '    "B1-Tutorial": { assignment_id: "B1-Tutorial", chapter: "0", de: "Einführung und Orientierung", en: "Orientation and Tutorial", attendanceOnly: true },',
    '    "B1-1.1": { assignment_id: "B1-1.1", chapter: "1.1", de: "Traumwelten", en: "Dream Worlds" },',
  ].join("\n");

  let next = replaceOnce(source, a2Before, a2After, "A2 attendance orientation");
  next = replaceOnce(next, b1Before, b1After, "B1 attendance orientation");
  return next;
});

const automaticEntriesBefore = "Object.values(courseDictionary[level] || {})";
const automaticEntriesAfter = "Object.values(courseDictionary[level] || {}).filter((entry) => entry?.attendanceOnly !== true)";

patchFile("src/data/courseSessionGroups.js", (source) =>
  replaceOnce(source, automaticEntriesBefore, automaticEntriesAfter, "course session group filtering"));

patchFile("src/services/liveClassServiceBase.js", (source) =>
  replaceOnce(source, automaticEntriesBefore, automaticEntriesAfter, "live class automatic curriculum filtering"));

patchFile("src/data/teachingSlides.js", (source) =>
  replaceOnce(source, automaticEntriesBefore, automaticEntriesAfter, "teaching slide filtering"));

patchFile("src/services/classCohortUpdateServiceBase.js", (source) => {
  const before = 'Object.values(courseDictionary[String(levelId || "").toUpperCase()] || {})[index]';
  const after = 'Object.values(courseDictionary[String(levelId || "").toUpperCase()] || {}).filter((entry) => entry?.attendanceOnly !== true)[index]';
  return replaceOnce(source, before, after, "class cohort automatic curriculum filtering");
});

patchFile("src/services/groupedCurriculumService.js", (source) => {
  const before = "Object.keys(courseDictionary[levelId] || {}).length";
  const after = "Object.values(courseDictionary[levelId] || {}).filter((entry) => entry?.attendanceOnly !== true).length";
  return replaceOnce(source, before, after, "grouped curriculum task count filtering");
});

console.log("A2 and B1 Day 0 orientation are selectable for attendance without changing the 28-lesson curriculum.");
