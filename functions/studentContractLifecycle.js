const LEVEL_SEQUENCE = ["A1", "A2", "B1", "B2", "C1"];
const CONTRACT_TERM_MONTHS = 6;
const UPGRADE_GRACE_MONTHS = 1;

function normalizeLevel(value) {
  const match = String(value || "").trim().toUpperCase().match(/\b(A1|A2|B1|B2|C1)\b/);
  return match ? match[1] : "";
}

function nextLevel(value) {
  const current = normalizeLevel(value);
  const index = LEVEL_SEQUENCE.indexOf(current);
  return index >= 0 && index < LEVEL_SEQUENCE.length - 1 ? LEVEL_SEQUENCE[index + 1] : "";
}

function asDate(value) {
  if (!value) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  if (typeof value?.toDate === "function") {
    const date = value.toDate();
    return Number.isNaN(date.getTime()) ? null : date;
  }
  if (typeof value?.toMillis === "function") {
    const date = new Date(value.toMillis());
    return Number.isNaN(date.getTime()) ? null : date;
  }
  if (typeof value === "object" && Number.isFinite(Number(value.seconds))) {
    const date = new Date(Number(value.seconds) * 1000 + Math.round(Number(value.nanoseconds || 0) / 1e6));
    return Number.isNaN(date.getTime()) ? null : date;
  }
  const raw = String(value).trim();
  if (!raw) return null;
  const date = /^\d{4}-\d{2}-\d{2}$/.test(raw) ? new Date(`${raw}T00:00:00.000Z`) : new Date(raw);
  return Number.isNaN(date.getTime()) ? null : date;
}

function startOfUtcDay(value) {
  const date = asDate(value) || new Date();
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function addCalendarMonths(value, months) {
  const source = asDate(value);
  if (!source) return null;
  const amount = Number(months) || 0;
  const day = source.getUTCDate();
  const target = new Date(Date.UTC(source.getUTCFullYear(), source.getUTCMonth() + amount, 1));
  const lastDay = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate();
  target.setUTCDate(Math.min(day, lastDay));
  target.setUTCHours(source.getUTCHours(), source.getUTCMinutes(), source.getUTCSeconds(), source.getUTCMilliseconds());
  return target;
}

function isoDate(value) {
  const date = asDate(value);
  return date ? date.toISOString().slice(0, 10) : "";
}

function computeUpgradeGraceEnd(start = new Date(), months = UPGRADE_GRACE_MONTHS) {
  return addCalendarMonths(startOfUtcDay(start), months);
}

function contractIsActive(contractEnd, now = new Date()) {
  const end = asDate(contractEnd);
  if (!end) return false;
  return startOfUtcDay(end).getTime() >= startOfUtcDay(now).getTime();
}

function computeExtendedContractEnd(contractEnd, paidAt = new Date(), months = CONTRACT_TERM_MONTHS) {
  const paymentDay = startOfUtcDay(paidAt);
  const existingEnd = asDate(contractEnd);
  const base = existingEnd && startOfUtcDay(existingEnd).getTime() >= paymentDay.getTime()
    ? startOfUtcDay(existingEnd)
    : paymentDay;
  return isoDate(addCalendarMonths(base, months));
}

function isUpgradeGraceExpired(graceEnd, now = new Date()) {
  const end = asDate(graceEnd);
  if (!end) return false;
  return end.getTime() <= asDate(now).getTime();
}

module.exports = {
  LEVEL_SEQUENCE,
  CONTRACT_TERM_MONTHS,
  UPGRADE_GRACE_MONTHS,
  normalizeLevel,
  nextLevel,
  asDate,
  addCalendarMonths,
  isoDate,
  computeUpgradeGraceEnd,
  contractIsActive,
  computeExtendedContractEnd,
  isUpgradeGraceExpired,
};
