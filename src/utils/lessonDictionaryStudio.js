// Starter curriculum for the quarterly, offline-first Lesson Dictionary Studio.
// Each dictionary owns its teaching content; slide text and scripts are derived from it.
export const DICTIONARY_SCHEMA_VERSION = 1;
export const STARTER_DICTIONARIES = [
  {
    id: "a1-greetings", level: "A1", title: "Begrüßung und Vorstellung",
    goal: "Sich begrüßen, den Namen sagen und nach dem Befinden fragen.",
    intro: "Wie begrüßt du eine neue Person auf Deutsch?",
    vocabulary: "Guten Morgen — good morning\nHallo — hello\nWie geht es dir? — how are you?\nMir geht es gut. — I am fine.",
    grammar: "ich heiße … / du heißt …\nWie heißt du? — Ich heiße Ama.\nDu-Form für Freunde; Sie-Form für formelle Situationen.",
    examples: "Hallo! Ich heiße Ama. | Hello! My name is Ama.\nWie heißen Sie? | What is your name? (formal)\nMir geht es gut, danke. | I am fine, thank you.",
    mistakes: "Wie du heißt? | Wie heißt du? | Im Fragesatz steht das Verb an Position eins.\nIch bin heißen Ama. | Ich heiße Ama. | Das Verb heißen steht allein.",
    practice: "Begrüße eine Person und stelle dich in zwei Sätzen vor.",
    recap: "Begrüßung, Name und Befinden: drei Schritte für ein erstes Gespräch.", quarter: "2026-Q4",
  },
  {
    id: "a1-routine", level: "A1", title: "Mein Tagesablauf",
    goal: "Den Tagesablauf mit Uhrzeiten und trennbaren Verben beschreiben.",
    intro: "Was machst du am Morgen, am Mittag und am Abend?",
    vocabulary: "aufstehen — to get up\nfrühstücken — to have breakfast\narbeiten — to work\nschlafen — to sleep",
    grammar: "Ich stehe um sieben Uhr auf.\nDas trennbare Präfix kommt ans Satzende.\nZeitangaben: um 7 Uhr, am Montag, jeden Tag.",
    examples: "Ich stehe um sechs Uhr auf. | I get up at six.\nAm Abend lerne ich Deutsch. | In the evening I study German.\nWann frühstückst du? | When do you have breakfast?",
    mistakes: "Ich aufstehe um sieben Uhr. | Ich stehe um sieben Uhr auf. | Das Präfix steht am Ende.\nUm Montag arbeite ich. | Am Montag arbeite ich. | Wochentage verwenden am.",
    practice: "Beschreibe deinen Morgen mit drei Verben und zwei Uhrzeiten.",
    recap: "Verb auf Position zwei; trennbares Präfix am Ende.", quarter: "2026-Q4",
  },
  {
    id: "a1-shopping", level: "A1", title: "Einkaufen und Preise",
    goal: "Nach Preisen fragen und höflich einkaufen.",
    intro: "Was kostet das? Und wie viel möchten Sie kaufen?",
    vocabulary: "der Preis — price\nbillig — inexpensive\nteuer — expensive\ndie Rechnung — bill",
    grammar: "Was kostet das? — Das kostet fünf Euro.\nIch hätte gern … ist eine höfliche Bestellung.\nAkkusativ: Ich kaufe einen Apfel.",
    examples: "Wie viel kostet die Tasche? | How much does the bag cost?\nIch hätte gern einen Kaffee. | I would like a coffee.\nDas ist mir zu teuer. | That is too expensive for me.",
    mistakes: "Ich möchte ein Apfel. | Ich möchte einen Apfel. | Maskuline Akkusativform.\nWie viel kosten das? | Wie viel kostet das? | Das verlangt die Singularform.",
    practice: "Spiele ein kurzes Einkaufsgespräch mit Preis und Bestellung.",
    recap: "Preis erfragen, Bestellung formulieren und den Akkusativ beachten.", quarter: "2026-Q4",
  },
  {
    id: "a2-restaurant", level: "A2", title: "Im Restaurant",
    goal: "Bestellen, nach Empfehlungen fragen und sich höflich beschweren.",
    intro: "Wie führst du ein natürliches Gespräch im Restaurant?",
    vocabulary: "die Speisekarte — menu\ndie Vorspeise — starter\ndie Rechnung — bill\ndie Empfehlung — recommendation",
    grammar: "Ich hätte gern … (höflicher Wunsch).\nKönnten Sie mir … bringen? (Konjunktiv II).\nweil-Satz: Ich frage nach, weil das Essen kalt ist.",
    examples: "Was können Sie empfehlen? | What can you recommend?\nKönnten wir bitte zahlen? | Could we pay, please?\nDas Essen ist leider kalt. | Unfortunately, the food is cold.",
    mistakes: "Könnten Sie bringen mir Wasser? | Könnten Sie mir Wasser bringen? | Der Infinitiv steht am Ende.\nWeil das Essen ist kalt. | Weil das Essen kalt ist. | Weil verschiebt das Verb ans Ende.",
    practice: "Bestelle ein Gericht und äußere eine höfliche Nachfrage.",
    recap: "Höfliche Wünsche, Nebensätze und typische Restaurantformeln.", quarter: "2026-Q4",
  },
  {
    id: "a2-travel", level: "A2", title: "Unterwegs und nach dem Weg fragen",
    goal: "Verbindungen vergleichen und nach dem Weg fragen.",
    intro: "Du bist neu in einer Stadt. Wie kommst du zum Bahnhof?",
    vocabulary: "die Haltestelle — stop\numsteigen — to transfer\nabbiegen — to turn\ndie Verspätung — delay",
    grammar: "mit + Dativ: mit dem Bus, mit der Bahn.\nzu + Dativ: zum Bahnhof, zur Schule.\nImperativ: Gehen Sie geradeaus!",
    examples: "Wo muss ich umsteigen? | Where must I transfer?\nFahren Sie mit der Straßenbahn. | Take the tram.\nDer Zug hat zehn Minuten Verspätung. | The train is ten minutes late.",
    mistakes: "mit den Bus | mit dem Bus | Mit fordert den Dativ.\nIch fahre zu Bahnhof. | Ich fahre zum Bahnhof. | Zu dem wird zum.",
    practice: "Erkläre einer Person den Weg zum Bahnhof mit zwei Richtungsangaben.",
    recap: "Verkehrsmittel mit Dativ, Richtungen und höfliche Wegbeschreibungen.", quarter: "2026-Q4",
  },
  {
    id: "a2-work", level: "A2", title: "Beruf und Karriere",
    goal: "Über Beruf, Pläne und bisherige Erfahrungen sprechen.",
    intro: "Was möchtest du beruflich erreichen?",
    vocabulary: "die Bewerbung — application\ndie Ausbildung — training\ndie Erfahrung — experience\ndas Ziel — goal",
    grammar: "Ich möchte … werden.\nIch habe als Verkäufer gearbeitet. (Perfekt)\nIch plane, einen Kurs zu besuchen. (Infinitiv mit zu)",
    examples: "Ich möchte Lehrerin werden. | I want to become a teacher.\nIch habe zwei Jahre Erfahrung. | I have two years of experience.\nMein Ziel ist, Deutsch zu verbessern. | My goal is to improve my German.",
    mistakes: "Ich möchte werde Arzt. | Ich möchte Arzt werden. | Modalverb mit Infinitiv am Ende.\nIch habe gearbeitet als Koch. | Ich habe als Koch gearbeitet. | Partizip am Satzende.",
    practice: "Stelle deinen Berufswunsch und einen nächsten Schritt vor.",
    recap: "Berufswünsche, Perfekt und persönliche Zukunftspläne.", quarter: "2026-Q4",
  },
  {
    id: "b1-health", level: "B1", title: "Gesundheit und Wohlbefinden",
    goal: "Beschwerden beschreiben und Ratschläge begründen.",
    intro: "Was hilft dir, dich im Alltag besser zu fühlen?",
    vocabulary: "die Beschwerden — symptoms\ndie Untersuchung — examination\nsich erholen — to recover\nvorbeugen — to prevent",
    grammar: "Du solltest mehr schlafen. (Konjunktiv II)\nWenn ich müde bin, mache ich eine Pause.\nDeshalb / trotzdem verknüpfen Hauptsätze.",
    examples: "Du solltest dich ausruhen. | You should rest.\nObwohl ich müde bin, gehe ich spazieren. | Although I am tired, I go for a walk.\nIch bin erkältet, deshalb bleibe ich zu Hause. | I have a cold, so I stay home.",
    mistakes: "Obwohl ich bin müde … | Obwohl ich müde bin … | Nebensatzverb am Ende.\nDu sollst besser schlafen. | Du solltest besser schlafen. | Solltest klingt als Rat höflicher.",
    practice: "Gib zwei begründete Ratschläge für einen gesünderen Alltag.",
    recap: "Ratschläge und Konnektoren differenziert einsetzen.", quarter: "2026-Q4",
  },
  {
    id: "b1-environment", level: "B1", title: "Umweltfreundlich leben",
    goal: "Nachhaltige Gewohnheiten beschreiben und Vorschläge begründen.",
    intro: "Welche kleine Veränderung hat eine große Wirkung?",
    vocabulary: "die Verpackung — packaging\nvermeiden — to avoid\nwiederverwenden — to reuse\nnachhaltig — sustainable",
    grammar: "Statt das Auto zu nehmen, fahre ich Rad.\nJe mehr wir sparen, desto besser …\nPassiv: Papier wird recycelt.",
    examples: "Ich vermeide unnötige Verpackungen. | I avoid unnecessary packaging.\nPapier wird getrennt gesammelt. | Paper is collected separately.\nJe weniger wir verschwenden, desto besser. | The less we waste, the better.",
    mistakes: "Ich fahre mit Fahrrad. | Ich fahre mit dem Fahrrad. | Nach mit steht der Dativ.\nPapier werden recycelt. | Papier wird recycelt. | Singularsubjekt verlangt wird.",
    practice: "Formuliere drei praktische Umwelttipps und erkläre warum.",
    recap: "Konkrete Maßnahmen, Passiv und nachvollziehbare Begründungen.", quarter: "2026-Q4",
  },
  {
    id: "b2-media", level: "B2", title: "Medien und digitale Gesellschaft",
    goal: "Mediennutzung kritisch bewerten und Argumente abwägen.",
    intro: "Informieren soziale Medien – oder beeinflussen sie uns stärker, als wir denken?",
    vocabulary: "die Reichweite — reach\ndie Glaubwürdigkeit — credibility\ndie Desinformation — misinformation\nhinterfragen — to question",
    grammar: "Einerseits … andererseits …\nWährend einige …, sehen andere …\nIndirekte Rede: Die Studie zeige, dass …",
    examples: "Einerseits verbinden soziale Medien Menschen, andererseits können sie ablenken. | Social media connects but can distract.\nQuellen sollten kritisch geprüft werden. | Sources should be checked critically.\nDie Autorin behauptet, die Zahlen seien eindeutig. | The author claims the figures are clear.",
    mistakes: "Obwohl Medien sind wichtig … | Obwohl Medien wichtig sind … | Nebensatzwortstellung.\nAuf der anderen Seite, soziale Medien … | Andererseits können soziale Medien … | Vollständigen Hauptsatz bilden.",
    practice: "Diskutiere je ein Argument für und gegen personalisierte Nachrichten.",
    recap: "Position beziehen, Gegenargumente würdigen und Aussagen einordnen.", quarter: "2026-Q4",
  },
  {
    id: "c1-argumentation", level: "C1", title: "Argumentieren und differenzieren",
    goal: "Komplexe Positionen entwickeln, einschränken und überzeugend zusammenführen.",
    intro: "Wie wird aus einer Meinung ein nachvollziehbares Argument?",
    vocabulary: "die Voraussetzung — prerequisite\ndie Abwägung — weighing of options\nnachvollziehbar — comprehensible\neinräumen — to concede",
    grammar: "Zwar …, jedoch …\nUnter der Voraussetzung, dass …\nEs lässt sich nicht von der Hand weisen, dass …",
    examples: "Zwar bietet die Digitalisierung Chancen, jedoch entstehen neue Abhängigkeiten. | Digitalization has opportunities but also dependencies.\nDies gilt allerdings nur unter bestimmten Voraussetzungen. | This applies only under certain conditions.\nEs wäre verkürzt, den Erfolg allein daran zu messen. | It would be reductive to measure success by that alone.",
    mistakes: "Trotzdem dass die Kosten steigen … | Obwohl die Kosten steigen … | Trotzdem leitet keinen dass-Satz ein.\nEs hängt von ab, wie … | Es hängt davon ab, wie … | Pronominaladverb mit davon.",
    practice: "Formuliere eine These, ein Gegenargument und eine differenzierte Schlussfolgerung.",
    recap: "Präzise Verknüpfungen und begrenzte Aussagen machen Argumente stärker.", quarter: "2026-Q4",
  },
];

