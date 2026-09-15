import fs from "node:fs";

const presenterPath = new URL("../src/utils/teachingPresenter.js", import.meta.url);
let source = fs.readFileSync(presenterPath, "utf8");

if (!source.includes('normalizedAssignmentId(slide) === "A2-7.19"')) {
  const functionStart = source.indexOf("function buildPresenterV2Stages(");
  if (functionStart < 0) throw new Error("Day 19 Presenter V2 function missing");
  const returnIndex = source.indexOf("  return stages;", functionStart);
  if (returnIndex < 0) throw new Error("Day 19 Presenter V2 return missing");

  const extension = `
  if (normalizedAssignmentId(slide) === "A2-7.19") {
    const makeModels = (items) => items.map(([questionDe, modelAnswerDe]) => ({ questionDe, modelAnswerDe }));
    const vocab = [
      ["Du bekommst 20 % Preisnachlass. Wie heißt das Wort?", "der Rabatt"],
      ["Du möchtest eine Ware zurückschicken. Wie heißt das Nomen?", "die Rücksendung"],
      ["Du kaufst Produkte aus deiner Region. Welches Adjektiv passt?", "regional"],
      ["Du möchtest beweisen, dass du bezahlt hast. Was brauchst du?", "den Kassenbon / die Quittung"],
    ];
    const sentence = [
      ["ich / online / kaufe / denn / bequem / es / ist", "Ich kaufe online, denn es ist bequem."],
      ["bar / oder / möchtest / mit Karte / du / bezahlen", "Möchtest du bar oder mit Karte bezahlen?"],
      ["ich / regionale Produkte / kaufe / denn / frisch / sie / sind", "Ich kaufe regionale Produkte, denn sie sind frisch."],
    ];
    const guided = [
      ["Online oder im Geschäft? Entscheide dich und bilde einen Satz mit denn.", "Ich kaufe lieber im Geschäft, denn ich kann die Kleidung anprobieren."],
      ["Bar oder mit Karte? Entscheide dich und begründe mit denn.", "Ich bezahle lieber mit Karte, denn das ist praktisch."],
      ["Regionale oder importierte Produkte? Entscheide dich und begründe.", "Ich kaufe regionale Produkte, denn die Transportwege sind kürzer."],
    ];
    const role = [
      ["Du möchtest eine Jacke kaufen. Frage nach zwei Farben, entscheide dich und begründe deine Wahl mit denn.", "Haben Sie die Jacke in Schwarz oder Blau? Ich nehme die blaue Jacke, denn die Farbe gefällt mir besser."],
      ["Du kaufst Möbel mit einem Freund. Gib zwei Möglichkeiten mit oder und erkläre deine Präferenz mit denn.", "Sollen wir den runden oder den rechteckigen Tisch nehmen? Ich bevorzuge den runden Tisch, denn er passt besser ins Zimmer."],
      ["Du bist Verkäufer/in. Frage: bar oder mit Karte? Der Kunde antwortet und gibt einen Grund mit denn.", "Möchten Sie bar oder mit Karte bezahlen? – Mit Karte, denn ich habe nicht genug Bargeld dabei."],
    ];
    stages.push(
      { id: "vocabulary-retrieval", type: "question-reveal", kicker: "Wortschatz", title: "Wortschatz aktivieren", items: vocab.map(([q]) => q), questionModels: makeModels(vocab), requiresQuestionModel: true, suggestedMinutes: 7 },
      { id: "sentence-builder", type: "question-reveal", kicker: "Satzbau", title: "Baue den richtigen Satz", items: sentence.map(([q]) => q), questionModels: makeModels(sentence), requiresQuestionModel: true, suggestedMinutes: 8 },
      { id: "guided-action", type: "question-reveal", kicker: "Geführte Übung", title: "Entscheide und begründe", items: guided.map(([q]) => q), questionModels: makeModels(guided), requiresQuestionModel: true, suggestedMinutes: 8 },
      { id: "role-play", type: "question-reveal", kicker: "Rollenspiel", title: "Einkaufen im echten Leben", items: role.map(([q]) => q), questionModels: makeModels(role), requiresQuestionModel: true, suggestedMinutes: 10 },
    );
  }
`;
  source = source.slice(0, returnIndex) + extension + source.slice(returnIndex);
}

fs.writeFileSync(presenterPath, source);
console.log("A2 Day 19 actionable extension preserved.");
