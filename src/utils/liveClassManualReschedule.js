import { normalizeScheduleRules } from "./liveClassScheduling.js";

const WEEKDAYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

function normalize(value) {
  return String(value || "").trim();
}

function codedError(code, message) {
  const error = new Error(message);
  error.code = code;
  return error;
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

export function normalizeLocalDateTime(value) {
  const match = normalize(value).match(/^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})/);
  return match ? `${match[1]}T${match[2]}` : "";
}

export function dateTimeInTimezone(value, timezone = "Africa/Accra") {
  const date = toDate(value);
  if (!date) return "";
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: normalize(timezone) || "Africa/Accra",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    hourCycle: "h23",
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}T${values.hour}:${values.minute}`;
}

function payloadDateTime(payload = {}, timezone = "Africa/Accra") {
  const direct = normalizeLocalDateTime(payload.startsAt);
  if (direct) return direct;

  const localDate = normalize(payload.localDate || payload.date);
  const localTime = normalize(payload.localTime || payload.time).slice(0, 5);
  if (/^\d{4}-\d{2}-\d{2}$/.test(localDate) && /^\d{2}:\d{2}$/.test(localTime)) {
    return `${localDate}T${localTime}`;
  }

  return dateTimeInTimezone(payload.startsAt, timezone);
}

function scheduleRuleForDate(dateIso, scheduleRules = []) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalize(dateIso))) return null;
  const weekday = WEEKDAYS[new Date(`${dateIso}T00:00:00.000Z`).getUTCDay()];
  return normalizeScheduleRules(scheduleRules)
    .filter((rule) => rule.day === weekday)
    .sort((left, right) => left.startTime.localeCompare(right.startTime))[0] || null;
}

function applyWeekdayRuleToDateOnlyChange(selected, current, scheduleRules = []) {
  if (!selected || !current) return { selected, scheduleRuleApplied: false };
  const [selectedDate, selectedTime] = selected.split("T");
  const [currentDate, currentTime] = current.split("T");
  if (!selectedDate || !selectedTime || selectedDate === currentDate || selectedTime !== currentTime) {
    return { selected, scheduleRuleApplied: false };
  }

  const matchingRule = scheduleRuleForDate(selectedDate, scheduleRules);
  if (!matchingRule || matchingRule.startTime === selectedTime) {
    return { selected, scheduleRuleApplied: false };
  }

  return {
    selected: `${selectedDate}T${matchingRule.startTime}`,
    scheduleRuleApplied: true,
  };
}

export function resolveManualRescheduleDateTime({
  currentStartsAt,
  payload = {},
  domStartsAt = "",
  timezone = "Africa/Accra",
  scheduleRules = [],
} = {}) {
  const current = dateTimeInTimezone(currentStartsAt, timezone);
  const dom = normalizeLocalDateTime(domStartsAt);
  const submitted = payloadDateTime(payload, timezone);

  const domChanged = Boolean(dom && dom !== current);
  const payloadChanged = Boolean(submitted && submitted !== current);
  const selectedInput = domChanged
    ? dom
    : payloadChanged
      ? submitted
      : dom || submitted;

  if (!selectedInput) {
    throw codedError("live-class/invalid-time", "Choose a valid new Ghana date and time.");
  }

  const adjusted = applyWeekdayRuleToDateOnlyChange(selectedInput, current, scheduleRules);
  const selected = adjusted.selected;
  if (current && selected === current) {
    throw codedError(
      "live-class/no-reschedule-change",
      "The selected lesson is still on the same date and time. Choose the new date in the picker before saving.",
    );
  }

  const [localDate, localTime] = selected.split("T");
  const baseSource = domChanged ? "mobile-form" : "payload";
  return {
    startsAt: selected,
    localDate,
    localTime,
    source: adjusted.scheduleRuleApplied ? `${baseSource}-class-weekday-rule` : baseSource,
    previousLocalDateTime: current,
    scheduleRuleApplied: adjusted.scheduleRuleApplied,
  };
}
