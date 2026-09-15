import fs from "node:fs";

const presenterPath = new URL("../src/utils/teachingPresenter.js", import.meta.url);
const day19Path = new URL("../src/data/a2WorkbookAlignedSlidesDays16To20.js", import.meta.url);

let source = fs.readFileSync(presenterPath, "utf8");

const practiceEntries = `
  "A2-10.26": {
    grammar: [
      ["Korrigiere: Ich bin nervös, wenn ich habe eine Prüfung.", "Ich bin nervös, wenn ich eine Prüfung habe."],
      ["Korrigiere: Wenn ich gute Nachrichten bekomme, ich bin froh.", "Wenn ich gute Nachrichten bekomme, bin ich froh."],
      ["Korrigiere: Wenn ich bin gestresst, höre ich Musik.", "Wenn ich gestresst bin, höre ich Musik."],
    ],
    sentence: [
      ["wenn / ich / eine Prüfung / habe / bin / ich / nervös", "Wenn ich eine Prüfung habe, bin ich nervös."],
      ["ich / froh / bin / wenn / gute Nachrichten / ich / bekomme", "Ich bin froh, wenn ich gute Nachrichten bekomme."],
      ["wenn / ich / gestresst / bin / mache / ich / eine Pause", "Wenn ich gestresst bin, mache ich eine Pause."],
    ],
    role: [
      ["Dein Freund ist vor einer Prüfung sehr nervös. Beschreibe das Gefühl und gib einen Rat mit wenn.", "Wenn du nervös bist, kannst du eine kurze Pause machen und tief atmen."],
      ["Erzähle von einer Situation, die dich froh oder enttäuscht macht, und sage, wie du reagierst.", "Wenn ich gute Nachrichten bekomme, bin ich froh und rufe meine Familie an."],
      ["Ein Nachbar hat dir geholfen, als du krank warst. Bedanke dich und biete eine Gegenleistung an.", "Vielen Dank für deine Hilfe. Ich war sehr erleichtert. Wenn du einmal Hilfe brauchst, helfe ich dir gern."],
    ],
  },
  "A2-10.27": {
    grammar: [
      ["Korrigiere: Ich finde, dass E-Mails sind praktisch.", "Ich finde, dass E-Mails praktisch sind."],
      ["Korrigiere: Ich glaube, dass soziale Medien haben viele Vorteile.", "Ich glaube, dass soziale Medien viele Vorteile haben."],
      ["Korrigiere: Mir ist wichtig, dass sind meine Daten sicher.", "Mir ist wichtig, dass meine Daten sicher sind."],
    ],
    sentence: [
      ["ich / finde / dass / Nachrichten / praktisch / sind", "Ich finde, dass Nachrichten praktisch sind."],
      ["ich / glaube / dass / soziale Medien / nützlich / sein können", "Ich glaube, dass soziale Medien nützlich sein können."],
      ["mir / wichtig / ist / dass / meine Daten / sicher / sind", "Mir ist wichtig, dass meine Daten sicher sind."],
    ],
    role: [
      ["Erkläre einem Freund deine Meinung zu E-Mails oder Messenger-Nachrichten. Benutze dass.", "Ich finde, dass Messenger-Nachrichten praktisch sind, weil man schnell antworten kann."],
      ["Diskutiert einen Vorteil und einen Nachteil sozialer Medien.", "Ich glaube, dass soziale Medien hilfreich sind. Ein Nachteil ist, dass man dort viel Zeit verlieren kann."],
      ["Du möchtest deine persönlichen Daten besser schützen. Erkläre, was dir wichtig ist.", "Mir ist wichtig, dass meine Daten sicher sind. Deshalb teile ich nicht alle persönlichen Informationen online."],
    ],
  },
  "A2-10.28": {
    grammar: [
      ["Korrigiere: Nächstes Jahr ich werde Deutsch weiterlernen.", "Nächstes Jahr werde ich Deutsch weiterlernen."],
      ["Korrigiere: Ich werde nächstes Jahr nach Deutschland reisen werde.", "Ich werde nächstes Jahr nach Deutschland reisen."],
      ["Korrigiere: Meine Schwester werden eine Ausbildung machen.", "Meine Schwester wird eine Ausbildung machen."],
    ],
    sentence: [
      ["ich / werde / nächstes Jahr / Deutsch / weiterlernen", "Ich werde nächstes Jahr Deutsch weiterlernen."],
      ["wir / werden / später / eine Reise / machen", "Wir werden später eine Reise machen."],
      ["sie / wird / in Zukunft / eine Ausbildung / beginnen", "Sie wird in Zukunft eine Ausbildung beginnen."],
    ],
    role: [
      ["Sprich über drei Ziele für das nächste Jahr. Benutze Futur I.", "Nächstes Jahr werde ich Deutsch weiterlernen, mehr Sport machen und eine Reise planen."],
      ["Erzähle einem Freund von deinen beruflichen und persönlichen Zukunftsplänen.", "Ich werde meine beruflichen Fähigkeiten verbessern. Außerdem werde ich mehr Zeit für meine Familie einplanen."],
      ["Du beendest den A2-Kurs. Erkläre, wie du dein Deutsch weiter verbessern wirst.", "Ich werde jeden Tag Deutsch üben, regelmäßig lesen und mehr auf Deutsch sprechen."],
    ],
  },
`;

