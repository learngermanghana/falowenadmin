export const EARLY_COMPLETION_ERROR_CODE = "live-class/early-completion-confirmation-required";

function toDate(value) {
  if (!value) return null;
  if (typeof value?.toDate === "function") return value.toDate();
  if (typeof value?.toMillis === "function") return new Date(value.toMillis());
  if (typeof value === "object" && Number.isFinite(value.seconds)) {
    return new Date((Number(value.seconds) * 1000) + Math.round(Number(value.nanoseconds || 0) / 1000000));
  }
  const parsed = value instanceof Date ? value : new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function sessionCompletionCutoff(session = {}) {
  const end = toDate(session.endsAt || session.endAt || session.endDateTime || session.endDate);
  if (end) return end;
  return toDate(session.startsAt || session.startAt || session.startDateTime || session.date);
}

export function requiresEarlySessionCompletionOverride(session = {}, now = new Date()) {
  const cutoff = sessionCompletionCutoff(session);
  const current = toDate(now);
  return Boolean(cutoff && current && current.getTime() < cutoff.getTime());
}

export function activeSessionStatusRestoresReminders(status) {
  return ["scheduled", "rescheduled", "live"].includes(String(status || "").trim().toLowerCase());
}
