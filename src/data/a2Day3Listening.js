import supplied from './a2Day3ListeningQuestions.json' with { type: 'json' };

// Separate, ungraded classroom recording. This exact object key must match R2;
// the provided Cloudflare dashboard link confirms the day-03 folder, not its filename.
export const A2_DAY3_AUDIO_KEY = 'a2/day-03/dinge-und-personen-vergleichen.mp3';
export const A2_DAY3_LISTENING = Object.freeze({
  level: 'A2',
  day: 3,
  title: 'Dinge und Personen vergleichen · Jonas wählt ein Smartphone',
  audioKey: A2_DAY3_AUDIO_KEY,
  transcript: Object.freeze([]),
  questions: Object.freeze(supplied.questions.map(item => Object.freeze({
    prompt: item.question,
    options: Object.freeze([...item.options]),
    correctIndex: item.correctIndex,
    answer: item.options[item.correctIndex],
    evidence: item.evidence,
    hint: 'Höre auf den Preis, die Fotos, den Akku und die Kaufentscheidung.',
    explanation: `Hörbeleg: „${item.evidence}“`,
  }))),
  suggestedMinutes: 7,
  previewWords: ['billiger als', 'wichtiger', 'der Akku', 'die Fotos', 'das Smartphone'],
  playbackNote: 'Lies zuerst die fünf Fragen. Höre das Gespräch zweimal und begründe die Antworten mit einer Hörstelle.',
});
