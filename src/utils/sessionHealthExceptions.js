const ACTIVE_SESSION_STATUSES = new Set(["scheduled", "rescheduled", "live"]);
const CLOSED_SESSION_STATUSES = new Set(["cancelled", "canceled", "completed", "superseded", "deleted"]);
const KNOWN_SESSION_STATUSES = new Set([...ACTIVE_SESSION_STATUSES, ...CLOSED_SESSION_STATUSES]);
const FAILED_DELIVERY_STATUSES = new Set(["failed", "retry_failed", "error"]);
const REVIEW_DELIVERY_STATUSES = new Set(["skipped", "no_recipients"]);

function text(value) {
  return String(value ?? "").trim();
}

function lower(value) {
  return text(value).toLowerCase();
}

function toMillis(value) {
  if (!value) return null;
  if (typeof value?.toMillis === "function") {
    const millis = Number(value.toMillis());
    return Number.isFinite(millis) ? millis : null;
  }
  if (typeof value?.toDate === "function") {
    const date = value.toDate();
    return date instanceof Date && !Number.isNaN(date.getTime()) ? date.getTime() : null;
  }
  if (typeof value?.seconds === "number") {
    const millis = Number(value.seconds) * 1000;
    return Number.isFinite(millis) ? millis : null;
  }
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.getTime();
}

function isoDate(value) {
  const millis = toMillis(value);
  if (millis === null) return "";
  return new Date(millis).toISOString().slice(0, 10);
}

function sessionAssignmentIds(session = {}) {
  const values = [session.assignmentIds, session.chapterIds, session.curriculumIds]
    .find((candidate) => Array.isArray(candidate) && candidate.length) || [];
  const fallback = text(session.assignmentId || session.assignment_id);
  return [...new Set([...values, fallback].map(text).filter(Boolean))];
}

function statusFor(session = {}) {
  return lower(session.status || session.sessionStatus || "scheduled") || "scheduled";
}

function isArchivedClass(klass = {}) {
  const status = lower(klass.status);
  return klass.historical === true || ["archived", "graduated", "deleted", "inactive", "cancelled", "canceled"].includes(status);
}

function normalizedAttendanceMap(attendanceBySessionId = {}) {
  if (attendanceBySessionId instanceof Map) return attendanceBySessionId;
  return new Map(Object.entries(attendanceBySessionId || {}));
}

function studentCandidates(record = {}) {
  return [
    record.uid,
    record.studentUid,
    record.studentId,
    record.studentCode,
    record.studentcode,
    record.email,
    record.id,
  ].map((value) => lower(value)).filter(Boolean);
}

function attendanceEntryForCheckin(attendance = {}, checkin = {}) {
  const students = attendance?.students && typeof attendance.students === "object"
    ? attendance.students
    : {};
  const candidates = new Set(studentCandidates(checkin));
  if (!candidates.size) return null;

  for (const [key, value] of Object.entries(students)) {
    const entryCandidates = new Set([lower(key), ...studentCandidates(value)]);
    if ([...candidates].some((candidate) => entryCandidates.has(candidate))) {
      return value && typeof value === "object" ? value : { present: Boolean(value) };
    }
  }
  return null;
}

function addIssue(target, seen, issue) {
  const key = text(issue.id || [issue.severity, issue.code, issue.sessionId, issue.studentKey].join("::"));
  if (!key || seen.has(key)) return;
  seen.add(key);
  target.push({
    severity: issue.severity === "action" ? "action" : "review",
    code: text(issue.code),
    title: text(issue.title),
    detail: text(issue.detail),
    sessionId: text(issue.sessionId),
    studentKey: text(issue.studentKey),
    action: text(issue.action),
    id: key,
  });
}

function deliveryIssue({ klass, field, title, code, issues, seen }) {
  const status = lower(klass?.[field]);
  if (FAILED_DELIVERY_STATUSES.has(status)) {
    addIssue(issues, seen, {
      severity: "action",
      code,
      title,
      detail: text(klass?.[`${field.replace(/LastStatus$/, "LastError")}`]) || "The most recent delivery attempt failed.",
      action: "Open Communication and retry or inspect the delivery error.",
    });
  } else if (REVIEW_DELIVERY_STATUSES.has(status)) {
    addIssue(issues, seen, {
      severity: "review",
      code,
      title,
      detail: text(klass?.[`${field.replace(/LastStatus$/, "LastSkipReason")}`]) || `The latest delivery was ${status.replace(/_/g, " ")}.`,
      action: "Confirm this was expected in Communication.",
    });
  }
}

