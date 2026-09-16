import fs from "node:fs";

const b2SlidesPath = new URL("../src/data/b2PresenterSlides.js", import.meta.url);
const dictionaryPath = new URL("../src/data/courseDictionary.js", import.meta.url);
const teacherSupportPath = new URL("../src/data/teacherSlideSupport.js", import.meta.url);
const advancedModelsPath = new URL("../src/data/advancedSpeakingModels.js", import.meta.url);
const b2TestPath = new URL("../tests/b2-presenter-v2-all-days.test.js", import.meta.url);

const lessons = [
  {
    day: 1,
    assignmentId: "B2-1.1",
    topic: "Umweltschutz im Alltag – Müll vermeiden",
    grammar: [
      "Use indem and dadurch, dass to explain concrete methods of reducing waste.",
      "Use um ... zu and damit to express environmental goals; use damit when the subjects differ.",
      "Use wodurch or sodass to connect everyday behaviour with environmental consequences.",
    ],
    models: [
      "Man kann Abfall vermeiden, indem man wiederverwendbare Produkte benutzt.",
      "Viele Geschäfte bieten Nachfüllstationen an, damit Kunden weniger Verpackungen verbrauchen.",
      "Ich kaufe nur, was ich wirklich brauche, wodurch weniger Müll entsteht.",
    ],
    speakingAnswers: [
      "Umweltschutz im Alltag ist wichtig, weil viele kleine Entscheidungen zusammen eine große Wirkung haben. Besonders beim Einkaufen, Essen und Wegwerfen kann jeder Mensch seinen Ressourcenverbrauch beeinflussen.",
      "Ein Vorteil ist, dass umweltfreundliche Gewohnheiten häufig auch Geld sparen. Gleichzeitig ist es manchmal schwierig, weil nachhaltige Alternativen teurer oder nicht überall verfügbar sind.",
      "Besonders sinnvoll finde ich, Einwegprodukte zu vermeiden und Dinge möglichst lange zu benutzen. Dadurch sinkt nicht nur die Müllmenge, sondern auch der Bedarf an neuen Rohstoffen.",
      "In Deutschland gibt es viele Systeme zur Mülltrennung und Rückgabe von Flaschen. In Ghana sind solche Strukturen je nach Ort unterschiedlich entwickelt, weshalb praktische Sammel- und Recyclingsysteme besonders wichtig sind.",
      "Ich bin der Auffassung, dass man nicht perfekt leben muss, um die Umwelt zu schützen. Wenn ich zum Beispiel eine wiederverwendbare Flasche benutze und Einkäufe plane, vermeide ich regelmäßig unnötigen Abfall.",
    ],
  },
  {
    day: 2,
    assignmentId: "B2-1.2",
    topic: "Mülltrennung, Recycling und Kreislaufwirtschaft",
    grammar: [
      "Use passive and modal passive to describe collection, sorting and recycling processes objectively.",
      "Use nominalisation for formal environmental language: wiederverwerten → die Wiederverwertung; trennen → die Trennung.",
      "Use relative clauses, including genitive forms such as deren, to describe recyclable products precisely.",
    ],
    models: [
      "Papier, Glas und Bioabfälle müssen getrennt gesammelt werden.",
      "Durch die Wiederverwertung von Rohstoffen lässt sich der Ressourcenverbrauch reduzieren.",
      "Produkte, deren Materialien leicht recycelt werden können, sind langfristig nachhaltiger.",
    ],
    speakingAnswers: [
      "Recycling ist wichtig, weil wertvolle Rohstoffe nicht nach einmaliger Nutzung verloren gehen sollten. Eine funktionierende Kreislaufwirtschaft versucht deshalb, Materialien möglichst lange im Wirtschaftskreislauf zu halten.",
      "Recycling spart Ressourcen und kann die Menge an Deponieabfällen reduzieren. Problematisch ist jedoch, dass nicht jedes Material beliebig oft recycelt werden kann und falsche Mülltrennung den Prozess erschwert.",
      "Ich halte leicht verständliche Trennsysteme mit klar gekennzeichneten Behältern für besonders sinnvoll. Zusätzlich sollten Hersteller stärker verpflichtet werden, recyclingfähige Verpackungen zu verwenden.",
      "Deutschland verfügt über ein relativ ausgebautes System für Mülltrennung und Pfand. In vielen anderen Ländern bestehen dagegen größere Herausforderungen bei Sammlung, Transport und Verarbeitung von Abfällen.",
      "Meiner Meinung nach sollte Recycling nicht als einzige Lösung betrachtet werden. Noch wichtiger ist es, Abfall von Anfang an zu vermeiden, denn auch Recycling benötigt Energie und Infrastruktur.",
    ],
  },
  {
    day: 3,
    assignmentId: "B2-1.3",
    topic: "Lebensmittelverschwendung und nachhaltiger Konsum",
    grammar: [
      "Use je ... desto to express relationships between planning, consumption and food waste.",
      "Use obwohl / trotzdem and trotz to acknowledge realistic obstacles to sustainable consumption.",
      "Use indem to explain practical strategies for preventing food waste.",
    ],
    models: [
      "Je genauer Haushalte ihre Einkäufe planen, desto weniger Lebensmittel werden weggeworfen.",
      "Obwohl Produkte kurz vor dem Mindesthaltbarkeitsdatum oft noch genießbar sind, werden sie häufig entsorgt.",
      "Lebensmittelverschwendung lässt sich reduzieren, indem Reste sinnvoll weiterverwendet werden.",
    ],
    speakingAnswers: [
      "Lebensmittelverschwendung betrifft Umwelt, Wirtschaft und soziale Verantwortung zugleich. Wenn essbare Lebensmittel weggeworfen werden, werden auch Wasser, Energie, Transport und Arbeitsleistung unnötig verbraucht.",
      "Bewusster Konsum kann Haushaltskosten senken und Ressourcen schonen. Gleichzeitig führen große Packungen, spontane Einkäufe und Unsicherheit über Haltbarkeitsangaben oft dazu, dass Lebensmittel trotzdem im Müll landen.",
      "Eine wirksame Maßnahme ist eine realistische Einkaufsplanung. Wer zuerst prüft, was bereits zu Hause vorhanden ist, kauft gezielter ein und kann Reste besser einplanen.",
      "In wohlhabenden Ländern entsteht ein Teil der Verschwendung häufig in Haushalten und im Handel. In anderen Ländern können dagegen fehlende Kühlung, Lagerung oder Transportmöglichkeiten eine größere Rolle spielen.",
      "Ich versuche, Lebensmittel nicht nur nach dem Datum zu beurteilen, sondern auch Aussehen und Geruch zu prüfen. So musste ich schon mehrfach Produkte nicht wegwerfen, die noch völlig in Ordnung waren.",
    ],
  },
  {
    day: 4,
    assignmentId: "B2-1.4",
    topic: "Plastik vermeiden und bewusster einkaufen",
    grammar: [
      "Use ohne ... zu and statt ... zu to describe avoided and alternative consumer behaviour.",
      "Use nicht nur ... sondern auch and sowohl ... als auch to structure responsibility between consumers and companies.",
      "Use obwohl / dennoch to discuss convenience, price and environmental impact in a balanced way.",
    ],
    models: [
      "Man kann einkaufen, ohne jedes Produkt in Plastik verpacken zu lassen.",
      "Statt Einwegflaschen zu kaufen, kann man wiederverwendbare Flaschen benutzen.",
      "Nicht nur Verbraucher, sondern auch Unternehmen tragen Verantwortung für Verpackungsmüll.",
    ],
    speakingAnswers: [
      "Plastik ist im Alltag praktisch, wird aber oft nur sehr kurz benutzt. Deshalb ist bewusster Einkauf besonders dort sinnvoll, wo Einwegverpackungen ohne großen Aufwand vermieden werden können.",
      "Mehrwegprodukte können langfristig Müll reduzieren, kosten am Anfang aber manchmal mehr. Außerdem haben Verbraucher nicht immer die Möglichkeit, unverpackte oder plastikfreie Alternativen zu finden.",
      "Ich halte Mehrwegsysteme und Nachfüllangebote für besonders sinnvoll. Gleichzeitig sollten Hersteller Verpackungen reduzieren, statt die gesamte Verantwortung auf einzelne Kunden zu übertragen.",
      "In Deutschland sind Pfand- und Mehrwegsysteme verbreitet, während in Ghana Einwegverpackungen in vielen Bereichen weiterhin eine große Rolle spielen. Entscheidend ist deshalb, Lösungen an die lokale Infrastruktur anzupassen.",
      "Ich bevorzuge Produkte mit wenig Verpackung, sofern Preis und Qualität vergleichbar sind. Zum Beispiel nehme ich zum Einkaufen eine eigene Tasche mit, statt jedes Mal eine neue Plastiktüte zu verwenden.",
    ],
  },
  {
    day: 5,
    assignmentId: "B2-2.5",
    topic: "Nachhaltige Mobilität und öffentlicher Verkehr",
    grammar: [
      "Use während and wohingegen to compare transport options precisely.",
      "Use je ... desto to express relationships between public-transport quality and private-car dependence.",
      "Use indem / dadurch, dass to explain how cities can reduce traffic and emissions.",
    ],
    models: [
      "Während das Auto flexibel ist, verursacht der öffentliche Verkehr pro Person meist weniger Emissionen.",
      "Je zuverlässiger Busse und Bahnen sind, desto weniger Menschen sind auf das eigene Auto angewiesen.",
      "Städte können den Verkehr entlasten, indem sie sichere Radwege und attraktive Busverbindungen ausbauen.",
    ],
    speakingAnswers: [
      "Nachhaltige Mobilität betrifft nicht nur den Klimaschutz, sondern auch Luftqualität, Lärm und Lebensqualität in Städten. Gute Verkehrssysteme ermöglichen Menschen, ihre Ziele zu erreichen, ohne immer ein eigenes Auto zu benötigen.",
      "Öffentliche Verkehrsmittel können günstiger und klimafreundlicher sein, sind aber nur attraktiv, wenn sie zuverlässig und sicher funktionieren. In schlecht angebundenen Gebieten bleibt das Auto deshalb oft schwer zu ersetzen.",
      "Ich würde vor allem in zuverlässige Bus- und Bahnverbindungen investieren. Wenn Taktung, Sicherheit und Anschlüsse stimmen, wechseln mehr Menschen freiwillig vom Auto zum öffentlichen Verkehr.",
      "In Deutschland ist das Bahn- und Nahverkehrsnetz vielerorts dichter, obwohl es ebenfalls Probleme mit Verspätungen gibt. In Ghana könnten insbesondere gut organisierte Busnetze und sichere Fußwege den Stadtverkehr verbessern.",
      "Für kurze Strecken würde ich möglichst zu Fuß gehen oder öffentliche Verkehrsmittel nutzen. Für mich ist entscheidend, dass eine nachhaltige Alternative praktisch genug ist, um sie regelmäßig zu verwenden.",
    ],
  },
  {
    day: 6,
    assignmentId: "B2-2.6",
    topic: "Energie sparen und erneuerbare Energien",
    grammar: [
      "Use passive and modal passive to describe energy production, building standards and public measures.",
      "Use nominalisation for formal discussion: verbrauchen → der Verbrauch; ausbauen → der Ausbau; fördern → die Förderung.",
      "Use sodass / wodurch to explain the consequences of efficiency measures and renewable-energy expansion.",
    ],
    models: [
      "Der Energieverbrauch in Gebäuden kann durch bessere Dämmung deutlich gesenkt werden.",
      "Der Ausbau erneuerbarer Energien erfordert Investitionen in Netze und Speicher.",
      "Solaranlagen erzeugen Strom vor Ort, wodurch Haushalte teilweise unabhängiger vom Stromnetz werden können.",
    ],
    speakingAnswers: [
      "Energie ist ein zentrales Umweltthema, weil Stromerzeugung, Heizung und Verkehr einen großen Einfluss auf Emissionen haben. Gleichzeitig muss Energie für Haushalte und Unternehmen bezahlbar und zuverlässig bleiben.",
      "Erneuerbare Energien verursachen im Betrieb deutlich weniger Emissionen als fossile Brennstoffe. Herausforderungen entstehen jedoch durch Investitionskosten, schwankende Produktion und den notwendigen Ausbau von Stromnetzen und Speichern.",
      "Eine sinnvolle Strategie verbindet Energieeinsparung mit dem Ausbau erneuerbarer Quellen. Effiziente Geräte und Gebäude reduzieren zuerst den Bedarf, sodass die verbleibende Energie leichter nachhaltig bereitgestellt werden kann.",
      "Deutschland investiert stark in Wind- und Solarenergie, während Ghana aufgrund der hohen Sonneneinstrahlung ebenfalls großes Solarpotenzial besitzt. Die konkreten Lösungen hängen jedoch von Infrastruktur, Finanzierung und regionalen Bedingungen ab.",
      "Ich halte Energieeffizienz für einen Bereich, in dem Haushalte relativ schnell handeln können. Zum Beispiel kann man unnötigen Stromverbrauch reduzieren, ohne auf grundlegenden Komfort verzichten zu müssen.",
    ],
  },
  {
    day: 7,
    assignmentId: "B2-2.7",
    topic: "Klimafreundliches Wohnen und grüne Städte",
    grammar: [
      "Use relative clauses with prepositions to describe housing, neighbourhoods and infrastructure precisely.",
      "Use Konjunktiv II to formulate realistic proposals for greener neighbourhoods and cities.",
      "Use obwohl / dennoch and trotz to balance housing costs, density, green space and environmental goals.",
    ],
    models: [
      "Wohnviertel, in denen Geschäfte und Haltestellen gut erreichbar sind, reduzieren lange Alltagswege.",
      "Städte könnten mehr Bäume pflanzen und Flächen entsiegeln, um Hitze im Sommer zu verringern.",
      "Obwohl energieeffiziente Wohnungen zunächst teurer sein können, sinken dadurch häufig die laufenden Energiekosten.",
    ],
    speakingAnswers: [
      "Klimafreundliches Wohnen verbindet Energieverbrauch, Verkehr, Grünflächen und Lebensqualität. Besonders in wachsenden Städten ist wichtig, dass neue Wohnungen nicht völlig getrennt von Arbeitsplätzen, Schulen und öffentlichem Verkehr entstehen.",
      "Dichte Städte können Wege verkürzen und Infrastruktur effizient nutzen. Gleichzeitig können hohe Mieten, wenig Grün und starke Hitze zu Problemen werden, wenn Stadtentwicklung nur auf möglichst viele Gebäude ausgerichtet ist.",
      "Ich halte gemischte Viertel mit Wohnungen, Geschäften, Schulen, Grünflächen und guter Verkehrsanbindung für besonders sinnvoll. Dadurch müssen Bewohner im Alltag weniger lange Strecken zurücklegen.",
      "Deutsche Städte investieren zunehmend in energetische Sanierung, Radwege und Begrünung. In schnell wachsenden Städten in Ghana wäre zusätzlich wichtig, Grünflächen und Verkehrsinfrastruktur frühzeitig in neue Wohngebiete einzuplanen.",
      "Ich würde lieber in einem gut angebundenen Viertel mit etwas weniger Wohnfläche leben als weit außerhalb und täglich lange fahren müssen. Für mich gehören Wohnen und Mobilität deshalb unmittelbar zusammen.",
    ],
  },
];

