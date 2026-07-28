import { collection, getDocs } from "firebase/firestore";
import { auth, db } from "../firebase.js";
import {
  assertScoreUpsertReceipt,
  buildScoreUpsertPayload,
  collapseStudentResultRows,
  normalizeStudentCode,
} from "../utils/studentResultUpsert.js";

const env = import.meta.env || {};
const SCORES_SHEET_CSV_URL = String(env.VITE_SCORES_SHEET_CSV_URL || "").trim();
const STUDENT_RESULTS_UPSERT_URL = "/api/student-results/sheet-upsert";

function normalize(value) {
  return String(value ?? "").trim();
}

function normalizeHeader(value) {
  return normalize(value).toLowerCase().replace(/[^a-z0-9]/g, "");
}

function parseCsvLine(line) {
  const cells = [];
  let current = "";
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    if (character === '"') {
      if (inQuotes && line[index + 1] === '"') {
        current += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (character === "," && !inQuotes) {
      cells.push(current);
      current = "";
    } else {
      current += character;
    }
  }

  cells.push(current);
  return cells;
}

function parseCsv(text) {
  return String(text || "")
    .split(/\r?\n/)
    .filter((line) => line.trim())
    .map(parseCsvLine);
}

function toScoreSheetRows(csvRows) {
  if (!csvRows.length) return [];
  const [headerRow, ...dataRows] = csvRows;
  const headers = headerRow.map(normalizeHeader);

  return dataRows.map((values, index) => {
    const entry = { sheetRowNumber: index + 2 };
    headers.forEach((header, columnIndex) => {
      entry[header] = normalize(values[columnIndex]);
    });

    return {
      ...entry,
      studentCode: entry.studentcode || entry.studentid || entry.uid || "",
      name: entry.name || entry.studentname || "",
      assignment: entry.assignment || "",
      assignmentId: entry.assignmentid || entry.assignmentkey || "",
      score: entry.score || entry.finalscore || "",
      comments: entry.comments || entry.feedback || "",
      date: entry.date || entry.markedat || entry.updatedat || "",
      level: entry.level || entry.class || entry.classname || "",
      link: entry.link || "",
      dedupeId: entry.dedupeid || "",
    };
  });
}

async function loadSheetRows(studentCode) {
  if (!SCORES_SHEET_CSV_URL) return { configured: false, rows: [] };
  const response = await fetch(SCORES_SHEET_CSV_URL, { cache: "no-store" });
  if (!response.ok) throw new Error("Failed to load the published score sheet.");
  const rows = toScoreSheetRows(parseCsv(await response.text()));
  const code = normalizeStudentCode(studentCode);
  return {
    configured: true,
    rows: rows.filter((row) => normalizeStudentCode(row.studentCode) === code),
  };
}

async function loadFirestoreRows(studentCode) {
  const code = normalizeStudentCode(studentCode);
  const snapshot = await getDocs(collection(db, "scores"));
  const rows = [];
  snapshot.forEach((scoreDocument) => {
    const data = scoreDocument.data() || {};
    if (normalizeStudentCode(data.studentCode || data.studentcode) !== code) return;
    rows.push({ id: scoreDocument.id, ...data });
  });
  return rows;
}

export async function loadStudentResultSources(studentCode) {
  const [firestoreRawRows, sheetResult] = await Promise.all([
    loadFirestoreRows(studentCode),
    loadSheetRows(studentCode),
  ]);
  const firestore = collapseStudentResultRows(firestoreRawRows);
  const sheet = collapseStudentResultRows(sheetResult.rows);

  return {
    firestoreRows: firestore.rows,
    sheetRows: sheet.rows,
    sheetConfigured: sheetResult.configured,
    firestoreRawCount: firestore.rawCount,
    firestoreDuplicateCount: firestore.duplicateCount,
    sheetRawCount: sheet.rawCount,
    sheetDuplicateCount: sheet.duplicateCount,
  };
}

async function postUpsertPayload(payload) {
  const currentUser = auth?.currentUser;
  if (!currentUser) throw new Error("Sign in again before updating Student Results.");
  const idToken = await currentUser.getIdToken();

  let response;
  try {
    response = await fetch(STUDENT_RESULTS_UPSERT_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${idToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action: "upsertScoreRows",
        mode: "upsert",
        rows: payload.rows,
      }),
    });
  } catch (error) {
    throw new Error(`Could not reach the Falowen result-update API: ${error?.message || error}`);
  }

  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body?.error || `Score-sheet update failed (${response.status}).`);
  return assertScoreUpsertReceipt(body);
}

export async function syncFirestoreScoresToSheet(scores = []) {
  if (!Array.isArray(scores) || !scores.length) {
    return { rows: [], sheet: { attempted: false, success: true, message: "No selected scores to sync." } };
  }

  const payload = buildScoreUpsertPayload(scores);
  const response = await postUpsertPayload(payload);
  const inserted = Number(response.inserted || 0);
  const updated = Number(response.updated || 0);
  const duplicatesRemoved = Number(response.duplicatesRemoved || response.duplicates_removed || 0);

  return {
    rows: payload.rows,
    response,
    sheet: {
      attempted: true,
      success: true,
      message: `Sheet updated: ${updated} replaced, ${inserted} added, ${duplicatesRemoved} older duplicate${duplicatesRemoved === 1 ? "" : "s"} removed.`,
    },
  };
}

export async function syncFirestoreScoreToSheet(score = {}) {
  return syncFirestoreScoresToSheet([score]);
}
