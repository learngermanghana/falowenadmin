import { getA1Days16To20UnderstandingChecks } from "./a1Days16To20Understanding.js";

export const A1_DAY16_NEGATION_ASSIGNMENT = "A1-9";
export const A1_DAY16_NEGATION_WORKBOOK = "/campus/course/a1-day-16-food-and-negation-food-and-daily-life-workbook";

// This 12-page lesson belongs exclusively to A1-9. The separate A1-10 Day 16
// block, its assessment and its coursebook route must not be changed.
export const A1_DAY16_FOOD = Object.freeze([
  { word: "der Käse", en: "cheese", icon: "🧀", form: "keinen Käse", example: "Ich esse keinen Käse." },
  { word: "die Milch", en: "milk", icon: "🥛", form: "keine Milch", example: "Ich habe keine Milch." },
  { word: "das Brot", en: "bread", icon: "🍞", form: "kein Brot", example: "Ich kaufe kein Brot." },
  { word: "der Kaffee", en: "coffee", icon: "☕", form: "keinen Kaffee", example: "Ich trinke keinen Kaffee." },
  { word: "die Banane", en: "banana", icon: "🍌", form: "keine Banane", example: "Ich esse keine Banane." },
  { word: "der Apfel", en: "apple", icon: "🍎", form: "keinen Apfel", example: "Ich habe keinen Apfel." },
  { word: "das Wasser", en: "water", icon: "💧", form: "kein Wasser", example: "Ich trinke kein Wasser." },
  { word: "die Äpfel", en: "apples (plural)", icon: "🍏", form: "keine Äpfel", example: "Wir kaufen keine Äpfel." },
]);

export const A1_DAY16_NEGATION_CHOICES = Object.freeze([
  { lead: "Ich habe", blank: "___", tail: "Milch.", options: ["kein", "keine", "nicht"], correct: "keine", why: "die Milch ist feminin. Bei einem verneinten Nomen: keine Milch." },
  { lead: "Ich esse", blank: "___", tail: "Käse.", options: ["kein", "keinen", "nicht"], correct: "keinen", why: "der Käse steht als maskulines Akkusativobjekt: keinen Käse." },
  { lead: "Die Suppe ist", blank: "___", tail: "warm.", options: ["keine", "nicht", "keinen"], correct: "nicht", why: "warm ist ein Adjektiv. Es wird mit nicht verneint." },
  { lead: "Ich kaufe", blank: "___", tail: "Brot.", options: ["kein", "keine", "nicht"], correct: "kein", why: "das Brot ist neutral; im Akkusativ bleibt es kein Brot." },
  { lead: "Wir haben", blank: "___", tail: "Äpfel.", options: ["keinen", "keine", "nicht"], correct: "keine", why: "Mehrzahl: keine Äpfel." },
  { lead: "Ich koche heute", blank: "___", tail: ".", options: ["kein", "keine", "nicht"], correct: "nicht", why: "Hier wird die Handlung koche verneint: heute nicht." },
  { lead: "Der Kaffee ist", blank: "___", tail: "heiß.", options: ["keinen", "nicht", "kein"], correct: "nicht", why: "heiß ist ein Adjektiv; nicht heiß." },
  { lead: "Das ist", blank: "___", tail: "Apfel.", options: ["keinen", "kein", "nicht"], correct: "kein", why: "Nach ist steht der Nominativ: kein Apfel (der Apfel)." },
]);

export const A1_DAY16_NEGATION_FIXES = Object.freeze([
  { wrong: "Ich habe kein Milch.", right: "Ich habe keine Milch.", why: "Die Milch → keine Milch." },
  { wrong: "Ich esse kein Käse.", right: "Ich esse keinen Käse.", why: "Der Käse im Akkusativ → keinen Käse." },
  { wrong: "Die Suppe ist keine warm.", right: "Die Suppe ist nicht warm.", why: "Vor dem Adjektiv warm steht nicht." },
  { wrong: "Ich nicht koche heute.", right: "Ich koche heute nicht.", why: "Mit nicht wird die Handlung in diesem kurzen Satz am Ende verneint." },
  { wrong: "Wir kaufen nicht Äpfel.", right: "Wir kaufen keine Äpfel.", why: "Plural ohne bestimmten Artikel → keine Äpfel." },
]);

