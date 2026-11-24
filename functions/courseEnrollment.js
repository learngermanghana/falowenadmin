// Legacy consumers continue to read the primary placement from the student root.
const { asDate, addCalendarMonths } = require("./studentContractLifecycle");
const languages = ["german", "swahili"];
const classFields = ["classId", "classRecordId", "assignedClassId", "groupId", "cohortId", "className", "classname", "class", "group", "groupName", "cohort", "cohortName", "level", "levelId"];
const invalid = message => Object.assign(new Error(message), { statusCode: 400 });

function courseEnrollmentPatch(student, request, now = new Date()) {
  const { mode, secondaryLevel, secondaryClassName, expectedPrimary, secondaryAccessEnd, grantSecondaryAccess } = request || {};
  const primary = String(student.program || "german").toLowerCase();
  if (!languages.includes(primary) || ![...languages, "both"].includes(mode)) throw invalid("Invalid course language");
  if (expectedPrimary !== primary) throw Object.assign(new Error("The primary course changed. Reload the student."), { statusCode: 409 });
  const other = languages.find(language => language !== primary);
  const placements = { ...student.coursePlacements };
  const saved = placements[other] || { level: "A1", className: "" };
  if (mode === "both" || (mode === other && (secondaryLevel !== undefined || secondaryClassName !== undefined))) {
    const level = secondaryLevel ?? saved.level ?? "A1";
    const className = secondaryClassName ?? saved.className ?? "";
    if (!/^(A1|A2|B1|B2|C1|C2)$/.test(level) || typeof className !== "string" || className.length > 160) throw invalid("Invalid secondary course placement");
    placements[other] = { ...saved, level, levelId: level, className: className.trim() };
    if (className.trim() !== (saved.className || "")) {
      for (const key of classFields.filter(key => !["level", "levelId", "className"].includes(key))) delete placements[other][key];
    }
    if (mode === "both" && primary === "german" && (grantSecondaryAccess === true || secondaryAccessEnd !== undefined)) {
      const paid = String(student.paymentStatus || "").trim().toLowerCase() === "paid" ||
        ["paid", "paidAmount", "initialPaymentAmount", "amountPaid"].some(field => Number(String(student[field] || "0").replace(/,/g, "")) > 0);
      if (!paid || student.accountType === "exam_only") throw invalid("Complimentary Swahili access requires an existing paid German course.");
      const existing = placements.swahili;
      if (existing.accessType && existing.accessType !== "complimentary") throw invalid("Review the existing Swahili enrollment before replacing its access.");
      if (existing.accessType !== "complimentary" && (Number(existing.paid || existing.paidAmount || 0) > 0 || existing.contractEnd)) throw invalid("Existing Swahili billing or contract must be reviewed separately.");
      const start = asDate(existing.contractStart) || now;
      let end;
      if (secondaryAccessEnd !== undefined) {
        if (typeof secondaryAccessEnd !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(secondaryAccessEnd)) throw invalid("Enter a valid Swahili access end date.");
        end = new Date(secondaryAccessEnd + "T23:59:59.999Z");
        if (!Number.isFinite(end.getTime()) || end.toISOString().slice(0,10) !== secondaryAccessEnd || end <= start) throw invalid("Swahili expiry must follow its start date.");
      } else {
        end = asDate(existing.contractEnd) || addCalendarMonths(start, 3);
      }
      placements.swahili = { ...existing, accessType: "complimentary", contractStart: start.toISOString(),
        contractEnd: end.toISOString(), contractTermMonths: 3 };
    } else if (secondaryAccessEnd !== undefined || grantSecondaryAccess === true) {
      throw invalid("This access grant is only for German + Swahili enrollment.");
    }
    if (mode === "both") return { program: primary, secondaryProgram: other, coursePlacements: placements };
  }
  if (mode === primary) return { program: primary, secondaryProgram: null };
  placements[primary] = Object.fromEntries(classFields.map(key => [key, student[key] || ""]));
  const root = Object.fromEntries(classFields.map(key => [key, (placements[other] || saved)[key] || ""]));
  return { ...root, program: other, secondaryProgram: null, coursePlacements: placements };
}
module.exports = { courseEnrollmentPatch };
