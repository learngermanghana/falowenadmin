function isIsoDate(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(value || ""));
}

export function formatLongDate(value, locale = "en-US") {
  if (!isIsoDate(value)) return String(value || "");
  const date = new Date(`${value}T00:00:00.000Z`);
  return new Intl.DateTimeFormat(locale, {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

export function buildClassEndDateMismatchWarning(klass = {}, locale = "en-US") {
  const savedEndDate = String(klass.endDate || "").trim();
  const sessionDerivedEndDate = String(klass.sessionDerivedEndDate || "").trim();
  if (!isIsoDate(savedEndDate) || !isIsoDate(sessionDerivedEndDate)) return "";
  if (sessionDerivedEndDate <= savedEndDate) return "";
  return `This class has sessions after the saved graduation date. Rebuild/sync will update the class end date to ${formatLongDate(sessionDerivedEndDate, locale)}.`;
}