export const currentDictionaryQuarter = (date = new Date()) =>
  String(date.getFullYear()) + "-Q" + String(Math.floor(date.getMonth() / 3) + 1);
export const DICTIONARY_FIELDS = ["id","level","title","goal","intro","vocabulary","grammar","examples","mistakes","practice","recap","quarter"];
export function validateDictionaries(value) {
  const list = Array.isArray(value) ? value : value?.dictionaries;
  if (!Array.isArray(list) || list.length < 1 || list.length > 100) throw new Error("Provide between 1 and 100 lesson dictionaries.");
  const seen = new Set();
  return list.map((item, index) => {
    if (!item || typeof item !== "object") throw new Error("Invalid dictionary at position " + (index + 1) + ".");
    const next = {};
    for (const key of DICTIONARY_FIELDS) {
      if (typeof item[key] !== "string" || item[key].length > 12000) throw new Error("Invalid " + key + " in dictionary " + (index + 1) + ".");
      next[key] = item[key];
    }
    if (!/^[a-z0-9-]{3,80}$/.test(next.id) || seen.has(next.id)) throw new Error("Dictionary IDs must be unique URL-safe strings.");
    seen.add(next.id);
    return next;
  });
}
const lines = str => String(str || "").split("\n").map(s => s.trim()).filter(Boolean);
const pairs = str => lines(str).map(s => s.split("|").map(v => v.trim()));
function scriptFor(section, pack) {
  if (section === "intro") return "Willkommen bei Falowen. Heute geht es um " + pack.title + ". " + pack.intro + " Unser Lernziel: " + pack.goal;
  if (section === "vocabulary") return "Wir beginnen mit dem Wortschatz. " + lines(pack.vocabulary).map(v => v.split("—")[0].trim()).join(". ") + ". Sprich die Wörter laut nach.";
  if (section === "grammar") return "Jetzt kommt die Grammatik. " + lines(pack.grammar).join(" ") + " Achte auf die Stellung des Verbs.";
  if (section === "examples") return "Hören wir einige Beispiele. " + pairs(pack.examples).map(v => v[0]).join(" [PAUSE 1] ") + " [PAUSE 2] Versuche, eigene Sätze zu bilden.";
  if (section === "mistakes") return "Diese Fehler solltest du vermeiden. " + pairs(pack.mistakes).map(v => "Nicht: " + (v[0] || "") + ". Sondern: " + (v[1] || "") + ". " + (v[2] || "")).join(" ");
  return "Jetzt bist du dran. " + pack.practice + " [PAUSE 3] Merke dir: " + pack.recap + " Viel Erfolg beim Üben.";
}
export function dictionaryStoryboard(pack, overrides = {}) {
  if (!pack) return [];
  const sections = [
    { kind: "intro", label: "01 / INTRO", heading: pack.title, detail: pack.intro, bullets: [pack.goal] },
    { kind: "vocabulary", label: "02 / WORTSCHATZ", heading: "Wichtige Wörter", detail: "Wortschatz für den Alltag", bullets: lines(pack.vocabulary) },
    { kind: "grammar", label: "03 / GRAMMATIK", heading: "Grammatik verstehen", detail: "Regeln und Satzbau", bullets: lines(pack.grammar) },
    { kind: "examples", label: "04 / BEISPIELE", heading: "So klingt es richtig", detail: "Deutsch mit englischer Hilfe", bullets: pairs(pack.examples).map(v => (v[0] || "") + (v[1] ? "\n" + v[1] : "")) },
    { kind: "mistakes", label: "05 / FEHLER", heading: "Häufige Fehler", detail: "Falsch → richtig", bullets: pairs(pack.mistakes).map(v => (v[0] || "") + "  →  " + (v[1] || "")) },
    { kind: "practice", label: "06 / PRAXIS", heading: "Jetzt bist du dran", detail: pack.practice, bullets: [pack.recap] },
  ];
  return sections.map((entry, index) => ({ ...entry, id: pack.id + "-" + entry.kind, start: 0, text: entry.heading,
    script: Object.prototype.hasOwnProperty.call(overrides, entry.kind) ? String(overrides[entry.kind]) : scriptFor(entry.kind, pack),
    index }));
}
export function renderDictionarySlide(slide, { aspect = "landscape", theme = "night", level = "A1", quarter = "" } = {}) {
  const portrait = aspect === "tiktok";
  const canvas = document.createElement("canvas");
  canvas.width = portrait ? 720 : 1280;
  canvas.height = portrait ? 1280 : 720;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Your browser cannot draw teaching slides.");
  const light = theme === "paper", forest = theme === "forest";
  const bg = light ? "#f7f8f4" : forest ? "#092d2d" : "#0b1f3c";
  const ink = light ? "#142840" : "#ffffff";
  const muted = light ? "#496179" : "#bbcee2";
  const accent = light ? "#075bb4" : forest ? "#a1e1b8" : "#6de0e3";
  const width = canvas.width, height = canvas.height;
  const margin = portrait ? 54 : 86;
  ctx.fillStyle = bg; ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = accent; ctx.fillRect(0, 0, portrait ? 12 : 14, height);
  ctx.fillStyle = light ? "#e7edf1" : "rgba(255,255,255,0.05)";
  ctx.fillRect(margin - 20, portrait ? 240 : 170, width - 2 * margin + 40, portrait ? 830 : 430);
  ctx.fillStyle = accent; ctx.font = "bold " + (portrait ? 23 : 22) + "px sans-serif";
  ctx.fillText("FALOWEN   /   GERMAN LEARNING", margin, portrait ? 88 : 70);
  ctx.fillStyle = muted; ctx.font = (portrait ? 21 : 19) + "px sans-serif";
  ctx.fillText(level + "    •    " + slide.label + "    •    " + quarter, margin, portrait ? 140 : 108);
  function wrap(text, maxWidth, font, maxLines) {
    ctx.font = font;
    const out = [];
    for (const paragraph of String(text || "").split("\n")) {
      let row = "";
      for (const word of paragraph.split(/\s+/)) {
        const next = row ? row + " " + word : word;
        if (ctx.measureText(next).width > maxWidth && row) { out.push(row); row = word; }
        else row = next;
      }
      if (row) out.push(row);
    }
    return out.slice(0, maxLines);
  }
  const titleY = portrait ? 322 : 230;
  ctx.fillStyle = ink;
  const titleFont = "bold " + (portrait ? 48 : 54) + "px sans-serif";
  const titleRows = wrap(slide.heading, width - 2 * margin, titleFont, 3);
  ctx.font = titleFont; titleRows.forEach((line, i) => ctx.fillText(line, margin, titleY + i * (portrait ? 62 : 66)));
  const detailY = titleY + titleRows.length * (portrait ? 62 : 66) + 21;
  const detailFont = (portrait ? 27 : 29) + "px sans-serif";
  ctx.fillStyle = accent; ctx.font = detailFont;
  const detailRows = wrap(slide.detail, width - 2 * margin, detailFont, portrait ? 5 : 2);
  detailRows.forEach((line, i) => ctx.fillText(line, margin, detailY + i * 42));
  let y = detailY + detailRows.length * 43 + (portrait ? 32 : 20);
  ctx.fillStyle = ink;
  const bodyFont = (portrait ? 29 : 29) + "px sans-serif";
  const maxY = height - (portrait ? 160 : 95);
  for (const bullet of slide.bullets.slice(0, portrait ? 7 : 5)) {
    const linesOfBullet = wrap(bullet, width - 2 * margin - 43, bodyFont, portrait ? 5 : 3);
    if (y + linesOfBullet.length * 38 + 19 > maxY) break;
    ctx.fillStyle = accent; ctx.beginPath(); ctx.arc(margin + 8, y - 9, 5, 0, 2 * Math.PI); ctx.fill();
    ctx.fillStyle = ink; ctx.font = bodyFont;
    linesOfBullet.forEach((line, j) => { ctx.fillText(line, margin + 30, y + j * 38); });
    y += linesOfBullet.length * 38 + (portrait ? 25 : 13);
  }
  ctx.fillStyle = muted; ctx.font = (portrait ? 20 : 18) + "px sans-serif";
  ctx.fillText("Learn German with Falowen   •   falowen.app", margin, height - 43);
  return canvas.toDataURL("image/png");
}
