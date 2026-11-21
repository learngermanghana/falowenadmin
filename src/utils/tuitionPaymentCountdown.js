// Shared calendar-day rule used by WhatsApp Reminders and Partnerships.
// Tuition payment is due 30 calendar days after the recorded contract start.
const DAY_MS = 24 * 60 * 60 * 1000;
export const TUITION_PAYMENT_TERM_DAYS = 30;

function civilDayMs(value) {
  if (value instanceof Date) {
    if (!Number.isFinite(value.getTime())) return null;
    return Date.UTC(value.getFullYear(), value.getMonth(), value.getDate());
  }
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value || "").trim());
  if (!match) return null;
  const [, year, month, day] = match;
  const time = Date.UTC(Number(year), Number(month) - 1, Number(day));
  return Number.isFinite(time) && new Date(time).toISOString().slice(0, 10) === match[0] ? time : null;
}

export function paymentDueDateFromContractStart(contractStart) {
  const start = civilDayMs(contractStart);
  return start === null ? null : new Date(start + TUITION_PAYMENT_TERM_DAYS * DAY_MS).toISOString().slice(0, 10);
}

export function daysUntilCalendarDate(date, today = new Date()) {
  const target = civilDayMs(date);
  const current = civilDayMs(today);
  return target === null || current === null ? null : Math.round((target - current) / DAY_MS);
}