function replaceLessonLine(source, lesson) {
  const replacement = `  { day: ${lesson.day}, topic: ${JSON.stringify(lesson.topic)}, grammar: ${JSON.stringify(lesson.grammar)}, models: ${JSON.stringify(lesson.models)} },`;
  const pattern = new RegExp(`^\\s*\\{ day: ${lesson.day}, topic: .*\\},$`, "m");
  if (pattern.test(source)) return source.replace(pattern, replacement);
  if (source.includes(`{ day: ${lesson.day}, topic: ${JSON.stringify(lesson.topic)}`)) return source;
  throw new Error(`B2 Day ${lesson.day} lesson definition not found`);
}

let b2Source = fs.readFileSync(b2SlidesPath, "utf8");
for (const lesson of lessons) b2Source = replaceLessonLine(b2Source, lesson);
fs.writeFileSync(b2SlidesPath, b2Source);

let dictionary = fs.readFileSync(dictionaryPath, "utf8");
for (const lesson of lessons) {
  const chapter = lesson.assignmentId.split("-")[1];
  const replacement = `    ${JSON.stringify(lesson.assignmentId)}: { assignment_id: ${JSON.stringify(lesson.assignmentId)}, chapter: ${JSON.stringify(chapter)}, de: ${JSON.stringify(lesson.topic)}, en: ${JSON.stringify(lesson.topic)} },`;
  const lines = dictionary.split("\n");
  let replaced = false;
  const nextLines = lines.map((line) => {
    if (line.includes(`${JSON.stringify(lesson.assignmentId)}: { assignment_id: ${JSON.stringify(lesson.assignmentId)}`)) {
      replaced = true;
      return replacement;
    }
    return line;
  });
  if (!replaced && !dictionary.includes(`de: ${JSON.stringify(lesson.topic)}`)) {
    throw new Error(`Course dictionary entry missing for ${lesson.assignmentId}`);
  }
  dictionary = nextLines.join("\n");
}
fs.writeFileSync(dictionaryPath, dictionary);

