// Group dialogue turns into small, pause-delimited scenes so Gemini's
// documented two-speaker TTS can produce a dialogue with one API request.
// Important: never send [PAUSE n] to TTS; add exact silence locally instead.
// A spoken Goethe instruction must be its own clip when the next dialogue uses
// two actors. Otherwise the narrator occupies one of Google's two voice slots
// and the actual two-person dialogue is split into separate clips.
const EXAM_NARRATION = /^(?:hören\b|sie hören\b|beispiel\b|nummer\s+(?:\d+|eins|zwei|drei|vier|fünf|sechs)\b|ende (?:von )?hören\b)/iu;
export function buildStudioSpeechPlan(lines, maxCharacters = 520) {
  const plan = [];
  let turns = [];
  let characters = 0;
  const flush = () => {
    if (turns.length) plan.push({ type: "speech", turns });
    turns = [];
    characters = 0;
  };
  for (const line of lines) {
    if (line.type === "pause") {
      flush();
      plan.push({ type: "pause", seconds: line.seconds });
      continue;
    }
    if (line.type !== "speech") throw new Error("Unsupported transcript segment.");
    if (turns.length && line.speaker !== "A" &&
        turns.every(turn => turn.speaker === "A" && EXAM_NARRATION.test(turn.text))) flush();
    const speakers = new Set([...turns.map(turn => turn.speaker), line.speaker]);
    if (turns.length && (speakers.size > 2 || turns.length >= 8 || characters + line.text.length > maxCharacters)) flush();
    turns.push({ speaker: line.speaker, text: line.text });
    characters += line.text.length;
  }
  flush();
  return plan;
}

export function sceneVoiceKey(engine, scene) {
  return JSON.stringify([engine, scene.turns.map(turn => [turn.speaker, turn.text])]);
}

export function assemblyScenePlan(plan) {
  // The assembler treats each *scene* as one already-spoken WAV, but retains
  // exact [PAUSE n] markers and repetition/soundscape behavior.
  return plan.map(item => item.type === "pause" ? item : { type: "speech", speaker: "A", text: "recorded scene" });
}
