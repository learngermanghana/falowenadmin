// B1 Day 28 teacher-provided five-question classroom Hören, "Klimafreundlich leben".
// The teacher corrected the upload location: use the exact private
// B1 Day 28 recording. Keep the Day 27 recording independent.

// This is independent of graded workbook Teil 4 and does not alter its answer key.
export const B1_DAY28_AUDIO_KEY = "b1/day-28/klimafreundlich-leben.mp3";

export const B1_DAY28_LISTENING_QUESTIONS = Object.freeze([
  {
    prompt: "Wie reagierten die Zuhörer auf den Vortrag?",
    evidence: "Die Leute waren überrascht, wie viel wir im Alltag verändern können, ohne großen Aufwand.",
    options: [
      "Sie waren überrascht über die Möglichkeiten zur Veränderung.",
      "Sie fanden den Vortrag langweilig und uninteressant.",
      "Sie wussten bereits alles über den ökologischen Fußabdruck.",
    ],
    correctIndex: 0,
  },
  {
    prompt: "Welches erste Beispiel wurde zur CO2-Einsparung genannt?",
    evidence: "Den Fleischkonsum. Wenn man seltener Fleisch isst, spart das enorm viel CO2 ein.",
    options: [
      "Weniger oft mit dem Flugzeug in den Urlaub reisen.",
      "Weniger Fleisch essen, um CO2 einzusparen.",
      "Komplett vegan leben ohne Ausnahmen.",
    ],
    correctIndex: 1,
  },
  {
    prompt: "Was empfiehlt Jonas bezüglich des Transports?",
    evidence: "Wer öfter das Auto stehen lässt und stattdessen mit dem Fahrrad fährt oder die öffentlichen Verkehrsmittel nutzt, schont die Umwelt und die Gesundheit.",
    options: [
      "Ein neues Elektroauto kaufen.",
      "Niemals mehr öffentliche Verkehrsmittel nutzen.",
      "Öfter das Auto stehen lassen und Fahrrad fahren.",
    ],
    correctIndex: 2,
  },
  {
    prompt: "Wann fällt es Anna schwer, mit dem Rad zu fahren?",
    evidence: "Aber im Winter ist das oft schwer.",
    options: [
      "Im Frühling bei Regen.",
      "Im Winter ist das oft schwer.",
      "Am Wochenende in der Freizeit.",
    ],
    correctIndex: 1,
  },
  {
    prompt: "Welchen Haushalts-Tipp nennt Jonas noch?",
    evidence: "Man kann aber auch im Haushalt Energie sparen, zum Beispiel beim Heizen oder wenn man Elektrogeräte komplett ausschaltet statt im Standby-Modus zu lassen.",
    options: [
      "Elektrogeräte komplett ausschalten statt im Standby-Modus zu lassen.",
      "Alle Lampen durch Kerzen ersetzen.",
      "Die Heizung im Sommer komplett laufen lassen.",
    ],
    correctIndex: 0,
  },
].map((question) => Object.freeze({
  ...question,
  options: Object.freeze(question.options),
  answer: `${String.fromCharCode(65 + question.correctIndex)}) ${question.options[question.correctIndex]}`,
  hint: "Lies die drei Antworten, achte auf Details im Gespräch und begründe deine Wahl.",
  explanation: `Hörbeleg aus dem bereitgestellten Fragenblatt: „${question.evidence}“`,
})));

export const B1_DAY28_LISTENING = Object.freeze({
  level: "B1",
  day: 28,
  title: "Klimafreundlich leben · Hörverstehen",
  audioKey: B1_DAY28_AUDIO_KEY,
  transcript: Object.freeze([]),
  questions: B1_DAY28_LISTENING_QUESTIONS,
  suggestedMinutes: 8,
  playbackNote: "Lies die fünf Fragen vor dem Hören. Spiele die Aufnahme Klimafreundlich leben für B1 Tag 28 ab und wähle A, B oder C.",
  previewWords: Object.freeze(["der ökologische Fußabdruck", "Fleischkonsum", "öffentliche Verkehrsmittel", "im Winter", "Standby-Modus"]),
});
