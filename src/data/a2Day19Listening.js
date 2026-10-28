// Teacher-approved Day 19 conversation. Reuses the uploaded script and key.
// Q2 explicitly describes Anna's question, without assuming her opinion.
// This is classroom practice, separate from the scored workbook recording.
export const A2_DAY19_AUDIO_KEY = 'a2/day-19/einkaufen-wo-und-wie.mp3';
export const A2_DAY19_TRANSCRIPT = Object.freeze([
  [
    "A",
    "Hallo Ben. Wo kaufst du eigentlich am liebsten ein?"
  ],
  [
    "B",
    "Hallo Anna. Also, für frisches Obst und Gemüse gehe ich samstags immer auf den Wochenmarkt."
  ],
  [
    "A",
    "Wirklich? Ist das nicht zu teuer?"
  ],
  [
    "B",
    "Nein, gar nicht. Die Qualität ist super und es schmeckt besser als im Supermarkt."
  ],
  [
    "A",
    "Und was ist mit Kleidung?"
  ],
  [
    "B",
    "Kleidung kaufe ich fast nur online. Das ist bequem, weil ich alles zu Hause anprobieren kann."
  ],
  [
    "A",
    "Verstehe. Ich gehe lieber in die Fußgängerzone und stöbere in kleinen Geschäften."
  ],
  [
    "B",
    "Das mache ich manchmal auch, aber online ist es schneller."
  ]
]);
const truthValues = Object.freeze(['Richtig', 'Falsch']);
const questions = [
  {
    "question": "Ben kauft Obst und Gemüse auf dem Wochenmarkt.",
    "evidence": "für frisches Obst und Gemüse gehe ich samstags immer auf den Wochenmarkt.",
    "answer": "Richtig"
  },
  {
    "question": "Anna fragt, ob der Wochenmarkt zu teuer ist.",
    "evidence": "Wirklich? Ist das nicht zu teuer?",
    "answer": "Richtig"
  },
  {
    "question": "Ben kauft seine Kleidung am liebsten in der Fußgängerzone.",
    "evidence": "Kleidung kaufe ich fast nur online.",
    "answer": "Falsch"
  },
  {
    "question": "Online-Shopping ist für Ben bequem, weil er zu Hause anprobieren kann.",
    "evidence": "Das ist bequem, weil ich alles zu Hause anprobieren kann.",
    "answer": "Richtig"
  },
  {
    "question": "Anna geht niemals in kleine Geschäfte in der Fußgängerzone.",
    "evidence": "Ich gehe lieber in die Fußgängerzone und stöbere in kleinen Geschäften.",
    "answer": "Falsch"
  }
];
export const A2_DAY19_LISTENING = Object.freeze({
  level: 'A2', day: 19, title: 'Einkaufen – wo und wie?',
  audioKey: A2_DAY19_AUDIO_KEY, transcript: A2_DAY19_TRANSCRIPT,
  suggestedMinutes: 6, previewWords: ['der Wochenmarkt', 'die Fußgängerzone', 'anprobieren'],
  questions: Object.freeze(questions.map(q => Object.freeze({
    prompt: q.question, answer: q.answer, evidence: q.evidence,
    options: truthValues, correctIndex: truthValues.indexOf(q.answer),
    hint: `Hörbeleg: „${q.evidence}“`, explanation: q.evidence,
  }))),
});
