import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const servicePath = path.join(root, "src/services/markingServiceBase.js");

function replaceRequired(source, before, after, label) {
  if (source.includes(after)) return source;
  if (!source.includes(before)) {
    throw new Error(`Could not patch ${label}: expected source block was not found.`);
  }
  return source.replace(before, after);
}

function replacePatternRequired(source, pattern, replacement, label) {
  if (!pattern.test(source)) {
    throw new Error(`Could not patch ${label}: expected source pattern was not found.`);
  }
  return source.replace(pattern, replacement);
}

let source = await readFile(servicePath, "utf8");

source = replaceRequired(
  source,
  'import { addDoc, collection, collectionGroup, deleteDoc, doc, getDoc, getDocs, query, setDoc, updateDoc, where } from "firebase/firestore";',
  'import { addDoc, collection, collectionGroup, deleteDoc, doc, getDoc, getDocs, query, runTransaction, setDoc, updateDoc, where } from "firebase/firestore";',
  "Firestore transaction import",
);

source = replaceRequired(
  source,
  'import { buildScoreAttemptMetadata, hasSavedScoreForAssignment, shouldSkipExistingScore } from "../utils/scoreAttempts.js";',
  'import { buildScoreAttemptMetadata, shouldSkipExistingScore } from "../utils/scoreAttempts.js";\nimport { buildScoreSaveReservation, shouldBlockScoreSave } from "../utils/scoreSaveReservation.js";',
  "score reservation helper import",
);

source = replaceRequired(
  source,
  '    manualOverride: Boolean(result.manualOverride),\n    aiOriginalScore: result.aiOriginalScore ?? null,',
  '    manualOverride: Boolean(result.manualOverride),\n    duplicateScoreBlocked: Boolean(result.duplicateScoreBlocked),\n    tutorVerificationRequired: Boolean(result.tutorVerificationRequired || result.duplicateScoreBlocked),\n    aiOriginalScore: result.aiOriginalScore ?? null,',
  "marking result duplicate flags",
);

source = replaceRequired(
  source,
  '      manualOverride: payload.manualOverride,\n      aiOriginalScore: payload.aiOriginalScore,',
  '      manualOverride: payload.manualOverride,\n      duplicateScoreBlocked: payload.duplicateScoreBlocked,\n      tutorVerificationRequired: payload.tutorVerificationRequired,\n      aiOriginalScore: payload.aiOriginalScore,',
  "submission duplicate flags",
);

