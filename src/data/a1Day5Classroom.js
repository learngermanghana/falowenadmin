// Day 5 stays a self-practice consolidation lesson: der/die/das,
// predicative adjectives, personal introductions and W-questions only.
// Classroom examples mirror the independent workbook; no live diagnostic quiz.
export const A1_DAY5_ASSIGNMENT = "A1-1.3";
export const A1_DAY5_ARTICLES = Object.freeze([
  { noun:"Tisch", article:"der", color:"blue" },
  { noun:"Auto", article:"das", color:"violet" },
  { noun:"Lampe", article:"die", color:"teal" },
  { noun:"Apfel", article:"der", color:"blue" },
  { noun:"Buch", article:"das", color:"violet" },
]);
export const A1_DAY5_ADJECTIVE_PAIRS = Object.freeze([
  ["groß", "klein"], ["alt", "neu"], ["lang", "kurz"], ["schön", "hässlich"],
  ["heiß", "kalt"], ["schnell", "langsam"], ["laut", "leise"], ["teuer", "billig"],
  ["glücklich", "traurig"], ["sauber", "schmutzig"],
]);
export const A1_DAY5_DESCRIPTIONS = Object.freeze([
  { subject:"Der Baum", word:"groß", sentence:"Der Baum ist groß.", words:["groß","ist","der Baum"] },
  { subject:"Das Haus", word:"klein", sentence:"Das Haus ist klein.", words:["klein","das Haus","ist"] },
  { subject:"Die Blume", word:"schön", sentence:"Die Blume ist schön.", words:["ist","schön","die Blume"] },
]);
export const A1_DAY5_QUESTIONS = Object.freeze([
  { word:"Wie", purpose:"Name", question:"Wie heißt du?", answer:"Ich heiße Ama." },
  { word:"Wo", purpose:"Wohnort", question:"Wo wohnst du?", answer:"Ich wohne in Accra." },
  { word:"Woher", purpose:"Herkunft", question:"Woher kommst du?", answer:"Ich komme aus Ghana." },
  { word:"Wer", purpose:"Person", question:"Wer ist das?", answer:"Das ist meine Lehrerin." },
  { word:"Was", purpose:"Sache oder Tätigkeit", question:"Was machst du?", answer:"Ich lerne Deutsch." },
]);
export const A1_DAY5_WORD_ORDER = Object.freeze([
  { words:["heiße", "ich", "Anna"], answer:"Ich heiße Anna.", tip:"Aussage: Subjekt + Verb + Rest", kind:"Aussage" },
  { words:["kommen", "woher", "Sie"], answer:"Woher kommen Sie?", tip:"W-Frage: W-Wort + Verb + Subjekt", kind:"W-Frage" },
  { words:["bin", "ich", "Jahre alt", "25"], answer:"Ich bin 25 Jahre alt.", tip:"Aussage: Subjekt + Verb + Rest", kind:"Aussage" },
  { words:["aus", "komme", "ich", "Deutschland"], answer:"Ich komme aus Deutschland.", tip:"Aussage: Subjekt + Verb + Rest", kind:"Aussage" },
  { words:["ist", "meine", "Telefonnummer", "123456789"], answer:"Meine Telefonnummer ist 123456789.", tip:"Aussage: Subjekt + Verb + Rest", kind:"Aussage" },
  { words:["Entschuldigung", "heißen", "Sie", "wie"], answer:"Entschuldigung, wie heißen Sie?", tip:"W-Frage: W-Wort + Verb + Subjekt", kind:"W-Frage" },
  { words:["wie", "dir", "es", "geht"], answer:"Wie geht es dir?", tip:"W-Frage: W-Wort + Verb + Subjekt + Rest", kind:"W-Frage" },
  { words:["wie", "Ihnen", "es", "geht"], answer:"Wie geht es Ihnen?", tip:"W-Frage: W-Wort + Verb + Subjekt + Rest", kind:"W-Frage" },
  { words:["mir", "gut", "es", "geht"], answer:"Es geht mir gut.", alternative:"Mir geht es gut.", tip:"Aussage: Das konjugierte Verb steht an Position 2.", kind:"Aussage" },
  { words:["geht", "mir", "gut", "es"], answer:"Mir geht es gut.", alternative:"Es geht mir gut.", tip:"Aussage: Das konjugierte Verb steht an Position 2.", kind:"Aussage" },
  { words:["du", "wohnst", "wo"], answer:"Wo wohnst du?", tip:"W-Frage: W-Wort + Verb + Subjekt", kind:"W-Frage" },
]);
export const A1_DAY5_SELF_INTRO = Object.freeze([
  ["Name", "Ich heiße Lara."],
  ["Alter", "Ich bin 20 Jahre alt."],
  ["Herkunft", "Ich komme aus Ghana."],
  ["Wohnort", "Ich wohne in Hamburg."],
  ["Sprache", "Ich spreche Englisch und lerne Deutsch."],
  ["Freizeit", "In meiner Freizeit höre ich gern Musik."],
]);

