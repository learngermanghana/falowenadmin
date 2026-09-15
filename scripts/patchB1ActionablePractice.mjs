import fs from "node:fs";

const presenterPath = new URL("../src/utils/teachingPresenter.js", import.meta.url);
let source = fs.readFileSync(presenterPath, "utf8");

const grammarByAssignment = {
  "B1-1.1": [["Korrigiere: Letztes Jahr habe ich nach Berlin gereist.", "Letztes Jahr bin ich nach Berlin gereist."], ["Korrigiere: Ich habe schon in einem Büro arbeiten.", "Ich habe schon in einem Büro gearbeitet."], ["Bilde Perfekt: Ich lerne viel für meinen Traumberuf.", "Ich habe viel für meinen Traumberuf gelernt."]],
  "B1-1.2": [["Korrigiere: Mein bester Freund ist ein ehrlich Mensch.", "Mein bester Freund ist ein ehrlicher Mensch."], ["Korrigiere: Ich vertraue ihm, weil er ist zuverlässig.", "Ich vertraue ihm, weil er zuverlässig ist."], ["Korrigiere: Er hilft mir immer, deshalb ich vertraue ihm.", "Er hilft mir immer, deshalb vertraue ich ihm."]],
  "B1-1.3": [["Korrigiere: Obwohl er hatte wenig Geld, gründete er eine Firma.", "Obwohl er wenig Geld hatte, gründete er eine Firma."], ["Verbinde mit trotzdem: Sie hatte viele Probleme. Sie gab nicht auf.", "Sie hatte viele Probleme. Trotzdem gab sie nicht auf."], ["Korrigiere: Trotz er wenig Erfahrung hatte, war er erfolgreich.", "Obwohl er wenig Erfahrung hatte, war er erfolgreich."]],
  "B1-2.4": [["Korrigiere: Ich suche eine Wohnung, die hat drei Zimmer.", "Ich suche eine Wohnung, die drei Zimmer hat."], ["Korrigiere: Das ist der Vermieter, den die Wohnung gehört.", "Das ist der Vermieter, dem die Wohnung gehört."], ["Verbinde: Ich suche eine Wohnung. Die Wohnung liegt zentral.", "Ich suche eine Wohnung, die zentral liegt."]],
  "B1-2.5": [["Korrigiere: Ich interessiere mich für die Wohnung, obwohl sie ist teuer.", "Ich interessiere mich für die Wohnung, obwohl sie teuer ist."], ["Formuliere höflich: Wann kann ich einziehen?", "Könnten Sie mir bitte sagen, wann ich einziehen kann?"], ["Korrigiere: Ich möchte wissen, wie hoch ist die Kaution.", "Ich möchte wissen, wie hoch die Kaution ist."]],
  "B1-2.6": [["Korrigiere: Das Land ist ruhiger wie die Stadt.", "Das Land ist ruhiger als die Stadt."], ["Korrigiere: Je näher ich wohne, desto weniger Zeit brauche ich für den Arbeitsweg ist.", "Je näher ich wohne, desto weniger Zeit brauche ich für den Arbeitsweg."], ["Bilde einen Gegensatz mit während: Die Stadt ist lebendig. Das Land ist ruhig.", "Während die Stadt lebendig ist, ist das Land ruhig."]],
  "B1-3.7": [["Korrigiere: Wegen das schlechte Essen koche ich selbst.", "Wegen des schlechten Essens koche ich selbst."], ["Korrigiere: Trotz der hohen Preis kauft er Bio-Produkte.", "Trotz des hohen Preises kauft er Bio-Produkte."], ["Bilde Genitiv: wegen + der hohe Zuckergehalt", "wegen des hohen Zuckergehalts"]],
  "B1-3.8": [["Korrigiere: Wenn man gesund bleiben will, man sollte genug schlafen.", "Wenn man gesund bleiben will, sollte man genug schlafen."], ["Korrigiere: Man sollte Sport machen, um gesund bleiben.", "Man sollte Sport machen, um gesund zu bleiben."], ["Verbinde mit damit: Ich esse Gemüse. Mein Körper bekommt genug Vitamine.", "Ich esse Gemüse, damit mein Körper genug Vitamine bekommt."]],
  "B1-3.9": [["Korrigiere: Ich mache Pausen, um ich konzentriert zu bleiben.", "Ich mache Pausen, um konzentriert zu bleiben."], ["Korrigiere: Ich arbeite weniger, damit mehr Zeit zu haben.", "Ich arbeite weniger, um mehr Zeit zu haben."], ["Verbinde mit obwohl: Er arbeitet viel. Er hat Zeit für Sport.", "Obwohl er viel arbeitet, hat er Zeit für Sport."]],
  "B1-4.10": [["Korrigiere: Je weniger ich mein Handy benutze, desto entspannter ich bin.", "Je weniger ich mein Handy benutze, desto entspannter bin ich."], ["Korrigiere: Mein Laptop ist schneller als mein Handy ist.", "Mein Laptop ist schneller als mein Handy."], ["Bilde einen Vergleich mit so ... wie: Lesen / entspannend / Musik hören", "Lesen ist für mich so entspannend wie Musik hören."]],
  "B1-4.11": [["Korrigiere: Beim Teamspiel müssen alle miteinander zu arbeiten.", "Beim Teamspiel müssen alle miteinander arbeiten."], ["Verbinde mit damit: Wir sprechen klar. Alle verstehen die Aufgabe.", "Wir sprechen klar, damit alle die Aufgabe verstehen."], ["Korrigiere: Man muss gut zuhören, um Missverständnisse vermeiden.", "Man muss gut zuhören, um Missverständnisse zu vermeiden."]],
  "B1-4.12": [["Korrigiere: Nachdem wir angekommen sind, bauten wir das Zelt auf.", "Nachdem wir angekommen waren, bauten wir das Zelt auf."], ["Korrigiere: Während wir wanderten, es begann zu regnen.", "Während wir wanderten, begann es zu regnen."], ["Verbinde mit bevor: Wir gingen los. Wir prüften das Wetter.", "Bevor wir losgingen, prüften wir das Wetter."]],
  "B1-4.13": [["Korrigiere: Der Film, den ich gestern gesehen habe, war sehr spannend gewesen.", "Der Film, den ich gestern gesehen habe, war sehr spannend."], ["Korrigiere: Obwohl der Film war lang, fand ich ihn interessant.", "Obwohl der Film lang war, fand ich ihn interessant."], ["Formuliere eine Bewertung mit zwar ... aber.", "Der Film war zwar lang, aber trotzdem sehr spannend."]],
  "B1-5.14": [["Korrigiere: Obwohl digitales Lernen ist flexibel, fehlt manchmal der persönliche Kontakt.", "Obwohl digitales Lernen flexibel ist, fehlt manchmal der persönliche Kontakt."], ["Korrigiere: Traditioneller Unterricht ist persönlicher wie Online-Unterricht.", "Traditioneller Unterricht ist persönlicher als Online-Unterricht."], ["Bilde einen Gegensatz mit während.", "Während Online-Unterricht flexibel ist, bietet Präsenzunterricht mehr direkten Kontakt."]],
  "B1-5.15": [["Korrigiere: Ich finde, dass Homeoffice hat viele Vorteile.", "Ich finde, dass Homeoffice viele Vorteile hat."], ["Korrigiere: Obwohl ich zu Hause arbeite, aber ich bin produktiv.", "Obwohl ich zu Hause arbeite, bin ich produktiv."], ["Verbinde mit deshalb: Ich spare den Arbeitsweg. Ich habe mehr Zeit.", "Ich spare den Arbeitsweg. Deshalb habe ich mehr Zeit."]],
  "B1-5.16": [["Korrigiere: Wenn ich eine Prüfung habe, ich werde nervös.", "Wenn ich eine Prüfung habe, werde ich nervös."], ["Korrigiere: Um Stress reduzieren, mache ich Pausen.", "Um Stress zu reduzieren, mache ich Pausen."], ["Verbinde mit damit: Ich plane früh. Ich gerate nicht unter Zeitdruck.", "Ich plane früh, damit ich nicht unter Zeitdruck gerate."]],
  "B1-5.17": [["Korrigiere: Je öfter man wiederholt, desto besser man erinnert sich.", "Je öfter man wiederholt, desto besser erinnert man sich."], ["Korrigiere: Ich lerne mit Karteikarten, damit neue Wörter zu wiederholen.", "Ich lerne mit Karteikarten, um neue Wörter zu wiederholen."], ["Verbinde mit indem: Man lernt aktiv. Man erklärt den Stoff anderen.", "Man lernt aktiv, indem man den Stoff anderen erklärt."]],
  "B1-6.18": [["Korrigiere: Um mein Wunschberuf zu erreichen, brauche ich eine Ausbildung.", "Um meinen Wunschberuf zu erreichen, brauche ich eine Ausbildung."], ["Korrigiere: Ich mache ein Praktikum, damit Berufserfahrung sammeln.", "Ich mache ein Praktikum, um Berufserfahrung zu sammeln."], ["Verbinde mit weil: Weiterbildung ist wichtig. Die Anforderungen ändern sich.", "Weiterbildung ist wichtig, weil sich die Anforderungen ändern."]],
  "B1-6.19": [["Korrigiere: Ich würde gern wissen, wie sieht der Arbeitsalltag aus.", "Ich würde gern wissen, wie der Arbeitsalltag aussieht."], ["Korrigiere: Können Sie mir sagen, wann beginnt die Stelle?", "Können Sie mir sagen, wann die Stelle beginnt?"], ["Formuliere höflicher: Wie viel verdiene ich?", "Könnten Sie mir bitte sagen, wie hoch das Gehalt ist?"]],
  "B1-6.20": [["Korrigiere: Um Arzt werden, muss man Medizin studieren.", "Um Arzt zu werden, muss man Medizin studieren."], ["Korrigiere: Man braucht eine Ausbildung, damit als Elektriker arbeiten.", "Man braucht eine Ausbildung, um als Elektriker zu arbeiten."], ["Verbinde: Man sammelt Erfahrung. Man macht ein Praktikum.", "Man sammelt Erfahrung, indem man ein Praktikum macht."]],
  "B1-7.21": [["Korrigiere: Während eine WG günstiger ist, eine eigene Wohnung bietet mehr Ruhe.", "Während eine WG günstiger ist, bietet eine eigene Wohnung mehr Ruhe."], ["Korrigiere: Obwohl eine WG kann praktisch sein, gibt es Konflikte.", "Obwohl eine WG praktisch sein kann, gibt es Konflikte."], ["Bilde einen Vergleich mit einerseits ... andererseits.", "Einerseits ist eine WG günstig, andererseits hat man weniger Privatsphäre."]],
  "B1-7.22": [["Korrigiere: Mir ist wichtig, dass mein Partner ist ehrlich.", "Mir ist wichtig, dass mein Partner ehrlich ist."], ["Korrigiere: Ich brauche jemanden, der ich vertrauen kann.", "Ich brauche jemanden, dem ich vertrauen kann."], ["Verbinde mit obwohl: Wir haben unterschiedliche Interessen. Wir verstehen uns gut.", "Obwohl wir unterschiedliche Interessen haben, verstehen wir uns gut."]],
  "B1-7.23": [["Korrigiere: Wenn das erste Date gut läuft, man kann sich wieder treffen.", "Wenn das erste Date gut läuft, kann man sich wieder treffen."], ["Formuliere höflich: Gib mir deine Nummer.", "Könntest du mir vielleicht deine Nummer geben?"], ["Korrigiere: Ich würde gern wissen, ob hast du am Samstag Zeit.", "Ich würde gern wissen, ob du am Samstag Zeit hast."]],
  "B1-8.24": [["Korrigiere: Obwohl nachhaltige Produkte sind teurer, kaufe ich sie gern.", "Obwohl nachhaltige Produkte teurer sind, kaufe ich sie gern."], ["Korrigiere: Je weniger Plastik wir benutzen, desto besser es ist für die Umwelt.", "Je weniger Plastik wir benutzen, desto besser ist es für die Umwelt."], ["Verbinde mit indem: Man konsumiert nachhaltiger. Man kauft regional.", "Man konsumiert nachhaltiger, indem man regional kauft."]],
  "B1-8.25": [["Korrigiere: Wenn die Ware beschädigt ist, ich reklamiere sie.", "Wenn die Ware beschädigt ist, reklamiere ich sie."], ["Korrigiere: Ich möchte wissen, wie kann ich die Ware zurückschicken.", "Ich möchte wissen, wie ich die Ware zurückschicken kann."], ["Formuliere höflich eine Forderung nach Rückerstattung.", "Ich möchte Sie bitten, mir den Kaufpreis zu erstatten."]],
  "B1-9.26": [["Korrigiere: Obwohl mein Flug verspätet war, aber ich blieb ruhig.", "Obwohl mein Flug verspätet war, blieb ich ruhig."], ["Korrigiere: Wenn mein Gepäck verloren geht, ich melde es sofort.", "Wenn mein Gepäck verloren geht, melde ich es sofort."], ["Verbinde Problem und Lösung mit deshalb.", "Mein Zug ist ausgefallen. Deshalb nehme ich den nächsten Bus."]],
  "B1-10.27": [["Korrigiere: Indem man weniger Auto fährt, man schützt die Umwelt.", "Indem man weniger Auto fährt, schützt man die Umwelt."], ["Korrigiere: Je mehr wir recyceln, desto weniger Müll wir produzieren.", "Je mehr wir recyceln, desto weniger Müll produzieren wir."], ["Verbinde mit um ... zu: Ich fahre Fahrrad. Ich reduziere CO₂.", "Ich fahre Fahrrad, um CO₂ zu reduzieren."]],
  "B1-10.28": [["Korrigiere: Obwohl Klimaschutz kostet Geld, ist er wichtig.", "Obwohl Klimaschutz Geld kostet, ist er wichtig."], ["Korrigiere: Je mehr Menschen öffentliche Verkehrsmittel nutzen, desto weniger Autos es gibt.", "Je mehr Menschen öffentliche Verkehrsmittel nutzen, desto weniger Autos gibt es."], ["Verbinde mit damit: Städte bauen Radwege. Mehr Menschen fahren Fahrrad.", "Städte bauen Radwege, damit mehr Menschen Fahrrad fahren."]],
};

