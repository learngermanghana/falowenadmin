// Legacy consumers continue to read the primary placement from the student root.
const languages = ["german", "swahili"];
const classFields = ["classId", "classRecordId", "assignedClassId", "groupId", "cohortId", "className", "classname", "class", "group", "groupName", "cohort", "cohortName", "level", "levelId"];
const invalid = message => Object.assign(new Error(message), { statusCode: 400 });

function courseEnrollmentPatch(student, request) {
  const { mode, secondaryLevel, secondaryClassName, expectedPrimary } = request || {};
  const primary = String(student.program || "german").toLowerCase();
  if (!languages.includes(primary) || ![...languages, "both"].includes(mode)) throw invalid("Invalid course language");
  if (expectedPrimary !== primary) throw Object.assign(new Error("The primary course changed. Reload the student."), { statusCode: 409 });
  const other = languages.find(language => language !== primary);
  const placements = { ...student.coursePlacements };
  const saved = placements[other] || { level: "A1", className: "" };
  if (mode === "both") {
    const level = secondaryLevel ?? saved.level;
    const className = secondaryClassName ?? saved.className;
    if (!/^(A1|A2|B1|B2|C1|C2)$/.test(level) || typeof className !== "string" || className.length > 160) throw invalid("Invalid secondary course placement");
    placements[other] = { ...saved, level, levelId: level, className: className.trim() };
    if (className.trim() !== saved.className) {
      for (const key of classFields.filter(key => !["level", "levelId", "className"].includes(key))) delete placements[other][key];
    }
    return { program: primary, secondaryProgram: other, coursePlacements: placements };
  }
  if (mode === primary) return { program: primary, secondaryProgram: null };
  placements[primary] = Object.fromEntries(classFields.map(key => [key, student[key] || ""]));
  const root = Object.fromEntries(classFields.map(key => [key, saved[key] || ""]));
  return { ...root, program: other, secondaryProgram: null, coursePlacements: placements };
}
module.exports = { courseEnrollmentPatch };
