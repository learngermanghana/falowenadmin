import { normalizeScheduleRules } from "./liveClassScheduling.js";

const GHANA_TIMEZONE = "Africa/Accra";

function normalize(value) {
  return String(value || "").trim();
}

function toDate(value) {
  if (!value) return null;
  if (typeof value?.toDate === "function") return value.toDate();
  if (typeof value?.toMillis === "function") return new Date(value.toMillis());
  if (typeof value === "object" && Number.isFinite(value.seconds)) {
    return new Date((Number(value.seconds) * 1000) + Math.round(Number(value.nanoseconds || 0) / 1000000));
  }
  const parsed = value instanceof Date ? value : new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function sessionDateDisplay(value, timezone = GHANA_TIMEZONE) {
  const date = toDate(value);
  if (!date) {
    return {
      valid: false,
      weekday: "Date unavailable",
      weekdayKey: "",
      dateLabel: normalize(value) || "-",
      time: "--:--",
      localDate: "",
    };
  }

  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: normalize(timezone) || GHANA_TIMEZONE,
    weekday: "long",
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    hourCycle: "h23",
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  const weekday = values.weekday || "";

  return {
    valid: true,
    weekday,
    weekdayKey: weekday.toLowerCase().slice(0, 3),
    dateLabel: `${values.day} ${values.month} ${values.year}`,
    time: `${values.hour}:${values.minute}`,
    localDate: `${values.year}-${String(values.month).padStart(2, "0")}-${values.day}`,
  };
}

export function sessionTimeRange(session = {}, timezone = GHANA_TIMEZONE) {
  const start = sessionDateDisplay(session.startsAt, timezone);
  const end = sessionDateDisplay(session.endsAt, timezone);
  return {
    start,
    end,
    label: `${start.time}–${end.time}`,
  };
}

export function scheduleSlotsLabel(scheduleRules = []) {
  const rules = normalizeScheduleRules(scheduleRules);
  if (!rules.length) return "No weekly timetable saved";
  return rules
    .map((rule) => `${String(rule.day || "").toUpperCase()} ${rule.startTime || "--:--"}`)
    .join(" · ");
}

export function sessionScheduleCheck(session = {}, scheduleRules = [], timezone = GHANA_TIMEZONE) {
  const rules = normalizeScheduleRules(scheduleRules);
  if (!rules.length) {
    return {
      valid: true,
      hasRules: false,
      message: "No weekly timetable is saved for comparison.",
      expected: [],
    };
  }

  const start = sessionDateDisplay(session.startsAt, timezone);
  if (!start.valid || !start.weekdayKey) {
    return {
      valid: false,
      hasRules: true,
      message: "This session has an invalid date or time.",
      expected: rules,
    };
  }

  const weekdayRules = rules.filter((rule) => normalize(rule.day).toLowerCase() === start.weekdayKey);
  if (!weekdayRules.length) {
    return {
      valid: false,
      hasRules: true,
      message: `${start.weekday} is outside the saved class timetable.`,
      expected: rules,
    };
  }

  const matchingRule = weekdayRules.find((rule) => normalize(rule.startTime).slice(0, 5) === start.time);
  if (!matchingRule) {
    const expectedTimes = weekdayRules.map((rule) => normalize(rule.startTime).slice(0, 5)).filter(Boolean);
    return {
      valid: false,
      hasRules: true,
      message: `${start.weekday} sessions should start at ${expectedTimes.join(" or ")}. This session starts at ${start.time}.`,
      expected: weekdayRules,
    };
  }

  return {
    valid: true,
    hasRules: true,
    message: `Matches the saved ${start.weekday} timetable slot.`,
    expected: [matchingRule],
  };
}
