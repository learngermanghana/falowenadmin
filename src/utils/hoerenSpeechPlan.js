// Group dialogue turns into small, pause-delimited scenes so Gemini's
// documented two-speaker TTS can produce a dialogue with one API request.
// Important: never send [PAUSE n] to TTS; add exact silence locally instead.
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
