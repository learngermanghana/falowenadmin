function normalize(value) {
  return String(value || "").trim().toLowerCase();
}

function toMillis(value) {
  if (!value) return Number.NaN;
  if (typeof value?.toMillis === "function") return value.toMillis();
  if (typeof value?.toDate === "function") return value.toDate().getTime();
  if (typeof value === "object" && Number.isFinite(value.seconds)) {
    return (Number(value.seconds) * 1000) + Math.round(Number(value.nanoseconds || 0) / 1000000);
  }
  return new Date(value).getTime();
}

export function hasScheduleHealthReminderSuppression(record = {}) {
  return record.scheduleHealthRemindersSuppressed === true
    || record.scheduleRemindersSuppressed === true
    || normalize(record.reminderSuppressionSource) === "schedule-health";
}

export function shouldReleaseScheduleHealthReminderSuppression(session = {}, nowMs = Date.now()) {
  if (!hasScheduleHealthReminderSuppression(session)) return false;

  const status = normalize(session.status || session.sessionStatus || "scheduled");
  if (["cancelled", "canceled", "completed", "superseded", "deleted"].includes(status)) return false;
  if (session.superseded === true || session.isSuperseded === true) return false;

  const startsAtMs = toMillis(session.startsAt || session.startAt || session.startDateTime || session.date);
  return Number.isFinite(startsAtMs) && startsAtMs > nowMs;
}

export function scheduleHealthReminderReleasePatch(scheduleVersion = Date.now()) {
  return {
    remindersSuppressed: false,
    scheduleHealthRemindersSuppressed: false,
    scheduleRemindersSuppressed: false,
    reminderSuppressionSource: "",
    reminderSuppressionReason: "",
    scheduleReminderSuppressionReason: "",
    reminderScheduleVersion: scheduleVersion,
  };
}
