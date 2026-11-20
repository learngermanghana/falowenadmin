import supplied from './a2Day28ListeningQuestions.json' with { type: 'json' };

// Separate classroom Hören after the Day 28 music slide, not the graded workbook.
// Keep the exact private R2 object key and use authenticated audio signing.
export const A2_DAY28_AUDIO_KEY = 'a2/day-28/uber-die-zukunft-sprechen.mp3';
export const A2_DAY28_CLASSROOM_LISTENING = Object.freeze({
  level: 'A2', day: 28, title: 'Über die Zukunft sprechen · Anna',
  audioKey: A2_DAY28_AUDIO_KEY, suggestedMinutes: 7,
  transcript: Object.freeze([]),
  playbackNote: 'Lies zuerst die fünf Fragen. Höre das Gespräch zweimal und wähle jeweils die richtige Antwort. Die Lösungen erst danach anzeigen.',
  previewWords: ['im Juli', 'im August', 'drei Wochen', 'im Herbst', 'nächstes Jahr'],
  questions: Object.freeze(supplied.questions.map(item => Object.freeze({
    prompt: item.question,
    options: Object.freeze([...item.options]),
    correctIndex: item.correctIndex,
    answer: item.options[item.correctIndex],
    evidence: item.evidence,
    explanation: `Hörbeleg: „${item.evidence}“`,
  }))),
});
