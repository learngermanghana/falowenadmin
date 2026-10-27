import {parseStudioTranscript,repairUnlabelledStudioLines,sameSpokenTranscript} from "./hoerenAudio.js";

// Automatic voice casting is used only when first generating an AI script.
// Saving manually edited B/C/D voices must not remap teacher choices.
export function prepareSavedBatchTranscript(original,edited){
  const next=repairUnlabelledStudioLines(edited??original);
  parseStudioTranscript(next);
  return {next,changed:next!==original,wordsUnchanged:sameSpokenTranscript(original,next)};
}

// Explicit regeneration reuses the saved script and questions, and keeps the
// existing MP3 intact until a replacement has successfully assembled.
export function shouldGenerateBatchAudio(part={},regenerateAudio=false){
  return regenerateAudio||!(part.audio instanceof Blob&&part.questions?.length);
}
