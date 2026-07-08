const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function toDateInputValue(value) {
  if (!value) return "";
  if (typeof value === "string") return value.includes("T") ? value.slice(0, 10) : value.slice(0, 10);
  const date = typeof value?.toDate === "function" ? value.toDate() : value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

function toTimeInputValue(value) {
  const text = String(value || "").trim();
  const match = text.match(/(\d{1,2}):(\d{2})/);
  if (!match) return "";
  return `${match[1].padStart(2, "0")}:${match[2]}`;
}

function normalizeDay(value) {
  const text = String(value || "").slice(0, 3).toLowerCase();
  return DAYS.find((day) => day.toLowerCase() === text) || "";
}

export function normalizeScheduleRulesForSheet(rules = []) {
  const normalizedRules = Array.isArray(rules) ? rules : [];
  const meetingDays = [];
  const dayTimes = {};

  normalizedRules.forEach((rule) => {
    const day = normalizeDay(rule.day || rule.weekday || rule.dayName);
    if (!day) return;
    if (!meetingDays.includes(day)) meetingDays.push(day);
    const time = toTimeInputValue(rule.time || rule.startTime || rule.startsAt);
    if (time) dayTimes[`${day.toLowerCase()}Time`] = time;
  });

  return { meetingDays, dayTimes, firstTime: Object.values(dayTimes)[0] || "" };
}

export function classRecordToScheduleSheetPayload(record = {}) {
  const { meetingDays, dayTimes, firstTime } = normalizeScheduleRulesForSheet(record.scheduleRules);
  const className = String(record.name || record.className || record.classId || "").trim();
  return {
    className,
    startDate: toDateInputValue(record.startDate || record.startsAt || record.start),
    endDate: toDateInputValue(record.endDate || record.graduationDate || record.endsAt),
    time: toTimeInputValue(record.time || record.startTime || record.classTime || record.scheduleTime || firstTime),
    meetingDays,
    monTime: dayTimes.monTime || "",
    tueTime: dayTimes.tueTime || "",
    wedTime: dayTimes.wedTime || "",
    thuTime: dayTimes.thuTime || "",
    friTime: dayTimes.friTime || "",
    satTime: dayTimes.satTime || "",
    sunTime: dayTimes.sunTime || "",
  };
}
