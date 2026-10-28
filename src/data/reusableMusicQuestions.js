import { MUSIC_QUESTION_SEEDS_A1 } from './musicQuestionSeedsA1.js';
import { MUSIC_QUESTION_SEEDS_A2 } from './musicQuestionSeedsA2.js';
import { MUSIC_QUESTION_SEEDS_B1 } from './musicQuestionSeedsB1.js';
import { getReusableSongDraft, musicDraftPackageText } from './reusableMusicSongbook.js';

// One canonical source for reusable music exercises. No API calls or question
// regeneration; each comprehension answer is tied to the original song lyrics.
export const MUSIC_QUESTION_SEEDS = Object.freeze({
  A1: MUSIC_QUESTION_SEEDS_A1,
  A2: MUSIC_QUESTION_SEEDS_A2,
  B1: MUSIC_QUESTION_SEEDS_B1,
});

const byAssignment = new Map(Object.values(MUSIC_QUESTION_SEEDS)
  .flat().map(row => [String(row[0]).trim().toUpperCase(), row]));

function verseEvidence(lyrics, verseNumber) {
  const label = verseNumber === 1 ? '[Verse 1]' : '[Verse 2]';
  const start = String(lyrics || '').indexOf(label);
  if (start < 0) return '';
  const next = String(lyrics).indexOf('[', start + label.length);
  return String(lyrics).slice(start + label.length, next < 0 ? undefined : next).trim();
}

export function getReusableMusicQuestions(assignmentKey) {
  const key = String(assignmentKey || '').trim().toUpperCase();
  const row = byAssignment.get(key);
  const song = getReusableSongDraft(key);
  if (!row || !song) return null;
  const level = key.split('-')[0];
  const guidance = level === 'A1' ? 'Antworte mit einem einfachen Satz.'
    : level === 'A2' ? 'Antworte mit zwei oder drei Sätzen und benutze weil oder dann.'
    : 'Begründe deine Meinung mit mehreren Sätzen und einem Beispiel.';
  return {
    assignmentKey: song.assignmentKey,
    level,
    songTitle: song.title,
    topic: song.assignmentKey,
    questions: [
      { id: key + '-listen-1', type: 'listening', prompt: row[1], answer: row[2], evidence: verseEvidence(song.lyrics, 1) },
      { id: key + '-listen-2', type: 'listening', prompt: row[3], answer: row[4], evidence: key === 'A1-14.1' ? 'Mia bringt mir Wasser und Tee.\nJetzt geht es mir schon besser.' : verseEvidence(song.lyrics, 2) },
      { id: key + '-speak-1', type: 'speaking', prompt: row[5], answer: null, evidence: '', teacherNote: guidance },
    ],
  };
}

export function formatReusableMusicQuestions(assignmentKey, { includeAnswers = false, includeEvidence = false } = {}) {
  const data = getReusableMusicQuestions(assignmentKey);
  if (!data) return '';
  const result = [
    `FALOWEN MUSIC · ${data.level} · ${data.assignmentKey}`,
    `Song: ${data.songTitle}`,
    'LISTEN, THINK & SPEAK',
    'Teacher: use these questions with the matching song, not another recording.',
    '',
  ];
  for (const [index, question] of data.questions.entries()) {
    result.push(`${index + 1}. [${question.type === 'speaking' ? 'SPRECHEN' : 'HÖRVERSTEHEN'}] ${question.prompt}`);
    if (includeAnswers && question.type === 'listening') {
      result.push(`   Erwartete Antwort: ${question.answer}`);
      if (includeEvidence) result.push(`   Textbeleg: ${question.evidence}`);
    }
    if (includeAnswers && question.type === 'speaking') {
      result.push(`   Lehrerhinweis: ${question.teacherNote}`);
    }
  }
  if (!includeAnswers) result.push('', 'Antworte nach dem Hören des Liedes.');
  return result.join('\n');
}

export function getReusableMusicQuestionCount() {
  return Object.values(MUSIC_QUESTION_SEEDS).flat().length * 3;
}

export function musicSongTeachingPackText(song, lesson) {
  if (!song) return '';
  // The question bank is keyed to the original draft. Callers must review the
  // answers before using it with materially edited or newly generated lyrics.
  return [
    musicDraftPackageText(song, lesson),
    '',
    '='.repeat(52),
    '',
    formatReusableMusicQuestions(song.assignmentKey, { includeAnswers: true }),
    '',
    'Answer key above is based on the original saved lyric draft. Review if the lyrics change.',
  ].join('\n');
}