// The reusable bank for Days 20–25 already exists in production source after this
// prebuild patch. Extend that same bank to Days 26–28 without changing the core slides.
if (source.includes("const A2_ACTIONABLE_PRACTICE =") && !source.includes('"A2-10.26": {')) {
  const bankEnd = source.indexOf("\n};", source.indexOf("const A2_ACTIONABLE_PRACTICE ="));
  if (bankEnd < 0) throw new Error("A2 actionable practice bank end missing");
  source = source.slice(0, bankEnd) + practiceEntries + source.slice(bankEnd);
}

// Clean checkouts do not yet contain the generated bank. Recreate the complete bank
// by reusing the stable Day 20–25 source embedded below, then append Days 26–28.
if (!source.includes("const A2_ACTIONABLE_PRACTICE =")) {
  const baseEntries = `const A2_ACTIONABLE_PRACTICE = {
  "A2-7.20": { grammar: [["Korrigiere: Ich möchte die Schuhe umtauschen, weil sie sind zu klein.", "Ich möchte die Schuhe umtauschen, weil sie zu klein sind."], ["Korrigiere: Ich reklamiere, denn die Ware kaputt ist.", "Ich reklamiere, denn die Ware ist kaputt."], ["Formuliere höflich: Geben Sie mir mein Geld zurück!", "Könnten Sie mir bitte mein Geld zurückgeben?"]], sentence: [["weil / die Jacke / zu groß / ist / ich / sie / umtauschen / möchte", "Ich möchte die Jacke umtauschen, weil sie zu groß ist."], ["ich / reklamiere / denn / der Reißverschluss / ist / kaputt", "Ich reklamiere, denn der Reißverschluss ist kaputt."], ["könnten / Sie / mir / bitte / eine neue Ware / schicken", "Könnten Sie mir bitte eine neue Ware schicken?"]], role: [["Du hast Kopfhörer gekauft. Sie funktionieren nicht. Reklamiere höflich.", "Ich möchte die Kopfhörer reklamieren, weil sie nicht funktionieren. Könnten Sie sie bitte umtauschen?"], ["Ein Pullover ist zu klein. Bitte um eine Lösung.", "Ich möchte ihn umtauschen, weil er mir nicht passt."], ["Du hast die falsche Ware bekommen. Telefoniere mit dem Kundenservice.", "Ich habe die falsche Ware bekommen. Könnten Sie mir bitte den richtigen Artikel schicken?"]] },
  "A2-8.21": { grammar: [["Korrigiere: Wenn das Wetter gut ist, wir gehen in den Park.", "Wenn das Wetter gut ist, gehen wir in den Park."], ["Korrigiere: Ich weiß nicht, ob meine Freunde haben Zeit.", "Ich weiß nicht, ob meine Freunde Zeit haben."], ["Was passt: wenn, falls oder ob? Ich weiß nicht, ___ Anna kommt.", "ob"]], sentence: [["wenn / das Wetter / gut / ist / machen / wir / ein Picknick", "Wenn das Wetter gut ist, machen wir ein Picknick."], ["falls / es / regnet / gehen / wir / ins Kino", "Falls es regnet, gehen wir ins Kino."], ["ich / weiß / nicht / ob / Paul / Zeit / hat", "Ich weiß nicht, ob Paul Zeit hat."]], role: [["Plane Samstag und gib einen Plan B.", "Wenn das Wetter gut ist, gehen wir in den Park. Falls es regnet, gehen wir ins Kino."], ["Frage indirekt, ob dein Freund Zeit hat.", "Ich möchte wissen, ob du am Samstag Zeit hast."], ["Lade jemanden ein und nenne einen Plan B.", "Wenn das Wetter gut ist, machen wir einen Ausflug; falls es regnet, besuchen wir ein Museum."]] },
  "A2-8.22": { grammar: [["Korrigiere: Am Dienstag ich arbeite bis 17 Uhr.", "Am Dienstag arbeite ich bis 17 Uhr."], ["Korrigiere: Morgen ich treffe meine Freundin.", "Morgen treffe ich meine Freundin."], ["Korrigiere: Um 18 Uhr muss ich gehen zum Deutschkurs.", "Um 18 Uhr muss ich zum Deutschkurs gehen."]], sentence: [["am Mittwoch / ich / einen Termin / habe", "Am Mittwoch habe ich einen Termin."], ["morgen / ich / meine Freundin / treffe", "Morgen treffe ich meine Freundin."], ["am Freitag / ich / nicht / kommen / kann", "Am Freitag kann ich nicht kommen."]], role: [["Findet einen freien Abend.", "Am Freitag habe ich Zeit. Passt dir Freitagabend?"], ["Lade jemanden zum Mittagessen ein.", "Möchtest du am Freitag um 12 Uhr mit mir zu Mittag essen?"], ["Erkläre zwei Pflichten und eine freie Zeit.", "Am Montag muss ich arbeiten. Am Freitagabend habe ich Zeit."]] },
  "A2-9.23": { grammar: [["Korrigiere: Ich fahre mit der Bus zur Arbeit.", "Ich fahre mit dem Bus zur Arbeit."], ["Korrigiere: Morgens gehe ich zu die Schule.", "Morgens gehe ich zur Schule."], ["Was passt: nach oder zu? Ich fahre ___ Berlin.", "nach Berlin"]], sentence: [["ich / mit dem Bus / zur Arbeit / fahre", "Ich fahre mit dem Bus zur Arbeit."], ["sie / mit der Bahn / nach Berlin / fährt", "Sie fährt mit der Bahn nach Berlin."], ["wir / zu Fuß / zur Schule / gehen", "Wir gehen zu Fuß zur Schule."]], role: [["Erkläre deinen Arbeitsweg.", "Ich fahre mit dem Bus zur Arbeit. Die Fahrt dauert 30 Minuten."], ["Vergleiche Auto und Bahn.", "Ich fahre lieber mit der Bahn, weil sie umweltfreundlicher ist."], ["Stelle einem Autohändler zwei Fragen.", "Wie viel kostet das Auto? Wie hoch ist der Verbrauch?"]] },
  "A2-9.24": { grammar: [["Korrigiere: Im Sommer fahre ich zu Spanien.", "Im Sommer fahre ich nach Spanien."], ["Korrigiere: Wir fahren nach die Schweiz.", "Wir fahren in die Schweiz."], ["Plane mit möchte: nächstes Jahr / Italien / reisen", "Nächstes Jahr möchte ich nach Italien reisen."]], sentence: [["im Sommer / wir / nach Ghana / fliegen", "Im Sommer fliegen wir nach Ghana."], ["ich / möchte / ans Meer / fahren", "Ich möchte ans Meer fahren."], ["wir / werden / in einem Hotel / übernachten", "Wir werden in einem Hotel übernachten."]], role: [["Plane einen Urlaub.", "Ich möchte nach Italien reisen und in einem Hotel übernachten."], ["Entscheidet euch für ein Reiseziel.", "Ich würde Spanien wählen, weil ich ans Meer möchte."], ["Was musst du vor der Reise organisieren?", "Ich muss das Hotel buchen, Tickets kaufen und meinen Koffer packen."]] },
  "A2-9.25": { grammar: [["Korrigiere: Morgens ich stehe um 7 Uhr auf.", "Morgens stehe ich um 7 Uhr auf."], ["Korrigiere: Ich aufstehe jeden Tag um sechs Uhr.", "Ich stehe jeden Tag um sechs Uhr auf."], ["Korrigiere: Danach ich frühstücke.", "Danach frühstücke ich."]], sentence: [["morgens / ich / um 7 Uhr / aufstehe", "Morgens stehe ich um 7 Uhr auf."], ["danach / ich / zur Arbeit / fahre", "Danach fahre ich zur Arbeit."], ["abends / ich / fernsehe", "Abends sehe ich fern."]], role: [["Beschreibe deinen Morgen.", "Morgens stehe ich auf. Dann dusche ich. Danach frühstücke ich."], ["Vergleiche Werktag und Wochenende.", "Am Wochenende stehe ich später auf."], ["Erzähle deine Abendroutine.", "Abends koche ich, mache Hausaufgaben und sehe fern."]] },
${practiceEntries}};`;
  const functionIndex = source.indexOf("function buildPresenterV2Stages(");
  if (functionIndex < 0) throw new Error("A2 Presenter V2 function missing");
  source = source.slice(0, functionIndex) + baseEntries + "\n\n" + source.slice(functionIndex);
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
  const returnIndex = source.indexOf("  return stages;", functionStart);
  if (functionStart < 0 || returnIndex < 0) throw new Error("A2 Presenter V2 return missing");
  source = source.slice(0, returnIndex) + extraStages + "\n" + source.slice(returnIndex);
}

fs.writeFileSync(presenterPath, source);

// Keep the released Day 19 grammar check data available on clean Vercel checkouts.
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
console.log("A2 presenter: actionable grammar/topic practice enabled for Days 20–28; Day 19 preserved.");
