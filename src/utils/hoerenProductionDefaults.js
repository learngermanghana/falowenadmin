// Shared production defaults for all CEFR levels. These change local playback or
// speaker labels only; they never rewrite the words or answer evidence.
const NARRATION = /^(?:hören\b|sie hören\b|lesen sie\b|markieren sie\b|kreuzen sie\b|zu jedem text\b|entscheiden sie\b|beispiel\b|nummer\s+(?:\d+|eins|zwei|drei|vier|fünf|sechs|sieben|acht|neun|zehn)\b|aufgabe\s+\d+\b|ende (?:von )?hören\b|jetzt hören sie\b|sie bekommen\b|wählen sie\b)/iu;
const PAUSE = /^\[PAUSE\s+\d{1,2}\]$/i;
const SPOKEN = /^([ABCD]):\s*(.+)$/i;
const CAST = ["B", "C", "D"];

export function assignGoetheSpeakers(source) {
  const lines = String(source || "").replace(/\r\n/g, "\n").split("\n");
  // Each pause-delimited recording is a fresh situation. The presenter is A;
  // independent speakers use B/C/D, rotating on successive monologues.
  let start = 0;
  let groupNumber = 0;
  const output = [...lines];
  const rewriteGroup = end => {
    const actors = [];
    for (let i = start; i < end; i += 1) {
      const found = output[i].trim().match(SPOKEN);
      if (found && !NARRATION.test(found[2])) actors.push(found[1].toUpperCase());
    }
    if (!actors.length) return;
    const used = new Set(actors);
    let mapping = {};
    if (used.has("A")) {
      if (used.has("B") && used.has("C")) mapping = { A: "B", B: "C", C: "D" };
      else if (used.has("B")) mapping = { A: "B", B: "C" };
      else if (used.has("C")) mapping = { A: "B" };
      else mapping = { A: CAST[groupNumber % CAST.length] };
    }
    for (let i = start; i < end; i += 1) {
      const found = output[i].trim().match(SPOKEN);
      if (!found || NARRATION.test(found[2])) continue;
      const speaker = found[1].toUpperCase();
      if (mapping[speaker]) output[i] = `${mapping[speaker]}: ${found[2]}`;
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
  airport: /\b(?:flughafen|flugzeug|flug|terminal|gate|landebahn|abflug|ankunftsterminal|airport)\b/iu,
  station: /\b(?:bahnhof|bahnsteig|gleis|zug|s-bahn|u-bahn|ice|schaffner|hauptbahnhof|train station)\b/iu,
  cafe: /\b(?:café|cafe|restaurant|speisekarte|kellner|kellnerin|mittagessen|bäckerei)\b/iu,
  supermarket: /\b(?:supermarkt|kaufhaus|laden|einkaufen|kasse|umtauschen|lebensmittel|geschäft)\b/iu,
  clinic: /\b(?:arztpraxis|krankenhaus|apotheke|ärztin|rezept|patient|sprechstunde)\b/iu,
  street: /\b(?:straßenverkehr|ampel|straßenbahn|zebrastreifen|fußgänger|parkplatz)\b/iu,
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
