import { getA1Days11To15UnderstandingChecks } from "./a1Days11To15Understanding.js";

// Day 15 / Kapitel 4.7: imperative first; Goethe A1 Teil 3 application.
// Briefly name Teil 1 and Teil 2 on page 1. Day 19 remains the full mock.
export const A1_DAY15_ASSIGNMENT = "A1-4.7";
export const A1_DAY15_WORKBOOK = "/campus/course/speaking-exams-intro-4-7";

export const A1_DAY15_SENTENCE_TASKS = Object.freeze({
  formal: [
    { words: ["bitte", "Sie", "Öffnen", "die Tür."], order: [2, 1, 0, 3], model: "Öffnen Sie bitte die Tür." },
    { words: ["den Stift.", "Geben", "bitte", "Sie", "mir"], order: [1, 3, 4, 2, 0], model: "Geben Sie mir bitte den Stift." },
    { words: ["Sie", "bitte", "das Buch.", "Zeigen"], order: [3, 0, 1, 2], model: "Zeigen Sie bitte das Buch." },
  ],
  separable: [
    { words: ["das Radio", "Machen", "Sie", "aus.", "bitte"], order: [1, 2, 4, 0, 3], model: "Machen Sie bitte das Radio aus." },
    { words: ["auf.", "Sie", "die Tür", "Machen", "bitte"], order: [3, 1, 4, 2, 0], model: "Machen Sie bitte die Tür auf." },
  ],
  koennen: [
    { words: ["bitte", "die Tür", "Sie", "schließen?", "Können"], order: [4, 2, 0, 1, 3], model: "Können Sie bitte die Tür schließen?" },
    { words: ["mir", "geben?", "den Stift", "Sie", "Können", "bitte"], order: [4, 3, 0, 5, 2, 1], model: "Können Sie mir bitte den Stift geben?" },
  ],
  koennten: [
    { words: ["Sie", "bitte", "Könnten", "das Fenster", "öffnen?"], order: [2, 0, 1, 3, 4], model: "Könnten Sie bitte das Fenster öffnen?" },
    { words: ["Sie", "das Buch", "bitte", "mir", "zeigen?", "Könnten"], order: [5, 0, 3, 2, 1, 4], model: "Könnten Sie mir bitte das Buch zeigen?" },
  ],
});

// Recognise meaningful German alternatives without relaxing the verb-position
// exercises. All Day 15 tasks use Verb + Sie at the start; the polite particle
// "bitte" may come after Sie or later in the clause, before the final
// verb/prefix or punctuated sentence-ending phrase.
export function isA1Day15SentenceOrderCorrect(item, selectedIndices) {
  if (!item || !Array.isArray(item.words) || !Array.isArray(item.order) ||
      !Array.isArray(selectedIndices) ||
      selectedIndices.length !== item.order.length ||
      new Set(selectedIndices).size !== selectedIndices.length) return false;

  const bitteIndex = item.words.findIndex(word => word.trim().toLowerCase() === "bitte");
  if (bitteIndex === -1) {
    return item.order.every((expected, position) => selectedIndices[position] === expected);
  }

  // Moving bitte must not mask a misplaced conjugated verb, subject,
  // object, infinitive, or separable prefix.
  const requiredCore = item.order.filter(index => index !== bitteIndex);
  const suppliedCore = selectedIndices.filter(index => index !== bitteIndex);
  if (requiredCore.length !== suppliedCore.length ||
      requiredCore.some((expected, position) => suppliedCore[position] !== expected)) return false;

  const bittePosition = selectedIndices.indexOf(bitteIndex);
  // In these exercises both the finite verb and Sie must precede bitte,
  // and punctuation belongs to the last phrase, so bitte cannot end a sentence.
  return bittePosition >= 2 && bittePosition < selectedIndices.length - 1;
}

export const A1_DAY15_REACTIONS = Object.freeze([
  { request: "Können Sie mir bitte den Stift geben?", response: "Ja, gern. Hier bitte.", tip: "Agree and hand over the object." },
  { request: "Machen Sie bitte das Radio aus.", response: "Natürlich, gern.", tip: "A short, relevant positive answer is enough." },
  { request: "Könnten Sie bitte das Fenster öffnen?", response: "Tut mir leid, das geht leider nicht.", tip: "A short polite refusal is also correct when appropriate." },
]);

