import { collection, doc, getDoc, getDocs, query, setDoc } from "firebase/firestore";
import { db } from "../firebase.js";
import { saveScoreRow } from "./markingService.js";

function readTimestamp(value) {
  if (!value) return null;
  if (typeof value.toDate === "function") return value.toDate();
  if (typeof value.seconds === "number") return new Date(value.seconds * 1000);
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}


function normalize(value) {
  return String(value || "").trim();
}

function inferAssignmentKey(...values) {
  const normalizedValues = values.map(normalize).filter(Boolean);
  for (const value of normalizedValues) {
    const match = value.match(/([A-Z]\d+-[\d._]+)/i);
    if (match?.[1]) return match[1].toUpperCase().replace(/_/g, ".");
  }
  return normalizedValues[0] || "";
}

function objectHasEntries(value) {
  return value && typeof value === "object" && !Array.isArray(value) && Object.keys(value).length > 0;
}

function readSubmissionText(data = {}) {
  const candidate = data.text ||
    data.submissionText ||
    data.content ||
    data.message ||
    data.writing ||
    data.answer ||
    "";

  if (typeof candidate === "string") return candidate.trim();
  if (Array.isArray(candidate)) return candidate.map((item) => String(item || "").trim()).filter(Boolean).join("\n");
  if (objectHasEntries(candidate)) {
    return Object.entries(candidate)
      .map(([key, value]) => `${key}: ${typeof value === "string" ? value : JSON.stringify(value)}`)
      .join("\n");
  }

  if (objectHasEntries(data.answers)) {
    return Object.entries(data.answers)
      .map(([key, value]) => `${key}: ${typeof value === "string" ? value : JSON.stringify(value)}`)
      .join("\n");
  }

  return "";
}

function compactSubmission(data = {}, ref = null) {
  if (!data || !Object.keys(data).length) return null;
  return {
    id: ref?.id || "",
    path: ref?.path || "",
    text: readSubmissionText(data),
    answers: objectHasEntries(data.answers) ? data.answers : null,
    assignment: normalize(data.assignment || data.assignmentTitle || data.assignmentName || data.topic),
    assignmentKey: normalize(data.assignmentKey || data.assignment_id || data.assignmentId || data.canonicalAssignmentKey),
    level: normalize(data.level || data.className || data.class || data.group),
    studentCode: normalize(data.studentCode || data.studentcode || data.uid),
    studentName: normalize(data.studentName || data.name || data.fullName),
    createdAtDate: readTimestamp(data.createdAt || data.submittedAt || data.timestamp || data.date || data.created_at),
  };
}

function compactAnswerKey(data = {}, id = "") {
  if (!data || !Object.keys(data).length) return null;
  return {
    id,
    assignmentKey: data.assignmentKey || data.assignment_id || id,
    title: data.title || data.assignment || data.assignmentName || "",
    level: data.level || "",
    format: data.format || data.answerLayout || "",
    answerUrl: data.answerUrl || data.answer_url || data.sheetUrl || data.sheet_url || "",
    expectedParts: data.expectedParts || [],
    answers: data.answers || null,
    parts: data.parts || null,
    partGrading: data.partGrading || null,
  };
}

async function enrichAuditRow(row) {
  let submission = null;
  const submissionRef = docFromPath(row.submissionPath);
  if (submissionRef) {
    const submissionSnap = await getDoc(submissionRef).catch(() => null);
    if (submissionSnap?.exists()) {
      submission = compactSubmission(submissionSnap.data() || {}, submissionSnap.ref);
    }
  }

  const assignmentKey = inferAssignmentKey(
    row.assignmentKey,
    row.assignment,
    submission?.assignmentKey,
    submission?.assignment,
    row.scoreSaveReceipt?.row?.assignment_id,
    row.scoreSaveReceipt?.row?.assignmentId,
  );

  let answerKey = null;
  const safeAssignmentKey = safeFirestoreId(assignmentKey);
  if (safeAssignmentKey) {
    const answerSnap = await getDoc(doc(db, "answerKeyRegistry", safeAssignmentKey)).catch(() => null);
    if (answerSnap?.exists()) {
      answerKey = compactAnswerKey(answerSnap.data() || {}, answerSnap.id);
    }
  }

  return {
    ...row,
    assignmentKey: row.assignmentKey || assignmentKey,
    studentWorkText: row.submissionText || submission?.text || "",
    studentAnswers: submission?.answers || null,
    submissionSnapshot: submission,
    answerKey,
  };
}

