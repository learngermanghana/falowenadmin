import { getA1Days1To5UnderstandingChecks } from "./a1Days1To5Understanding.js";

// Dedicated, projector-first Day 4 sequence, matching the bespoke Day 2/3 A1 lessons.
// The ten quiz prompts/answers are the existing, verified A1-2 understanding checks.
export const A1_DAY4_QUIZ_ANSWERS = Object.freeze([
  ["sechszehn", "sechzehn", "sechzig"],
  ["siebenzehn", "siebzig", "siebzehn"],
  ["fünfundzwanzig", "zwanzigfünf", "fünfzigzwei"],
  ["dreiundzwanzig", "zweiunddreißig", "dreißigzwei"],
  ["neunundachtzig", "neunzigacht", "achtundneunzig"],
  ["42", "24", "14"],
  ["49", "94", "40"],
  ["zweihundertzwanzigzwei", "zweihundertzweiundzwanzig", "zweihundertzwei"],
  ["fünfhundertneun", "fünfhundertneunzig", "fünfzigneun"],
  ["zweihundertvierzig", "zweitausendvierzig", "zweitausendvierhundert"],
]);

export const A1_DAY4_NUMBERS = Object.freeze({
  basics: ["null", "eins", "zwei", "drei", "vier", "fünf", "sechs", "sieben", "acht", "neun", "zehn"],
  teens: [
    [11, "elf"], [12, "zwölf"], [13, "dreizehn"], [14, "vierzehn"], [15, "fünfzehn"],
    [16, "sechzehn"], [17, "siebzehn"], [18, "achtzehn"], [19, "neunzehn"],
  ],
  tens: [[20, "zwanzig"], [30, "dreißig"], [40, "vierzig"], [50, "fünfzig"],
    [60, "sechzig"], [70, "siebzig"], [80, "achtzig"], [90, "neunzig"]],
  compound: [[21, "ein", "zwanzig"], [25, "fünf", "zwanzig"], [32, "zwei", "dreißig"],
    [49, "neun", "vierzig"], [98, "acht", "neunzig"]],
  hundreds: [[100, "hundert"], [222, "zweihundertzweiundzwanzig"],
    [509, "fünfhundertneun"], [555, "fünfhundertfünfundfünfzig"]],
  thousands: [[1020, "eintausendzwanzig"], [2040, "zweitausendvierzig"],
    [5509, "fünftausendfünfhundertneun"], [8553, "achttausendfünfhundertdreiundfünfzig"]],
  finalChallenge: [[16, "sechzehn"], [98, "achtundneunzig"],
    [555, "fünfhundertfünfundfünfzig"], [1020, "eintausendzwanzig"],
    [8553, "achttausendfünfhundertdreiundfünfzig"]],
});

const verifiedQuestions = getA1Days1To5UnderstandingChecks("A1-2").slice(0, 10);

const pages = [
  ["intro", "Einführung", "Zahlen, Telefonnummern und Adressen", 3],
  ["basics", "Zahlen 0–10", "Die Zahlen von null bis zehn", 4],
  ["teens", "Zahlen 11–19", "Die Zahlen von elf bis neunzehn", 4],
  ["tens", "Die Zehner", "Zwanzig, dreißig, vierzig …", 4],
  ["compound", "Zahlen 21–99", "Einer + und + Zehner", 6],
  ["hundreds", "Hunderter", "Zahlen bis 999", 4],
  ["thousands", "Tausender", "Tausenderzahlen verstehen", 5],
  ["contact", "Im Alltag", "Telefonnummern und Hausnummern", 4],
  ["quiz", "Zahlen-Quiz", "Eine Zahlenfrage pro Student", 6],
];

export const A1_DAY4_CLASSROOM_STAGES = Object.freeze(pages.map(([step, kicker, title, minutes]) =>
  Object.freeze({
    id: step === "quiz" ? "grammar-check" : "a1-day4-" + step,
    type: "a1-day4",
    step,
    kicker,
    title,
    suggestedMinutes: minutes,
    items: step === "quiz" ? verifiedQuestions : [],
    teacherPurpose: {
      student: "Zahl sehen, laut sagen und sicher als deutsches Zahlwort erkennen.",
      teacher: "Zuerst Schüler antworten lassen. Modell oder Multiple-Choice-Lösung erst danach zeigen.",
    },
  }),
));
