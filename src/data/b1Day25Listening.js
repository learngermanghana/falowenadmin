// The teacher's separate classroom Hören conversation is NOT the student's
// scored workbook Hören recording (b1/day-25/day-25.mp3). Never substitute
// or publish the workbook audio for this teaching-slide activity.
export const B1_DAY25_AUDIO_KEY = "b1/day-25/online-shopping-verbraucherservice.mp3";

// The revised delivery-problem recording has no approved published transcript.
// Never display the obsolete sustainable-shopping dialogue as its script.
export const B1_DAY25_TRANSCRIPT = Object.freeze([]);

const statements = [
  {
    prompt: "Der Kunde hat online ein neues Smartphone bestellt.",
    correctIndex: 0,
    hint: "Achte darauf, was der Kunde bestellt hat.",
    explanation: "Laut dem aktuellen Antwortschlüssel: Richtig.",
  },
  {
    prompt: "Das Paket wurde dem Kunden persönlich übergeben.",
    correctIndex: 1,
    hint: "Wird eine persönliche Übergabe ausdrücklich bestätigt?",
    explanation: "Laut dem aktuellen Antwortschlüssel: Falsch.",
  },
  {
    prompt: "Bei Online-Käufen in der EU gibt es laut dem Gespräch ein gesetzliches Widerrufsrecht von vierzehn Tagen.",
    correctIndex: 0,
    hint: "Achte auf die genannten vierzehn Tage und das Widerrufsrecht.",
    explanation: "Laut dem aktuellen Antwortschlüssel: Richtig.",
  },
  {
    prompt: "Die Nachforschung der Post dauert laut dem Mitarbeiter genau einen Monat.",
    correctIndex: 1,
    hint: "Unterscheide eine feste Dauer von einer ungefähren Zeitangabe.",
    explanation: "Laut dem aktuellen Antwortschlüssel: Falsch.",
  },
  {
    prompt: "Wenn das Paket nicht auftaucht, erhält der Kunde sein Geld zurück.",
    correctIndex: 0,
    hint: "Achte darauf, welche Lösung für ein dauerhaft fehlendes Paket genannt wird.",
    explanation: "Laut dem aktuellen Antwortschlüssel: Richtig.",
  },
];

const OPTIONS = Object.freeze(["A) Richtig", "B) Falsch"]);

export const B1_DAY25_LISTENING_QUESTIONS = Object.freeze(statements.map((item) => Object.freeze({
  prompt: item.prompt,
  options: OPTIONS,
  correctIndex: item.correctIndex,
  answer: OPTIONS[item.correctIndex],
  hint: item.hint,
  explanation: item.explanation,
})));

export const B1_DAY25_LISTENING = Object.freeze({
  level: "B1",
  day: 25,
  title: "Online einkaufen · Lieferproblem (Richtig oder Falsch)",
  audioKey: B1_DAY25_AUDIO_KEY,
  transcript: B1_DAY25_TRANSCRIPT,
  questions: B1_DAY25_LISTENING_QUESTIONS,
  suggestedMinutes: 9,
  playbackNote: "Lies zuerst die fünf Aussagen. Höre das Gespräch zweimal. Wähle A = Richtig oder B = Falsch.",
  previewWords: ["das Paket", "die Nachforschung", "das Widerrufsrecht"],
});