function checkScheduleOverlap(sessions, issues, seen) {
  const active = sessions
    .filter((session) => !CLOSED_SESSION_STATUSES.has(statusFor(session)))
    .map((session) => ({
      session,
      start: toMillis(session.startsAt || session.startAt),
      end: toMillis(session.endsAt || session.endAt),
    }))
    .filter((row) => row.start !== null && row.end !== null && row.end > row.start)
    .sort((a, b) => a.start - b.start);

  const sameStart = new Map();
  active.forEach((row) => {
    const key = String(row.start);
    const previous = sameStart.get(key);
    if (previous) {
      addIssue(issues, seen, {
        severity: "action",
        code: "duplicate-session-time",
        title: "Two active sessions have the same start time",
        detail: `${text(previous.session.topic) || previous.session.id} and ${text(row.session.topic) || row.session.id} start at the same time.`,
        sessionId: row.session.id,
        action: "Open Live Classes and move or cancel one of the sessions.",
        id: `duplicate-session-time::${previous.session.id}::${row.session.id}`,
      });
    } else {
      sameStart.set(key, row);
    }
  });

  for (let index = 1; index < active.length; index += 1) {
    const previous = active[index - 1];
    const current = active[index];
    if (current.start < previous.end) {
      addIssue(issues, seen, {
        severity: "action",
        code: "session-overlap",
        title: "Active sessions overlap",
        detail: `${text(previous.session.topic) || previous.session.id} overlaps ${text(current.session.topic) || current.session.id}.`,
        sessionId: current.session.id,
        action: "Open Live Classes and correct the session time.",
        id: `session-overlap::${previous.session.id}::${current.session.id}`,
      });
    }
  }
}

