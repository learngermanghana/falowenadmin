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

  if (haystack.includes(term)) return true;

  // Only treat a phone-like search as phone digits. A one-digit query must not
  // match nearly every phone in the directory.
  if (!/^[+\d\s()./-]+$/.test(term)) return false;
  const digits = term.replace(/\D/g, "");
  if (digits.length < 4) return false;

  return [primaryPhone, emergencyPhone].some(
    (value) => String(value || "").replace(/\D/g, "").includes(digits),
  );
}
