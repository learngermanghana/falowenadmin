// Shared production defaults for all CEFR levels. These change local playback or
// speaker labels only; they never rewrite the words or answer evidence.
const NARRATION = /^(?:hören\b|sie hören\b|lesen sie\b|markieren sie\b|kreuzen sie\b|zu jedem text\b|entscheiden sie\b|beispiel\b|nummer\s+(?:\d+|eins|zwei|drei|vier|fünf|sechs|sieben|acht|neun|zehn)\b|aufgabe\s+\d+\b|ende (?:von )?hören\b|jetzt hören sie\b|sie bekommen\b|wählen sie\b)/iu;
const PAUSE = /^\[PAUSE\s+\d{1,2}\]$/i;
const SPOKEN = /^([ABCD]):\s*(.+)$/i;
const CAST = ["B", "C", "D"];

export function assignGoetheSpeakers(source) {
  const lines = String(source || "").replace(/\r\n/g, "\n").split("\n");
  const output = [...lines];
  // Narrator A is never recast. Rotate B/C/D between independent tasks, while
  // preserving a distinct, consistent voice for each actor within each task.
  // Canonical group casting makes this safe to run twice (e.g. on editor blur).
  let start = 0;
  let groupNumber = 0;
  const rewriteGroup = end => {
    const actors = [];
    for (let i = start; i < end; i += 1) {
      const found = output[i].trim().match(SPOKEN);
      if (found && !NARRATION.test(found[2])) {
        const original = found[1].toUpperCase();
        if (!actors.includes(original)) actors.push(original);
      }
    }
    if (!actors.length) return;
    const mapping = Object.fromEntries(actors.map((speaker, i) =>
      [speaker, CAST[(groupNumber + i) % CAST.length]]));
    for (let i = start; i < end; i += 1) {
      const found = output[i].trim().match(SPOKEN);
      if (found && !NARRATION.test(found[2])) {
        output[i] = `${mapping[found[1].toUpperCase()]}: ${found[2]}`;
      }
    }
    groupNumber += 1;
  };
  for (let i = 0; i < lines.length; i += 1) {
    if (PAUSE.test(lines[i].trim())) {
      rewriteGroup(i);
      start = i + 1;
    }
  }
  rewriteGroup(lines.length);
  return output.join("\n");
}

const CUES = Object.freeze({
  airport: /(?<![\p{L}\p{N}])(?:flughafen|flugzeug|flug|terminal|gate|landebahn|abflug|ankunftsterminal|airport)(?![\p{L}\p{N}])/iu,
  station: /(?<![\p{L}\p{N}])(?:bahnhof|bahnsteig|gleis|zug|s-bahn|u-bahn|ice|schaffner|hauptbahnhof|train station)(?![\p{L}\p{N}])/iu,
  cafe: /(?<![\p{L}\p{N}])(?:café|cafe|restaurant|speisekarte|kellner|kellnerin|mittagessen|bäckerei)(?![\p{L}\p{N}])/iu,
  supermarket: /(?<![\p{L}\p{N}])(?:supermarkt|kaufhaus|laden|einkaufen|kasse|umtauschen|lebensmittel|geschäft)(?![\p{L}\p{N}])/iu,
  clinic: /(?<![\p{L}\p{N}])(?:arztpraxis|krankenhaus|apotheke|ärztin|rezept|patient|sprechstunde)(?![\p{L}\p{N}])/iu,
  street: /(?<![\p{L}\p{N}])(?:straßenverkehr|ampel|straßenbahn|zebrastreifen|fußgänger|parkplatz)(?![\p{L}\p{N}])/iu,
});
// An exam with several locations must not put a train-station sound under a
// hospital scene. Leave those recordings clean; manual override stays possible.
function classifyScene(text) {
  const matches = Object.entries(CUES).filter(([, pattern]) => pattern.test(text)).map(([scene]) => scene);
  return matches.length === 1 ? matches[0] : matches.length > 1 ? "mixed" : "none";
}
export function suggestRecordingScene({ script = "", topic = "", type = "", mode = "course" } = {}) {
  if (["radio", "podcast", "interview", "discussion", "lecture", "telephone"].includes(type)) return "none";
  const lines = String(script).split(/\[PAUSE\s+\d{1,2}\]/i);
  const detected = lines.map(classifyScene);
  if (detected.includes("mixed")) return "none";
  const situations = detected.filter(scene => scene !== "none");
  const unique = [...new Set(situations)];
  if (unique.length > 1) return "none";
  if (unique.length === 1) return unique[0];
  if (mode === "goethe" && lines.length > 2) return "none";
  return classifyScene(topic);
}