export const A1_DAY5_PERSONAL_INFO = Object.freeze([
  ["Familienname","Surname / family name","Mein Familienname ist …","My surname is …","Wie ist dein Familienname?","Mein Familienname ist Müller."],
  ["Vorname","First name","Mein Vorname ist …","My first name is …","Wie ist dein Vorname?","Mein Vorname ist Anna."],
  ["Herkunft","Country of origin","Ich komme aus …","I come from …","Woher kommst du?","Ich komme aus Ghana."],
  ["Geburtsort","Place of birth","Ich bin in … geboren.","I was born in …","Wo bist du geboren?","Ich bin in Accra geboren."],
  ["Adresse","Address","Meine Adresse ist …","My address is …","Wie ist deine Adresse?","Meine Adresse ist Gartenstraße 10."],
  ["Postleitzahl","Postal code","Meine Postleitzahl ist …","My postal code is …","Wie ist deine Postleitzahl?","Meine Postleitzahl ist 10115."],
  ["Telefonnummer","Telephone number","Meine Telefonnummer ist …","My telephone number is …","Wie ist deine Telefonnummer?","Meine Telefonnummer ist 123456789."],
  ["Familienstand","Marital status","Ich bin ledig / verheiratet / geschieden / verwitwet.","I am single / married / divorced / widowed.","Wie ist dein Familienstand?","Ich bin ledig."],
  ["Kinder","Children","Ich habe … Kinder. / Ich habe keine Kinder.","I have … children. / I have no children.","Hast du Kinder?","Ich habe keine Kinder."],
  ["Alter","Age","Ich bin … Jahre alt.","I am … years old.","Wie alt bist du?","Ich bin 25 Jahre alt."],
]);

const pages = [
  ["intro", "Einführung", "Sich vorstellen, Artikel und W-Fragen", 3],
  ["articles", "Artikel", "der · die · das", 5],
  ["article-quiz", "Artikel-Quiz", "Welcher Artikel passt?", 4],
  ["adjectives", "Adjektive", "Gegensätze verstehen", 4],
  ["self-intro", "Persönliche Informationen", "English meaning and German sentence starters", 7],
  ["intro-builder", "Sprechen", "Fragen und Antworten", 8],
  ["w-questions", "W-Fragen", "Wie · Wo · Woher · Wer · Was", 5],
  ["word-order", "Teil 5 · Satzbau", "Ordne die Wörter – 11 Workbook-Aufgaben", 12],
];

export const A1_DAY5_CLASSROOM_STAGES = Object.freeze(
  pages.map(([step,kicker,title,suggestedMinutes]) => Object.freeze({
    id:step==="intro" ? "intro" : "a1-day5-"+step,
    type:step==="intro" ? "intro" : "a1-day5",
    day5VisualIntro:step==="intro",
    step,kicker,title,suggestedMinutes,
    items:[],
    grammarTeaching:step==="articles",
    teacherPurpose: {
      student:"Sieh dir das Beispiel an, antworte zuerst selbst und erkläre die Wahl mit einfachem Deutsch.",
      teacher:"Erst die eigene Schülerantwort hören, dann die Lösung zeigen. Die Übungsseiten sind nicht benotet.",
    },
  })),
);
