import { hasSavedScoreForAssignment, shouldSkipExistingScore } from "./scoreAttempts.js";

export const SCORE_SAVE_RESERVATION_TTL_MS = 5 * 60 * 1000;

function timestampMillis(value) {
  if (!value) return 0;
  if (typeof value.toDate === "function") return value.toDate().getTime();
  if (typeof value.seconds === "number") return value.seconds * 1000;
  const parsed = new Date(value).getTime();
  return Number.isNaN(parsed) ? 0 : parsed;
}

export function isActiveScoreSaveReservation(existingScore = null, now = Date.now()) {
  if (String(existingScore?.saveReservationStatus || "").toLowerCase() !== "pending") return false;
  const expiresAt = timestampMillis(existingScore?.saveReservationExpiresAt);
  return Boolean(expiresAt && expiresAt > now);
}

export function getScoreSaveBlockReason(existingScore = null, currentScore = null, {
  allowDuplicate = false,
  blockAnyDuplicate = false,
  now = Date.now(),
} = {}) {
  if (isActiveScoreSaveReservation(existingScore, now)) return "in_progress";
  const blocked = blockAnyDuplicate
    ? hasSavedScoreForAssignment(existingScore)
    : shouldSkipExistingScore(existingScore, currentScore, allowDuplicate);
  return blocked ? "same_score" : "";
}

export function shouldBlockScoreSave(existingScore = null, currentScore = null, options = {}) {
  return Boolean(getScoreSaveBlockReason(existingScore, currentScore, options));
}

export function buildScoreSaveReservation(token, nowIso = new Date().toISOString()) {
  const startedAt = new Date(nowIso);
  const safeStartedAt = Number.isNaN(startedAt.getTime()) ? new Date() : startedAt;
  return {
    saveReservationStatus: "pending",
    saveReservationToken: token,
    saveReservationStartedAt: safeStartedAt.toISOString(),
    saveReservationExpiresAt: new Date(safeStartedAt.getTime() + SCORE_SAVE_RESERVATION_TTL_MS).toISOString(),
  };
}
