import fs from "node:fs";

const presenterPath = new URL("../src/utils/teachingPresenter.js", import.meta.url);
const dayPath = new URL("../src/data/a2WorkbookAlignedSlidesDays16To20.js", import.meta.url);

let source = fs.readFileSync(presenterPath, "utf8");

const day19Stages = `    ...(normalizedAssignmentId(slide) === "A2-7.19" ? [
      { id: "grammar-check", type: "question-reveal", kicker: "Grammatik-Check", title: "Korrigiere den Satz · oder / denn", items: slide.grammarCheckQuestions || [], questionModels: slide.grammarCheckModels || [], requiresQuestionModel: true, suggestedMinutes: 10 },
      { id: "vocabulary-retrieval", type: "question-reveal", kicker: "Wortschatz", title: "Wortschatz aktivieren", items: slide.vocabularyCheckQuestions || [], questionModels: slide.vocabularyCheckModels || [], requiresQuestionModel: true, suggestedMinutes: 7 },
      { id: "sentence-builder", type: "question-reveal", kicker: "Satzbau", title: "Baue den richtigen Satz", items: slide.sentenceBuilderQuestions || [], questionModels: slide.sentenceBuilderModels || [], requiresQuestionModel: true, suggestedMinutes: 8 },
      { id: "guided-action", type: "question-reveal", kicker: "Geführte Übung", title: "Entscheide und begründe", items: slide.guidedActionQuestions || [], questionModels: slide.guidedActionModels || [], requiresQuestionModel: true, suggestedMinutes: 8 },
      { id: "role-play", type: "question-reveal", kicker: "Rollenspiel", title: "Einkaufen im echten Leben", items: slide.rolePlayQuestions || [], questionModels: slide.rolePlayModels || [], requiresQuestionModel: true, suggestedMinutes: 10 },
    ] : []),
`;

if (!source.includes('id: "vocabulary-retrieval"')) {
  const stableAnchor = '  ];\n  if (Array.isArray(slide.grammarCheckQuestions)';
  if (!source.includes(stableAnchor)) throw new Error("Day 19 presenter stages array anchor missing");
  source = source.replace(stableAnchor, `${day19Stages}  ];\n  if (Array.isArray(slide.grammarCheckQuestions)`);
}
fs.writeFileSync(presenterPath, source);