// B2 Day 1 previously forced an old identity-specific support override. The direct
// support from b2PresenterSlides is now the source of truth for the redesigned course.
let support = fs.readFileSync(teacherSupportPath, "utf8");
support = support.replace('const preferCurated = assignmentId === "B2-1.1";', "const preferCurated = false;");
fs.writeFileSync(teacherSupportPath, support);

// patchB2C1SpeakingModels.mjs generates this file first. Keep Days 8–28 unchanged,
// but align the five model answers for Days 1–7 with the new exam-domain questions.
if (fs.existsSync(advancedModelsPath)) {
  let advanced = fs.readFileSync(advancedModelsPath, "utf8");
  const startMarker = "const B2_SPEAKING_ANSWERS = ";
  const endMarker = ";\n\nconst C1_SPEAKING_ANSWERS = ";
  const start = advanced.indexOf(startMarker);
  const end = start >= 0 ? advanced.indexOf(endMarker, start) : -1;
  if (start < 0 || end < 0) throw new Error("Generated B2 speaking answers block missing");
  const jsonStart = start + startMarker.length;
  const answers = JSON.parse(advanced.slice(jsonStart, end));
  for (const lesson of lessons) answers[String(lesson.day)] = lesson.speakingAnswers;
  advanced = advanced.slice(0, jsonStart) + JSON.stringify(answers, null, 2) + advanced.slice(end);
  fs.writeFileSync(advancedModelsPath, advanced);
}

