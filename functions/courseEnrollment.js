// Legacy consumers continue to read the primary placement from the student root.
const { asDate, addCalendarMonths } = require("./studentContractLifecycle");
const languages = ["german", "swahili"];
const classFields = ["classId", "classRecordId", "assignedClassId", "groupId", "cohortId", "className", "classname", "class", "group", "groupName", "cohort", "cohortName", "level", "levelId"];
const invalid = message => Object.assign(new Error(message), { statusCode: 400 });

function courseEnrollmentPatch(student, request, now = new Date()) {
  const { mode, secondaryLevel, secondaryClassName, expectedPrimary, secondaryAccessEnd, grantSecondaryAccess, secondaryAccessType, secondaryContractStart, secondaryContractTermMonths } = request || {};
  const primary = String(student.program || "german").toLowerCase();
  if (!languages.includes(primary) || ![...languages, "both"].includes(mode)) throw invalid("Invalid course language");
  if (expectedPrimary !== primary) throw Object.assign(new Error("The primary course changed. Reload the student."), { statusCode: 409 });
  const other = languages.find(language => language !== primary);
  const placements = { ...student.coursePlacements };
  // Root billing belongs to the original primary language. Do not silently move it.
  if (mode === other && (student.contractStart || student.contractEnd || Number(student.paid || student.paidAmount || 0) > 0 || student.paymentStatus === "paid" || student.institutionId)) throw invalid("Keep the original billing language. Review primary-language changes with admissions.");
  const saved = placements[other] || { level: "A1", className: "" };
  if (mode === "both" || (mode === other && (secondaryLevel !== undefined || secondaryClassName !== undefined))) {
    const level = secondaryLevel ?? saved.level ?? "A1";
    const className = secondaryClassName ?? saved.className ?? "";
    if (!/^(A1|A2|B1|B2|C1|C2)$/.test(level) || typeof className !== "string" || className.length > 160) throw invalid("Invalid secondary course placement");
    placements[other] = { ...saved, level, levelId: level, className: className.trim() };
    if (className.trim() !== (saved.className || "")) {
      for (const key of classFields.filter(key => !["level", "levelId", "className"].includes(key))) delete placements[other][key];
    }
    const existing = placements[other];
    const paid = String(student.paymentStatus || "").trim().toLowerCase() === "paid" ||
      ["paid", "paidAmount", "initialPaymentAmount", "amountPaid"].some(field => Number(String(student[field] || "0").replace(/,/g, "")) > 0);
    const grantRequested = grantSecondaryAccess === true || secondaryAccessType === "complimentary";
    const edits = secondaryAccessEnd !== undefined || secondaryContractStart !== undefined || secondaryContractTermMonths !== undefined;
    if ((grantRequested || edits || secondaryAccessType !== undefined) && (mode !== "both" || student.accountType === "exam_only")) throw invalid("Manage secondary access on an eligible dual-course enrollment.");
    if (grantRequested) {
      if (primary === "german" && !paid) throw invalid("Complimentary Swahili access requires an existing paid German course.");
      if (existing.accessType && !["complimentary","pending"].includes(existing.accessType)) throw invalid("Review the existing secondary enrollment before replacing its access.");
      if (existing.accessType !== "complimentary" && (Number(existing.paid || existing.paidAmount || 0) > 0 || existing.contractEnd)) throw invalid("Existing secondary billing or contract must be reviewed separately.");
      if (other === "german" && existing.accessType !== "complimentary" && !secondaryAccessEnd) throw invalid("An explicit German access end date is required.");
      existing.accessType = "complimentary";
    } else if (secondaryAccessType !== undefined) {
      if (secondaryAccessType !== "pending" || (existing.accessType && existing.accessType !== "pending") || existing.contractEnd || Number(existing.paid || existing.paidAmount || 0)>0) throw invalid("Review existing access separately.");
      existing.accessType = "pending";
    }
    if (grantRequested || edits) {
      if (existing.accessType === "pending" || existing.accessType === "invitation_pending") throw invalid("Approve access explicitly before setting a contract.");
      if (!existing.accessType && !existing.contractEnd && !existing.contractStart && !grantRequested) throw invalid("Confirm secondary access before editing dates.");
      const parseDate = (value, end) => {
        if (typeof value !== "string" || !/^\\d{4}-\\d{2}-\\d{2}$/.test(value)) throw invalid("Enter a valid contract date.");
        const date = new Date(value + (end ? "T23:59:59.999Z" : "T00:00:00.000Z"));
        if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0,10)!==value) throw invalid("Enter a valid contract date.");
        return date;
      };
      const start = secondaryContractStart !== undefined ? parseDate(secondaryContractStart,false) : asDate(existing.contractStart) || now;
      const term = secondaryContractTermMonths !== undefined ? Number(secondaryContractTermMonths) : Number(existing.contractTermMonths || 3);
      if (!Number.isInteger(term) || term < 1 || term > 36) throw invalid("Contract term must be 1–36 months.");
      const end = secondaryAccessEnd !== undefined ? parseDate(secondaryAccessEnd,true) : asDate(existing.contractEnd) || (grantRequested ? addCalendarMonths(start,term) : null);
      if (!end || end <= start) throw invalid("Contract expiry must follow its start date.");
      placements[other] = {...existing,contractStart:start.toISOString(),contractEnd:end.toISOString(),contractTermMonths:term};
    }
    if (mode === "both") return { program: primary, secondaryProgram: other, coursePlacements: placements };
  }
  if (mode === primary) return { program: primary, secondaryProgram: null };
  placements[primary] = Object.fromEntries(classFields.map(key => [key, student[key] || ""]));
  const root = Object.fromEntries(classFields.map(key => [key, (placements[other] || saved)[key] || ""]));
  return { ...root, program: other, secondaryProgram: null, coursePlacements: placements };
}
module.exports = { courseEnrollmentPatch };
