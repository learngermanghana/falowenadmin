export const SESSION_MINUTES_BY_LEVEL = Object.freeze({
  A1: 60,
  A2: 90,
  B1: 90,
  B2: 90,
  C1: 90,
  C2: 90,
});

function normalize(value) {
  return String(value || "").trim();
}

export function inferPresenterLevel(...values) {
  for (const value of values) {
    const match = normalize(value).toUpperCase().match(/\b(A1|A2|B1|B2|C1|C2)\b/);
    if (match) return match[1];
  }
  return "";
}

export function presenterSessionMinutes(level = "") {
  return SESSION_MINUTES_BY_LEVEL[normalize(level).toUpperCase()] || 0;
}

export function presenterSessionDurationSeconds(level = "") {
  return presenterSessionMinutes(level) * 60;
}

export function formatClassCountdown(seconds = 0) {
  const total = Math.max(0, Math.floor(Number(seconds) || 0));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const rest = String(total % 60).padStart(2, "0");
  return hours ? `${hours}:${String(minutes).padStart(2, "0")}:${rest}` : `${String(minutes).padStart(2, "0")}:${rest}`;
}

export function formatTeachingDuration(milliseconds = 0) {
  const total = Math.max(0, Math.floor(Number(milliseconds) / 1000) || 0);
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  return `${hours ? `${hours} hr ` : ""}${minutes} min ${seconds} sec`;
}

export function sharedClassClock(state = {}, nowMs = Date.now(), fallback = {}) {
  const positive = (value) => Number.isFinite(Number(value)) && Number(value) > 0 ? Number(value) : 0;
  const startedAtMs = positive(state.classStartedAtMs) || positive(fallback.startedAtMs);
  const endedAtMs = positive(state.classEndedAtMs) || positive(fallback.endedAtMs);
  const durationSeconds = positive(fallback.durationSeconds) || positive(state.timerDurationSeconds);
  const derivedEndAt = startedAtMs && durationSeconds ? startedAtMs + durationSeconds * 1000 : 0;
  const rawEndAt = positive(state.timerEndAt);
  const deadlineMs = state.classStartSource === "checkin" && derivedEndAt
    ? Math.min(rawEndAt || derivedEndAt, derivedEndAt)
    : rawEndAt || derivedEndAt;
  const remainingSeconds = endedAtMs ? 0 : deadlineMs
    ? Math.max(0, Math.ceil((deadlineMs - nowMs) / 1000))
    : Math.max(0, Number(state.timerRemaining || 0));
  const elapsedSeconds = startedAtMs ? Math.max(0, Math.floor(((endedAtMs || nowMs) - startedAtMs) / 1000)) : 0;
  return { startedAtMs, endedAtMs, deadlineMs, remainingSeconds, elapsedSeconds };
}

export function presenterClassMatches(expectedClassId, classRecordId, state = {}) {
  const expected = normalize(expectedClassId).toLowerCase();
  const actual = normalize(state.classId).toLowerCase();
  // A Firestore record ID remains stable when the class name/alias changes.
  const record = normalize(classRecordId);
  const actualRecord = normalize(state.classRecordId);
  if (record && actualRecord) return record === actualRecord;
  return Boolean(expected && actual && expected === actual);
}