// Keep the existing B2 regression test aligned when npm test runs after this patch.
if (fs.existsSync(b2TestPath)) {
  let testSource = fs.readFileSync(b2TestPath, "utf8");
  const oldTopics = [
    "Persönliche Identität und Selbstverständnis",
    "Beziehungen und Kommunikation",
    "Öffentliches vs. Privates Leben",
    "Beruf und Karriere",
    "Bildung und Lernen",
    "Kultur und Gesellschaft",
    "Medien und digitale Welt",
  ];
  lessons.forEach((lesson, index) => {
    testSource = testSource.replace(JSON.stringify(oldTopics[index]), JSON.stringify(lesson.topic));
  });
  const oldTestStart = 'test("B2 Day 1 matches the real identity grammar and avoids old connector drills", () => {';
  const nextTestStart = 'test("B2 combined grammar entries preserve temporal and alternative targets", () => {';
  const startIndex = testSource.indexOf(oldTestStart);
  const nextIndex = testSource.indexOf(nextTestStart);
  if (startIndex >= 0 && nextIndex > startIndex) {
    const replacement = `test("B2 Day 1 starts the exam-domain redesign with practical environmental protection", () => {\n  const slide = getTeachingSlideByAssignmentId("B2-1.1");\n  const support = buildTeacherSlideSupport(slide);\n  const stages = buildTeachingPresenterStages(slide, slide.topic);\n  const grammarText = stages.find((stage) => stage.id === "grammar")?.items.join(" ") || "";\n  const supportText = support.grammarFocusEn.join(" ");\n\n  assert.match(slide.title, /Umweltschutz im Alltag/i);\n  assert.match(grammarText, /indem/i);\n  assert.match(grammarText, /dadurch/i);\n  assert.match(grammarText, /um .* zu|damit/i);\n  assert.match(supportText, /indem/i);\n  assert.doesNotMatch(supportText, /adjective endings/i);\n});\n\n`;
    testSource = testSource.slice(0, startIndex) + replacement + testSource.slice(nextIndex);
  }
  fs.writeFileSync(b2TestPath, testSource);
}

console.log("B2 Days 1–7 redesigned around Umwelt, waste, sustainable consumption, mobility, energy and green housing.");
