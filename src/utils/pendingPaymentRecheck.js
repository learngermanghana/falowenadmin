// A single timer for the earliest pending Paystack link, not repeated polling.
// The caller is responsible for cancelling the timer when student/history changes.
export const PENDING_PAYMENT_MIN_AGE_MS = 90 * 1000;

export function planPendingPaymentRecheck(
  payments = [],
  attemptedReferences = new Set(),
  now = Date.now(),
  toMillis = (value) => new Date(value).getTime(),
) {
  const dueReferences = [];
  let nextDelayMs = null;
  const seen = new Set();

  for (const payment of payments) {
    if (String(payment?.status || "").trim().toLowerCase() !== "pending") continue;
    const reference = String(payment?.reference || payment?.id || "").trim();
    if (!reference || attemptedReferences.has(reference) || seen.has(reference)) continue;
    seen.add(reference);

    const createdAtMs = toMillis(payment?.createdAt);
    if (!Number.isFinite(createdAtMs) || createdAtMs <= 0) continue;
    const dueAt = createdAtMs + PENDING_PAYMENT_MIN_AGE_MS;
    if (dueAt <= now) {
      dueReferences.push(reference);
      continue;
    }
    // A small buffer prevents timer jitter from firing just before the threshold.
    const delayMs = Math.min(2 ** 31 - 1, Math.max(1, Math.ceil(dueAt - now) + 50));
    nextDelayMs = nextDelayMs === null ? delayMs : Math.min(nextDelayMs, delayMs);
  }

  return { dueReferences, nextDelayMs };
}
