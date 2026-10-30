import { PRESENTER_READING_TRANSLATIONS } from '../data/presenterReadingTranslations.js';

export function savedReadingTranslation(assignmentId,section,text) {
  const rows=PRESENTER_READING_TRANSLATIONS[String(assignmentId||'').trim().toUpperCase()]?.[section];
  return rows?.find(row=>row.de===String(text||'').trim())?.en || '';
}