export const A1_DAY15_MISTAKES = Object.freeze([
  { wrong: "Sie öffnen bitte die Tür.", right: "Öffnen Sie bitte die Tür.", why: "Imperativ mit Sie: Verb zuerst, dann Sie." },
  { wrong: "Können Sie bitte öffnen das Fenster?", right: "Können Sie bitte das Fenster öffnen?", why: "Nach können steht der Infinitiv ganz am Ende." },
  { wrong: "Machen Sie bitte aus das Radio.", right: "Machen Sie bitte das Radio aus.", why: "Im Imperativ wird ausmachen getrennt: machen ... aus." },
  { wrong: "Konnten Sie mir den Stift geben?", right: "Könnten Sie mir bitte den Stift geben?", why: "Könnten Sie ist eine höfliche Bitte; konnten Sie ist Vergangenheit." },
]);

const teaching = [
  ["exam-map", "01 · Prüfungsüberblick", "Goethe A1 · drei Teile", 3],
  ["imperative-intro", "02 · Grammatik", "Was ist ein Imperativ?", 4],
  ["imperative-forms", "03 · Grammatik", "Imperativ · du, ihr und Sie", 5],
  ["formal-imperative", "04 · Satzwerkstatt", "Imperativ mit Sie", 6],
  ["separable-imperative", "05 · Satzbau", "Trennbare Verben im Imperativ", 5],
  ["koennen-request", "06 · Höfliche Bitten", "Können Sie bitte ...?", 6],
  ["koennten-request", "07 · Höfliche Bitten", "Können Sie oder Könnten Sie?", 5],
  ["objects", "08 · Bildkarten", "Gegenstände und passende Verben", 5],
];

const purpose = {
  student: "Sage deinen Satz zuerst selbst. Zeige die mögliche Lösung erst nach dem Versuch.",
  teacher: "Kurze, klare Beispiele mit Sie üben; dann mit können und könnten höfliche Bitten bilden. Teil 1/2 nur kurz erwähnen. Keine zusätzliche benotete Abgabe.",
};

export function buildA1Day15ClassroomStages({ song, workbookUrl = A1_DAY15_WORKBOOK } = {}) {
  if (!song || song.type !== "published-music") {
    throw new Error("A1 Day 15 requires its approved published music stage; never invent an audio source.");
  }
  const checks = getA1Days11To15UnderstandingChecks(A1_DAY15_ASSIGNMENT);
  if (!Array.isArray(checks) || checks.length !== 11) throw new Error("Day 15 requires ten object checks and one independent exit card.");
  return [
    ...teaching.map(([step, kicker, title, suggestedMinutes]) => ({
      id: "a1-day15-" + step, type: "a1-day15", step, kicker, title, suggestedMinutes,
      items: [{ label: title, detail: "Guided imperative and Goethe A1 Teil 3 practice" }],
      teacherPurpose: purpose,
    })),
    {
      id: "grammar-check", type: "check", kicker: "09 · Teil 3 · Sprechen",
      title: "Eine Bildkarte pro Student · Bitte und Reaktion",
      teil3ObjectCards: true, items: checks.slice(0, 10), suggestedMinutes: 10,
      teacherPurpose: {
        student: "Sieh die Bildkarte. Bilde eine höfliche Bitte mit Imperativ oder Können Sie / Könnten Sie. Reagiere dann auf die Bitte.",
        teacher: "Studenten oben auswählen. Nur die Bildkarte zeigen, noch kein Verb oder Modell. Nach der Antwort Correct, Needs review, Skip oder Absent markieren.",
      },
    },
    {
      id: "a1-day15-reactions", type: "a1-day15", step: "reactions",
      kicker: "10 · Teil 3 · Reagieren", title: "Bitten beantworten und Fehler verbessern",
      suggestedMinutes: 6, items: [{ label: "Partnerreaktion und typische Fehler" }],
      teacherPurpose: purpose,
    },
    {
      ...song, id: "a1-day15-music", kicker: "11 · Falowen Music",
      title: "Ich bin bereit zu sprechen · Hören · Liedtext · Frage",
    },
    {
      id: "exit-check", type: "check", kicker: "12 · Teil 3 · Mini-Prüfung",
      title: "Neue Bildkarte · ohne Hilfe",
      teil3ObjectCards: true, exitCheck: true, items: [checks[10]],
      suggestedMinutes: 5, workbookUrl,
      teacherPurpose: {
        student: "Sage eine höfliche Bitte zur neuen Bildkarte und reagiere auf die Bitte deines Partners – ohne Hilfe.",
        teacher: "Nur die neue Fensterkarte projizieren. Eine Bitte und eine passende Reaktion abwarten; erst danach das Modell einblenden. Mit dem bestehenden Workbook fortfahren.",
      },
    },
  ];
}
