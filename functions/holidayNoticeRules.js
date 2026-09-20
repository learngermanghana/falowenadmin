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

function resolveHolidaySendOutcome({ sent = 0, failed = 0, skipped = 0, recipientCount } = {}) {
  const sentCount = Number(sent || 0);
  const failedCount = Number(failed || 0);
  const skippedCount = Number(skipped || 0);
  const recipients = Number(recipientCount ?? sentCount);

  if (recipients === 0) {
    return {
      status: "no_recipients",
      recipientCount: 0,
      lastError: "No active recipients found for this audience.",
    };
  }

  if (failedCount > 0 && sentCount === 0) {
    return {
      status: "failed",
      recipientCount: recipients,
      lastError: `Failed: ${failedCount}; skipped: ${skippedCount}`,
    };
  }

  return {
    status: "sent",
    recipientCount: recipients,
    lastError: failedCount > 0 ? `Partial send: ${failedCount} failed; ${sentCount} sent.` : "",
  };
}

module.exports = {
  normalizeNoticeStatus,
  resolveHolidayNoticeUpdate,
  resolveHolidaySendOutcome,
};
