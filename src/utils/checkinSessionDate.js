export function parseCheckinSessionDate(dateValue) {
  const raw = String(dateValue || "").trim();
  if (!raw) return null;

  const isoMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) {
    return {
      year: Number.parseInt(isoMatch[1], 10),
      month: Number.parseInt(isoMatch[2], 10),
      day: Number.parseInt(isoMatch[3], 10),
    };
  }

  const direct = new Date(raw);
  if (!Number.isNaN(direct.getTime())) {
    return {
      year: direct.getFullYear(),
      month: direct.getMonth() + 1,
      day: direct.getDate(),
    };
  }

  const withoutWeekday = raw.replace(/^[A-Za-z]+,\s*/, "");
  const fallback = new Date(withoutWeekday);
  if (!Number.isNaN(fallback.getTime())) {
    return {
      year: fallback.getFullYear(),
      month: fallback.getMonth() + 1,
      day: fallback.getDate(),
    };
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
