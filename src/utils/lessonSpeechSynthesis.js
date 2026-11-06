import { assembleListeningExam, splitLongStudioSpeech, wavDurationSeconds } from "./hoerenAudio.js";
import { assemblyScenePlan, sceneVoiceKey } from "./hoerenSpeechPlan.js";

export const VIDEO_SPEECH_GAP = 0.35;
export const VIDEO_SPEECH_MAX_SCENES = 36;
export const VIDEO_SPEECH_MAX_CHARACTERS = 12000;

export function buildLessonNarrationPlan({ slides = [], fullScript = "", source = "auto", engine = "lite", speaker = "A" }) {
  if (!Array.isArray(slides) || !slides.length) throw new Error("Import your slides before generating narration.");
  if (!["auto", "slides", "full"].includes(source)) throw new Error("Choose a supported narration source.");
  if (!["lite", "flash"].includes(engine) || !["A", "B", "C", "D"].includes(speaker))
    throw new Error("Choose a supported Hören Studio voice.");
  const slideHasText = slides.some(slide => String(slide.script || "").trim());
  const useSlides = source === "slides" || (source === "auto" && slideHasText);
  const entries = useSlides
    ? slides.map((slide, slideIndex) => ({ text: String(slide.script || "").trim(), slideIndex }))
    : [{ text: String(fullScript || "").trim(), slideIndex: 0 }];
  if (!useSlides && !entries[0].text) throw new Error("Write a full transcript or narration for each slide first.");
  const empty = entries.find(entry => !entry.text);
  if (empty) throw new Error("Slide " + (empty.slideIndex + 1) + " has no narration. Write its script or choose Full transcript.");
  const characterCount = entries.reduce((sum, entry) => sum + entry.text.length, 0);
  if (characterCount > VIDEO_SPEECH_MAX_CHARACTERS)
    throw new Error("This recording is too long. Limit narration to 12,000 characters or make two videos.");

  const steps = [];
  for (const { text, slideIndex } of entries) {
    const parts = text.split(/(\[PAUSE\s+\d{1,2}\])/gi).filter(Boolean);
    for (const part of parts) {
      const pause = part.match(/^\[PAUSE\s+(\d{1,2})\]$/i);
      if (pause) {
        const seconds = Number(pause[1]);
        if (seconds < 1 || seconds > 20) throw new Error("Pauses must be written as [PAUSE 2] (1–20 seconds).");
        steps.push({ type: "pause", seconds, slideIndex });
        continue;
      }
      if (/\[\s*(?:PAUSE|SILENCE|REPEAT)\b/i.test(part))
        throw new Error("Use [PAUSE 2] for a two-second pause; do not include unsupported directions in speech text.");
      // Preserve every spoken word; only collapse unnecessary whitespace.
      const chunks = splitLongStudioSpeech(part.replace(/\s+/g, " ").trim(), 300);
      let turns = [], count = 0;
      const flush = () => {
        if (turns.length) steps.push({ type: "speech", turns, slideIndex });
        turns = []; count = 0;
      };
      for (const chunk of chunks) {
        if (turns.length && (turns.length >= 8 || count + chunk.length > 520)) flush();
        turns.push({ speaker, text: chunk });
        count += chunk.length;
      }
      flush();
    }
  }
  const scenes = steps.filter(step => step.type === "speech");
  if (!scenes.length) throw new Error("Add spoken text before requesting generated audio.");
  if (scenes.length > VIDEO_SPEECH_MAX_SCENES)
    throw new Error("This narration requires " + scenes.length + " scenes; the limit is 36 to avoid unexpected Google charges.");
  const keys = scenes.map(scene => sceneVoiceKey(engine, scene));
  return { steps, scenes, keys, uniqueKeys: [...new Set(keys)], source: useSlides ? "slides" : "full",
    characterCount, engine, speaker };
}
export function lessonNarrationSlideStarts(plan, speechClips, lineGap = VIDEO_SPEECH_GAP) {
  if (!plan?.steps?.length || speechClips.length !== plan.scenes.length)
    throw new Error("Every voice scene must be available before calculating slide timings.");
  let elapsed = 0, clip = 0;
  const starts = new Map();
  for (const step of plan.steps) {
    if (!starts.has(step.slideIndex)) starts.set(step.slideIndex, Math.round(elapsed * 100) / 100);
    if (step.type === "pause") elapsed += step.seconds;
    else {
      elapsed += wavDurationSeconds(speechClips[clip]) + lineGap;
      clip += 1;
    }
  }
  return { starts, duration: elapsed };
}
export function assembleLessonNarration(plan, speechClips) {
  if (!plan?.steps?.length || !Array.isArray(speechClips) || speechClips.length !== plan.scenes.length)
    throw new Error("Not all narration clips have been generated.");
  return assembleListeningExam(assemblyScenePlan(plan.steps), speechClips, {
    repeats: 1, lineGap: VIDEO_SPEECH_GAP, soundscape: null,
  });
}


/**
 * Assemble the contiguous saved portion of a recording after a provider error.
 * Never send a Google request: scenes come exclusively from the existing
 * Hören Studio on-device cache. The result is deliberately labelled PARTIAL.
 */
export function recoverLessonNarrationPrefix(plan, cached) {
  if (!plan?.steps?.length || typeof cached !== "function") return null;
  const steps = [], clips = [];
  for (const step of plan.steps) {
    if (step.type === "pause") {
      if (clips.length) steps.push(step);
      continue;
    }
    const audio = cached(sceneVoiceKey(plan.engine, step));
    if (!audio) break;
    steps.push(step); clips.push(audio);
  }
  while (steps.length && steps[steps.length - 1].type === "pause") steps.pop();
  if (!clips.length) return null;
  return {
    scenes: clips.length,
    total: plan.scenes.length,
    complete: clips.length === plan.scenes.length,
    audio: assembleLessonNarration({ ...plan, steps, scenes: steps.filter(step => step.type === "speech") }, clips),
  };
}