let data = fs.readFileSync(dayPath, "utf8");
const anchor = '    wrapUpTaskDe: "Schreibe 5 Sätze über dein Einkaufsverhalten. Benutze einmal oder und zweimal denn.",';
if (!data.includes('vocabularyCheckQuestions: [')) {
  if (!data.includes(anchor)) throw new Error("Day 19 data anchor missing");
  const fields = `    grammarCheckQuestions: [
      "Ich kaufe die Jacke, denn sie zu billig ist.",
      "Möchtest du bar denn mit Karte bezahlen?",
      "Ich kaufe online, denn ist es bequemer.",
      "Kaufst du das rote Hemd denn das blaue Hemd?",
      "Ich gehe heute einkaufen oder ich brauche Lebensmittel.",
    ],
    grammarCheckModels: [
      { questionDe: "Ich kaufe die Jacke, denn sie zu billig ist.", modelAnswerDe: "Ich kaufe die Jacke, denn sie ist billig. Nach denn bleibt Subjekt + Verb." },
      { questionDe: "Möchtest du bar denn mit Karte bezahlen?", modelAnswerDe: "Möchtest du bar oder mit Karte bezahlen? oder verbindet Alternativen." },
      { questionDe: "Ich kaufe online, denn ist es bequemer.", modelAnswerDe: "Ich kaufe online, denn es ist bequemer. Nach denn steht das Subjekt vor dem Verb." },
      { questionDe: "Kaufst du das rote Hemd denn das blaue Hemd?", modelAnswerDe: "Kaufst du das rote Hemd oder das blaue Hemd? oder zeigt eine Auswahl." },
      { questionDe: "Ich gehe heute einkaufen oder ich brauche Lebensmittel.", modelAnswerDe: "Ich gehe heute einkaufen, denn ich brauche Lebensmittel. denn gibt einen Grund." },
    ],
    vocabularyCheckQuestions: [
      "Du bekommst 20 % Preisnachlass. Wie heißt das Wort?",
      "Du möchtest eine Ware zurückschicken. Wie heißt das Nomen?",
      "Du kaufst Produkte aus deiner Region. Welches Adjektiv passt?",
      "Du möchtest beweisen, dass du bezahlt hast. Was brauchst du?",
      "Du kaufst bewusst weniger Plastik und faire Produkte. Wie heißt dieses Thema?",
    ],
    vocabularyCheckModels: [
      { questionDe: "Du bekommst 20 % Preisnachlass. Wie heißt das Wort?", modelAnswerDe: "der Rabatt" },
      { questionDe: "Du möchtest eine Ware zurückschicken. Wie heißt das Nomen?", modelAnswerDe: "die Rücksendung" },
      { questionDe: "Du kaufst Produkte aus deiner Region. Welches Adjektiv passt?", modelAnswerDe: "regional" },
      { questionDe: "Du möchtest beweisen, dass du bezahlt hast. Was brauchst du?", modelAnswerDe: "den Kassenbon / die Quittung" },
      { questionDe: "Du kaufst bewusst weniger Plastik und faire Produkte. Wie heißt dieses Thema?", modelAnswerDe: "nachhaltiger Konsum" },
    ],
    sentenceBuilderQuestions: [
      "ich / online / kaufe / denn / bequem / es / ist",
      "bar / oder / möchtest / mit Karte / du / bezahlen",
      "ich / regionale Produkte / kaufe / denn / frisch / sie / sind",
      "das rote Hemd / oder / nimmst / das blaue Hemd / du",
    ],
    sentenceBuilderModels: [
      { questionDe: "ich / online / kaufe / denn / bequem / es / ist", modelAnswerDe: "Ich kaufe online, denn es ist bequem." },
      { questionDe: "bar / oder / möchtest / mit Karte / du / bezahlen", modelAnswerDe: "Möchtest du bar oder mit Karte bezahlen?" },
      { questionDe: "ich / regionale Produkte / kaufe / denn / frisch / sie / sind", modelAnswerDe: "Ich kaufe regionale Produkte, denn sie sind frisch." },
      { questionDe: "das rote Hemd / oder / nimmst / das blaue Hemd / du", modelAnswerDe: "Nimmst du das rote Hemd oder das blaue Hemd?" },
    ],
    guidedActionQuestions: [
      "Online oder im Geschäft? Entscheide dich und bilde einen Satz mit denn.",
      "Bar oder mit Karte? Entscheide dich und begründe mit denn.",
      "Neue oder gebrauchte Kleidung? Entscheide dich und begründe.",
      "Regionale oder importierte Produkte? Entscheide dich und begründe.",
    ],
    guidedActionModels: [
      { questionDe: "Online oder im Geschäft? Entscheide dich und bilde einen Satz mit denn.", modelAnswerDe: "Ich kaufe lieber im Geschäft, denn ich kann die Kleidung anprobieren." },
      { questionDe: "Bar oder mit Karte? Entscheide dich und begründe mit denn.", modelAnswerDe: "Ich bezahle lieber mit Karte, denn das ist praktisch." },
      { questionDe: "Neue oder gebrauchte Kleidung? Entscheide dich und begründe.", modelAnswerDe: "Ich kaufe manchmal gebrauchte Kleidung, denn das ist nachhaltiger." },
      { questionDe: "Regionale oder importierte Produkte? Entscheide dich und begründe.", modelAnswerDe: "Ich kaufe regionale Produkte, denn die Transportwege sind kürzer." },
    ],
    rolePlayQuestions: [
      "Du möchtest eine Jacke kaufen. Frage nach zwei Farben, entscheide dich und begründe deine Wahl mit denn.",
      "Du kaufst Möbel mit einem Freund. Gib zwei Möglichkeiten mit oder und erkläre deine Präferenz mit denn.",
      "Du bist Verkäufer/in. Frage: bar oder mit Karte? Der Kunde antwortet und gibt einen Grund mit denn.",
    ],
    rolePlayModels: [
      { questionDe: "Du möchtest eine Jacke kaufen. Frage nach zwei Farben, entscheide dich und begründe deine Wahl mit denn.", modelAnswerDe: "Haben Sie die Jacke in Schwarz oder Blau? Ich nehme die blaue Jacke, denn die Farbe gefällt mir besser." },
      { questionDe: "Du kaufst Möbel mit einem Freund. Gib zwei Möglichkeiten mit oder und erkläre deine Präferenz mit denn.", modelAnswerDe: "Sollen wir den runden oder den rechteckigen Tisch nehmen? Ich bevorzuge den runden Tisch, denn er passt besser ins Zimmer." },
      { questionDe: "Du bist Verkäufer/in. Frage: bar oder mit Karte? Der Kunde antwortet und gibt einen Grund mit denn.", modelAnswerDe: "Möchten Sie bar oder mit Karte bezahlen? – Mit Karte, denn ich habe nicht genug Bargeld dabei." },
    ],
${anchor}`;
  data = data.replace(anchor, fields);
}
fs.writeFileSync(dayPath, data);
console.log("A2 Day 19 presenter: original stages plus 5 interactive activity slides.");
