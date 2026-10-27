const SUPPORTED_LEVELS = ["A1", "A2", "B1", "B2", "C1"];
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

const DEFAULT_GOETHE_EXAM_CONFIG = Object.freeze({
  version: 1,
  timezone: "Africa/Accra",
  examFileUrl: "https://www.falowen.app/campus/examFile",
  goetheUrl: "https://www.goethe.de/",
  senderName: "Learn Language Education Academy",
  replyTo: "learngermanghana@gmail.com",
  reminder: {
    minContractWeeks: 5,
    reminderDays: [14, 3, 2, 1],
    accountSetupDaysBefore: 7,
    accountSetupCatchUp: true,
    allowedStatuses: ["active", "paid", "enrolled"],
    dailyHour: 6,
    dailyMinute: 30,
    openingWindows: [
      { key: "EVE_1730", daysBefore: 1, hour: 17, minute: 30, label: "17:30 on the day before opening" },
      { key: "PREMIDNIGHT_2330", daysBefore: 1, hour: 23, minute: 30, label: "23:30 on the day before opening" },
      { key: "PRE6AM_0530", daysBefore: 0, hour: 5, minute: 30, label: "05:30 on the opening day" },
    ],
  },
  levels: [
    {
      level: "A1",
      title: "Goethe-Zertifikat A1: Start Deutsch 1",
      description: "A German exam for adults. It certifies very basic language skills at A1 level.",
      registrationUrl: "https://www.goethe.de/ins/gh/en/spr/prf/gzsd1.cfm",
      price: "3,000 GHS",
      priceValue: 3000,
      location: "Goethe-Institut Accra",
      exams: [
        { date: "2026-06-03", registrationStart: "2026-05-04", registrationEnd: "2026-05-04" },
        { date: "2026-06-04", registrationStart: "2026-05-04", registrationEnd: "2026-05-04" },
        { date: "2026-06-05", registrationStart: "2026-05-04", registrationEnd: "2026-05-04" },
        { date: "2026-06-06", registrationStart: "2026-05-04", registrationEnd: "2026-05-04" },
        { date: "2026-06-08", registrationStart: "2026-05-04", registrationEnd: "2026-05-04" },
        { date: "2026-06-09", registrationStart: "2026-05-04", registrationEnd: "2026-05-04" },
        { date: "2026-08-31", registrationStart: "2026-08-03", registrationEnd: "2026-08-03" },
        { date: "2026-09-01", registrationStart: "2026-08-03", registrationEnd: "2026-08-03" },
        { date: "2026-09-02", registrationStart: "2026-08-03", registrationEnd: "2026-08-03" },
        { date: "2026-09-03", registrationStart: "2026-08-03", registrationEnd: "2026-08-03" },
      ],
    },
    {
      level: "A2",
      title: "Goethe-Zertifikat A2",
      description: "A German exam for adults. It certifies basic language skills at A2 level.",
      registrationUrl: "https://www.goethe.de/ins/gh/en/spr/prf/gzsd2.cfm",
      price: "2,550 GHS",
      priceValue: 2550,
      location: "Goethe-Institut Accra",
      exams: [
        { date: "2026-03-12", registrationStart: "2026-02-03", registrationEnd: "2026-02-03" },
        { date: "2026-03-13", registrationStart: "2026-02-03", registrationEnd: "2026-02-03" },
        { date: "2026-06-10", registrationStart: "2026-05-05", registrationEnd: "2026-05-05" },
        { date: "2026-06-11", registrationStart: "2026-05-05", registrationEnd: "2026-05-05" },
        { date: "2026-09-07", registrationStart: "2026-08-04", registrationEnd: "2026-08-04" },
        { date: "2026-09-08", registrationStart: "2026-08-04", registrationEnd: "2026-08-04" },
        { date: "2026-11-30", registrationStart: "2026-10-27", registrationEnd: "2026-10-27" },
        { date: "2026-12-01", registrationStart: "2026-10-27", registrationEnd: "2026-10-27" },
      ],
    },
    {
      level: "B1",
      title: "Goethe-Zertifikat B1",
      description: "A German exam for young people and adults. It certifies independent language use at B1 level.",
      registrationUrl: "https://www.goethe.de/ins/gh/en/spr/prf/gzb1.cfm",
      price: "2,900 GHS",
      priceValue: 2900,
      modulePrice: "950 GHS per module",
      modulePriceValue: 950,
      location: "Goethe-Institut Accra",
      exams: [
        { date: "2026-03-16", registrationStart: "2026-02-04", registrationEnd: "2026-02-04" },
        { date: "2026-03-17", registrationStart: "2026-02-04", registrationEnd: "2026-02-04" },
        { date: "2026-06-12", registrationStart: "2026-05-06", registrationEnd: "2026-05-06" },
        { date: "2026-06-15", registrationStart: "2026-05-06", registrationEnd: "2026-05-06" },
        { date: "2026-09-09", registrationStart: "2026-08-05", registrationEnd: "2026-08-05" },
        { date: "2026-09-10", registrationStart: "2026-08-05", registrationEnd: "2026-08-05" },
        { date: "2026-12-02", registrationStart: "2026-10-28", registrationEnd: "2026-10-28" },
        { date: "2026-12-03", registrationStart: "2026-10-28", registrationEnd: "2026-10-28" },
      ],
    },
    {
      level: "B2",
      title: "Goethe-Zertifikat B2",
      description: "A German exam for young people and adults. It certifies advanced language skills at B2 level.",
      registrationUrl: "https://www.goethe.de/ins/gh/en/spr/prf/gzb2.cfm",
      price: "Contact Goethe-Institut Accra",
      location: "Goethe-Institut Accra",
      exams: [],
    },
    {
      level: "C1",
      title: "Goethe-Zertifikat C1",
      description: "A German exam for adults. It certifies proficient language skills at C1 level.",
      registrationUrl: "https://www.goethe.de/ins/gh/en/spr/prf/gzc1.cfm",
      price: "Contact Goethe-Institut Accra",
      location: "Goethe-Institut Accra",
      exams: [],
    },
  ],
});