export function buildSessionHealthExceptions({
  klass = {},
  sessions = [],
  attendanceBySessionId = {},
  checkins = [],
  sessionRepair = null,
  curriculumRepair = null,
  checkinLoadFailures = [],
  now = new Date(),
} = {}) {
  const issues = [];
  const seen = new Set();
  const attendanceMap = normalizedAttendanceMap(attendanceBySessionId);
  const nowMs = toMillis(now) ?? Date.now();
  const classId = text(klass.id || klass.classId || klass.classRecordId);
  const className = text(klass.name || klass.className);
  const classArchived = isArchivedClass(klass);

  if (lower(klass.generationStatus) === "failed") {
    addIssue(issues, seen, {
      severity: "action",
      code: "generation-failed",
      title: "Session generation failed",
      detail: text(klass.generationError) || "The class record reports a failed session-generation run.",
      action: "Open Class & settings and regenerate the class sessions.",
    });
  }

  if (lower(klass.timetableIntegrityStatus) === "broken") {
    addIssue(issues, seen, {
      severity: "action",
      code: "timetable-broken",
      title: "Timetable health is broken",
      detail: text(klass.scheduleReminderSuppressionReason) || "Future reminders are paused until the timetable is healthy.",
      action: "Open Official class timetable repair and fix the blocking timetable issues.",
    });
  }

  if (sessionRepair?.error) {
    addIssue(issues, seen, {
      severity: "action",
      code: "session-repair-failed",
      title: "Missing-session repair failed",
      detail: sessionRepair.error,
      action: "Open Official class timetable repair and inspect the saved weekly timetable.",
    });
  }

  if (curriculumRepair?.error) {
    addIssue(issues, seen, {
      severity: "review",
      code: "curriculum-repair-failed",
      title: "Curriculum repair could not finish",
      detail: curriculumRepair.error,
      action: "Review the session dictionary mappings before the next class.",
    });
  }

  deliveryIssue({
    klass,
    field: "classReminderEmailLastStatus",
    title: "Class reminder email failed",
    code: "class-reminder-email",
    issues,
    seen,
  });
  deliveryIssue({
    klass,
    field: "attendanceConfirmationEmailLastStatus",
    title: "Attendance email failed",
    code: "attendance-email",
    issues,
    seen,
  });

  if (!classArchived && sessions.length === 0) {
    addIssue(issues, seen, {
      severity: "action",
      code: "no-sessions",
      title: "No class sessions were found",
      detail: "This class is active but has no canonical session records.",
      action: "Open Class & settings and save the timetable to regenerate sessions.",
    });
  }

  checkScheduleOverlap(sessions, issues, seen);

  const sessionIds = new Set(sessions.map((session) => text(session.id)).filter(Boolean));
  const checkinsBySession = new Map();
  checkins.forEach((checkin) => {
    const sessionId = text(checkin.sessionId || checkin.classSessionId);
    if (!sessionId) return;
    const rows = checkinsBySession.get(sessionId) || [];
    rows.push(checkin);
    checkinsBySession.set(sessionId, rows);
  });

  sessions.forEach((session) => {
    const sessionId = text(session.id);
    const status = statusFor(session);
    const startMs = toMillis(session.startsAt || session.startAt);
    const endMs = toMillis(session.endsAt || session.endAt);
    const attendance = attendanceMap.get(sessionId) || null;
    const assignmentIds = sessionAssignmentIds(session);
    const sessionCheckins = checkinsBySession.get(sessionId) || [];

    if (!KNOWN_SESSION_STATUSES.has(status)) {
      addIssue(issues, seen, {
        severity: "review",
        code: "unknown-session-status",
        title: "Unrecognized session status",
        detail: `${text(session.topic) || sessionId || "A session"} has status “${status}”.`,
        sessionId,
        action: "Review this session in Live Classes.",
      });
    }

    if (startMs === null || endMs === null) {
      addIssue(issues, seen, {
        severity: "action",
        code: "invalid-session-time",
        title: "Session has an invalid date or time",
        detail: `${text(session.topic) || sessionId || "A session"} cannot be placed reliably on the timetable.`,
        sessionId,
        action: "Open Live Classes and correct the date and time.",
      });
    } else if (endMs <= startMs) {
      addIssue(issues, seen, {
        severity: "action",
        code: "invalid-session-duration",
        title: "Session end time is not after its start",
        detail: text(session.topic) || sessionId,
        sessionId,
        action: "Open Live Classes and correct the session duration.",
      });
    }

    const canonicalOwner = text(session.classRecordId);
    if (classId && canonicalOwner && canonicalOwner !== classId) {
      addIssue(issues, seen, {
        severity: "action",
        code: "wrong-session-owner",
        title: "Session belongs to another class record",
        detail: `${text(session.topic) || sessionId} points to class ${canonicalOwner}, not ${classId}.`,
        sessionId,
        action: "Use Official class timetable repair to reconcile the class ownership.",
      });
    }

    if (!attendance) {
      addIssue(issues, seen, {
        severity: CLOSED_SESSION_STATUSES.has(status) ? "review" : "action",
        code: "missing-attendance-session",
        title: "Attendance record is missing",
        detail: `${text(session.topic) || sessionId} has a Live Classes session but no matching attendance session.`,
        sessionId,
        action: "Open Attendance for this session and reconcile the canonical record.",
      });
    } else {
      const attendanceSessionId = text(attendance.classSessionId || attendance.sessionId || attendance.id);
      if (attendanceSessionId && attendanceSessionId !== sessionId) {
        addIssue(issues, seen, {
          severity: "action",
          code: "attendance-session-id-mismatch",
          title: "Attendance points to a different session ID",
          detail: `Live Classes uses ${sessionId}, while Attendance reports ${attendanceSessionId}.`,
          sessionId,
          action: "Open Attendance and reconcile this session before recording attendance.",
        });
      }

      const attendanceStatus = lower(attendance.sessionStatus || attendance.status || "scheduled") || "scheduled";
      const cancelledMismatch = [status, attendanceStatus].some((value) => ["cancelled", "canceled"].includes(value))
        && status !== attendanceStatus;
      if (cancelledMismatch) {
        addIssue(issues, seen, {
          severity: "action",
          code: "attendance-status-mismatch",
          title: "Cancellation state is inconsistent",
          detail: `Live Classes is ${status}, but Attendance is ${attendanceStatus}.`,
          sessionId,
          action: "Re-open the session change in Live Classes so both records are synchronized.",
        });
      }

      const attendanceStartMs = toMillis(attendance.startsAt || attendance.classStartsAt || attendance.autoOpenSessionStartsAt);
      if (startMs !== null && attendanceStartMs !== null && Math.abs(startMs - attendanceStartMs) > 60_000) {
        addIssue(issues, seen, {
          severity: "action",
          code: "attendance-time-mismatch",
          title: "Attendance still has an old session time",
          detail: `The Live Classes and Attendance start times differ for ${text(session.topic) || sessionId}.`,
          sessionId,
          action: "Open Live Classes and re-save the session change, then refresh Attendance.",
        });
      }

      const attendanceDate = text(attendance.date);
      if (startMs !== null && attendanceDate && attendanceDate !== isoDate(startMs)) {
        addIssue(issues, seen, {
          severity: "review",
          code: "attendance-date-mismatch",
          title: "Attendance date label is stale",
          detail: `Attendance says ${attendanceDate}, while the canonical session date is ${isoDate(startMs)}.`,
          sessionId,
          action: "Review the session in Attendance and Live Classes.",
        });
      }
    }

    if (!CLOSED_SESSION_STATUSES.has(status) && !assignmentIds.length) {
      addIssue(issues, seen, {
        severity: "review",
        code: "missing-assignment",
        title: "Session has no assignment mapping",
        detail: `${text(session.topic) || sessionId} cannot support automatic check-in or assignment attendance without an assignment ID.`,
        sessionId,
        action: "Open the session dictionary selection and assign the correct lesson.",
      });
    }

    if (!CLOSED_SESSION_STATUSES.has(status) && !text(session.topic)) {
      addIssue(issues, seen, {
        severity: "review",
        code: "missing-topic",
        title: "Session topic is missing",
        detail: sessionId,
        sessionId,
        action: "Add the session topic or choose its dictionary item.",
      });
    }

    if (["cancelled", "canceled"].includes(status)) {
      if (!text(session.cancellationReason || attendance?.cancellationReason)) {
        addIssue(issues, seen, {
          severity: "review",
          code: "missing-cancellation-reason",
          title: "Cancelled session has no reason",
          detail: text(session.topic) || sessionId,
          sessionId,
          action: "Add a cancellation reason so the audit trail is clear.",
        });
      }

      if (session.remindersSuppressed !== true || (attendance && attendance.remindersSuppressed !== true)) {
        addIssue(issues, seen, {
          severity: "action",
          code: "cancelled-reminder-leak",
          title: "Cancelled session can still reach reminder automation",
          detail: `${text(session.topic) || sessionId} is cancelled but reminder suppression is incomplete.`,
          sessionId,
          action: "Open Live Classes and re-apply the cancellation before the reminder worker runs.",
        });
      }

      if (attendance?.opened === true && !text(attendance.closedBy)) {
        addIssue(issues, seen, {
          severity: "action",
          code: "cancelled-checkin-open",
          title: "Cancelled session check-in is still marked open",
          detail: `${text(session.topic) || sessionId} has an open attendance window after cancellation.`,
          sessionId,
          action: "Open Attendance and close the check-in window.",
        });
      }

      const cancelledAtMs = toMillis(session.cancelledAt || attendance?.cancelledAt);
      if (cancelledAtMs !== null) {
        const lateCheckin = sessionCheckins.find((checkin) => {
          const submittedMs = toMillis(checkin.checkedInAt || checkin.createdAt || checkin.submittedAt || checkin.timestamp);
          return submittedMs !== null && submittedMs > cancelledAtMs;
        });
        if (lateCheckin) {
          addIssue(issues, seen, {
            severity: "action",
            code: "checkin-after-cancellation",
            title: "Check-in was recorded after cancellation",
            detail: `A student check-in exists after ${text(session.topic) || sessionId} was cancelled.`,
            sessionId,
            studentKey: text(lateCheckin.studentCode || lateCheckin.uid || lateCheckin.email || lateCheckin.id),
            action: "Review this attendance entry before sending attendance confirmation.",
          });
        }
      }
    } else if (session.remindersSuppressed === true && lower(klass.timetableIntegrityStatus) !== "broken") {
      addIssue(issues, seen, {
        severity: "action",
        code: "active-reminder-suppressed",
        title: "Active session reminders are still suppressed",
        detail: `${text(session.topic) || sessionId} is active but carries a cancellation reminder block.`,
        sessionId,
        action: "Re-save or reactivate the session so reminders can run again.",
      });
    }

    if (ACTIVE_SESSION_STATUSES.has(status) && endMs !== null && nowMs > endMs + 6 * 60 * 60 * 1000) {
      addIssue(issues, seen, {
        severity: "review",
        code: "stale-session-status",
        title: "Past session is still active",
        detail: `${text(session.topic) || sessionId} ended more than six hours ago but is still ${status}.`,
        sessionId,
        action: "Confirm attendance and mark the session completed if teaching finished.",
      });
    }

    if (
      attendance
      && ACTIVE_SESSION_STATUSES.has(status)
      && klass.attendanceAutoOpenEnabled !== false
      && startMs !== null
      && endMs !== null
    ) {
      const leadMinutes = Math.max(1, Math.min(240, Number(klass.attendanceAutoOpenLeadMinutes ?? attendance.autoOpenLeadMinutes ?? 30) || 30));
      const autoOpenDueAt = startMs - leadMinutes * 60 * 1000;
      if (nowMs >= autoOpenDueAt && nowMs < startMs && attendance.opened !== true && assignmentIds.length) {
        addIssue(issues, seen, {
          severity: "action",
          code: "checkin-did-not-open",
          title: "Automatic check-in did not open",
          detail: `${text(session.topic) || sessionId} starts within ${leadMinutes} minutes, but its attendance window is not open.`,
          sessionId,
          action: "Open Attendance now and verify the automatic check-in worker.",
        });
      }
    }

    sessionCheckins.forEach((checkin) => {
      const attendanceEntry = attendanceEntryForCheckin(attendance || {}, checkin);
      if (!attendanceEntry || attendanceEntry.present !== true) {
        addIssue(issues, seen, {
          severity: "review",
          code: "checkin-not-reflected",
          title: "Student checked in but attendance is not present",
          detail: `A check-in exists for ${text(checkin.studentName || checkin.studentCode || checkin.email || checkin.uid || checkin.id) || "a student"}, but the attendance roster does not show Present.`,
          sessionId,
          studentKey: text(checkin.studentCode || checkin.uid || checkin.email || checkin.id),
          action: "Open Attendance and reconcile this student before the confirmation email is sent.",
        });
      }
    });

    if (attendance?.students && typeof attendance.students === "object") {
      Object.entries(attendance.students).forEach(([studentKey, entry]) => {
        if (!entry || typeof entry !== "object") return;
        const source = lower(entry.source || entry.attendanceSource);
        const entryStatus = lower(entry.status || entry.attendanceStatus);
        const assignmentAttendance = source === "assignment_submission" || entryStatus === "present_by_assignment";
        if (assignmentAttendance && entry.present !== true) {
          addIssue(issues, seen, {
            severity: "action",
            code: "assignment-attendance-not-present",
            title: "Assignment attendance was recorded without Present status",
            detail: `${text(entry.name || entry.email || studentKey)} has assignment-submission evidence, but attendance is not marked Present.`,
            sessionId,
            studentKey,
            action: "Review the assignment-based attendance entry and correct the student status.",
          });
        }
      });
    }
  });

  attendanceMap.forEach((attendance, attendanceId) => {
    const canonicalId = text(attendance?.classSessionId || attendance?.sessionId || attendanceId);
    if (canonicalId && !sessionIds.has(canonicalId) && !sessionIds.has(text(attendanceId))) {
      addIssue(issues, seen, {
        severity: "review",
        code: "orphan-attendance-session",
        title: "Attendance has an orphan session record",
        detail: `${text(attendance?.title || attendance?.sessionLabel || attendanceId)} is not linked to a current Live Classes session.`,
        sessionId: canonicalId,
        action: "Confirm whether this is a legacy record before removing or migrating it.",
        id: `orphan-attendance-session::${attendanceId}`,
      });
    }
  });

  (checkinLoadFailures || []).forEach((failure) => {
    addIssue(issues, seen, {
      severity: "review",
      code: "checkin-read-failed",
      title: "Some check-in records could not be inspected",
      detail: text(failure?.message || failure?.reason || failure?.sessionId) || "A check-in subcollection could not be read.",
      sessionId: text(failure?.sessionId),
      action: "Refresh Health & Exceptions. If it persists, inspect Firestore permissions or connectivity.",
    });
  });

  issues.sort((left, right) => {
    if (left.severity !== right.severity) return left.severity === "action" ? -1 : 1;
    return left.title.localeCompare(right.title);
  });

  const actionRequired = issues.filter((issue) => issue.severity === "action");
  const needsReview = issues.filter((issue) => issue.severity === "review");
  const status = actionRequired.length ? "action" : needsReview.length ? "review" : "healthy";

  return {
    status,
    label: status === "action" ? "Action required" : status === "review" ? "Needs review" : "Healthy",
    issues,
    actionRequired,
    needsReview,
    counts: {
      actionRequired: actionRequired.length,
      needsReview: needsReview.length,
      sessions: sessions.length,
      attendanceSessions: attendanceMap.size,
      checkins: checkins.length,
    },
    classId,
    className,
  };
}
