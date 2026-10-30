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

// Only add choices where distractors have been reviewed against the ORIGINAL
// recording. Other A1/A2/B1 prompts stay open until their choices are written.
const REVIEWED_LISTENING_CHOICES = Object.freeze({
  'A1-0.2': Object.freeze([
    {options:['Bina.','Lena.','Mia.'],correctIndex:0},
    {options:['Am Sonntag.','Am Montag.','Am Freitag.'],correctIndex:1},
  ]),
  'A1-1.1': Object.freeze([
    {options:['Aus Bonn.','Aus Accra.','Aus Berlin.'],correctIndex:2},
    {options:['In Bonn.','In Berlin.','In Hamburg.'],correctIndex:0},
  ]),
  'A1-2': Object.freeze([
    { options: ['Eins, zwei, drei.', 'Vier, fünf, sechs.', 'Sieben, acht, neun.'], correctIndex: 1 },
    { options: ['Zehn Jahre alt.', 'Zwanzig Jahre alt.', 'Dreißig Jahre alt.'], correctIndex: 1 },
  ]),
  'A2-7.18': Object.freeze([
    { options: ['Die Bankkarte oder das Zahlungsgerät.', 'Das Handy der Mitarbeiterin.', 'Der Geldautomat in der Bank.'], correctIndex: 0 },
    { options: ['Die Person bezahlt nur noch bar.', 'Nach der Erklärung der Bank funktioniert die Zahlung wieder.', 'Die Bank schickt sofort eine neue Karte.'], correctIndex: 1 },
  ]),
  'A1-14.1': Object.freeze([
    { options: ['Um neun Uhr.', 'Um zehn Uhr.', 'Um elf Uhr.'], correctIndex: 1 },
    { options: ['Viel Wasser trinken und heute zu Hause bleiben.', 'Sport machen und zur Schule gehen.', 'Nur Tee trinken und sofort arbeiten.'], correctIndex: 0 },
  ]),
});
function listeningChoice(questionKey, number) {
  return REVIEWED_LISTENING_CHOICES[questionKey]?.[number] || {};
}

const SPEAKING_SUPPORT = Object.freeze({
  'A1-2': Object.freeze({
    sentenceStarters: ['Ich heiße …', 'Meine Übungsnummer ist …'],
    possibleAnswers: ['Ich heiße Ama. Meine Übungsnummer ist vier, fünf, sechs.'],
  }),
  'A2-7.18': Object.freeze({
    sentenceStarters: ['Guten Tag, ich rufe an, weil …', 'Meine Karte funktioniert nicht, wenn …', 'Können Sie bitte …?'],
    possibleAnswers: [
      'Guten Tag, ich rufe an, weil meine Karte nicht funktioniert. Das Gerät zeigt einen Fehler. Können Sie mir bitte helfen?',
      'Ich kann im Geschäft nicht mit meiner Karte bezahlen. Können Sie bitte meine Karte prüfen? Dann teste ich sie noch einmal.',
    ],
  }),
});

function chorusEvidence(lyrics) {
  const match = String(lyrics || '').match(/\[Chorus\]\s*([\s\S]*?)(?=\n\[|$)/);
  return match?.[1]?.trim() || '';
}

function verseEvidence(lyrics, verseNumber) {
  const label = `[Verse ${verseNumber}]`;
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
      { id: key + '-listen-1', type: 'listening', prompt: row[1], answer: row[2], evidence: key === 'A1-2' ? chorusEvidence(song.lyrics) : verseEvidence(song.lyrics, key === 'A1-14.1' ? 2 : 1), ...listeningChoice(key, 0) },
      { id: key + '-listen-2', type: 'listening', prompt: row[3], answer: row[4], evidence: verseEvidence(song.lyrics, key === 'A1-14.1' ? 3 : 2), ...listeningChoice(key, 1) },
      { id: key + '-speak-1', type: 'speaking', prompt: row[5], answer: null, evidence: '', teacherNote: guidance, ...(SPEAKING_SUPPORT[key] || {}) },
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
    if (Array.isArray(question.options)) {
      for (const [optionIndex, option] of question.options.entries()) {
        result.push(`   ${String.fromCharCode(65 + optionIndex)}. ${option}`);
      }
    }
    if (question.sentenceStarters?.length) result.push('   Satzanfänge:', ...question.sentenceStarters.map(line => `   • ${line}`));
    if (question.possibleAnswers?.length) result.push('   Mögliche Antworten · eigene Varianten sind willkommen:', ...question.possibleAnswers.map(line => `   • ${line}`));
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