function safeFirestoreId(value) {
  return String(value || "")
    .trim()
    .replace(/[/#?[\]]+/g, "_")
    .replace(/_{2,}/g, "_");
}

function docFromPath(path = "") {
  const segments = String(path || "").split("/").filter(Boolean);
  if (!segments.length || segments.length % 2 !== 0) return null;
  return doc(db, ...segments);
}

export async function loadAIMarkingAudit() {
  const snap = await getDocs(query(collection(db, "aiMarkingAudit")));
  const rows = [];
  snap.forEach((docSnap) => {
    const data = docSnap.data() || {};
    rows.push({
      id: docSnap.id,
      ...data,
      createdAtDate: readTimestamp(data.createdAt),
      updatedAtDate: readTimestamp(data.updatedAt),
    });
  });

  const sortedRows = rows.sort((a, b) => (b.createdAtDate?.getTime() || 0) - (a.createdAtDate?.getTime() || 0));
  return Promise.all(sortedRows.map(enrichAuditRow));
}

export async function approveAndSyncAIMarkingAudit({ auditId, score, feedback }) {
  const safeAuditId = String(auditId || "").trim();
  if (!safeAuditId) throw new Error("Missing AI audit id.");

  const finalScore = Number(score);
  if (!Number.isFinite(finalScore) || finalScore < 0 || finalScore > 100) {
    throw new Error("Enter a valid score from 0 to 100 before syncing.");
  }

  const cleanedFeedback = String(feedback || "").trim();
  if (!cleanedFeedback) {
    throw new Error("Enter feedback before syncing.");
  }

  const auditRef = doc(db, "aiMarkingAudit", safeAuditId);
  const auditSnap = await getDoc(auditRef);
  if (!auditSnap.exists()) throw new Error("AI audit record not found.");

  const audit = auditSnap.data() || {};
  const now = new Date().toISOString();
  const assignmentId = audit.assignmentKey || audit.assignment || audit.scoreSaveReceipt?.row?.assignment_id || "";
  const assignment = audit.assignment || audit.assignmentKey || "AI marked assignment";

  const receipt = await saveScoreRow({
    studentCode: audit.studentCode || audit.scoreSaveReceipt?.row?.studentcode || "",
    name: audit.studentName || audit.scoreSaveReceipt?.row?.name || "",
    assignment,
    assignmentId,
    score: finalScore,
    comments: cleanedFeedback,
    level: audit.level || "",
    link: audit.scoreSaveReceipt?.row?.link || "",
    source: "ai_audit_approved",
  });

  const updatedResult = {
    ...(audit.result || {}),
    finalScore,
    score: finalScore,
    feedback: cleanedFeedback,
    status: "marked",
  };

  await setDoc(auditRef, {
    finalScore,
    feedback: cleanedFeedback,
    status: "approved_synced",
    editedByTutor: true,
    tutorApprovedAt: now,
    updatedAt: now,
    reviewReason: "Tutor edited and approved this AI result.",
    scoreSaveReceipt: receipt,
    sheetSynced: Boolean(receipt?.sheet?.success && !receipt?.skippedForReview),
    firestoreSynced: Boolean(receipt?.firestore?.success),
    result: updatedResult,
  }, { merge: true });

  const submissionRef = docFromPath(audit.submissionPath);
  if (submissionRef) {
    await setDoc(submissionRef, {
      finalScore,
      aiFeedback: cleanedFeedback,
      markingStatus: "marked",
      aiConfidence: audit.confidence ?? null,
      feedbackSentToStudent: false,
      markingUpdatedAt: now,
      aiAuditApprovedAt: now,
    }, { merge: true });
  }

  const markingResultId = safeFirestoreId(audit.submissionId || audit.submissionPath || safeAuditId);
  await setDoc(doc(db, "markingResults", markingResultId), {
    submissionId: audit.submissionId || "",
    submissionPath: audit.submissionPath || "",
    result: updatedResult,
    status: "marked",
    finalScore,
    feedback: cleanedFeedback,
    confidence: audit.confidence ?? null,
    sentToStudent: false,
    updatedAt: now,
  }, { merge: true });

  return receipt;
}
