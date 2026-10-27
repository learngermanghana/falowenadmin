const HISTORICAL_STATUSES = new Set(["graduated", "archived", "completed"]);

function normalizedStatus(payload = {}) {
  return String(payload.status || "").trim().toLowerCase();
}

export function isHistoricalSchedulePayload(payload = {}) {
  if (payload.historicalMode === true) return true;
  if (payload.historical !== true) return false;

  const status = normalizedStatus(payload);
  return HISTORICAL_STATUSES.has(status);
}

export function shouldShowHistoricalScheduleMode(payload = {}) {
  return isHistoricalSchedulePayload(payload);
}
