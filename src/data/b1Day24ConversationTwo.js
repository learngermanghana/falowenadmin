// Teacher-authored conversation 2. This is the scored Day 24 Hören,
// not the separate Day 24 sustainability music introduction.
export const B1_DAY24_AUDIO_KEY = "b1/day-24/day-25.mp3";
const transcript = [
  "A: Hallo Lisa, hast du kurz Zeit? Ich sortiere gerade meine Kleidung aus.",
  "B: Klar, Jonas. Machst du wieder einen Flohmarktverkauf online?",
  "A: Nein, dieses Mal probiere ich etwas Neues aus. Ich gebe die alten Sachen in einen Altkontainer für Recycling.",
  "B: Das ist gut, aber weißt du eigentlich, was danach mit der Kleidung passiert?",
  "A: Ehrlich gesagt nicht genau. Ich dachte, sie wird direkt gespendet.",
  "B: Leitthemen in unserem Nachhaltigkeitskurs waren letztes Woche ganz anders. Ein großer Teil der Altkleider landet im Globalen Süden und zerstört dort die lokalen Textilmärkte.",
  "A: Oh, das wusste ich wirklich nicht. Ich dachte immer, das sei reine Wohltätigkeit.",
  "B: Leider ist das oft nur ein profitables Geschäft. Besser ist es, Kleidung länger zu tragen oder auf Tauschpartys zu gehen.",
  "A: Da hast du recht. Dann behalte ich die guten Hosen lieber oder frage Freunde, ob sie Interesse haben.",
  "B: Genau, bewusster Konsum fängt schon im Kleiderschrank an.",
];
const statements = [
  ["Jonas verkauft seine alten Kleider dieses Mal online auf einem Flohmarkt.",1,"Nein, dieses Mal probiere ich etwas Neues aus."],
  ["Jonas wirft seine Kleidung in einen Altkontainer.",0,"Ich gebe die alten Sachen in einen Altkontainer für Recycling."],
  ["Ein großer Teil der Altkleider zerstört laut Lisa lokale Märkte im Globalen Süden.",0,"Ein großer Teil der Altkleider landet im Globalen Süden und zerstört dort die lokalen Textilmärkte."],
  ["Jonas wusste von Anfang an genau, was mit der Altkleidung passiert.",1,"Ehrlich gesagt nicht genau. Ich dachte, sie wird direkt gespendet."],
  ["Lisa empfiehlt, Kleidung länger zu tragen oder Tauschpartys zu besuchen.",0,"Besser ist es, Kleidung länger zu tragen oder auf Tauschpartys zu gehen."],
];
const OPTIONS = Object.freeze(["A) Richtig","B) Falsch"]);
export const B1_DAY24_CONVERSATION_QUESTIONS = Object.freeze(statements.map(([prompt,correctIndex,evidence]) =>
  Object.freeze({prompt,options:OPTIONS,correctIndex,answer:OPTIONS[correctIndex],hint:"Achte auf die passende Aussage von Lisa oder Jonas.",explanation:evidence})
));
export const B1_DAY24_CONVERSATION_TWO = Object.freeze({
  level:"B1",day:24, title:"Konsum und Nachhaltigkeit · Gespräch 2 · Altkleider",
  audioKey:B1_DAY24_AUDIO_KEY,
  transcript:Object.freeze(transcript.map(line => Object.freeze([line.slice(0, 1), line.slice(3)]))),
  questions:B1_DAY24_CONVERSATION_QUESTIONS,
  suggestedMinutes:8,
  playbackNote:"Höre das Gespräch zweimal. Wähle A = Richtig oder B = Falsch.",
  previewWords:["die Altkleider","der Altkontainer","die Tauschparty","der Globale Süden"],
});
