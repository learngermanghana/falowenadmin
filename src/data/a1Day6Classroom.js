import { getA1Days6To10UnderstandingChecks } from "./a1Days6To10Understanding.js";

// A1-2.3 is a self-practice and group-discussion lesson, not tutor-marked.
// These classroom pages reuse the ten verified participation questions.
export const A1_DAY6_ASSIGNMENT = "A1-2.3";

export const A1_DAY6_FAMILY = Object.freeze([
  { article:"die", noun:"Mutter", english:"mother", example:"meine Mutter", tone:"teal" },
  { article:"der", noun:"Vater", english:"father", example:"mein Vater", tone:"blue" },
  { article:"der", noun:"Bruder", english:"brother", example:"mein Bruder", tone:"blue" },
  { article:"die", noun:"Schwester", english:"sister", example:"meine Schwester", tone:"teal" },
  { article:"die", noun:"Eltern", english:"parents", example:"meine Eltern", tone:"violet" },
  { article:"das", noun:"Kind", english:"child", example:"mein Kind", tone:"violet" },
]);

export const A1_DAY6_POSSESSIVE_QUIZ = Object.freeze([
  { noun:"Vater", answer:"mein", example:"mein Vater" },
  { noun:"Mutter", answer:"meine", example:"meine Mutter" },
  { noun:"Bruder", answer:"mein", example:"mein Bruder" },
  { noun:"Schwester", answer:"meine", example:"meine Schwester" },
  { noun:"Eltern", answer:"meine", example:"meine Eltern" },
  { noun:"Kind", answer:"mein", example:"mein Kind" },
]);

export const A1_DAY6_DISCUSSION_PROMPTS = Object.freeze([
  ["Name", "Ich heiße Sara."],
  ["Land", "Ich komme aus Ghana."],
  ["Alter", "Ich bin 25 Jahre alt."],
  ["Familie", "Ich habe einen Bruder und eine Schwester."],
  ["Familienmitglied", "Meine Mutter heißt Ama."],
  ["Sprachen", "Ich spreche Englisch und ein bisschen Deutsch."],
  ["Hobby", "Ich lese gern."],
  ["Zusatz", "Meine Familie wohnt in Accra."],
]);

export const A1_DAY6_LANGUAGES = Object.freeze([
  ["Deutsch","Ich spreche ein bisschen Deutsch."],
  ["Englisch","Ich spreche Englisch."],
  ["Französisch","Ich spreche Französisch."],
  ["Kiswahili","Ich spreche Kiswahili."],
]);

export const A1_DAY6_YES_NO_QUESTIONS = Object.freeze([
  { words:["du","sprichst","Deutsch"], statement:"Du sprichst Deutsch.", answer:"Sprichst du Deutsch?", explanation:"sprichst + du + Deutsch" },
  { words:["Fußball","du","spielst"], statement:"Du spielst Fußball.", answer:"Spielst du Fußball?", explanation:"spielst + du + Fußball" },
  { words:["Fußball","er","spielt"], statement:"Er spielt Fußball.", answer:"Spielt er Fußball?", explanation:"spielt + er + Fußball" },
  { words:["gern","sie","kocht"], statement:"Sie kocht gern.", answer:"Kocht sie gern?", explanation:"kocht + sie + gern" },
]);

export const A1_DAY6_HOBBIES = Object.freeze([
  { icon:"⚽", noun:"Fußball spielen", sentence:"Ich spiele gern Fußball." },
  { icon:"📖", noun:"lesen", sentence:"Ich lese gern." },
  { icon:"🍳", noun:"kochen", sentence:"Ich koche gern." },
  { icon:"🏊", noun:"schwimmen", sentence:"Ich schwimme gern." },
  { icon:"🎶", noun:"Musik hören", sentence:"Ich höre gern Musik." },
]);

const participationChecks = getA1Days6To10UnderstandingChecks(A1_DAY6_ASSIGNMENT).slice(0,10);

const pages = [
  ["intro","Einführung","Familie, Sprachen und Hobbys",3],
  ["family","Familie","Meine Familie",4],
  ["possessives","mein oder meine?","Was gehört zu wem?",5],
  ["family-writing","Meine Familie","6–8 Sätze über meine Familie",5],
  ["languages","Sprachen","Welche Sprachen sprichst du?",4],
  ["ein-bisschen","Ein bisschen","Ich spreche ein bisschen Deutsch",4],
  ["yes-no-rule","Ja/Nein-Fragen","Das konjugierte Verb steht zuerst",5],
  ["yes-no-quiz","Fragen bilden","Aus einer Aussage wird eine Frage",5],
  ["hobbies","Hobbys","Ich spiele gern Fußball",5],
  ["live-quiz","Live-Quiz","Eine Frage pro Student",5],
];

export const A1_DAY6_CLASSROOM_STAGES = Object.freeze(
  pages.map(([step,kicker,title,suggestedMinutes]) => Object.freeze({
    id:step==="intro" ? "intro" : step==="live-quiz" ? "grammar-check" : "a1-day6-"+step,
    type:step==="intro" ? "intro" : "a1-day6",
    step,kicker,title,suggestedMinutes,
    day6VisualIntro:step==="intro",
    items:step==="live-quiz" ? participationChecks : [],
    grammarTeaching:step==="possessives" || step==="yes-no-rule",
    teacherPurpose:{
      student:"Sprich laut und formuliere zuerst eine eigene kurze A1-Antwort.",
      teacher:"Erst die Antwort hören, dann die Erklärung zeigen. Day 6 ist Selbstübung ohne benotete Abgabe.",
    },
  })),
);
