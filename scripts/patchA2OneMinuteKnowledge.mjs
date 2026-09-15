import fs from "node:fs";

const presenterPath = new URL("../src/utils/teachingPresenter.js", import.meta.url);
const a2SlidesPath = new URL("../src/data/a2WorkbookAlignedSlidesDays16To20.js", import.meta.url);

function replaceOnce(source, anchor, replacement, label) {
  if (source.includes(replacement)) return source;
  if (!source.includes(anchor)) throw new Error(`A2 one-minute knowledge patch anchor missing: ${label}`);
  return source.replace(anchor, replacement);
}

function patchPresenter() {
  let source = fs.readFileSync(presenterPath, "utf8");
  const anchor = `    {\n      id: "warmup",\n      type: "list",\n      kicker: "Warm-up",\n      title: advanced ? "Einstieg" : "Warm-up",\n      items: Array.isArray(slide.warmupQuestionsDe) ? slide.warmupQuestionsDe : [],\n      suggestedMinutes: interactionMinutes(slide, 0) || 5,\n    },\n    {\n      id: "phrases",`;
  const replacement = `    {\n      id: "warmup",\n      type: "list",\n      kicker: "Warm-up",\n      title: advanced ? "Einstieg" : "Warm-up",\n      items: Array.isArray(slide.warmupQuestionsDe) ? slide.warmupQuestionsDe : [],\n      suggestedMinutes: interactionMinutes(slide, 0) || 5,\n    },\n    {\n      id: "knowledge",\n      type: "task",\n      kicker: "1 Minute",\n      title: "1-Minute-Wissen",\n      body: slide.knowledgeTextDe || "",\n      suggestedMinutes: 1,\n    },\n    {\n      id: "phrases",`;
  source = replaceOnce(source, anchor, replacement, "insert knowledge stage after warm-up");
  fs.writeFileSync(presenterPath, source);
}

function patchDay19() {
  let source = fs.readFileSync(a2SlidesPath, "utf8");
  const anchor = `    assignmentId: "A2-7.19",\n    title: "A2 Day 19 · Einkaufen: wo und wie?",\n    topic: "7.19 Einkaufen? Wo und wie?",\n    objective: "Students discuss shopping choices with oder, justify choices with denn, and connect shopping habits to the invitation, sustainable-consumption reading and online-shopping listening tasks.",\n    estimatedDuration: "45–60 minutes",`;
  const replacement = `    assignmentId: "A2-7.19",\n    title: "A2 Day 19 · Einkaufen: wo und wie?",\n    topic: "7.19 Einkaufen? Wo und wie?",\n    objective: "Students discuss shopping choices with oder, justify choices with denn, and connect shopping habits to the invitation, sustainable-consumption reading and online-shopping listening tasks.",\n    estimatedDuration: "45–60 minutes",\n    knowledgeTextDe: "In Deutschland kaufen viele Menschen Lebensmittel im Supermarkt, aber Wochenmärkte sind ebenfalls beliebt. Im Supermarkt findet man viele Produkte an einem Ort. Auf dem Wochenmarkt gibt es oft regionale Lebensmittel, zum Beispiel Obst, Gemüse, Käse oder Brot. Manche Menschen kaufen lieber online ein, denn das spart Zeit. Andere gehen gern in Geschäfte, denn dort können sie Produkte direkt sehen und ausprobieren. Beim Einkaufen achten viele Kundinnen und Kunden auf Preis, Qualität und Herkunft. Für nachhaltiges Einkaufen kann man Mehrwegtaschen benutzen, regionale Produkte wählen und nur das kaufen, was man wirklich braucht.",`;
  source = replaceOnce(source, anchor, replacement, "add A2-7.19 knowledge text");
  fs.writeFileSync(a2SlidesPath, source);
}

patchPresenter();
patchDay19();
console.log("A2 Day 19 one-minute knowledge slide is wired into Presenter.");