const assignmentIds = Object.keys(grammarByAssignment);

if (!source.includes("const B1_ACTIONABLE_PRACTICE =")) {
  const functionIndex = source.indexOf("function buildPresenterV2Stages(");
  if (functionIndex < 0) throw new Error("B1 Presenter V2 function missing");
  const bank = `const B1_ACTIONABLE_PRACTICE = ${JSON.stringify(grammarByAssignment, null, 2)};\n\n`;
  source = source.slice(0, functionIndex) + bank + source.slice(functionIndex);
}

if (!source.includes('id: "b1-grammar-check"')) {
  const functionStart = source.indexOf("function buildPresenterV2Stages(");
  if (functionStart < 0) throw new Error("B1 Presenter V2 function missing");
  const returnIndex = source.indexOf("  return stages;", functionStart);
  if (returnIndex < 0) throw new Error("B1 Presenter V2 return missing");
  const extension = `
  const b1Actionable = B1_ACTIONABLE_PRACTICE[normalizedAssignmentId(slide)];
  if (b1Actionable) {
    const makeB1Models = (pairs) => pairs.map(([questionDe, modelAnswerDe]) => ({ questionDe, modelAnswerDe }));
    const b1Phrases = (Array.isArray(slide.keyPhrasesDe) ? slide.keyPhrasesDe : []).slice(0, 4);
    const b1PhraseQuestions = b1Phrases.map((phrase) => \`Formuliere einen eigenen B1-Satz mit diesem Redemittel: “\${phrase}”\`);
    const b1PhraseModels = b1PhraseQuestions.map((questionDe, index) => ({ questionDe, modelAnswerDe: b1Phrases[index] }));
    const b1TopicQuestions = (Array.isArray(slide.studentQuestionsDe) ? slide.studentQuestionsDe : []).slice(0, 5);
    const b1TopicModels = Array.isArray(slide.speakingModels) ? slide.speakingModels : [];
    const roleItems = b1TopicQuestions.slice(0, 3).map((question, index) => {
      const contexts = ["Diskutiere die Situation mit einem Partner und begründe deine Position.", "Reagiere auf eine andere Meinung und nenne einen konkreten Grund oder ein Beispiel.", "Übertrage das Thema auf eine reale Situation aus Alltag, Arbeit, Schule oder Familie."];
      return \`\${contexts[index]} Ausgangsfrage: \${question}\`;
    });
    const roleModels = roleItems.map((questionDe, index) => ({ questionDe, modelAnswerDe: b1TopicModels[index]?.modelAnswerDe || "Begründe deine Antwort mit einem passenden Konnektor und einem konkreten Beispiel." }));
    stages.push(
      { id: "b1-grammar-check", type: "question-reveal", kicker: "Grammatik-Check", title: "Finde und korrigiere den Fehler", items: b1Actionable.map(([question]) => question), questionModels: makeB1Models(b1Actionable), requiresQuestionModel: true, suggestedMinutes: 9 },
      { id: "b1-vocabulary-retrieval", type: "question-reveal", kicker: "Redemittel", title: "Aktiviere die Sprache", items: b1PhraseQuestions, questionModels: b1PhraseModels, requiresQuestionModel: true, suggestedMinutes: 7 },
      { id: "b1-sentence-builder", type: "question-reveal", kicker: "Satzbau", title: "Baue einen stärkeren B1-Satz", items: b1Actionable.map(([question], index) => \`Formuliere die korrekte Struktur neu, aber mit einem eigenen Beispiel. Musterproblem: \${question}\`), questionModels: makeB1Models(b1Actionable), requiresQuestionModel: true, suggestedMinutes: 8 },
      { id: "b1-guided-action", type: "question-reveal", kicker: "Thema + Grammatik", title: "Antworte, begründe und erweitere", items: b1TopicQuestions, questionModels: b1TopicModels, requiresQuestionModel: true, suggestedMinutes: 10 },
      { id: "b1-role-play", type: "question-reveal", kicker: "Transfer", title: "Nutze die Sprache in einer realen Situation", items: roleItems, questionModels: roleModels, requiresQuestionModel: true, suggestedMinutes: 10 },
    );
  }
`;
  source = source.slice(0, returnIndex) + extension + source.slice(returnIndex);
}

fs.writeFileSync(presenterPath, source);
console.log(`B1 actionable practice enabled for ${assignmentIds.length} lessons.`);
