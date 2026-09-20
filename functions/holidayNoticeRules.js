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

module.exports = {
  normalizeNoticeStatus,
  resolveHolidayNoticeUpdate,
};
