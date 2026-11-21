import { getA1Days1To5UnderstandingChecks } from "./a1Days1To5Understanding.js";

// Day 5 stays a self-practice consolidation lesson: der/die/das,
// predicative adjectives, personal introductions and W-questions only.
// The existing class-participation picker supplies its verified question bank.
export const A1_DAY5_ASSIGNMENT = "A1-1.3";
export const A1_DAY5_ARTICLES = Object.freeze([
  { noun:"Tisch", article:"der", color:"blue" },
  { noun:"Lampe", article:"die", color:"teal" },
  { noun:"Auto", article:"das", color:"violet" },
  { noun:"Baum", article:"der", color:"blue" },
  { noun:"Blume", article:"die", color:"teal" },
  { noun:"Haus", article:"das", color:"violet" },
]);
export const A1_DAY5_ADJECTIVE_PAIRS = Object.freeze([
  ["groß", "klein"], ["alt", "neu"], ["schön", "hässlich"],
]);
export const A1_DAY5_DESCRIPTIONS = Object.freeze([
  { subject:"Der Tisch", word:"groß", sentence:"Der Tisch ist groß." },
  { subject:"Die Lampe", word:"neu", sentence:"Die Lampe ist neu." },
  { subject:"Das Auto", word:"schnell", sentence:"Das Auto ist schnell." },
  { subject:"Das Haus", word:"klein", sentence:"Das Haus ist klein." },
]);
export const A1_DAY5_QUESTIONS = Object.freeze([
  { word:"Wie", purpose:"Name", question:"Wie heißt du?", answer:"Ich heiße Ama." },
  { word:"Wo", purpose:"Wohnort", question:"Wo wohnst du?", answer:"Ich wohne in Accra." },
  { word:"Woher", purpose:"Herkunft", question:"Woher kommst du?", answer:"Ich komme aus Ghana." },
  { word:"Wer", purpose:"Person", question:"Wer ist das?", answer:"Das ist meine Lehrerin." },
  { word:"Was", purpose:"Sache oder Tätigkeit", question:"Was machst du?", answer:"Ich lerne Deutsch." },
]);
export const A1_DAY5_WORD_ORDER = Object.freeze([
  { words:["wo", "du", "wohnst"], answer:"Wo wohnst du?", tip:"W-Wort + Verb + Person" },
  { words:["heißt", "wie", "du"], answer:"Wie heißt du?", tip:"W-Wort + Verb + Person" },
  { words:["kommst", "du", "woher"], answer:"Woher kommst du?", tip:"W-Wort + Verb + Person" },
]);
export const A1_DAY5_SELF_INTRO = Object.freeze([
  ["Name", "Ich heiße Lara."],
  ["Alter", "Ich bin 20 Jahre alt."],
  ["Herkunft", "Ich komme aus Ghana."],
  ["Wohnort", "Ich wohne in Hamburg."],
  ["Sprache", "Ich spreche Englisch und lerne Deutsch."],
  ["Freizeit", "In meiner Freizeit höre ich gern Musik."],
]);

const mainChecks = getA1Days1To5UnderstandingChecks(A1_DAY5_ASSIGNMENT).slice(0,10);

const pages = [
  ["intro", "Einführung", "Sich vorstellen, Artikel und W-Fragen", 3],
  ["articles", "Artikel", "der · die · das", 5],
  ["article-quiz", "Artikel-Quiz", "Welcher Artikel passt?", 4],
  ["adjectives", "Adjektive", "Gegensätze verstehen", 4],
  ["ist-adjective", "Satzbau", "Subjekt + ist + Adjektiv", 5],
  ["self-intro", "Sich vorstellen", "So stelle ich mich vor", 4],
  ["intro-builder", "Meine Vorstellung", "Eine kurze Vorstellung bauen", 5],
  ["w-questions", "W-Fragen", "Wie · Wo · Woher · Wer · Was", 5],
  ["word-order", "Fragesätze", "Fragen richtig ordnen", 4],
  ["live-quiz", "Verständnis prüfen", "Eine Frage pro Student", 5],
];

export const A1_DAY5_CLASSROOM_STAGES = Object.freeze(
  pages.map(([step,kicker,title,suggestedMinutes]) => Object.freeze({
    id:step==="intro" ? "intro" : step==="live-quiz" ? "grammar-check" : "a1-day5-"+step,
    type:step==="intro" ? "intro" : "a1-day5",
    day5VisualIntro:step==="intro",
    step,kicker,title,suggestedMinutes,
    items:step==="live-quiz" ? mainChecks : [],
    grammarTeaching:step==="articles" || step==="ist-adjective",
    teacherPurpose: {
      student:"Sieh dir das Beispiel an, antworte zuerst selbst und erkläre die Wahl mit einfachem Deutsch.",
      teacher:"Erst die eigene Schülerantwort hören, dann die Lösung zeigen. Die Übungsseiten sind nicht benotet.",
    },
  })),
);
