const HOLIDAY_NOTICE_PROTOCOL_VERSION = "holiday-notice-v3";

const VALID_NOTICE_STATUSES = new Set([
  "not_scheduled",
  "scheduled",
  "sent",
  "failed",
  "no_recipients",
]);

function normalizeNoticeStatus(value) {
  return VALID_NOTICE_STATUSES.has(value) ? value : "not_scheduled";
}

function resolveHolidayNoticeUpdate({ existing = {}, schoolClosed, autoSendNotice } = {}) {
  const effectiveSchoolClosed =
    typeof schoolClosed === "boolean" ? schoolClosed : Boolean(existing.schoolClosed);
  const effectiveAutoSendNotice = effectiveSchoolClosed && autoSendNotice === true;
  const existingStatus = normalizeNoticeStatus(existing.noticeStatus);
  const noticeStatus =
    existingStatus === "sent"
      ? "sent"
      : effectiveAutoSendNotice
        ? "scheduled"
        : "not_scheduled";

  return {
    schoolClosed: effectiveSchoolClosed,
    autoSendNotice: effectiveAutoSendNotice,
    noticeStatus,
  };
}

function buildHolidayNoticeSubject({ schoolClosed, holidayName, date } = {}) {
  const prefix = schoolClosed ? "No class notice" : "Holiday update";
  const name = String(holidayName || "Holiday").trim() || "Holiday";
  const holidayDate = String(date || "").trim();
  return holidayDate ? `${prefix}: ${name} (${holidayDate})` : `${prefix}: ${name}`;
}

function resolveHolidaySendOutcome({ sent = 0, failed = 0, skipped = 0, recipientCount } = {}) {
  const sentCount = Number(sent || 0);
  const failedCount = Number(failed || 0);
  const skippedCount = Number(skipped || 0);
  const attemptedCount = Number(recipientCount ?? (sentCount + failedCount));

  if (attemptedCount === 0) {
    return {
      status: "no_recipients",
      recipientCount: 0,
      attemptedCount: 0,
      lastError: "No active recipients found for this audience.",
    };
  }

  if (failedCount > 0 && sentCount === 0) {
    return {
      status: "failed",
      recipientCount: 0,
      attemptedCount,
      lastError: `Failed: ${failedCount}; skipped: ${skippedCount}`,
    };
  }

  return {
    status: "sent",
    recipientCount: sentCount,
    attemptedCount,
    lastError: failedCount > 0 ? `Partial send: ${failedCount} failed; ${sentCount} sent.` : "",
  };
}

module.exports = {
  HOLIDAY_NOTICE_PROTOCOL_VERSION,
  normalizeNoticeStatus,
  resolveHolidayNoticeUpdate,
  buildHolidayNoticeSubject,
  resolveHolidaySendOutcome,
};
