import supplied from './a2Day2ListeningQuestions.json' with { type: 'json' };
// Teacher-provided Hören answer sheet; this is not the graded workbook Hören.
// Cloudflare folder URL supplied: a2/dat-02/ (sic). The MP3 filename under
// that prefix could not be read from a private dashboard link. Confirm the
// exact object key before treating playback as verified.
export const A2_DAY2_AUDIO_KEY = 'a2/dat-02/personen-beschreiben.mp3';
export const A2_DAY2_LISTENING = Object.freeze({
  level: 'A2', day: 2, title: 'Personen beschreiben · Tom und Sarah',
  audioKey: A2_DAY2_AUDIO_KEY, transcript: Object.freeze([]),
  questions: Object.freeze(supplied.questions.map(item => Object.freeze({
    prompt: item.question,
    options: Object.freeze([...item.options]),
    correctIndex: item.correctIndex,
    answer: item.options[item.correctIndex],
    evidence: item.evidence,
    hint: 'Achte auf das Aussehen, die Kleidung und den Charakter.',
    explanation: `Hörbeleg: „${item.evidence}“`,
  }))),
  suggestedMinutes: 7,
  previewWords: ['die Haare', 'der Pullover', 'schüchtern', 'die Kollegin', 'die Jacke'],
  playbackNote: 'Lies die fünf Fragen vor dem Gespräch. Höre zweimal und überprüfe deine Antworten.',
});
