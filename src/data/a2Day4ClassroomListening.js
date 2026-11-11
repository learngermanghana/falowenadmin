// A2 Day 4 · ungraded classroom Hören based on the teacher-supplied Mia/Lukas dialogue.
// R2 object key is from the owner's exact Cloudflare file URL; audio was not acoustically inspected.
// Keep this separate from workbook submissions and the existing published music.
export const A2_DAY4_CLASSROOM_AUDIO_KEY = 'a2/day-04/wo-mochten-wir-uns-treffen.mp3';

export const A2_DAY4_CLASSROOM_TRANSCRIPT = Object.freeze([
  ['A', 'Hallo Mia, hast du am Samstag Zeit? Wir wollten doch zusammen in die Stadt gehen.'],
  ['B', 'Hallo Lukas! Ja, sehr gerne. Wann und wo möchten wir uns treffen?'],
  ['A', 'Passt es dir um zehn Uhr am Hauptbahnhof?'],
  ['B', 'Zehn Uhr ist ein bisschen früh für mich. Können wir uns um elf Uhr treffen?'],
  ['A', 'Ja, kein Problem. Treffen wir uns direkt am Ausgang Nord?'],
  ['B', 'Ja, super. Und wo gehen wir hin? Gehen wir zuerst in das neue Café am Marktplatz?'],
  ['A', 'Das ist eine gute Idee! Danach können wir in die Buchhandlung gehen. Ich brauche ein neues Buch.'],
  ['B', 'Perfekt. Und am Nachmittag besuchen wir den Park, wenn das Wetter schön ist.'],
  ['A', 'Abgemacht. Bis Samstag um elf Uhr am Ausgang Nord!'],
  ['B', 'Bis dann, Tschüss!'],
].map(turn => Object.freeze(turn)));

const QUESTION_DATA = [
  {
    prompt: 'Um wie viel Uhr treffen sich Mia und Lukas am Samstag?',
    options: ['Um zehn Uhr.', 'Um elf Uhr.', 'Um zwölf Uhr.'],
    correctIndex: 1,
    evidence: 'Bis Samstag um elf Uhr am Ausgang Nord!',
  },
  {
    prompt: 'Wo genau ist ihr Treffpunkt?',
    options: ['Am Eingang zum Café.', 'Vor der Buchhandlung.', 'Am Ausgang Nord.'],
    correctIndex: 2,
    evidence: 'Treffen wir uns direkt am Ausgang Nord?',
  },
  {
    prompt: 'Warum möchte Mia sich nicht um zehn Uhr treffen?',
    options: ['Zehn Uhr ist ihr zu früh.', 'Sie arbeitet bis zwölf Uhr.', 'Sie hat am Samstag keine Zeit.'],
    correctIndex: 0,
    evidence: 'Zehn Uhr ist ein bisschen früh für mich.',
  },
  {
    prompt: 'Wohin wollen sie zuerst gehen?',
    options: ['In das neue Café am Marktplatz.', 'In die Buchhandlung.', 'In den Park.'],
    correctIndex: 0,
    evidence: 'Gehen wir zuerst in das neue Café am Marktplatz?',
  },
  {
    prompt: 'Was möchten sie nach dem Café machen?',
    options: ['Zum Hauptbahnhof zurückgehen.', 'Die Buchhandlung besuchen.', 'Ins Kino gehen.'],
    correctIndex: 1,
    evidence: 'Danach können wir in die Buchhandlung gehen.',
  },
  {
    prompt: 'Was planen sie für den Nachmittag, wenn das Wetter schön ist?',
    options: ['Eine Reise buchen.', 'Zu Hause bleiben.', 'Den Park besuchen.'],
    correctIndex: 2,
    evidence: 'Und am Nachmittag besuchen wir den Park, wenn das Wetter schön ist.',
  },
];

export const A2_DAY4_CLASSROOM_QUESTIONS = Object.freeze(QUESTION_DATA.map(
  ({ prompt, options, correctIndex, evidence }) => Object.freeze({
    prompt,
    options: Object.freeze(options),
    correctIndex,
    answer: options[correctIndex],
    evidence,
    hint: `Hörbeleg: „${evidence}“`,
    explanation: evidence,
  }),
));

export const A2_DAY4_CLASSROOM_LISTENING = Object.freeze({
  level: 'A2',
  day: 4,
  title: 'Wo möchten wir uns treffen? · Mia und Lukas',
  audioKey: A2_DAY4_CLASSROOM_AUDIO_KEY,
  transcript: A2_DAY4_CLASSROOM_TRANSCRIPT,
  questions: A2_DAY4_CLASSROOM_QUESTIONS,
  suggestedMinutes: 7,
  playbackNote: 'Lest zuerst die sechs Fragen. Hört das Gespräch und achtet auf die endgültige Uhrzeit, den Treffpunkt und den Ablauf.',
  previewWords: ['sich treffen', 'der Hauptbahnhof', 'der Ausgang Nord', 'die Buchhandlung', 'am Marktplatz'],
});