function text(value, fallback = "") {
  const normalized = String(value ?? "").trim();
  return normalized || fallback;
}

function integer(value, fallback, min, max) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(min, Math.min(max, Math.round(parsed)));
}

function dateOnly(value, fallback = "") {
  const normalized = text(value);
  return ISO_DATE.test(normalized) ? normalized : fallback;
}

function stringList(value, fallback = []) {
  const source = Array.isArray(value) ? value : String(value || "").split(",");
  const result = [...new Set(source.map((item) => text(item).toLowerCase()).filter(Boolean))];
  return result.length ? result : [...fallback];
}

function numberList(value, fallback = []) {
  const source = Array.isArray(value) ? value : String(value || "").split(",");
  const result = [...new Set(source.map(Number).filter(Number.isFinite).map((item) => Math.max(0, Math.round(item))))]
    .sort((a, b) => b - a);
  return result.length ? result : [...fallback];
}

function normalizeExam(exam = {}) {
  const date = dateOnly(exam.date);
  const registrationStart = dateOnly(exam.registrationStart || exam.registrationDate);
  const registrationEnd = dateOnly(exam.registrationEnd, registrationStart);
  if (!date || !registrationStart) return null;
  if (registrationEnd < registrationStart) {
    throw new Error(`Registration end ${registrationEnd} cannot be before ${registrationStart}.`);
  }
  return { date, registrationStart, registrationEnd };
}

function normalizeOpeningWindow(window = {}, fallback = {}) {
  return {
    key: text(window.key, fallback.key),
    daysBefore: integer(window.daysBefore, fallback.daysBefore ?? 0, 0, 30),
    hour: integer(window.hour, fallback.hour ?? 0, 0, 23),
    minute: integer(window.minute, fallback.minute ?? 0, 0, 59),
    label: text(window.label, fallback.label),
  };
}

