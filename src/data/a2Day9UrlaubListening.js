import supplied from './a2Day9UrlaubQuestions.json' with { type: 'json' };

// A2 Day 9 · teacher-provided private R2 MP3, separate from the assessed workbook Teil 4.
// Only answer-evidence excerpts were supplied; do not invent a full recording transcript.
export const A2_DAY9_URLAUB_AUDIO_KEY = 'a2/day-09/urlaub.mp3';
export const A2_DAY9_URLAUB_LISTENING = Object.freeze({
  level: 'A2',
  day: 9,
  title: 'Urlaub · Ben und seine Familie',
  audioKey: A2_DAY9_URLAUB_AUDIO_KEY,
  suggestedMinutes: 7,
  transcript: Object.freeze([]),
  previewWords: ['der Urlaub', 'mit dem Flugzeug', 'das Hotel', 'der Strand', 'zurückkommen'],
  playbackNote: 'Lest die fünf Multiple-Choice-Fragen. Hört Bens Urlaubsgespräch zweimal, wählt jeweils eine Antwort und besprecht die Lösungen erst danach.',
  questions: Object.freeze(supplied.questions.map(item => Object.freeze({
    prompt: item.question,
    options: Object.freeze([...item.options]),
    correctIndex: item.correctIndex,
    answer: item.options[item.correctIndex],
    evidence: item.evidence,
    hint: 'Achte auf Reiseziel, Verkehrsmittel, Aufenthaltsdauer, Hotel und Rückflug.',
    explanation: `Hörbeleg: „${item.evidence}“`,
  }))),
});
