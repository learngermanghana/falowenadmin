// A2 Day 24 · ungraded classroom Hören for the owner-supplied Anna/Lukas script.
// The transcript is teacher-provided text; the MP3 has not been acoustically checked here.
// Keep this activity separate from the protected, graded workbook Teil 4.
export const A2_DAY24_CLASSROOM_AUDIO_KEY = 'a2/day-24/einen-urlaub-planen.mp3';

export const A2_DAY24_CLASSROOM_TRANSCRIPT = Object.freeze([
  ['A', 'Hallo Lukas! Hast du schon Pläne für die Sommerferien?'],
  ['B', 'Hallo Anna! Ja, ich möchte dieses Jahr unbedingt nach Spanien reisen.'],
  ['A', 'Das klingt toll! Wann möchtest du denn fliegen?'],
  ['B', 'Im Juli, für zwei Wochen. Am liebsten Anfang Juli.'],
  ['A', 'Und suchst du schon nach einem Hotel oder einer Ferienwohnung?'],
  ['B', 'Ich möchte lieber in einem ruhigen Hotel am Meer wohnen.'],
  ['A', 'Verstehe. Fliegst du alleine oder reist jemand mit dir?'],
  ['B', 'Meine Schwester kommt mit. Wir buchen den Flug wahrscheinlich morgen online.'],
  ['A', 'Perfekt. Vergiss nicht, vorher den Reisepass zu prüfen!'],
].map(line => Object.freeze(line)));

const ITEMS = [
  {
    prompt: 'Wohin möchte Lukas in den Sommerferien reisen?',
    options: ['Nach Spanien.', 'Nach Italien.', 'Nach Hamburg.'],
    correctIndex: 0,
    evidence: 'Ja, ich möchte dieses Jahr unbedingt nach Spanien reisen.',
  },
  {
    prompt: 'Wann und wie lange möchte Lukas verreisen?',
    options: ['Ende August für eine Woche.', 'Anfang Juli für zwei Wochen.', 'Im Juni für drei Wochen.'],
    correctIndex: 1,
    evidence: 'Im Juli, für zwei Wochen. Am liebsten Anfang Juli.',
  },
  {
    prompt: 'Welche Unterkunft möchte Lukas?',
    options: ['Eine Ferienwohnung in der Stadt.', 'Ein Hostel am Bahnhof.', 'Ein ruhiges Hotel am Meer.'],
    correctIndex: 2,
    evidence: 'Ich möchte lieber in einem ruhigen Hotel am Meer wohnen.',
  },
  {
    prompt: 'Mit wem möchte Lukas reisen?',
    options: ['Mit seiner Schwester.', 'Mit Anna.', 'Allein.'],
    correctIndex: 0,
    evidence: 'Meine Schwester kommt mit.',
  },
  {
    prompt: 'Was möchten Lukas und seine Schwester wahrscheinlich morgen machen?',
    options: ['Den Reisepass verlängern.', 'Den Flug online buchen.', 'Ein Hotel stornieren.'],
    correctIndex: 1,
    evidence: 'Wir buchen den Flug wahrscheinlich morgen online.',
  },
];

export const A2_DAY24_CLASSROOM_QUESTIONS = Object.freeze(ITEMS.map(({ prompt, options, correctIndex, evidence }) =>
  Object.freeze({
    prompt, options: Object.freeze(options), correctIndex,
    answer: options[correctIndex], evidence,
    hint: `Hörbeleg: „${evidence}“`,
    explanation: evidence,
  })
));

export const A2_DAY24_CLASSROOM_LISTENING = Object.freeze({
  level: 'A2', day: 24,
  title: 'Einen Urlaub planen · Anna und Lukas',
  audioKey: A2_DAY24_CLASSROOM_AUDIO_KEY,
  transcript: A2_DAY24_CLASSROOM_TRANSCRIPT,
  questions: A2_DAY24_CLASSROOM_QUESTIONS,
  suggestedMinutes: 7,
  playbackNote: 'Lest zuerst die fünf Fragen. Hört dann das Gespräch über den Urlaub in Spanien. Anna erinnert Lukas am Ende daran, den Reisepass zu prüfen.',
  previewWords: ['die Sommerferien', 'die Ferienwohnung', 'am Meer', 'der Reisepass'],
});
