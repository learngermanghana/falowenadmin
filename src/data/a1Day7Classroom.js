import { getA1Days6To10UnderstandingChecks } from "./a1Days6To10Understanding.js";

// A1 Day 7 is the tutor-marked prices, pronouns and preferences lesson.
// The ten live questions come from its existing verified participation bank.
export const A1_DAY7_ASSIGNMENT = "A1-3";
export const A1_DAY7_PRODUCTS = Object.freeze([
  { icon:"📕", noun:"das Buch", pronoun:"es", price:20, plural:false, tone:"blue" },
  { icon:"💡", noun:"die Lampe", pronoun:"sie", price:15, plural:false, tone:"teal" },
  { icon:"🪑", noun:"der Stuhl", pronoun:"er", price:50, plural:false, tone:"violet" },
  { icon:"🚗", noun:"das Auto", pronoun:"es", price:5000, plural:false, tone:"blue" },
  { icon:"🍎", noun:"die Äpfel", pronoun:"sie", price:5, plural:true, tone:"teal" },
  { icon:"📚", noun:"die Bücher", pronoun:"sie", price:30, plural:true, tone:"violet" },
]);
export const A1_DAY7_COST_CHOICES = Object.freeze([
  {subject:"das Buch",answer:"kostet",sentence:"Das Buch kostet 20 Euro.",plural:false},
  {subject:"die Äpfel",answer:"kosten",sentence:"Die Äpfel kosten 5 Euro.",plural:true},
  {subject:"der Stuhl",answer:"kostet",sentence:"Der Stuhl kostet 50 Euro.",plural:false},
  {subject:"die Bücher",answer:"kosten",sentence:"Die Bücher kosten 30 Euro.",plural:true},
]);
export const A1_DAY7_PRONOUN_CHOICES = Object.freeze([
  {noun:"der Stuhl",answer:"er",sentence:"Er kostet 50 Euro."},
  {noun:"die Lampe",answer:"sie",sentence:"Sie kostet 15 Euro."},
  {noun:"das Buch",answer:"es",sentence:"Es kostet 20 Euro."},
  {noun:"das Auto",answer:"es",sentence:"Es kostet 5000 Euro."},
  {noun:"die Äpfel",answer:"sie",sentence:"Sie kosten 5 Euro."},
]);
export const A1_DAY7_PREFERENCES = Object.freeze([
  {label:"mögen + Nomen",sentence:"Ich mag Pizza.",note:"mag (nicht mögen) bei ich"},
  {label:"Verb + gern",sentence:"Ich esse gern Pizza.",note:"gern gehört zu einer Aktivität"},
  {label:"lieber = stärkerer Wunsch",sentence:"Ich trinke lieber Tee.",note:"lieber zeigt eine Vorliebe"},
]);
export const A1_DAY7_COMPARE = Object.freeze([
  {a:"Ich lese gern.",b:"Ich reise lieber.",question:"Was macht die Person lieber?",answer:"Sie reist lieber."},
  {a:"Ich spiele gern Fußball.",b:"Ich spiele lieber Basketball.",question:"Was spielt die Person lieber?",answer:"Sie spielt lieber Basketball."},
  {a:"Ich trinke gern Kaffee.",b:"Ich trinke lieber Tee.",question:"Was trinkt die Person lieber?",answer:"Sie trinkt lieber Tee."},
]);
export const A1_DAY7_FAMILY_WRITING = Object.freeze([
  {label:"Familienmitglieder",example:"Ich habe eine Schwester und einen Bruder."},
  {label:"Namen und Alter",example:"Meine Mutter heißt Ama und ist 48 Jahre alt."},
  {label:"Berufe",example:"Mein Vater ist Lehrer."},
  {label:"Hobbys",example:"Meine Schwester liest gern."},
  {label:"Wohnort",example:"Meine Familie wohnt in Accra."},
]);

const verified = getA1Days6To10UnderstandingChecks(A1_DAY7_ASSIGNMENT).slice(0, 10);
const pages = [
  ["intro","Einführung","Preise und Vorlieben",3],
  ["products","Preise","Wie viel kostet das?",4],
  ["cost-rule","Grammatik","kostet oder kosten?",5],
  ["price-dialogue","Einkaufen","Preise fragen und beantworten",5],
  ["pronouns","Personalpronomen","der → er · die → sie · das → es",4],
  ["pronoun-quiz","Pronomen-Quiz","Er, sie oder es?",5],
  ["mag-gern","Vorlieben","mag und gern unterscheiden",4],
  ["lieber","Vergleichen","Ich mache das lieber",4],
  ["family-writing","Schreiben","Familie beschreiben · Workbook Teil 2",5],
  ["live-quiz","Live-Quiz","Eine Frage pro Student",5],
];

export const A1_DAY7_CLASSROOM_STAGES = Object.freeze(pages.map(
  ([step,kicker,title,suggestedMinutes]) => Object.freeze({
    id:step==="intro" ? "intro" : step==="live-quiz" ? "grammar-check" : "a1-day7-"+step,
    type:step==="intro" ? "intro" : "a1-day7",
    step,kicker,title,suggestedMinutes,
    day7VisualIntro:step==="intro",
    items:step==="live-quiz"?verified:[],
    grammarTeaching:step==="cost-rule" || step==="pronouns",
    teacherPurpose:{
      student:"Lies die Aufgabe und antworte zuerst selbst in einem kurzen Satz.",
      teacher:"Erst den Versuch hören, dann die Erklärung zeigen. Das Workbook wird weiterhin über die bestehende Tutor-Bewertung abgegeben.",
    },
  }),
));
