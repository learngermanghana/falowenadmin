// Resolve class language from the owner-maintained metadata, not a staff URL.
export function classProgramLanguage(record = {}) {
  const explicit = String(record.language || record.program || record.courseLanguage || record.trainingLanguage || "").trim().toLowerCase();
  if (["swahili", "kiswahili", "sw"].includes(explicit)) return "swahili";
  if (explicit) return "german";
  // Legacy Swahili cohorts may predate the explicit language selector.
  const label = String(record.name || record.className || record.courseName || "").trim().toLowerCase();
  return /\b(?:ki)?swahili\b/.test(label) ? "swahili" : "german";
}
