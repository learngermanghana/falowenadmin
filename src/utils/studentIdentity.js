function text(value) {
  return String(value ?? "").trim();
}

export function codeFromScopeKey(value) {
  const scope = text(value);
  if (!scope.includes("__")) return "";
  return scope.split("__").map((part) => part.trim()).filter(Boolean)[1] || "";
}

export function resolveStudentIdentity(source = {}, fallbackStudentCode = "") {
  const raw = source.raw || {};
  const studentScopeKey = text(
    source.studentScopeKey ||
      source.student_scope_key ||
      raw.studentScopeKey ||
      raw.student_scope_key,
  );
  const studentCode = text(
    source.studentCode ||
      source.studentcode ||
      source.student_code ||
      raw.studentCode ||
      raw.studentcode ||
      raw.student_code ||
      codeFromScopeKey(studentScopeKey) ||
      fallbackStudentCode,
  );

  return {
    studentCode,
    studentcode: studentCode,
    student_code: studentCode,
    studentName: text(source.studentName || source.name || raw.studentName || raw.name),
    studentEmail: text(source.studentEmail || source.email || raw.studentEmail || raw.email),
    studentId: text(source.studentId || source.student_id || source.uid || raw.studentId || raw.student_id || raw.uid),
    studentScopeKey,
  };
}
