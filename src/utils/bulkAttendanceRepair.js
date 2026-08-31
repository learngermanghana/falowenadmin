function normalizedStatus(session = {}) {
  return String(session.status || session.sessionStatus || "scheduled").trim().toLowerCase();
}

export function isBulkRepairEligibleSession(session = {}) {
  if (!String(session.id || session.classSessionId || "").trim()) return false;
  return !["cancelled", "canceled", "superseded", "deleted"].includes(normalizedStatus(session));
}

export function buildBulkPresentRepair({ attendance = {}, sessionIds = [], studentCodes = [] } = {}) {
  const selectedSessions = [...new Set(sessionIds.map((value) => String(value || "").trim()).filter(Boolean))];
  const selectedStudents = [...new Set(studentCodes.map((value) => String(value || "").trim()).filter(Boolean))];
  const nextAttendance = { ...attendance };
  const changedSessionIds = [];
  let changedRecords = 0;

  selectedSessions.forEach((sessionId) => {
    const session = attendance[sessionId];
    if (!session || !isBulkRepairEligibleSession({ ...session, id: session.id || sessionId })) return;

    const students = { ...(session.students || {}) };
    let sessionChanged = false;

    selectedStudents.forEach((studentCode) => {
      const student = students[studentCode];
      if (!student || student.present === true) return;
      students[studentCode] = {
        ...student,
        present: true,
        status: "present",
        attendanceStatus: "present",
      };
      sessionChanged = true;
      changedRecords += 1;
    });

    if (!sessionChanged) return;
    changedSessionIds.push(sessionId);
    nextAttendance[sessionId] = { ...session, students };
  });

  return {
    attendance: nextAttendance,
    changedSessionIds,
    changedRecords,
  };
}
