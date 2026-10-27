const MONTH_NUMBER = Object.freeze({
  january: 1,
  february: 2,
  march: 3,
  april: 4,
  may: 5,
  june: 6,
  july: 7,
  august: 8,
  september: 9,
  october: 10,
  november: 11,
  december: 12,
});

function isLeapYear(year) {
  return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
}

function daysInMonth(year, month) {
  if (month === 2) return isLeapYear(year) ? 29 : 28;
  return [4, 6, 9, 11].includes(month) ? 30 : 31;
}

function validDateParts(year, month, day) {
  return Number.isInteger(year)
    && Number.isInteger(month)
    && Number.isInteger(day)
    && year >= 1
    && month >= 1
    && month <= 12
    && day >= 1
    && day <= daysInMonth(year, month);
}

function parsedDate(yearText, month, dayText) {
  const year = Number.parseInt(String(yearText || ""), 10);
  const day = Number.parseInt(String(dayText || ""), 10);
  if (!validDateParts(year, month, day)) return null;
  return { year, month, day };
}

export function parseCheckinSessionDate(dateValue) {
  const raw = String(dateValue || "").trim();
  if (!raw) return null;

  const isoMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) {
    return parsedDate(isoMatch[1], Number.parseInt(isoMatch[2], 10), isoMatch[3]);
  }

  const longMatch = raw.match(/^(?:[A-Za-z]+,\s*)?(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})$/);
  if (longMatch) {
    const month = MONTH_NUMBER[String(longMatch[2] || "").toLowerCase()];
    if (!month) return null;
    return parsedDate(longMatch[3], month, longMatch[1]);
  }

  return null;
}

export function checkinSessionDateKey(dateValue) {
  const raw = String(dateValue || "").trim();
  if (!raw) return "";
  const parsed = parseCheckinSessionDate(raw);
  if (!parsed) return null;
  return `${String(parsed.year).padStart(4, "0")}-${String(parsed.month).padStart(2, "0")}-${String(parsed.day).padStart(2, "0")}`;
}
