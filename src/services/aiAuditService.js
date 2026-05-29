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

  return rows.sort((a, b) => (b.createdAtDate?.getTime() || 0) - (a.createdAtDate?.getTime() || 0));
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
