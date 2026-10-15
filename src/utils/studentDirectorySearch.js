import { resolveEmergencyContactName, resolveEmergencyContactPhone } from "./studentEmergencyContact.js";

// Keep the staff directory's normal text search while matching phone numbers
// regardless of spaces, hyphens, parentheses or leading + country code.
export function matchesStudentDirectorySearch(student = {}, query = "", primaryPhone = "") {
  const term = String(query || "").trim().toLowerCase();
  if (!term) return true;

  const emergencyPhone = resolveEmergencyContactPhone(student);
  const emergencyName = resolveEmergencyContactName(student);
  const haystack = [
    student.name,
    student.email,
    student.studentCode,
    student.className,
    student.status,
    primaryPhone,
    emergencyPhone,
    emergencyName,
    student.level,
    student.program,
  ].map((value) => String(value || "").toLowerCase()).join(" ");

  // Only normalize phone-like searches. Short numeric searches are too
  // ambiguous and would otherwise match nearly every stored phone number.
  const phoneLike = /^[+\d\s()./-]+$/.test(term);
  const digits = phoneLike ? term.replace(/\D/g, "") : "";
  if (phoneLike && digits.length > 0 && digits.length < 4) return false;

  if (haystack.includes(term)) return true;
  if (!phoneLike || digits.length < 4) return false;

  return [primaryPhone, emergencyPhone].some(
    (value) => String(value || "").replace(/\D/g, "").includes(digits),
  );
}
