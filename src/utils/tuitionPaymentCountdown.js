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

function recordedCalendarDay(value) {
  if (value && typeof value.toDate === "function") value = value.toDate();
  if (value instanceof Date) return Number.isFinite(value.getTime()) ? value.toISOString().slice(0, 10) : "";
  const raw = String(value ?? "").trim();
  const day = /^\d{4}-\d{2}-\d{2}(?:T|$)/.test(raw) ? raw.slice(0, 10) : "";
  return civilDayMs(day) === null ? "" : day;
}

// Use the payment deadline for the current profile, never the contract end.
// Legacy pending upgrades have their own payment grace period.
export function studentPaymentDeadline(student = {}, draft = {}) {
  if (String(student.upgradeStatus || "").trim().toLowerCase() === "pending") {
    return recordedCalendarDay(student.upgradeGraceEnd) || null;
  }
  const explicit = draft.paymentDeadline ?? student.paymentDeadline;
  if (String(explicit ?? "").trim()) return recordedCalendarDay(explicit) || null;
  if (student.effectiveEnrollmentId) return null;
  const due = student.paymentDueDate;
  if (String(due ?? "").trim()) return recordedCalendarDay(due) || null;
  const start = recordedCalendarDay(draft.contractStart ?? student.contractStart);
  return paymentDueDateFromContractStart(start);
}

export function studentPaymentDeadlineReminder(student, draft) {
  const deadline = studentPaymentDeadline(student, draft);
  if (!deadline) return "Please contact us to confirm your payment deadline and arrange payment.";
  const formatted = new Intl.DateTimeFormat("en-GB", {
    day: "2-digit", month: "short", year: "numeric", timeZone: "UTC",
  }).format(new Date(deadline + "T00:00:00Z"));
  return "Your payment deadline is " + formatted + ". Please settle your balance to avoid interruption to your course access.";
}
