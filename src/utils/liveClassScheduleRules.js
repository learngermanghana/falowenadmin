import { normalizeScheduleRules } from "./liveClassScheduling.js";

const DAY_LABELS = {
  mon: "Mon",
  tue: "Tue",
  wed: "Wed",
  thu: "Thu",
  fri: "Fri",
  sat: "Sat",
  sun: "Sun",
};

export function singleSessionPerWeekdayRules(scheduleRules = []) {
  const unique = new Map();
  normalizeScheduleRules(scheduleRules).forEach((rule) => {
    if (!unique.has(rule.day)) unique.set(rule.day, rule);
  });
  return [...unique.values()];
}

export function scheduleRulesForEditor(scheduleRules = []) {
  return singleSessionPerWeekdayRules(scheduleRules).map((rule) => ({
    day: DAY_LABELS[rule.day] || rule.day,
    startTime: rule.startTime,
    durationMinutes: Number(rule.durationMinutes || 120),
  }));
}

export function duplicateScheduleWeekdays(scheduleRules = []) {
  const counts = new Map();
  normalizeScheduleRules(scheduleRules).forEach((rule) => {
    counts.set(rule.day, (counts.get(rule.day) || 0) + 1);
  });
  return [...counts.entries()]
    .filter(([, count]) => count > 1)
    .map(([day]) => DAY_LABELS[day] || day);
}

export function nextUnusedScheduleDay(scheduleRules = []) {
  const used = new Set(singleSessionPerWeekdayRules(scheduleRules).map((rule) => rule.day));
  return Object.keys(DAY_LABELS).find((day) => !used.has(day)) || "";
}
