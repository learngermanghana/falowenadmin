import supplied from './a2Day10StadtQuestions.json' with { type: 'json' };

// A2 Day 10 · owner-uploaded classroom dialogue, separate from the graded workbook Teil 4.
// The supplied answer key includes evidence quotations only, not a full transcript.
export const A2_DAY10_STADT_AUDIO_KEY = 'a2/day-10/eine-stadt-entdecken-und-etwas-erleben.mp3';
export const A2_DAY10_STADT_LISTENING = Object.freeze({
  level: 'A2',
  day: 10,
  title: 'Eine Stadt entdecken und etwas erleben',
  audioKey: A2_DAY10_STADT_AUDIO_KEY,
  suggestedMinutes: 7,
  transcript: Object.freeze([]),
  previewWords: ['der Marktplatz', 'das Stadtmuseum', 'der Eintritt', 'die Bootstour', 'der Treffpunkt'],
  playbackNote: 'Lest zuerst die fünf Fragen. Hört dann das Gespräch zweimal, wählt jeweils eine Antwort und besprecht eure Antworten danach.',
  questions: Object.freeze(supplied.questions.map(item => Object.freeze({
    prompt: item.question,
    options: Object.freeze([...item.options]),
    correctIndex: item.correctIndex,
    answer: item.options[item.correctIndex],
    evidence: item.evidence,
    hint: 'Achte auf die erste Sehenswürdigkeit, Öffnungszeit, Eintrittspreis, Nachmittagsplan und Treffpunkt.',
    explanation: `Hörbeleg: „${item.evidence}“`,
  }))),
});
