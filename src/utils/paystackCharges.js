export const PAYSTACK_CHARGE_RATE = 0.0195;
export const STUDENT_PAYSTACK_CHARGE_SHARE = 0.5;

export function parseMoneyValue(value) {
  const parsed = Number(String(value ?? "").replace(/[^0-9.-]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

export function calculatePaystackGrossAmount(
  netAmount,
  rate = PAYSTACK_CHARGE_RATE,
  studentShare = STUDENT_PAYSTACK_CHARGE_SHARE,
) {
  const amount = parseMoneyValue(netAmount);
  const feeRate = Number(rate);
  const feeShare = Number(studentShare);
  if (amount <= 0) return 0;
  if (!Number.isFinite(feeRate) || feeRate <= 0 || feeRate >= 1) return Math.ceil(amount);
  if (!Number.isFinite(feeShare) || feeShare <= 0) return Math.ceil(amount);
  if (feeShare >= 1) return Math.ceil(amount / (1 - feeRate));
  return Math.ceil(amount / (1 - feeRate * feeShare));
}

export function calculatePaystackCharge(netAmount, rate = PAYSTACK_CHARGE_RATE, studentShare = STUDENT_PAYSTACK_CHARGE_SHARE) {
  return Math.max(0, calculatePaystackGrossAmount(netAmount, rate, studentShare) - parseMoneyValue(netAmount));
}