function normalizeLevel(input = {}, fallback = {}) {
  const level = text(input.level, fallback.level).toUpperCase();
  const exams = (Array.isArray(input.exams) ? input.exams : fallback.exams || [])
    .map(normalizeExam)
    .filter(Boolean)
    .sort((left, right) => left.registrationStart.localeCompare(right.registrationStart) || left.date.localeCompare(right.date));
  return {
    level,
    title: text(input.title, fallback.title || level),
    description: text(input.description, fallback.description),
    registrationUrl: text(input.registrationUrl, fallback.registrationUrl),
    price: text(input.price, fallback.price),
    ...(Number.isFinite(Number(input.priceValue ?? fallback.priceValue))
      ? { priceValue: Number(input.priceValue ?? fallback.priceValue) }
      : {}),
    ...(text(input.modulePrice, fallback.modulePrice) ? { modulePrice: text(input.modulePrice, fallback.modulePrice) } : {}),
    ...(Number.isFinite(Number(input.modulePriceValue ?? fallback.modulePriceValue))
      ? { modulePriceValue: Number(input.modulePriceValue ?? fallback.modulePriceValue) }
      : {}),
    location: text(input.location, fallback.location || "Goethe-Institut Accra"),
    exams,
  };
}

function normalizeGoetheExamConfig(input = {}) {
  const fallbackReminder = DEFAULT_GOETHE_EXAM_CONFIG.reminder;
  const incomingLevels = new Map((Array.isArray(input.levels) ? input.levels : [])
    .map((item) => [text(item?.level).toUpperCase(), item]));
  const fallbackLevels = new Map(DEFAULT_GOETHE_EXAM_CONFIG.levels.map((item) => [item.level, item]));
  const incomingWindows = Array.isArray(input.reminder?.openingWindows) ? input.reminder.openingWindows : [];

  const config = {
    version: integer(input.version, DEFAULT_GOETHE_EXAM_CONFIG.version, 1, 9999),
    timezone: text(input.timezone, DEFAULT_GOETHE_EXAM_CONFIG.timezone),
    examFileUrl: text(input.examFileUrl, DEFAULT_GOETHE_EXAM_CONFIG.examFileUrl),
    goetheUrl: text(input.goetheUrl, DEFAULT_GOETHE_EXAM_CONFIG.goetheUrl),
    senderName: text(input.senderName, DEFAULT_GOETHE_EXAM_CONFIG.senderName),
    replyTo: text(input.replyTo, DEFAULT_GOETHE_EXAM_CONFIG.replyTo),
    reminder: {
      minContractWeeks: integer(input.reminder?.minContractWeeks, fallbackReminder.minContractWeeks, 0, 104),
      reminderDays: numberList(input.reminder?.reminderDays, fallbackReminder.reminderDays),
      accountSetupDaysBefore: integer(input.reminder?.accountSetupDaysBefore, fallbackReminder.accountSetupDaysBefore, 0, 60),
      accountSetupCatchUp: input.reminder?.accountSetupCatchUp == null
        ? fallbackReminder.accountSetupCatchUp
        : Boolean(input.reminder.accountSetupCatchUp),
      allowedStatuses: stringList(input.reminder?.allowedStatuses, fallbackReminder.allowedStatuses),
      dailyHour: integer(input.reminder?.dailyHour, fallbackReminder.dailyHour, 0, 23),
      dailyMinute: integer(input.reminder?.dailyMinute, fallbackReminder.dailyMinute, 0, 59),
      openingWindows: fallbackReminder.openingWindows.map((fallback, index) =>
        normalizeOpeningWindow(incomingWindows.find((item) => text(item?.key) === fallback.key) || incomingWindows[index], fallback)),
    },
    levels: SUPPORTED_LEVELS.map((level) => normalizeLevel(incomingLevels.get(level), fallbackLevels.get(level))),
  };

  if (!config.levels.some((level) => level.exams.length)) {
    throw new Error("Add at least one Goethe exam date before saving.");
  }
  return config;
}

function nextRegistrationForLevel(config, level, today = new Date()) {
  const normalized = normalizeGoetheExamConfig(config);
  const isoToday = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString().slice(0, 10);
  const selected = normalized.levels.find((item) => item.level === text(level).toUpperCase());
  if (!selected) return null;
  const openings = [...new Set(selected.exams.map((exam) => exam.registrationStart))]
    .filter((date) => date >= isoToday)
    .sort();
  return openings[0] || null;
}

module.exports = {
  DEFAULT_GOETHE_EXAM_CONFIG,
  SUPPORTED_LEVELS,
  nextRegistrationForLevel,
  normalizeGoetheExamConfig,
};
