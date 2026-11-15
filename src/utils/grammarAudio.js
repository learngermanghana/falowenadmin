import { splitLongStudioSpeech } from "./hoerenAudio.js";

// One language per line prevents English narration from being pronounced as German.
// These markers control generation only and are never passed to the speech model.
export function parseGrammarAudioScript(source) {
  const input = String(source || "").replace(/\r\n?/g, "\n").trim();
  if (!input) throw new Error("Paste a script or generate one first.");
  if (input.length > 6500) throw new Error("Keep the grammar script under 6,500 characters.");
  const output = [];
  for (const [index, raw] of input.split("\n").entries()) {
    const line = raw.trim();
    if (!line) continue;
    const pause = /^\[PAUSE\s+(\d{1,2})\]$/i.exec(line);
    if (pause) {
      const seconds = Number(pause[1]);
      if (seconds < 1 || seconds > 15) throw new Error("Pauses must be between 1 and 15 seconds.");
      output.push({ type: "pause", seconds });
      continue;
    }
    const match = /^(EN|DE):\s*(.+)$/i.exec(line);
    if (!match) throw new Error(`Line ${index + 1}: start with EN: or DE:, or use [PAUSE 2] on its own line.`);
    const language = match[1].toUpperCase() === "DE" ? "de-DE" : "en-GB";
    const text = match[2].trim();
    if (/\[(?:PAUSE|SILENCE|REPEAT)\b/i.test(text)) throw new Error(`Line ${index + 1}: put pauses on a separate line.`);
    if (!text) throw new Error(`Line ${index + 1} is empty.`);
    for (const chunk of splitLongStudioSpeech(text, 320)) {
      output.push({ type: "speech", text: chunk, language });
    }
  }
  if (!output.some(item => item.type === "speech")) throw new Error("Add at least one EN: or DE: spoken line.");
  return output;
}

export function planGrammarAudio(parts) {
  const plan = [];
  let turns = [];
  let language = "";
  let characters = 0;
  const flush = () => {
    if (turns.length) plan.push({ type: "speech", language, turns });
    turns = [];
    language = "";
    characters = 0;
  };
  for (const part of parts) {
    if (part.type === "pause") {
      flush();
      plan.push({ type: "pause", seconds: part.seconds });
      continue;
    }
    if (part.type !== "speech" || !["de-DE", "en-GB"].includes(part.language)) throw new Error("Unsupported narration segment.");
    if (turns.length && (part.language !== language || turns.length >= 8 || characters + part.text.length > 520)) flush();
    language = part.language;
    turns.push({ speaker: "A", text: part.text });
    characters += part.text.length;
  }
  flush();
  if (plan.filter(item => item.type === "speech").length > 36) {
    throw new Error("This recording exceeds 36 generated scenes. Divide the lesson into shorter parts.");
  }
  return plan;
}

export function grammarAudioCacheKey(engine, scene) {
  return JSON.stringify(["grammar-v1", engine, scene.language, scene.turns.map(({ text }) => text)]);
}

export function grammarAssemblyPlan(plan) {
  return plan.map(item => item.type === "pause" ? item : { type: "speech", speaker: "A", text: "audio" });
}
