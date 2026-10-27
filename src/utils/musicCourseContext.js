import { getStudioCourseCatalog } from './hoerenCourseCatalog.js';

export function getMusicDays(level) {
  const groups = new Map();
  for (const entry of getStudioCourseCatalog(level)) {
    if (!groups.has(entry.day)) groups.set(entry.day, []);
    groups.get(entry.day).push(entry);
  }
  return [...groups].sort(([a], [b]) => a - b).map(([day, lessons]) => ({ day, lessons }));
}

export function musicLessonContext(entry, language = 'bilingual', focus = '') {
  if (!entry) return '';
  return [
    'Falowen course song — use this selected lesson as the learning focus:',
    `CEFR level: ${entry.level}. Course day: ${entry.day}. Assignment: ${entry.assignmentKey}. Chapter: ${entry.chapter}.`,
    `Dictionary topic: ${entry.germanTitle} / ${entry.englishTitle}.`,
    language === 'german' ? 'Sing in German only.' : 'Sing in German with short English explanations of the German learning phrases.',
    `Use vocabulary and grammar appropriate to ${entry.level}. Use clear pronunciation and repeat useful phrases in the chorus.`,
    'The dictionary provides lesson titles, not a verbatim vocabulary list. Do not claim invented examples are quotations from the course.',
    focus.trim() ? `Teacher-selected words or grammar to practise: ${focus.trim()}` : '',
    'Preserve any supplied lyrics; do not silently replace them to fit the lesson.',
  ].filter(Boolean).join('\n');
}
