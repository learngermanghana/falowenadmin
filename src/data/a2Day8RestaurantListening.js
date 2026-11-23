import supplied from './a2Day8RestaurantQuestions.json' with { type: 'json' };

// Teacher-approved private R2 classroom listening, separate from the graded workbook Teil 4.
// The supplied answer-key quotes are not a verified full transcript of the MP3.
export const A2_DAY8_RESTAURANT_AUDIO_KEY = 'a2/day-08/im-restaurant-bestellen-und-reagieren.mp3';

export const A2_DAY8_RESTAURANT_LISTENING = Object.freeze({
  level: 'A2',
  day: 8,
  title: 'Im Restaurant – bestellen und reagieren · Hören',
  audioKey: A2_DAY8_RESTAURANT_AUDIO_KEY,
  suggestedMinutes: 7,
  transcript: Object.freeze([]),
  previewWords: ['die Vorspeise', 'das Hauptgericht', 'die Apfelschorle', 'zusammen bezahlen', 'die Rechnung'],
  playbackNote: 'Lest zuerst die fünf Aussagen. Hört das Restaurantgespräch zweimal. Entscheidet: Richtig oder Falsch. Lösungen erst danach besprechen.',
  questions: Object.freeze(supplied.questions.map(item => Object.freeze({
    prompt: item.question,
    options: Object.freeze(['Richtig', 'Falsch']),
    correctIndex: item.answer === 'Richtig' ? 0 : 1,
    answer: item.answer,
    evidence: item.evidence,
    hint: 'Höre auf die Bestellung, das Getränk, die Zahlungsart und den Rechnungsbetrag.',
    explanation: `Hörbeleg: „${item.evidence}“`,
  }))),
});
