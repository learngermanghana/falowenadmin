// One stable classroom sequence for all authored Kiswahili slide packs.
// Preserve original IDs, content and relative order within each section.
export const SWAHILI_PRESENTER_SECTIONS = Object.freeze([
  "intro", "music", "listening", "reading", "support", "grammar", "practice", "speaking", "writing", "workbook",
]);

export function swahiliStageSection(stage = {}) {
  const id = String(stage.id || "");
  const type = stage.type;
  if (id === "intro" || type === "intro") return "intro";
  if (/^music(?:-|$)/.test(id) || type === "music" || type === "swahili-song") return "music";
  if (/^(?:radio|listening|teacher-listening)(?:-|$)/.test(id) || ["listening", "teacher-listening", "classroom-listening", "radio-questions"].includes(type)) return "listening";
  if (id === "knowledge" && stage.listening) return "listening";
  if (/^reading(?:-|$)/.test(id)) return "reading";
  if (/^(?:ai-video|vocabulary|action-map)(?:-|$)/.test(id) || type === "teacher-lecture") return "support";
  if (/^(?:grammar|mistakes|common-mistakes)(?:-|$)/.test(id) || type === "grammar") return "grammar";
  if (id === "workbook" || id === "summary" || type === "summary") return "workbook";
  if (id === "writing" || type === "writing") return "writing";
  if (/^(?:speaking|presentation|dialogue|scenario|comparison|pair-plan)(?:-|$)/.test(id) || ["speaking","presentation","dialogue","scenario"].includes(type)) return "speaking";
  return "practice";
}

export function standardizeSwahiliStages(stages = []) {
  return [...stages].sort((a, b) =>
    SWAHILI_PRESENTER_SECTIONS.indexOf(swahiliStageSection(a)) -
    SWAHILI_PRESENTER_SECTIONS.indexOf(swahiliStageSection(b))
  );
}