const teachingPages = [
  ["intro", "01 · Einstieg", "Essen und Verneinung", 3],
  ["food", "02 · Wortschatz", "Essen und Artikel erkennen", 5],
  ["positive-negative", "03 · Grammatik", "Positive und negative Sätze", 4],
  ["kein-or-nicht", "04 · Grammatik", "Wann kein? Wann nicht?", 5],
  ["kein-forms", "05 · Grammatik", "kein · keine · keinen", 5],
  ["case", "06 · Fälle", "Nominativ oder Akkusativ?", 5],
  ["nicht", "07 · Grammatik", "nicht bei Verben und Adjektiven", 5],
  ["sentence-builder", "08 · Üben", "Sätze mit kein und nicht bauen", 7],
];

export function buildA1Day16NegationStages({
  song, reading, workbookUrl = A1_DAY16_NEGATION_WORKBOOK,
} = {}) {
  if (song?.type !== "published-music") {
    throw new Error("A1-9 must retain its verified published music, without invented audio paths.");
  }
  if (!reading || !Array.isArray(reading.checks) || reading.checks.length < 3) {
    throw new Error("A1-9 requires its existing evidence-based Lesen activity.");
  }
  const questions = getA1Days16To20UnderstandingChecks(A1_DAY16_NEGATION_ASSIGNMENT);
  if (!Array.isArray(questions) || questions.length !== 11) {
    throw new Error("A1-9 requires ten individual questions and an independent exit check.");
  }

  return [
    ...teachingPages.map(([step, kicker, title, suggestedMinutes]) => ({
      id: "a1-day16-negation-" + step,
      type: "a1-day16-negation",
      step, kicker, title, suggestedMinutes,
      items: [{ label: title }],
    })),
    {
      id: "grammar-check", type: "check",
      kicker: "09 · Verstehen", title: "Eine Negationsfrage pro Student",
      items: questions.slice(0, 10), suggestedMinutes: 9,
      teacherPurpose: {
        student: "Antworte zuerst selbst und begründe, warum kein / keine / keinen oder nicht passt.",
        teacher: "Nutzt die vorhandene Studentenauswahl: eine Frage je Person; erst danach Modell und Feedback öffnen. Correct und Needs review bleiben im bestehenden System.",
      },
    },
    {
      id: "a1-day16-negation-corrections", type: "a1-day16-negation",
      step: "corrections", kicker: "10 · Fehler korrigieren",
      title: "Kein, keine, keinen oder nicht?", suggestedMinutes: 6,
      items: [{ label: "Fünf typische Fehler · erst korrigieren, dann aufdecken" }],
    },
    {
      id: "a1-day16-negation-music-reading", type: "a1-day16-negation",
      step: "music-reading", kicker: "11 · Falowen Music und Lesen",
      title: "Hören, Liedtext und Lesen", suggestedMinutes: 8,
      reading, hasMusic: true,
      items: [{ label: "Existing published A1-9 song and verified food-negation reading" }],
    },
    {
      id: "exit-check", type: "check", kicker: "12 · Abschluss",
      title: "Drei neue Sätze · ohne Hilfe", exitCheck: true,
      items: [questions[10]], workbookUrl, suggestedMinutes: 3,
      teacherPurpose: {
        student: "Wähle keine, keinen und nicht selbst. Zeige erst danach die Lösung.",
        teacher: "Nutze die vorhandene unbenotete Unterrichtsfrage; die separate A1-9 Course-Book-Aufgabe bleibt mit ihrem bestehenden Antwortschlüssel bewertet.",
      },
    },
  ];
}
