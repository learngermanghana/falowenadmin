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

export function resolveManualRescheduleDateTime({
  currentStartsAt,
  payload = {},
  domStartsAt = "",
  timezone = "Africa/Accra",
} = {}) {
  const current = dateTimeInTimezone(currentStartsAt, timezone);
  const dom = normalizeLocalDateTime(domStartsAt);
  const submitted = payloadDateTime(payload, timezone);

  const domChanged = Boolean(dom && dom !== current);
  const payloadChanged = Boolean(submitted && submitted !== current);
  const selected = domChanged
    ? dom
    : payloadChanged
      ? submitted
      : dom || submitted;

  if (!selected) {
    throw codedError("live-class/invalid-time", "Choose a valid new Ghana date and time.");
  }
  if (current && selected === current) {
    throw codedError(
      "live-class/no-reschedule-change",
      "The selected lesson is still on the same date and time. Choose the new date in the picker before saving.",
    );
  }

  const [localDate, localTime] = selected.split("T");
  return {
    startsAt: selected,
    localDate,
    localTime,
    source: domChanged ? "mobile-form" : "payload",
    previousLocalDateTime: current,
  };
}