if (!source.includes("Could not reserve the score key safely; no score was posted.")) {
  const atomicReservationBlock = [
    '  const nowIso = new Date().toISOString();',
    '  const row = buildScoreRow({ studentCode, studentEmail, studentId, studentScopeKey, name, assignment, assignmentId, score, comments, level, link, source, markingDetails });',
    '  const dedupeId = scoreDedupeId(row);',
    '  const scoreRef = doc(db, "scores", dedupeId);',
    '  const reservationToken = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;',
    '  let existingScore = null;',
    '  let attemptMetadata = null;',
    '  let duplicateSkipped = false;',
    '',
    '  if (SAVE_SCORES_TO_FIRESTORE) {',
    '    try {',
    '      await runTransaction(db, async (transaction) => {',
    '        const existingSnap = await transaction.get(scoreRef);',
    '        existingScore = existingSnap.exists() ? existingSnap.data() : null;',
    '        attemptMetadata = buildScoreAttemptMetadata(existingScore, row.score, nowIso);',
    '        duplicateSkipped = shouldBlockScoreSave(existingScore, row.score, {',
    '          allowDuplicate,',
    '          blockAnyDuplicate,',
    '        });',
    '        if (duplicateSkipped) return;',
    '',
    '        transaction.set(scoreRef, {',
    '          dedupe_id: dedupeId,',
    '          ...buildScoreSaveReservation(reservationToken, nowIso),',
    '        }, { merge: true });',
    '      });',
    '    } catch (error) {',
    '      const reservationError = new Error("Could not reserve the score key safely; no score was posted.");',
    '      reservationError.cause = error;',
    '      throw reservationError;',
    '    }',
    '  } else {',
    '    if (blockAnyDuplicate) {',
    '      throw new Error("Duplicate-safe score saving requires the Firestore score mirror.");',
    '    }',
    '    const existingSnap = await getDoc(scoreRef).catch(() => null);',
    '    existingScore = existingSnap?.exists?.() ? existingSnap.data() : null;',
    '    attemptMetadata = buildScoreAttemptMetadata(existingScore, row.score, nowIso);',
    '    duplicateSkipped = shouldSkipExistingScore(existingScore, row.score, allowDuplicate);',
    '  }',
    '',
    '  Object.assign(row, attemptMetadata);',
    '  const sheetDedupeId = forceSheetDedupeId ? dedupeId : (attemptMetadata.is_resubmission ? `${dedupeId}__attempt_${attemptMetadata.attempt}` : dedupeId);',
  ].join("\n");

  source = replacePatternRequired(
    source,
    /  const nowIso = new Date\(\)\.toISOString\(\);\n  const row = buildScoreRow\([\s\S]*?\n  const sheetDedupeId = forceSheetDedupeId \? dedupeId : \(attemptMetadata\.is_resubmission \? `\$\{dedupeId\}__attempt_\$\{attemptMetadata\.attempt\}` : dedupeId\);/,
    atomicReservationBlock,
    "atomic duplicate reservation",
  );

  source = replaceRequired(
    source,
    '  if (duplicateSkipped) {\n    receipt.sheet.success = true;\n    receipt.sheet.message = "Duplicate score blocked; this student already has a saved score for this assignment. Tutor verification is required.";\n  } else if (SCORES_WEBHOOK_URL) {',
    '  if (duplicateSkipped) {\n    receipt.sheet.attempted = false;\n    receipt.sheet.success = true;\n    receipt.sheet.message = "Duplicate score blocked atomically; this student already has a saved or in-progress score for this assignment. Tutor verification is required.";\n    receipt.firestore.success = true;\n    receipt.firestore.message = "Existing Firestore score left unchanged for tutor verification.";\n  } else if (SCORES_WEBHOOK_URL) {',
    "blocked duplicate receipt",
  );

  const reservedFirestoreWrite = [
    '  if (SAVE_SCORES_TO_FIRESTORE && !receipt.duplicateSkipped) {',
    '    try {',
    '      const firestoreScore = {',
    '        ...row,',
    '        dedupe_id: dedupeId,',
    '        sheetSaved: Boolean(receipt.sheet.success),',
    '        sheetMessage: receipt.sheet.message,',
    '        duplicateSkipped: false,',
    '        saveReservationStatus: "completed",',
    '        saveReservationCompletedAt: new Date().toISOString(),',
    '        saveReservationExpiresAt: nowIso,',
    '        createdAt: existingScore?.createdAt || nowIso,',
    '        updatedAt: nowIso,',
    '      };',
    '      await runTransaction(db, async (transaction) => {',
    '        const currentSnap = await transaction.get(scoreRef);',
    '        const currentScore = currentSnap.exists() ? currentSnap.data() : null;',
    '        if (currentScore?.saveReservationToken !== reservationToken || currentScore?.saveReservationStatus !== "pending") {',
    '          throw new Error("The score reservation was lost before Firestore finalization.");',
    '        }',
    '        transaction.set(scoreRef, firestoreScore, { merge: true });',
    '      });',
    '      receipt.firestore.success = true;',
    '      receipt.firestore.message = existingScore ? "Updated Firestore score mirror." : "Saved to Firestore mirror.";',
    '    } catch (error) {',
    '      receipt.firestore.success = false;',
    '      receipt.firestore.message = String(error?.message || "Firestore mirror save failed.");',
    '    }',
    '  }',
  ].join("\n");

  source = replacePatternRequired(
    source,
    /  if \(SAVE_SCORES_TO_FIRESTORE\) \{\n    try \{\n      const firestoreScore = receipt\.duplicateSkipped[\s\S]*?\n  \}/,
    reservedFirestoreWrite,
    "reserved Firestore finalization",
  );

  source = replaceRequired(
    source,
    '  if (!receipt.sheet.success && !receipt.firestore.success) {\n    const saveError = new Error("Save failed for both Google Sheets and Firestore.");',
    '  if (!receipt.sheet.success && !receipt.firestore.success) {\n    if (SAVE_SCORES_TO_FIRESTORE && !receipt.duplicateSkipped) {\n      await setDoc(scoreRef, {\n        saveReservationStatus: "failed",\n        saveReservationFailedAt: new Date().toISOString(),\n        saveReservationExpiresAt: nowIso,\n      }, { merge: true }).catch(() => null);\n    }\n    const saveError = new Error("Save failed for both Google Sheets and Firestore.");',
    "failed reservation release",
  );
}

for (const marker of [
  "runTransaction",
  "duplicateScoreBlocked: Boolean(result.duplicateScoreBlocked)",
  "tutorVerificationRequired: payload.tutorVerificationRequired",
  "shouldBlockScoreSave(existingScore, row.score",
  "saveReservationStatus: \"completed\"",
  "Existing Firestore score left unchanged for tutor verification.",
]) {
  if (!source.includes(marker)) throw new Error(`Duplicate score patch validation failed: missing ${marker}`);
}

await writeFile(servicePath, source);
console.log("Patched duplicate score verification persistence and atomic reservation.");
