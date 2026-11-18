import supplied from './a2Day7ListeningQuestions.json' with { type: 'json' };

// Separate, ungraded classroom Hören, not the learner workbook assessment.
// Keep this private R2 object key exact; never embed a public bucket URL.
export const A2_DAY7_AUDIO_KEY = 'a2/day-07/eine-wohnung-suchen.mp3';
export const A2_DAY7_LISTENING = Object.freeze({
  level: 'A2',
  day: 7,
  title: 'Eine Wohnung suchen · Hörverstehen',
  audioKey: A2_DAY7_AUDIO_KEY,
  suggestedMinutes: 7,
  transcript: Object.freeze([]),
  previewWords: ['die Besichtigung', 'die Miete', 'die Nebenkosten', 'der Garten', 'Quadratmeter'],
  playbackNote: 'Lies die fünf Aussagen. Höre das Gespräch zweimal und entscheide: richtig oder falsch. Die Lösungen erst danach anzeigen.',
  questions: Object.freeze(supplied.questions.map(item => Object.freeze({
    prompt: item.question,
    options: Object.freeze(['Richtig', 'Falsch']),
    correctIndex: item.answer === 'Richtig' ? 0 : 1,
    answer: item.answer,
    evidence: item.evidence,
    hint: 'Höre genau auf die Information über Wohnung, Termin, Größe, Nebenkosten oder Garten.',
    explanation: `Hörbeleg: „${item.evidence}“`,
  }))),
});
