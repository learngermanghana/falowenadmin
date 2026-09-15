import fs from "node:fs";

const presenterPath = new URL("../src/utils/teachingPresenter.js", import.meta.url);
const day19Path = new URL("../src/data/a2WorkbookAlignedSlidesDays16To20.js", import.meta.url);

let source = fs.readFileSync(presenterPath, "utf8");

const bankSource = `
const A2_ACTIONABLE_PRACTICE = {
  "A2-7.20": {
    grammar: [
      ["Korrigiere: Ich möchte die Schuhe umtauschen, weil sie sind zu klein.", "Ich möchte die Schuhe umtauschen, weil sie zu klein sind."],
      ["Korrigiere: Ich reklamiere, denn die Ware kaputt ist.", "Ich reklamiere, denn die Ware ist kaputt."],
      ["Formuliere höflich: Geben Sie mir mein Geld zurück!", "Könnten Sie mir bitte mein Geld zurückgeben? / Ich hätte gern eine Rückerstattung."],
    ],
    sentence: [
      ["weil / die Jacke / zu groß / ist / ich / sie / umtauschen / möchte", "Ich möchte die Jacke umtauschen, weil sie zu groß ist."],
      ["ich / reklamiere / denn / der Reißverschluss / ist / kaputt", "Ich reklamiere, denn der Reißverschluss ist kaputt."],
      ["könnten / Sie / mir / bitte / eine neue Ware / schicken", "Könnten Sie mir bitte eine neue Ware schicken?"],
    ],
    role: [
      ["Du hast gestern Kopfhörer gekauft. Sie funktionieren nicht. Reklamiere höflich und bitte um eine Lösung.", "Guten Tag. Ich möchte die Kopfhörer reklamieren, weil sie nicht funktionieren. Könnten Sie sie bitte umtauschen?"],
      ["Ein Pullover ist zu klein. Erkläre Problem + Grund + gewünschte Lösung.", "Der Pullover ist zu klein. Ich möchte ihn umtauschen, weil er mir nicht passt. Könnte ich bitte eine größere Größe bekommen?"],
      ["Du hast online bestellt und die falsche Ware bekommen. Telefoniere mit dem Kundenservice.", "Ich habe die falsche Ware bekommen. Könnten Sie mir bitte den richtigen Artikel schicken?"],
    ],
  },
  "A2-8.21": {
    grammar: [
      ["Korrigiere: Wenn das Wetter gut ist, wir gehen in den Park.", "Wenn das Wetter gut ist, gehen wir in den Park."],
      ["Korrigiere: Ich weiß nicht, ob meine Freunde haben Zeit.", "Ich weiß nicht, ob meine Freunde Zeit haben."],
      ["Was passt: wenn, falls oder ob? Ich weiß noch nicht, ___ Anna am Samstag kommt.", "ob"],
    ],
    sentence: [
      ["wenn / das Wetter / gut / ist / machen / wir / ein Picknick", "Wenn das Wetter gut ist, machen wir ein Picknick."],
      ["falls / es / regnet / gehen / wir / ins Kino", "Falls es regnet, gehen wir ins Kino."],
      ["ich / weiß / nicht / ob / Paul / Zeit / hat", "Ich weiß nicht, ob Paul Zeit hat."],
    ],
    role: [
      ["Plane Samstag mit einem Freund. Gib einen Plan und eine Alternative für schlechtes Wetter.", "Wenn das Wetter gut ist, gehen wir in den Park. Falls es regnet, gehen wir ins Kino."],
      ["Du bist noch unsicher, ob dein Freund Zeit hat. Frage indirekt und schlage danach etwas vor.", "Ich möchte wissen, ob du am Samstag Zeit hast. Wenn du Zeit hast, können wir uns treffen."],
      ["Lade jemanden fürs Wochenende ein und nenne Plan, Treffpunkt und Plan B.", "Wir treffen uns am Samstag am Bahnhof. Wenn das Wetter gut ist, machen wir einen Ausflug; falls es regnet, besuchen wir ein Museum."],
    ],
  },
  "A2-8.22": {
    grammar: [
      ["Korrigiere: Am Dienstag ich arbeite bis 17 Uhr.", "Am Dienstag arbeite ich bis 17 Uhr."],
      ["Korrigiere: Morgen ich treffe meine Freundin.", "Morgen treffe ich meine Freundin."],
      ["Korrigiere: Um 18 Uhr muss ich gehen zum Deutschkurs.", "Um 18 Uhr muss ich zum Deutschkurs gehen."],
    ],
    sentence: [
      ["am Mittwoch / ich / einen Termin / habe", "Am Mittwoch habe ich einen Termin."],
      ["morgen / ich / meine Freundin / treffe", "Morgen treffe ich meine Freundin."],
      ["am Freitag / ich / nicht / kommen / kann", "Am Freitag kann ich nicht kommen."],
    ],
    role: [
      ["Vergleiche deine Termine mit einem Freund und findet einen freien Abend.", "Am Mittwoch kann ich nicht, aber am Freitag habe ich Zeit. Passt dir Freitagabend?"],
      ["Lade jemanden zum Mittagessen ein. Nenne Tag, Uhrzeit und Ort.", "Möchtest du am Freitag um 12 Uhr mit mir zu Mittag essen? Wir treffen uns im Café."],
      ["Erkläre zwei Pflichten und eine freie Zeit in deiner Woche.", "Am Montag muss ich arbeiten und am Dienstag muss ich zum Arzt. Am Freitagabend habe ich Zeit."],
    ],
  },
  "A2-9.23": {
    grammar: [
      ["Korrigiere: Ich fahre mit der Bus zur Arbeit.", "Ich fahre mit dem Bus zur Arbeit."],
      ["Korrigiere: Morgens gehe ich zu die Schule.", "Morgens gehe ich zur Schule."],
      ["Was passt: nach oder zu? Ich fahre ___ Berlin.", "nach Berlin"],
    ],
    sentence: [
      ["ich / mit dem Bus / zur Arbeit / fahre", "Ich fahre mit dem Bus zur Arbeit."],
      ["sie / mit der Bahn / nach Berlin / fährt", "Sie fährt mit der Bahn nach Berlin."],
      ["wir / zu Fuß / zur Schule / gehen", "Wir gehen zu Fuß zur Schule."],
    ],
    role: [
      ["Erkläre einem neuen Kollegen deinen Arbeitsweg: Verkehrsmittel, Dauer und Ziel.", "Ich fahre mit dem Bus zur Arbeit. Die Fahrt dauert ungefähr 30 Minuten."],
      ["Du möchtest umweltfreundlicher fahren. Vergleiche Auto und öffentliche Verkehrsmittel.", "Ich fahre lieber mit der Bahn, weil sie umweltfreundlicher ist."],
      ["Du willst ein Auto kaufen. Erkläre dem Händler, wofür du es brauchst und stelle zwei Fragen.", "Ich brauche das Auto für meinen Arbeitsweg. Wie viel kostet es? Wie hoch ist der Verbrauch?"],
    ],
  },
  "A2-9.24": {
    grammar: [
      ["Korrigiere: Im Sommer fahre ich zu Spanien.", "Im Sommer fahre ich nach Spanien."],
      ["Korrigiere: Wir fahren nach die Schweiz.", "Wir fahren in die Schweiz."],
      ["Formuliere einen Urlaubsplan mit möchte: nächstes Jahr / Italien / reisen", "Nächstes Jahr möchte ich nach Italien reisen."],
    ],
    sentence: [
      ["im Sommer / wir / nach Ghana / fliegen", "Im Sommer fliegen wir nach Ghana."],
      ["ich / möchte / ans Meer / fahren", "Ich möchte ans Meer fahren."],
      ["wir / werden / in einem Hotel / übernachten", "Wir werden in einem Hotel übernachten."],
    ],
    role: [
      ["Plane einen Urlaub: Reiseziel, Verkehrsmittel, Unterkunft und zwei Aktivitäten.", "Ich möchte nach Italien reisen. Wir fliegen und übernachten in einem Hotel. Dort möchte ich Rom besuchen und italienisch essen."],
      ["Du planst mit einem Freund. Macht zwei Vorschläge und entscheidet euch für ein Ziel.", "Wollen wir nach Spanien oder in die Schweiz fahren? Ich würde Spanien wählen, weil ich ans Meer möchte."],
      ["Erkläre, was du vor der Reise organisieren musst.", "Vor der Reise muss ich das Hotel buchen, Tickets kaufen und meinen Koffer packen."],
    ],
  },
  "A2-9.25": {
    grammar: [
      ["Korrigiere: Morgens ich stehe um 7 Uhr auf.", "Morgens stehe ich um 7 Uhr auf."],
      ["Korrigiere: Ich aufstehe jeden Tag um sechs Uhr.", "Ich stehe jeden Tag um sechs Uhr auf."],
      ["Korrigiere: Danach ich frühstücke.", "Danach frühstücke ich."],
    ],
    sentence: [
      ["morgens / ich / um 7 Uhr / aufstehe", "Morgens stehe ich um 7 Uhr auf."],
      ["danach / ich / zur Arbeit / fahre", "Danach fahre ich zur Arbeit."],
      ["abends / ich / fernsehe", "Abends sehe ich fern."],
    ],
    role: [
      ["Beschreibe deinen Morgen von Aufstehen bis Arbeit/Schule mit mindestens drei Schritten.", "Morgens stehe ich um 7 Uhr auf. Dann dusche ich. Danach frühstücke ich und fahre zur Arbeit."],
      ["Vergleiche deinen Tagesablauf unter der Woche mit dem Wochenende.", "Unter der Woche stehe ich früh auf. Am Wochenende stehe ich später auf und treffe Freunde."],
      ["Erzähle einem Freund deine Abendroutine und frage anschließend nach seiner Routine.", "Abends koche ich, mache meine Hausaufgaben und sehe fern. Was machst du normalerweise am Abend?"],
    ],
  },
};
`;

