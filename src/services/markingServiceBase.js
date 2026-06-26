import { addDoc, collection, collectionGroup, deleteDoc, doc, getDoc, getDocs, query, setDoc, updateDoc, where } from "firebase/firestore";
import { db } from "../firebase.js";
import { normalizeAnswerDictionary, safeRegistryId, validateAnswerDictionary } from "../utils/answerKeyNormalizer.js";
import { checkDeterministicObjectiveAnswers } from "../utils/autoMarking.js";
import { inferSubmissionIdentityFromPath } from "../utils/submissionIdentity.js";
import { resolveStudentIdentity } from "../utils/studentIdentity.js";
import { AI_FEEDBACK_INSTRUCTION, limitFeedbackWords } from "../utils/feedbackPolicy.js";
import { shouldIncludeInIncomingQueue } from "../utils/markingQueue.js";
import { buildScoreAttemptMetadata, shouldSkipExistingScore } from "../utils/scoreAttempts.js";
import {
  loadPublishedStudentRows,
  readPublishedClassName,
  readPublishedLevel,
  readPublishedStatus,
  readPublishedStudentCode,
  readPublishedStudentName,
} from "./publishedSheetService.js";

const DEFAULT_ROSTER_SHEET_CSV_URL = import.meta.env.VITE_STUDENTS_SHEET_CSV_URL || "";
const MARKING_ROSTER_CSV_URL = import.meta.env.VITE_MARKING_ROSTER_CSV_URL || DEFAULT_ROSTER_SHEET_CSV_URL;
const MARKING_QUEUE_START_DATE = String(import.meta.env.VITE_MARKING_QUEUE_START_DATE || "2026-05-29T00:00:00Z").trim();
const OBJECTIVE_WEIGHT = 0.5;
const WRITING_WEIGHT = 0.5;

function normalizeHeader(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function normalize(value) {
  return String(value || "").trim();
}

function normalizeLower(value) {
  return String(value || "").trim().toLowerCase();
}

function parseCsvLine(line) {
  const cells = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (char === "," && !inQuotes) {
      cells.push(current);
      current = "";
      continue;
    }
    current += char;
  }

  cells.push(current);
  return cells;
}

function parseCsv(text) {
  return text
    .split(/\r?\n/)
    .filter((line) => line.trim().length > 0)
    .map(parseCsvLine);
}

function findCol(row, aliases) {
  for (const alias of aliases) {
    const key = normalizeHeader(alias);
    if (row[key]) return normalize(row[key]);
  }
  return "";
}

function toRosterRows(rows) {
  if (rows.length === 0) return [];
  const [headerRow, ...dataRows] = rows;
  const headers = headerRow.map(normalizeHeader);

  return dataRows
    .map((row) => {
      const entry = {};
      headers.forEach((header, idx) => {
        entry[header] = normalize(row[idx]);
      });

      const studentCode = findCol(entry, ["studentcode", "student_code", "uid", "code"]);
      const name = findCol(entry, ["name", "studentname", "student_name", "fullname"]);
      const level = findCol(entry, ["level", "classname", "class", "group"]);
      const status = findCol(entry, ["status"]);

      return {
        id: studentCode || `${name}-${level}`,
        studentCode,
        name,
        level,
        status: status || "Active",
      };
    })
    .filter((row) => row.studentCode || row.name);
}

