export function clean(value) {
  return String(value ?? "").trim();
}

export function cleanLower(value) {
  return clean(value).toLowerCase();
}

export function studentCodeOf(student = {}) {
  return clean(student.studentCode || student.studentcode || student.student_code || student.code || student.uid);
}

export function studentEmailOf(student = {}) {
  return clean(student.email || student.contactEmail).toLowerCase();
}

export function studentLevelOf(student = {}, fallback = "") {
  const values = [student.level, student.classLevel, student.courseLevel, fallback, student.className, student.class, student.group];
  for (const value of values) {
    const match = clean(value).match(/\b(A1|A2|B1|B2|C1|C2)\b/i);
    if (match?.[1]) return match[1].toUpperCase();
  }
  return "";
}

export function identityKeys(value = {}) {
  const keys = [
    value.studentCode,
    value.studentcode,
    value.student_code,
    value.code,
    value.uid,
    value.studentId,
    value.student_id,
    value.id,
    value.email,
    value.contactEmail,
  ]
    .map(cleanLower)
    .filter(Boolean);
  return [...new Set(keys)];
}

export function uniqueStudents(students = []) {
  const seen = new Set();
  return students.filter((student) => {
    const keys = identityKeys(student);
    const fallback = cleanLower(student.name);
    const comparable = keys.length ? keys : fallback ? [fallback] : [];
    if (!comparable.length || comparable.some((key) => seen.has(key))) return false;
    comparable.forEach((key) => seen.add(key));
    return true;
  });
}

function attendanceEntryForStudent(student, session = {}) {
  const entries = session.students && typeof session.students === "object" ? session.students : {};
  const studentKeys = new Set(identityKeys(student));
  const studentName = cleanLower(student.name || student.studentName);

  for (const [entryKey, entryValue] of Object.entries(entries)) {
    const entry = entryValue && typeof entryValue === "object" ? entryValue : { present: Boolean(entryValue) };
    const keys = new Set([cleanLower(entryKey), ...identityKeys(entry)]);
    if ([...keys].some((key) => key && studentKeys.has(key))) return entry;
    if (studentName && cleanLower(entry.name || entry.studentName) === studentName) return entry;
  }
  return null;
}

export function attendanceStatus(entry = {}) {
  return cleanLower(entry.status || entry.attendanceStatus);
}

export function isPresentAttendance(entry = {}) {
  const status = attendanceStatus(entry);
  return entry.present === true || ["present", "late", "attended"].includes(status);
}

export function isAbsentAttendance(entry = {}) {
  const status = attendanceStatus(entry);
  if (["absent", "missed", "no_show", "no-show"].includes(status)) return true;
  return entry.present === false && Boolean(status);
}

export function filterStudentsByAttendance(students = [], session = {}, mode = "all") {
  if (mode === "all") return uniqueStudents(students);
  return uniqueStudents(students).filter((student) => {
    const entry = attendanceEntryForStudent(student, session);
    if (!entry) return false;
    return mode === "present" ? isPresentAttendance(entry) : mode === "absent" ? isAbsentAttendance(entry) : false;
  });
}

export function filterStudentsNotCheckedIn(students = [], checkins = []) {
  const checked = new Set();
  checkins.forEach((checkin) => identityKeys(checkin).forEach((key) => checked.add(key)));
  return uniqueStudents(students).filter((student) => {
    const keys = identityKeys(student);
    return !keys.some((key) => checked.has(key));
  });
}

export function isStudentUnpaid(student = {}) {
  const status = cleanLower(student.paymentStatus || student.payment_status || student.billingStatus || student.billing_status)
    .replace(/[\s-]+/g, "_");
  const paidStatuses = new Set(["paid", "cleared", "complete", "completed", "fully_paid", "settled"]);
  const unpaidStatuses = new Set(["unpaid", "partial", "pending", "overdue", "failed", "expired", "awaiting_payment", "payment_required"]);
  if (paidStatuses.has(status)) return false;
  if (unpaidStatuses.has(status)) return true;

  const balanceRaw = student.balanceDue ?? student.balance_due ?? student.balance;
  if (balanceRaw !== undefined && balanceRaw !== null && clean(balanceRaw) !== "") {
    const balance = Number(balanceRaw);
    if (Number.isFinite(balance)) return balance > 0;
  }

  const tuition = Number(student.tuitionFee ?? student.tuition_fee ?? student.fee ?? 0);
  const paid = Number(student.paid ?? student.paidAmount ?? student.initialPaymentAmount ?? 0);
  return Number.isFinite(tuition) && tuition > 0 && Number.isFinite(paid) && paid < tuition;
}

export function filterUnpaidStudents(students = []) {
  return uniqueStudents(students).filter(isStudentUnpaid);
}

export function assignmentIdsOf(session = {}) {
  const values = Array.isArray(session.assignmentIds)
    ? session.assignmentIds
    : [session.assignmentId, session.assignment_id];
  return [...new Set(values.map((value) => clean(value).toUpperCase().replace(/_/g, ".")).filter(Boolean))];
}

export function submissionMatchesAssignments(submission = {}, assignmentIds = []) {
  const targets = new Set(assignmentIds.map((value) => clean(value).toUpperCase().replace(/_/g, ".")).filter(Boolean));
  if (!targets.size) return false;
  const candidates = [
    submission.assignmentId,
    submission.assignment_id,
    submission.assignmentKey,
    submission.assignment,
    submission.raw?.assignmentId,
    submission.raw?.assignment_id,
    submission.raw?.assignmentKey,
    submission.raw?.canonicalAssignmentKey,
  ];
  return candidates.some((candidate) => {
    const normalized = clean(candidate).toUpperCase().replace(/_/g, ".");
    if (!normalized) return false;
    if (targets.has(normalized)) return true;
    return [...targets].some((target) => normalized.includes(target));
  });
}