if (!source.includes("const A2_ACTIONABLE_PRACTICE =")) {
  const functionAnchor = "function buildPresenterV2Stages(";
  const index = source.indexOf(functionAnchor);
  if (index < 0) throw new Error("A2 actionable practice Presenter V2 function missing");
  source = source.slice(0, index) + bankSource + "\n" + source.slice(index);
}

const extraStages = `
  const actionable = A2_ACTIONABLE_PRACTICE[normalizedAssignmentId(slide)];
  if (actionable) {
    const pairModels = (pairs) => pairs.map(([questionDe, modelAnswerDe]) => ({ questionDe, modelAnswerDe }));
    const phraseItems = (Array.isArray(slide.keyPhrasesDe) ? slide.keyPhrasesDe : []).slice(0, 4).map((phrase) => \`Baue einen neuen Satz mit diesem Redemittel: “\${phrase}”\`);
    const phraseModels = phraseItems.map((questionDe, index) => ({ questionDe, modelAnswerDe: slide.keyPhrasesDe[index] }));
    stages.push(
      { id: "grammar-check", type: "question-reveal", kicker: "Grammatik-Check", title: "Finde und korrigiere den Fehler", items: actionable.grammar.map(([question]) => question), questionModels: pairModels(actionable.grammar), requiresQuestionModel: true, suggestedMinutes: 9 },
      { id: "vocabulary-retrieval", type: "question-reveal", kicker: "Redemittel", title: "Aktiviere die Sprache", items: phraseItems, questionModels: phraseModels, requiresQuestionModel: true, suggestedMinutes: 7 },
      { id: "sentence-builder", type: "question-reveal", kicker: "Satzbau", title: "Baue den richtigen Satz", items: actionable.sentence.map(([question]) => question), questionModels: pairModels(actionable.sentence), requiresQuestionModel: true, suggestedMinutes: 8 },
      { id: "guided-action", type: "question-reveal", kicker: "Thema + Grammatik", title: "Antworte zum Thema", items: Array.isArray(slide.studentQuestionsDe) ? slide.studentQuestionsDe : [], questionModels: Array.isArray(slide.speakingModels) ? slide.speakingModels : [], requiresQuestionModel: true, suggestedMinutes: 9 },
      { id: "role-play", type: "question-reveal", kicker: "Transfer", title: "Nutze die Sprache im echten Leben", items: actionable.role.map(([question]) => question), questionModels: pairModels(actionable.role), requiresQuestionModel: true, suggestedMinutes: 10 },
    );
  }`;