async function loadCsvRows(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to load CSV from ${url}`);
  return parseCsv(await res.text());
}

export async function loadRoster() {
  try {
    const publishedRows = await loadPublishedStudentRows();
    const rosterFromPublishedSheet = publishedRows
      .map((row) => {
        const name = normalize(readPublishedStudentName(row) || findCol(row, ["studentname", "student_name", "fullname"]));
        const studentCode = normalize(readPublishedStudentCode(row) || findCol(row, ["student_code", "uid", "code"]));
        const level = normalize(readPublishedLevel(row) || readPublishedClassName(row) || findCol(row, ["class", "group"]));
        const status = normalize(readPublishedStatus(row) || findCol(row, ["state"]));
        return {
          id: studentCode || `${name}-${level}`,
          studentCode,
          name,
          level,
          status: status || "Active",
        };
      })
      .filter((row) => row.studentCode || row.name);

    if (rosterFromPublishedSheet.length) return rosterFromPublishedSheet;
  } catch (error) {
    console.warn("Published student sheet roster unavailable; falling back to marking CSV.", error);
  }

  if (MARKING_ROSTER_CSV_URL) return toRosterRows(await loadCsvRows(MARKING_ROSTER_CSV_URL));

  try {
    return toRosterRows(await loadCsvRows("/students.csv"));
  } catch (error) {
    console.warn("Local students.csv unavailable; falling back to Firestore students collection.", error);
  }

  const snap = await getDocs(collection(db, "students"));
  const rows = [];
  snap.forEach((docSnap) => {
    const data = docSnap.data() || {};
    const studentCode = normalize(data.studentCode || data.studentcode || data.code || docSnap.id);
    const name = normalize(data.name || data.fullName || data.studentName || data.email || "");
    const level = normalize(data.level || data.className || data.classId || data.group || "");
    const status = normalize(data.status || "Active");
    rows.push({ id: studentCode || docSnap.id, studentCode, name, level, status });
  });
  return rows;
}

function readTimestamp(value) {
  if (!value) return null;
  if (typeof value.toDate === "function") return value.toDate();
  if (typeof value.seconds === "number") return new Date(value.seconds * 1000);
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function normalizeSubmissionDoc(docSnap, fallback = {}) {
  const data = docSnap.data() || {};
  const submittedAt = readTimestamp(data.submittedAt || data.createdAt || data.timestamp || data.date || data.created_at);
  const resubmittedAt = readTimestamp(data.resubmittedAt);
  const createdAt = resubmittedAt || submittedAt;
  const text = normalize(data.text || data.answer || data.answers || data.content || data.message || data.submissionText || data.writing || data.work || "");
  const assignment = normalize(data.assignment || data.assignmentTitle || data.assignmentName || data.topic || fallback.assignment || "");
  const assignmentId = normalize(data.assignmentId || data.assignment_id || data.assignmentKey || data.canonicalAssignmentKey || fallback.assignmentId || "");
  const pathIdentity = inferSubmissionIdentityFromPath(docSnap.ref.path);

  return {
    id: docSnap.id,
    path: docSnap.ref.path,
    text,
    assignment,
    assignmentId,
    assignmentKey: normalize(data.assignmentKey || data.assignment_id || data.assignmentId || data.canonicalAssignmentKey || ""),
    level: normalize(data.level || fallback.level || pathIdentity.level || ""),
    ...resolveStudentIdentity({ ...data, raw: data }, fallback.studentCode || pathIdentity.studentCode),
    studentName: normalize(data.studentName || data.name || data.fullName || fallback.studentName || ""),
    status: normalize(data.status || data.submissionStatus || "submitted"),
    markingStatus: normalize(data.markingStatus || "pending"),
    finalScore: data.finalScore ?? data.score ?? null,
    aiConfidence: data.aiConfidence ?? data.confidence ?? null,
    feedbackSentToStudent: Boolean(data.feedbackSentToStudent),
    improvementSummary: normalize(data.improvementSummary || data.resubmissionSummary || ""),
    previousSubmissionText: normalize(data.previousSubmissionText || data.previousText || ""),
    isResubmission: Boolean(data.isResubmission || normalizeLower(data.status || data.workflowStatus) === "resubmitted" || Number(data.attempt || data.attemptNumber) > 1),
    attempt: data.attempt ?? data.attemptNumber ?? null,
    previousScore: data.previousScore ?? data.previous_score ?? data.lastScore ?? null,
    submittedAt,
    resubmittedAt,
    createdAt,
    raw: data,
  };
}

export async function fetchSubmissions(level, studentCode) {
  const levelKey = normalize(level);
  const codeKey = normalize(studentCode);
  const results = [];
  const seenPaths = new Set();

  async function addFromQuery(qs, fallback = {}) {
    const snap = await getDocs(qs);
    snap.forEach((docSnap) => {
      if (seenPaths.has(docSnap.ref.path)) return;
      seenPaths.add(docSnap.ref.path);
      results.push(normalizeSubmissionDoc(docSnap, fallback));
    });
  }

  if (levelKey && codeKey) {
    await addFromQuery(query(collection(db, "submissions", levelKey, codeKey)), { level: levelKey, studentCode: codeKey });
  }
  if (codeKey) {
    await addFromQuery(query(collection(db, "submissions"), where("studentCode", "==", codeKey)), { studentCode: codeKey, level: levelKey });
    await addFromQuery(query(collection(db, "submissions"), where("studentcode", "==", codeKey)), { studentCode: codeKey, level: levelKey });
  }

  return results.sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));
}

function safeFirestoreId(value) {
  return String(value || "")
    .trim()
    .replace(/[/#?[\]]+/g, "_")
    .replace(/_{2,}/g, "_");
}

function inferAssignmentIdFromSubmission(row = {}) {
  const candidates = [row.assignmentKey, row.assignmentId, row.raw?.assignmentKey, row.raw?.assignment_id, row.raw?.assignmentId, row.raw?.canonicalAssignmentKey, row.assignment];
  for (const candidate of candidates) {
    const match = String(candidate || "").match(/([A-Z]\d+-[\d._]+)/i);
    if (match?.[1]) return match[1].toUpperCase().replace(/_/g, ".");
  }
  return String(row.assignmentKey || row.assignmentId || row.assignment || "").trim();
}

function scoreDedupeId(row = {}) {
  return safeFirestoreId([
    row.studentcode || row.studentCode || "unknown-student",
    row.assignment_id || row.assignmentId || row.assignment || "unknown-assignment",
  ].join("__"));
}

function scoreDedupeIdForSubmission(row = {}) {
  return scoreDedupeId({ studentcode: row.studentCode, assignment_id: inferAssignmentIdFromSubmission(row), assignment: row.assignment });
}

async function loadExistingScoreIndex() {
  try {
    const snap = await getDocs(collection(db, "scores"));
    const scores = new Map();
    snap.forEach((docSnap) => {
      const data = docSnap.data() || {};
      const keys = [docSnap.id, data.dedupe_id, scoreDedupeId(data)].filter(Boolean).map(String);
      keys.forEach((key) => scores.set(key, data));
    });
    return scores;
  } catch (error) {
    console.warn("Could not load score index for marking queue filtering.", error);
    return new Map();
  }
}

function decorateSubmissionWithPreviousScore(row, scoreIndex) {
  const score = scoreIndex.get(scoreDedupeIdForSubmission(row));
  if (!score) return row;
  return {
    ...row,
    previousScore: row.previousScore ?? score.score ?? score.finalScore ?? null,
    lastMarkedAt: readTimestamp(score.markedAt || score.scoredAt || score.updatedAt || score.createdAt || score.date),
  };
}

export async function loadSubmissions({ includeMarked = false } = {}) {
  const results = [];
  const seenPaths = new Set();

  async function addDocSnap(docSnap, fallback = {}) {
    if (seenPaths.has(docSnap.ref.path)) return;
    const data = docSnap.data() || {};
    if (data.__collectionShape === "container") return;
    seenPaths.add(docSnap.ref.path);
    results.push(normalizeSubmissionDoc(docSnap, fallback));
  }

  const flatSnap = await getDocs(collection(db, "submissions"));
  flatSnap.forEach((docSnap) => addDocSnap(docSnap));
  const groupSnap = await getDocs(collectionGroup(db, "posts"));
  groupSnap.forEach((docSnap) => addDocSnap(docSnap));
  const nestedSnap = await getDocs(collectionGroup(db, "submissions"));
  nestedSnap.forEach((docSnap) => addDocSnap(docSnap));

  const scoreIndex = await loadExistingScoreIndex();
  const decoratedRows = results.map((row) => decorateSubmissionWithPreviousScore(row, scoreIndex));
  const queueRows = includeMarked
    ? decoratedRows
    : decoratedRows.filter((row) => shouldIncludeInIncomingQueue(row, scoreIndex.get(scoreDedupeIdForSubmission(row)), MARKING_QUEUE_START_DATE));
  return queueRows.sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));
}

export async function createMarkingJob({ submissionId, submissionPath, assignmentKey, level, status = "pending" }) {
  const now = new Date().toISOString();
  await addDoc(collection(db, "markingJobs"), { submissionId, submissionPath, assignmentKey, level, status, createdAt: now, updatedAt: now });
}

export async function saveMarkingResult({ submissionId, submissionPath, result, status = "marked", sentToStudent = false }) {
  const now = new Date().toISOString();
  const safeSubmissionId = safeFirestoreId(submissionId || submissionPath || globalThis.crypto?.randomUUID?.() || `${Date.now()}`);
  const pathIdentity = inferSubmissionIdentityFromPath(submissionPath);
  const identity = resolveStudentIdentity(result, pathIdentity.studentCode);
  const payload = {
    submissionId,
    submissionPath,
    ...identity,
    level: normalize(result.level || pathIdentity.level),
    result,
    status,
    finalScore: result.finalScore ?? result.score ?? null,
    feedback: result.feedback || "",
    objectiveScore: result.objectiveScore ?? null,
    objectiveCorrect: result.objectiveCorrect ?? null,
    objectiveTotal: result.objectiveTotal ?? null,
    objectiveDetails: result.objectiveDetails ?? null,
    wrongAnswers: result.wrongAnswers ?? [],
    writingScore: result.writingScore ?? null,
    writingScorePercent: result.writingScorePercent ?? null,
    maxWritingScore: result.maxWritingScore ?? null,
    scoreBreakdown: result.scoreBreakdown ?? [],
    corrections: result.corrections ?? [],
    improvementSummary: result.improvementSummary || "",
    markingReason: result.markingReason || result.rawAiReason || result.ai?.reason || "",
    manualOverride: Boolean(result.manualOverride),
    aiOriginalScore: result.aiOriginalScore ?? null,
    aiOriginalFeedback: result.aiOriginalFeedback ?? "",
    confidence: result.confidence ?? null,
    sentToStudent,
    updatedAt: now,
  };

  await setDoc(doc(db, "markingResults", safeSubmissionId), { ...payload, createdAt: now }, { merge: true });

  if (submissionPath) {
    const segments = submissionPath.split("/").filter(Boolean);
    await setDoc(doc(db, ...segments), {
      markingStatus: status,
      finalScore: payload.finalScore,
      objectiveScore: payload.objectiveScore,
      objectiveCorrect: payload.objectiveCorrect,
      objectiveTotal: payload.objectiveTotal,
      objectiveDetails: payload.objectiveDetails,
      wrongAnswers: payload.wrongAnswers,
      writingScore: payload.writingScore,
      writingScorePercent: payload.writingScorePercent,
      maxWritingScore: payload.maxWritingScore,
      scoreBreakdown: payload.scoreBreakdown,
      corrections: payload.corrections,
      improvementSummary: payload.improvementSummary,
      markingReason: payload.markingReason,
      manualOverride: payload.manualOverride,
      aiOriginalScore: payload.aiOriginalScore,
      aiOriginalFeedback: payload.aiOriginalFeedback,
      aiConfidence: payload.confidence,
      aiFeedback: payload.feedback,
      feedbackSentToStudent: sentToStudent,
      markingUpdatedAt: now,
    }, { merge: true });
  }
}

export async function updateMarkingWorkflowStatus({ submissionId, submissionPath, status, sentToStudent = false }) {
  const now = new Date().toISOString();
  const safeSubmissionId = safeFirestoreId(submissionId || submissionPath || "unknown");
  await setDoc(doc(db, "markingResults", safeSubmissionId), { status, sentToStudent, updatedAt: now }, { merge: true });
  if (submissionPath) {
    const segments = submissionPath.split("/").filter(Boolean);
    await setDoc(doc(db, ...segments), { markingStatus: status, feedbackSentToStudent: sentToStudent, markingUpdatedAt: now }, { merge: true });
  }
}

export async function deleteSubmission(path) {
  const segments = String(path || "").split("/").filter(Boolean);
  if (!segments.length) throw new Error("Missing submission path");
  await deleteDoc(doc(db, ...segments));
}

export async function hideSubmissionFromQueue(path) {
  const segments = String(path || "").split("/").filter(Boolean);
  if (!segments.length) throw new Error("Missing submission path");
  await updateDoc(doc(db, ...segments), { hiddenFromMarkingQueue: true, hiddenAt: new Date().toISOString() });
}

export async function upsertMarkingProfile({ assignmentKey, profile }) {
  const safeAssignmentKey = safeFirestoreId(assignmentKey);
  await setDoc(doc(db, "markingProfiles", safeAssignmentKey), { assignmentKey: safeAssignmentKey, ...profile, updatedAt: new Date().toISOString() }, { merge: true });
}

export async function loadAnswerKeyRegistry() {
  const snap = await getDocs(collection(db, "answerKeyRegistry"));
  const rows = [];
  snap.forEach((docSnap) => rows.push({ id: docSnap.id, ...docSnap.data() }));
  return rows.sort((a, b) => String(a.assignmentKey || a.id).localeCompare(String(b.assignmentKey || b.id), undefined, { numeric: true }));
}

export async function loadAnswerKey(assignmentKey) {
  const safeAssignmentKey = safeRegistryId(assignmentKey);
  if (!safeAssignmentKey) return null;
  const snap = await getDoc(doc(db, "answerKeyRegistry", safeAssignmentKey));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function importAnswerDictionary(dictionary) {
  const validation = validateAnswerDictionary(dictionary);
  const normalizedEntries = normalizeAnswerDictionary(dictionary);
  const now = new Date().toISOString();
  const results = await Promise.allSettled(normalizedEntries.map(async (entry) => {
    const safeAssignmentKey = safeRegistryId(entry.assignmentKey);
    const existing = await getDoc(doc(db, "answerKeyRegistry", safeAssignmentKey));
    await setDoc(doc(db, "answerKeyRegistry", safeAssignmentKey), {
      assignmentKey: entry.assignmentKey,
      title: entry.title,
      level: entry.level,
      format: entry.format,
      answerUrl: entry.answerUrl,
      sheetUrl: entry.sheetUrl,
      rawAnswers: entry.rawAnswers,
      parts: entry.parts,
      expectedParts: entry.expectedParts,
      answerLayout: entry.answerLayout,
      totalAnswers: entry.totalAnswers,
      importedAt: now,
      updatedAt: now,
      createdAt: existing.exists() ? existing.data()?.createdAt || now : now,
    }, { merge: true });
    return entry.assignmentKey;
  }));

  const importedKeys = results.map((result, index) => result.status === "fulfilled" ? normalizedEntries[index].assignmentKey : "").filter(Boolean);
  const failed = results.map((result, index) => result.status === "rejected" ? {
    assignmentKey: normalizedEntries[index]?.assignmentKey || "unknown",
    reason: result.reason?.message || String(result.reason || "Import failed"),
  } : null).filter(Boolean);

  return {
    importedCount: importedKeys.length,
    failedCount: failed.length,
    totalAssignments: validation.totalAssignments,
    sampleImportedKeys: importedKeys.slice(0, 8),
    warnings: validation.warnings,
    failed,
    imported: importedKeys,
  };
}

export async function upsertAnswerKey({ assignmentKey, answerKey }) {
  const safeAssignmentKey = safeRegistryId(assignmentKey);
  await setDoc(doc(db, "answerKeyRegistry", safeAssignmentKey), { assignmentKey: safeAssignmentKey, ...answerKey, updatedAt: new Date().toISOString() }, { merge: true });
}

function stripBoldMarkdown(value = "") {
  return String(value || "").replace(/\*\*/g, "");
}

function normalizeScoreCandidate(value) {
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue)) return null;
  return Math.max(0, Math.min(100, Math.round(numberValue)));
}

function writingScoreFromParts(parts = []) {
  const scores = (Array.isArray(parts) ? parts : [])
    .filter((part) => part?.partType === "writing" || part?.partId === "teil2")
    .map((part) => normalizeScoreCandidate(part?.result?.score ?? part?.result?.writingScore ?? part?.score ?? part?.writingScore))
    .filter((score) => score !== null);
  if (!scores.length) return null;
  return Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
}

function resolveWritingScore(aiResult = {}) {
  const partScore = writingScoreFromParts(aiResult.parts);
  if (partScore !== null) return partScore;
  return normalizeScoreCandidate(aiResult.writingScore);
}

function formatObjectiveAnswerForFeedback(value = "", fallback = "blank") {
  const normalized = String(value || "").replace(/\s+/g, " ").trim();
  const safe = normalized || fallback;
  return `"${safe.length > 60 ? `${safe.slice(0, 57)}...` : safe}"`;
}

function buildDetailedObjectiveFeedback(deterministicObjective = {}) {
  const objectiveScore = deterministicObjective.objectiveScore;
  const base = `Objective score: ${deterministicObjective.objectiveCorrect}/${deterministicObjective.objectiveTotal} correct (${objectiveScore}%).`;
  const mistakeDetails = (deterministicObjective.wrongAnswers || []).slice(0, 5).map((item) => {
    const label = `${item.partId || "objective"} ${item.question || ""}`.trim();
    const submitted = formatObjectiveAnswerForFeedback(item.student || item.submitted || "", "blank");
    const expected = formatObjectiveAnswerForFeedback(item.expected || "", "the correct answer");
    return `${label}: you chose ${submitted}; correct answer is ${expected}`;
  });
  if (!mistakeDetails.length) return `${base} All objective answers were correct.`;
  return `${base} Review these exact answers: ${mistakeDetails.join("; ")}.`;
}

function normalizeAIMarkingResult(result = {}, payload = {}) {
  const assignmentKey = String(result.assignmentKey || payload.referenceEntry?.assignmentKey || payload.submission?.assignmentKey || payload.submission?.assignmentId || "").trim();
  const finalScore = Number.isFinite(Number(result.finalScore ?? result.score)) ? Math.max(0, Math.min(100, Math.round(Number(result.finalScore ?? result.score)))) : 0;
  const feedback = limitFeedbackWords(result.feedback || "AI marking completed. Please review the result before sending feedback to the student.");
  const status = ["marked", "needs_review"].includes(String(result.status || "").toLowerCase()) ? String(result.status).toLowerCase() : "needs_review";

  return {
    ...resolveStudentIdentity({ ...payload.submission, ...result, raw: payload.submission?.raw }),
    score: finalScore,
    finalScore,
    passed: Boolean(result.passed ?? finalScore >= 60),
    level: result.level || payload.referenceEntry?.level || payload.submission?.level || "UNKNOWN",
    assignmentKey,
    detectedParts: Array.isArray(result.detectedParts) ? result.detectedParts : [],
    parts: Array.isArray(result.parts) ? result.parts : [],
    expectedParts: Array.isArray(result.expectedParts) ? result.expectedParts : payload.referenceEntry?.expectedParts || [],
    objectiveScore: result.objectiveScore ?? null,
    objectiveCorrect: Number(result.objectiveCorrect || 0),
    objectiveTotal: Number(result.objectiveTotal || 0),
    objectiveDetails: result.objectiveDetails ?? null,
    wrongAnswers: Array.isArray(result.wrongAnswers) ? result.wrongAnswers : [],
    writingScore: result.writingScore ?? null,
    writingScorePercent: result.writingScorePercent ?? null,
    maxWritingScore: result.maxWritingScore ?? null,
    scoreBreakdown: Array.isArray(result.scoreBreakdown) ? result.scoreBreakdown : [],
    corrections: Array.isArray(result.corrections) ? result.corrections : [],
    feedback,
    improvementSummary: stripBoldMarkdown(result.improvementSummary || feedback),
    markingReason: result.markingReason || result.rawAiReason || result.ai?.reason || "",
    rawAiReason: result.rawAiReason || result.ai?.rawReason || result.ai?.reason || "",
    confidence: Number.isFinite(Number(result.confidence)) ? Math.max(0, Math.min(1, Number(result.confidence))) : 0.5,
    status,
    shouldSendAutomatically: Boolean(result.shouldSendAutomatically) && status === "marked",
    dataModel: result.dataModel || {
      answerKeyPath: assignmentKey ? `answerKeyRegistry/${assignmentKey}` : "answerKeyRegistry/{assignmentKey}",
      markingResultPath: payload.submission?.id ? `markingResults/${payload.submission.id}` : "markingResults/{submissionId}",
      markingJobPath: "markingJobs/{jobId}",
    },
    ai: {
      ...(result.ai || {}),
      feedbackWordCount: feedback ? feedback.split(/\s+/).filter(Boolean).length : 0,
    },
  };
}

function combineWithDeterministicObjectiveResult(aiResult = {}, deterministicObjective = null) {
  if (!deterministicObjective?.objectiveTotal) return aiResult;
  const writingScore = resolveWritingScore(aiResult);
  const objectiveScore = deterministicObjective.objectiveScore;
  const hasWritingScore = writingScore !== null && Number.isFinite(writingScore);
  const finalScore = hasWritingScore ? Math.round((objectiveScore * OBJECTIVE_WEIGHT) + (writingScore * WRITING_WEIGHT)) : objectiveScore;
  const objectiveFeedback = buildDetailedObjectiveFeedback(deterministicObjective);

  return {
    ...aiResult,
    score: finalScore,
    passed: finalScore >= 60,
    objectiveScore,
    objectiveCorrect: deterministicObjective.objectiveCorrect,
    objectiveTotal: deterministicObjective.objectiveTotal,
    objectiveDetails: deterministicObjective.details || deterministicObjective.objectiveDetails || null,
    writingScore: hasWritingScore ? writingScore : aiResult.writingScore ?? null,
    finalScore,
    wrongAnswers: deterministicObjective.wrongAnswers,
    detectedParts: deterministicObjective.detectedParts,
    parts: [
      ...(deterministicObjective.parts || []),
      ...(Array.isArray(aiResult.parts) ? aiResult.parts.filter((part) => part?.partType !== "objective") : []),
    ],
    feedback: stripBoldMarkdown(hasWritingScore ? [aiResult.feedback, deterministicObjective.wrongAnswers?.length ? objectiveFeedback : ""].filter(Boolean).join(" ") : objectiveFeedback),
    confidence: Math.max(Number(aiResult.confidence || 0), deterministicObjective.confidence || 0),
    status: aiResult.status === "marked" || finalScore >= 60 ? "marked" : aiResult.status,
    shouldSendAutomatically: false,
    ai: {
      ...(aiResult.ai || {}),
      deterministicObjectiveMarked: true,
      deterministicObjectiveWeight: hasWritingScore ? OBJECTIVE_WEIGHT : 1,
      deterministicWritingWeight: hasWritingScore ? WRITING_WEIGHT : 0,
    },
  };
}

function skippedScoreReceipt(row, reason) {
  return {
    row,
    dedupeId: scoreDedupeId(row),
    duplicateSkipped: false,
    skippedForReview: true,
    sheet: { attempted: false, success: true, message: reason },
    firestore: { attempted: false, success: true, message: "AI result kept in Firestore marking audit, not saved as final score." },
  };
}

async function saveAIAudit({ submission = {}, result = {}, receipt = {}, reason = "" }) {
  const now = new Date().toISOString();
  const identity = resolveStudentIdentity({ ...result, ...submission, raw: submission.raw });
  const safeId = safeFirestoreId(submission.id || submission.path || `${identity.studentCode || "student"}_${result.assignmentKey || "assignment"}_${now}`);
  await setDoc(doc(db, "aiMarkingAudit", safeId), {
    submissionId: submission.id || "",
    submissionPath: submission.path || "",
    ...identity,
    submissionText: submission.text || submission.submissionText || "",
    assignment: submission.assignment || result.assignmentKey || "",
    assignmentKey: result.assignmentKey || submission.assignmentKey || submission.assignmentId || "",
    level: result.level || submission.level || "",
    finalScore: result.finalScore ?? result.score ?? null,
    confidence: result.confidence ?? null,
    status: result.status || "needs_review",
    feedback: result.feedback || "",
    objectiveScore: result.objectiveScore ?? null,
    objectiveCorrect: result.objectiveCorrect ?? null,
    objectiveTotal: result.objectiveTotal ?? null,
    objectiveDetails: result.objectiveDetails ?? null,
    wrongAnswers: result.wrongAnswers || [],
    writingScore: result.writingScore ?? null,
    writingScorePercent: result.writingScorePercent ?? null,
    maxWritingScore: result.maxWritingScore ?? null,
    scoreBreakdown: result.scoreBreakdown || [],
    corrections: result.corrections || [],
    improvementSummary: result.improvementSummary || "",
    markingReason: result.markingReason || result.rawAiReason || result.ai?.reason || "",
    expectedParts: result.expectedParts || [],
    parts: result.parts || [],
    detectedParts: result.detectedParts || [],
    scoreSaveReceipt: receipt,
    sheetSynced: Boolean(receipt?.sheet?.attempted && receipt?.sheet?.success && !receipt?.skippedForReview),
    reviewReason: reason,
    createdAt: now,
    updatedAt: now,
  }, { merge: true });
}

export async function markSubmissionWithAI({ submission = {}, referenceEntry = null, submissionText = "" } = {}) {
  const deterministicObjective = checkDeterministicObjectiveAnswers({ referenceEntry: referenceEntry || {}, submissionText, partId: "main" });
  const objectiveFeedbackContext = deterministicObjective?.objectiveTotal ? {
    correct: deterministicObjective.objectiveCorrect,
    total: deterministicObjective.objectiveTotal,
    score: deterministicObjective.objectiveScore,
    wrongAnswers: deterministicObjective.wrongAnswers,
  } : null;
  const payload = {
    submission,
    referenceEntry,
    assignmentKey: referenceEntry?.assignmentKey || submission.assignmentKey || submission.assignmentId || "",
    level: referenceEntry?.level || submission.level || "",
    submissionText,
    objectiveFeedbackContext,
    feedbackInstruction: AI_FEEDBACK_INSTRUCTION,
  };

  const res = await fetch("/api/marking/ai", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
  const body = await res.json().catch(() => ({}));
  if (!res.ok || body?.status === "error") throw new Error(body?.message || "AI marking failed");

  const aiResult = normalizeAIMarkingResult(body.result || body, payload);
  const result = combineWithDeterministicObjectiveResult(aiResult, deterministicObjective);
  const identity = resolveStudentIdentity({ ...result, ...submission, raw: submission.raw });
  const row = buildScoreRow({
    ...identity,
    name: identity.studentName || submission.fullName || "",
    assignment: submission.assignment || referenceEntry?.title || result.assignmentKey || "AI marked assignment",
    assignmentId: result.assignmentKey || submission.assignmentId || submission.assignmentKey || "",
    score: result.finalScore ?? result.score ?? 0,
    comments: result.feedback || result.improvementSummary || "AI marking completed.",
    level: result.level || referenceEntry?.level || submission.level || "",
    link: referenceEntry?.answerUrl || referenceEntry?.answer_url || referenceEntry?.sheetUrl || referenceEntry?.sheet_url || "",
    source: "ai_marking",
    markingDetails: result,
  });

  const reviewReason = "AI marking saved as draft only. Tutor must click Save Final Score before anything is written to the final score sheet.";
  const receipt = skippedScoreReceipt(row, reviewReason);
  await saveAIAudit({ submission, result, receipt, reason: reviewReason });
  return { ...result, scoreSaveReceipt: receipt };
}

const DEFAULT_SCORES_WEBHOOK_URL =
  "https://script.google.com/macros/s/AKfycbxYrtdvehwxI56zBHDv_1ngJMzNGkPEefT9lgp3KlFczRlSTStcwhQPDzc02jXVjdvJJQ/exec";
const SCORES_WEBHOOK_URL = import.meta.env.VITE_SCORES_WEBHOOK_URL || DEFAULT_SCORES_WEBHOOK_URL;
const SCORES_WEBHOOK_TOKEN = String(import.meta.env.VITE_SCORES_WEBHOOK_TOKEN || "Xenomexpress7727/").trim();
const SCORES_WEBHOOK_SHEET_NAME = String(import.meta.env.VITE_SCORES_WEBHOOK_SHEET_NAME || "").trim();
const SCORES_WEBHOOK_SHEET_GID = String(import.meta.env.VITE_SCORES_WEBHOOK_SHEET_GID || "2121051612").trim();
const SAVE_SCORES_TO_FIRESTORE = String(import.meta.env.VITE_ENABLE_SCORE_FIRESTORE || "true").toLowerCase() !== "false";

function isLikelyNetworkError(error) {
  return error instanceof TypeError || /networkerror|failed to fetch/i.test(String(error?.message || ""));
}

async function postScoreToWebhook(payload) {
  const res = await fetch(SCORES_WEBHOOK_URL, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
  if (!res.ok) throw new Error(await res.text() || "Failed to write score to Google Sheets webhook");
  const responseBody = await res.json().catch(() => ({}));
  if (responseBody?.ok === false) throw new Error(responseBody?.error || "Validation failed while saving to sheet");
}

async function postScoreToWebhookNoCors(payload) {
  await fetch(SCORES_WEBHOOK_URL, { method: "POST", mode: "no-cors", headers: { "Content-Type": "text/plain;charset=UTF-8" }, body: JSON.stringify(payload) });
}

function serializeForSheet(value) {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  try {
    return JSON.stringify(value);
  } catch {
    return String(value || "");
  }
}

function buildScoreBreakdown(details = {}, row = {}) {
  if (Array.isArray(details.scoreBreakdown) && details.scoreBreakdown.length) return details.scoreBreakdown;
  const breakdown = [];
  if (Number(details.objectiveTotal || 0) > 0) {
    breakdown.push({
      label: "Objective / MCQ",
      score: `${details.objectiveCorrect || 0}/${details.objectiveTotal || 0}`,
      reason: `${details.objectiveScore ?? ""}% objective score`,
    });
  }
  if (details.writingScore !== null && details.writingScore !== undefined && details.writingScore !== "") {
    breakdown.push({ label: "Writing", score: details.writingScore, reason: "Task, grammar, vocabulary, structure, tone and clarity" });
  }
  if (!breakdown.length) breakdown.push({ label: "Overall", score: row.score ?? details.finalScore ?? details.score ?? "", reason: "Final score saved by tutor/admin" });
  return breakdown;
}

function buildMarkingReason(details = {}, row = {}) {
  return normalize(details.markingReason || details.rawAiReason || details.ai?.reason || details.improvementSummary || row.comments || "Score saved by tutor/admin after review.");
}

function buildScoreRow({ studentCode, studentEmail = "", studentId = "", studentScopeKey = "", name, assignment, assignmentId, score, comments, level, link, source = "manual", markingDetails = {} }) {
  const safeAssignmentId = String(assignmentId || "").trim();
  const now = new Date().toString();
  const details = markingDetails && typeof markingDetails === "object" ? markingDetails : {};
  const identity = resolveStudentIdentity({
    ...details,
    studentCode: studentCode || details.studentCode || details.studentcode || details.student_code,
    studentEmail: studentEmail || details.studentEmail || details.email,
    studentId: studentId || details.studentId || details.uid,
    studentScopeKey: studentScopeKey || details.studentScopeKey || details.student_scope_key,
    studentName: name || details.studentName || details.name,
  });
  const row = {
    ...identity,
    name: identity.studentName,
    assignment,
    assignment_id: safeAssignmentId,
    assignmentId: safeAssignmentId,
    score,
    comments,
    date: now,
    level,
    link: Number(score) < 60 ? "" : link,
    source,
  };

  return {
    ...row,
    objective_score: details.objectiveScore ?? "",
    objective_correct: details.objectiveCorrect ?? "",
    objective_total: details.objectiveTotal ?? "",
    objective_details: serializeForSheet(details.objectiveDetails || details.objectiveFeedbackContext || ""),
    wrong_answers: serializeForSheet(details.wrongAnswers || []),
    writing_score: details.writingScore ?? "",
    writing_score_percent: details.writingScorePercent ?? "",
    max_writing_score: details.maxWritingScore ?? "",
    score_breakdown: serializeForSheet(buildScoreBreakdown(details, row)),
    corrections: serializeForSheet(details.corrections || []),
    improvement_summary: details.improvementSummary || "",
    marking_reason: buildMarkingReason(details, row),
    ai_reason: buildMarkingReason(details, row),
    raw_ai_reason: details.rawAiReason || details.ai?.rawReason || details.ai?.reason || "",
  };
}

export async function saveScoreRow({
  studentCode,
  studentEmail = "",
  studentId = "",
  studentScopeKey = "",
  name,
  assignment,
  assignmentId,
  score,
  comments,
  level,
  link,
  source = "manual",
  allowDuplicate = false,
  markingDetails = {},
}) {
  const nowIso = new Date().toISOString();
  const row = buildScoreRow({ studentCode, studentEmail, studentId, studentScopeKey, name, assignment, assignmentId, score, comments, level, link, source, markingDetails });
  const dedupeId = scoreDedupeId(row);
  const scoreRef = doc(db, "scores", dedupeId);
  const existingSnap = SAVE_SCORES_TO_FIRESTORE ? await getDoc(scoreRef).catch(() => null) : null;
  const existingScore = existingSnap?.exists?.() ? existingSnap.data() : null;
  const attemptMetadata = buildScoreAttemptMetadata(existingScore, row.score, nowIso);
  Object.assign(row, attemptMetadata);
  const duplicateSkipped = shouldSkipExistingScore(existingScore, row.score, allowDuplicate);
  const sheetDedupeId = attemptMetadata.is_resubmission ? `${dedupeId}__attempt_${attemptMetadata.attempt}` : dedupeId;

  const webhookPayload = {
    ...(SCORES_WEBHOOK_TOKEN ? { token: SCORES_WEBHOOK_TOKEN } : {}),
    ...(SCORES_WEBHOOK_SHEET_NAME ? { sheet_name: SCORES_WEBHOOK_SHEET_NAME } : {}),
    ...(SCORES_WEBHOOK_SHEET_GID ? { sheet_gid: SCORES_WEBHOOK_SHEET_GID } : {}),
    dedupe_id: sheetDedupeId,
    metadata_columns: ["attempt", "status", "is_resubmission", "previous_score", "previous_result", "resubmitted_at"],
    create_missing_columns: true,
    row: { ...row, dedupe_id: sheetDedupeId },
    rows: [{ ...row, dedupe_id: sheetDedupeId }],
  };

  const receipt = {
    row,
    dedupeId,
    duplicateSkipped: false,
    sheet: { attempted: Boolean(SCORES_WEBHOOK_URL), success: !SCORES_WEBHOOK_URL, message: SCORES_WEBHOOK_URL ? "Pending" : "Sheet save skipped (webhook not configured)." },
    firestore: { attempted: SAVE_SCORES_TO_FIRESTORE, success: !SAVE_SCORES_TO_FIRESTORE, message: SAVE_SCORES_TO_FIRESTORE ? "Pending" : "Firestore mirror skipped (disabled by config)." },
  };

  if (SCORES_WEBHOOK_URL) {
    if (duplicateSkipped) {
      receipt.sheet.success = true;
      receipt.sheet.message = "Skipped duplicate sheet row; this student and assignment already has a passing score.";
      receipt.duplicateSkipped = true;
    } else {
      try {
        await postScoreToWebhook(webhookPayload);
        receipt.sheet.success = true;
        receipt.sheet.message = "Saved to Google Sheets with detailed marking fields.";
      } catch (error) {
        if (!isLikelyNetworkError(error)) {
          receipt.sheet.success = false;
          receipt.sheet.message = String(error?.message || "Google Sheets save failed.");
        } else {
          try {
            await postScoreToWebhookNoCors(webhookPayload);
            receipt.sheet.success = true;
            receipt.sheet.message = "Sheet request sent via no-cors fallback with detailed marking fields.";
          } catch (fallbackError) {
            receipt.sheet.success = false;
            receipt.sheet.message = String(fallbackError?.message || error?.message || "Google Sheets save failed.");
          }
        }
      }
    }
  }

  if (SAVE_SCORES_TO_FIRESTORE) {
    try {
      const firestoreScore = receipt.duplicateSkipped
        ? {
            dedupe_id: dedupeId,
            sheetSaved: Boolean(receipt.sheet.success),
            sheetMessage: receipt.sheet.message,
            duplicateSkipped: true,
            updatedAt: nowIso,
          }
        : {
            ...row,
            dedupe_id: dedupeId,
            sheetSaved: Boolean(receipt.sheet.success),
            sheetMessage: receipt.sheet.message,
            duplicateSkipped: false,
            createdAt: existingScore?.createdAt || nowIso,
            updatedAt: nowIso,
          };
      await setDoc(scoreRef, firestoreScore, { merge: true });
      receipt.firestore.success = true;
      receipt.firestore.message = existingScore ? "Updated Firestore score mirror." : "Saved to Firestore mirror.";
    } catch (error) {
      receipt.firestore.success = false;
      receipt.firestore.message = String(error?.message || "Firestore mirror save failed.");
    }
  }

  if (!receipt.sheet.success && !receipt.firestore.success) {
    const saveError = new Error("Save failed for both Google Sheets and Firestore.");
    saveError.receipt = receipt;
    throw saveError;
  }

  return receipt;
}
