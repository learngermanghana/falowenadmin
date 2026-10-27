import { collection, doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase.js";

const PASS_MARK = 60;

function normalize(value) {
  return String(value || "").trim();
}

function normalizeStudentCode(value) {
  return normalize(value).toLowerCase();
}

function safeFirestoreId(value) {
  return String(value || "")
    .trim()
    .replace(/[/#?[\]]+/g, "_")
    .replace(/\s+/g, "_")
    .replace(/_{2,}/g, "_")
    .slice(0, 180);
}

function buildBody(score, passed) {
  if (passed) {
    return `Score: ${score}/100 · Passed. Open Results to read your feedback and correction points.`;
  }
  return `Score: ${score}/100 · Needs improvement. Open Results, read the correction points, and resubmit.`;
}

function uniqueTargets(studentCode = "") {
  const trimmed = normalize(studentCode);
  const lower = trimmed.toLowerCase();
  const upper = trimmed.toUpperCase();
  return Array.from(new Set([trimmed, lower, upper].filter(Boolean)));
}

export async function createMarkedAssignmentNotification({
  studentCode,
  studentName,
  assignment,
  assignmentId,
  score,
  level,
  dedupeId,
  source = "falowen_admin_marking",
} = {}) {
  const normalizedStudentCode = normalizeStudentCode(studentCode);
  if (!normalizedStudentCode) {
    return { attempted: false, success: true, message: "No student code; notification skipped." };
  }

  const numericScore = Number(score);
  const safeScore = Number.isFinite(numericScore) ? Math.max(0, Math.min(100, Math.round(numericScore))) : 0;
  const passed = safeScore >= PASS_MARK;
  const notificationId = safeFirestoreId(
    dedupeId || `${normalizedStudentCode}_${assignmentId || assignment || "marked_assignment"}_${safeScore}`
  );
  const timestamp = Date.now();
  const title = "Your assignment has been marked";
  const body = buildBody(safeScore, passed);
  const payload = {
    type: "Scores",
    category: "feedback",
    title,
    body,
    message: body,
    timestamp,
    sentAt: new Date(timestamp).toISOString(),
    route: "/campus/results",
    source,
    studentCode: normalizedStudentCode,
    studentCodeOriginal: normalize(studentCode),
    studentName: normalize(studentName),
    assignment: normalize(assignment),
    assignmentId: normalize(assignmentId),
    level: normalize(level).toUpperCase(),
    score: safeScore,
    status: passed ? "passed" : "needs_improvement",
    read: false,
    data: {
      type: "marked_assignment",
      category: "feedback",
      route: "/campus/results",
      assignment: normalize(assignment),
      assignmentId: normalize(assignmentId),
      score: String(safeScore),
      status: passed ? "passed" : "needs_improvement",
    },
    updatedAt: serverTimestamp(),
  };

  const writes = [];

  // Top-level collection lets the student app query by studentCode even if the student document id is different.
  writes.push(
    setDoc(doc(db, "studentNotifications", notificationId), { ...payload, createdAt: serverTimestamp() }, { merge: true })
  );

  // Also mirror under common student document ids. This supports the existing notification bell path.
  uniqueTargets(studentCode).forEach((target) => {
    writes.push(
      setDoc(
        doc(collection(db, "students", target, "notifications"), notificationId),
        { ...payload, createdAt: serverTimestamp() },
        { merge: true }
      )
    );
  });

  const results = await Promise.allSettled(writes);
  const successCount = results.filter((result) => result.status === "fulfilled").length;
  const firstError = results.find((result) => result.status === "rejected")?.reason;

  if (!successCount) {
    return {
      attempted: true,
      success: false,
      notificationId,
      message: String(firstError?.message || firstError || "Notification save failed."),
    };
  }

  return {
    attempted: true,
    success: true,
    notificationId,
    mirroredWrites: successCount,
    message: "Student marking notification created.",
  };
}
