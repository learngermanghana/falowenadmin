const DAY_MS = 24 * 60 * 60 * 1000;
const PASS_MARK = 60;

const text = (value) => String(value ?? "").trim();
const lower = (value) => text(value).toLowerCase();

export const toDateMs = (value) => {
  if (!value) return 0;
  if (typeof value?.toMillis === "function") return value.toMillis();
  if (typeof value?.toDate === "function") {
    const date = value.toDate();
    return Number.isFinite(date?.getTime?.()) ? date.getTime() : 0;
  }
  if (value instanceof Date) return Number.isFinite(value.getTime()) ? value.getTime() : 0;
  if (typeof value === "number") return value > 100000000000 ? value : value * 1000;
  const parsed = Date.parse(String(value));
  return Number.isFinite(parsed) ? parsed : 0;
};

const firstNumber = (...values) => {
  for (const value of values) {
    if (value === null || value === undefined || text(value) === "") continue;
    const parsed = Number(String(value).replace(/[^0-9.-]/g, ""));
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
};

const firstText = (...values) => values.map(text).find(Boolean) || "";

export const isArchivedStudent = (student = {}) => {
  const status = lower(student.status || student.studentStatus || student.enrollmentStatus);
  return ["archived", "inactive", "withdrawn", "removed", "cancelled", "canceled"].some((token) =>
    status.includes(token),
  );
};

export const isTrialOrUnpaidStudent = (student = {}) => {
  if (isArchivedStudent(student)) return false;
  const status = lower(student.status);
  const paymentStatus = lower(student.paymentStatus);
  const balance = firstNumber(student.balanceDue, student.balance, student.outstandingBalance, student.amountDue);
  return (
    status.includes("trial") ||
    ["unpaid", "pending", "partial", "overdue", "failed"].some((token) => paymentStatus.includes(token)) ||
    (balance !== null && balance > 0)
  );
};

export const resolveLearningActivity = (student = {}, nowMs = Date.now()) => {
  const candidates = [
    student.lastLearningActivityAt,
    student.lastActivityAt,
    student.lastProgressAt,
    student.lastLessonActivityAt,
    student.lastSubmissionAt,
    student.lastSeenAt,
    student.lastLoginAt,
  ]
    .map(toDateMs)
    .filter((value) => value > 0);
  const lastActivityMs = candidates.length ? Math.max(...candidates) : 0;
  const inactiveDays = lastActivityMs > 0 ? Math.max(0, Math.floor((nowMs - lastActivityMs) / DAY_MS)) : null;
  return {
    lastActivityMs,
    lastActivityAt: lastActivityMs ? new Date(lastActivityMs).toISOString() : null,
    inactiveDays,
  };
};

export const resolveStudentLearningStatus = (student = {}, nowMs = Date.now()) => {
  const level = firstText(student.level, student.course, student.classLevel).toUpperCase();
  const activity = resolveLearningActivity(student, nowMs);
  const attendanceRate = firstNumber(
    student.attendanceRate,
    student.attendancePercent,
    student.attendancePercentage,
  );
  const latestScore = firstNumber(
    student.latestScore,
    student.latestResultScore,
    student.lastScore,
    student.score,
  );
  const completionPercent = firstNumber(
    student.completionPercent,
    student.courseCompletionPercent,
    student.progressPercent,
  );
  const awaitingReview = firstNumber(
    student.awaitingReview,
    student.awaitingReviewCount,
    student.pendingTutorReviews,
  ) || 0;
  const reviewStatus = lower(
    student.latestReviewStatus ||
    student.reviewStatus ||
    student.markingStatus ||
    student.latestSubmissionStatus ||
    student.assignmentStatus,
  );
  const paymentStatus = lower(student.paymentStatus);
  const status = lower(student.status);
  const contractEndMs = toDateMs(student.contractEnd);
  const balanceDue = firstNumber(
    student.balanceDue,
    student.balance,
    student.outstandingBalance,
    student.amountDue,
  );
  const needsImprovement =
    student.needsImprovement === true ||
    ["failed", "needs_correction", "needs-improvement", "redo_required"].some((token) =>
      reviewStatus.includes(token),
    ) ||
    (latestScore !== null && latestScore < PASS_MARK);
  const waitingForTutor =
    awaitingReview > 0 ||
    ["submitted", "resubmitted", "pending_review", "awaiting_review"].some((token) =>
      reviewStatus.includes(token),
    );
  const trialEnded = status.includes("trial_expired") || status.includes("trial-ended");
  const paymentBlocked = ["overdue", "failed", "rejected"].some((token) => paymentStatus.includes(token));
  const contractEnded = contractEndMs > 0 && contractEndMs <= nowMs;
  const accessNeedsAttention = trialEnded || paymentBlocked || (contractEnded && (balanceDue === null || balanceDue > 0));
  const nearA1Completion =
    level.includes("A1") &&
    completionPercent !== null &&
    completionPercent >= 80 &&
    completionPercent < 100;

  const reasons = [];
  if (accessNeedsAttention) {
    reasons.push({
      key: "access",
      label: trialEnded ? "Trial ended" : contractEnded ? "Access/contract ended" : "Payment problem",
      severity: 100,
      helper: trialEnded
        ? "Trial access has ended. Check payment or registration."
        : contractEnded
          ? "Contract access has ended or needs renewal."
          : "Payment status needs attention.",
    });
  }
  if (needsImprovement) {
    reasons.push({
      key: "needs-improvement",
      label: "Needs improvement",
      severity: 95,
      helper: latestScore !== null ? `Latest score: ${Math.round(latestScore)}%` : "Tutor-marked work needs correction.",
    });
  }
  if (waitingForTutor) {
    reasons.push({
      key: "waiting-for-tutor",
      label: "Waiting for tutor",
      severity: 85,
      helper: awaitingReview > 0 ? `${awaitingReview} item(s) awaiting review.` : "Submitted work is awaiting review.",
    });
  }
  if (activity.inactiveDays !== null && activity.inactiveDays >= 3) {
    reasons.push({
      key: "inactive",
      label: `Inactive ${activity.inactiveDays} day${activity.inactiveDays === 1 ? "" : "s"}`,
      severity: Math.min(80, 60 + activity.inactiveDays),
      helper: "Student has not recorded recent learning activity.",
    });
  }
  if (attendanceRate !== null && attendanceRate < 70) {
    reasons.push({
      key: "attendance",
      label: "Low attendance",
      severity: 60,
      helper: `Attendance: ${Math.round(attendanceRate)}%`,
    });
  }
  if (nearA1Completion) {
    reasons.push({
      key: "a1-finish",
      label: "A1 almost complete",
      severity: 45,
      helper: `Course completion: ${Math.round(completionPercent)}%`,
    });
  }

  reasons.sort((a, b) => b.severity - a.severity);

  const currentLesson = firstText(
    student.currentLessonTitle,
    student.currentLesson,
    student.lastLessonTitle,
    student.nextLessonTitle,
  );
  const currentDay = firstNumber(student.currentDay, student.lastDay, student.nextDay);
  const currentSection = firstText(student.activeView, student.lastView, student.currentSection);
  const lastRoute = firstText(student.lastRoute, student.resumeRoute, student.currentLessonRoute);

  return {
    attention: reasons.length > 0,
    primaryReason: reasons[0] || null,
    reasons,
    activity,
    attendanceRate,
    latestScore,
    completionPercent,
    awaitingReview,
    reviewStatus,
    balanceDue,
    level,
    currentLesson,
    currentDay,
    currentSection,
    lastRoute,
  };
};

export const sortStudentsByAttention = (students = [], nowMs = Date.now()) =>
  students
    .map((student) => ({ student, learningStatus: resolveStudentLearningStatus(student, nowMs) }))
    .filter(({ student, learningStatus }) => !isArchivedStudent(student) && learningStatus.attention)
    .sort((left, right) => {
      const severityDiff =
        (right.learningStatus.primaryReason?.severity || 0) -
        (left.learningStatus.primaryReason?.severity || 0);
      if (severityDiff) return severityDiff;
      const leftDays = left.learningStatus.activity.inactiveDays ?? -1;
      const rightDays = right.learningStatus.activity.inactiveDays ?? -1;
      if (rightDays !== leftDays) return rightDays - leftDays;
      return text(left.student.name).localeCompare(text(right.student.name));
    });

export const summarizeStudentAttention = (students = [], nowMs = Date.now()) => {
  const rows = sortStudentsByAttention(students, nowMs);
  const countReason = (key) => rows.filter(({ learningStatus }) =>
    learningStatus.reasons.some((reason) => reason.key === key),
  ).length;
  return {
    total: rows.length,
    inactive: countReason("inactive"),
    needsImprovement: countReason("needs-improvement"),
    waitingForTutor: countReason("waiting-for-tutor"),
    lowAttendance: countReason("attendance"),
    access: countReason("access"),
    nearA1Completion: countReason("a1-finish"),
    rows,
  };
};