if (!source.includes("const actionable = A2_ACTIONABLE_PRACTICE")) {
  const functionStart = source.indexOf("function buildPresenterV2Stages(");
  if (functionStart < 0) throw new Error("A2 Presenter V2 function missing");
  const returnIndex = source.indexOf("  return stages;", functionStart);
  if (returnIndex < 0) throw new Error("A2 Presenter V2 return missing");
  source = source.slice(0, returnIndex) + extraStages + "\n" + source.slice(returnIndex);
}

// Preserve the already-working Day 19 extension. It remains data-backed because it
// was released first; Days 20–25 use the reusable practice bank above.
if (!source.includes('id: "vocabulary-retrieval"') || !source.includes('normalizedAssignmentId(slide) === "A2-7.19"')) {
  // No-op: the current production source already contains the Day 19 extension after
  // this patch has run once. Keeping this guard prevents a second brittle insertion.
}

fs.writeFileSync(presenterPath, source);

// Keep Day 19's data patch idempotent for clean Vercel checkouts.
let data = fs.readFileSync(day19Path, "utf8");
const anchor = '    wrapUpTaskDe: "Schreibe 5 Sätze über dein Einkaufsverhalten. Benutze einmal oder und zweimal denn.",';
const day19Index = data.indexOf('assignmentId: "A2-7.19"');
const day19AnchorIndex = day19Index >= 0 ? data.indexOf(anchor, day19Index) : -1;
const day19Block = day19Index >= 0 && day19AnchorIndex >= 0 ? data.slice(day19Index, day19AnchorIndex + anchor.length) : "";
if (!day19Block.includes('grammarCheckQuestions: [')) {
  if (day19Index < 0 || day19AnchorIndex < 0) throw new Error("Day 19 data anchor missing");
  const fields = `    grammarCheckQuestions: ["Ich kaufe die Jacke, denn sie zu billig ist.", "Möchtest du bar denn mit Karte bezahlen?", "Ich kaufe online, denn ist es bequemer."],
    grammarCheckModels: [
      { questionDe: "Ich kaufe die Jacke, denn sie zu billig ist.", modelAnswerDe: "Ich kaufe die Jacke, denn sie ist billig." },
      { questionDe: "Möchtest du bar denn mit Karte bezahlen?", modelAnswerDe: "Möchtest du bar oder mit Karte bezahlen?" },
      { questionDe: "Ich kaufe online, denn ist es bequemer.", modelAnswerDe: "Ich kaufe online, denn es ist bequemer." }
    ],
${anchor}`;
  data = data.slice(0, day19AnchorIndex) + fields + data.slice(day19AnchorIndex + anchor.length);
}
fs.writeFileSync(day19Path, data);
console.log("A2 presenter: actionable grammar/topic practice enabled for Days 20–25; Day 19 preserved.");
