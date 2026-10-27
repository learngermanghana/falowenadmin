import fs from "node:fs";

function replaceOnce(source, before, after, label) {
  if (source.includes(after)) return source;
  if (!source.includes(before)) throw new Error(`${label} anchor changed; update patchSingularTaskFeedback.mjs`);
  return source.replace(before, after);
}

const grammarTarget = new URL("./patchObjectiveGrammarConsistency.mjs", import.meta.url);
let grammarSource = fs.readFileSync(grammarTarget, "utf8");

const grammarBefore = [
  '  \'    const taskPointLabel = total === 1 ? "task point" : "task points";\',',
  '  \'    if (!missing.length && completed >= total) return `You addressed all ${total} ${taskPointLabel}`;\',',
  '  \'    return `You covered ${Math.max(0, Math.min(total, completed))} of ${total} ${taskPointLabel}${missing[0] ? `; ${missing[0]} is missing` : ""}`;\',',
].join("\n");
const grammarAfter = [
  '  \'    const taskPointLabel = total === 1 ? "task point" : "task points";\',',
  '  \'    if (!missing.length && completed >= total) {\',',
  '  \'      if (total === 1) return "You completed the required task";\',',
  '  \'      return `You addressed all ${total} ${taskPointLabel}`;\',',
  '  \'    }\',',
  '  \'    return `You covered ${Math.max(0, Math.min(total, completed))} of ${total} ${taskPointLabel}${missing[0] ? `; ${missing[0]} is missing` : ""}`;\',',
].join("\n");
grammarSource = replaceOnce(
  grammarSource,
  grammarBefore,
  grammarAfter,
  "objective grammar task-feedback template",
);
fs.writeFileSync(grammarTarget, grammarSource);

const evidenceTarget = new URL("../src/utils/essayFeedbackEvidence.js", import.meta.url);
let evidenceSource = fs.readFileSync(evidenceTarget, "utf8");

const legacyBlock = [
  '  if (Number.isFinite(completed) && Number.isFinite(total) && total > 0) {',
  '    if (!missing.length && completed >= total) return `You addressed all ${total} task points`;',
  '    return `You covered ${Math.max(0, Math.min(total, completed))} of ${total} task points${missing[0] ? `; ${missing[0]} is missing` : ""}`;',
  '  }',
].join("\n");
const pluralizedBlock = [
  '  if (Number.isFinite(completed) && Number.isFinite(total) && total > 0) {',
  '    const taskPointLabel = total === 1 ? "task point" : "task points";',
  '    if (!missing.length && completed >= total) return `You addressed all ${total} ${taskPointLabel}`;',
  '    return `You covered ${Math.max(0, Math.min(total, completed))} of ${total} ${taskPointLabel}${missing[0] ? `; ${missing[0]} is missing` : ""}`;',
  '  }',
].join("\n");
const clearBlock = [
  '  if (Number.isFinite(completed) && Number.isFinite(total) && total > 0) {',
  '    const taskPointLabel = total === 1 ? "task point" : "task points";',
  '    if (!missing.length && completed >= total) {',
  '      if (total === 1) return "You completed the required task";',
  '      return `You addressed all ${total} ${taskPointLabel}`;',
  '    }',
  '    return `You covered ${Math.max(0, Math.min(total, completed))} of ${total} ${taskPointLabel}${missing[0] ? `; ${missing[0]} is missing` : ""}`;',
  '  }',
].join("\n");

if (evidenceSource.includes(clearBlock)) {
  // Already patched.
} else if (evidenceSource.includes(pluralizedBlock)) {
  evidenceSource = evidenceSource.replace(pluralizedBlock, clearBlock);
} else if (evidenceSource.includes(legacyBlock)) {
  evidenceSource = evidenceSource.replace(legacyBlock, clearBlock);
} else {
  throw new Error("Essay task-feedback block changed; update patchSingularTaskFeedback.mjs");
}

fs.writeFileSync(evidenceTarget, evidenceSource);
console.log("Singular writing-task feedback now uses clear natural wording and remains build-idempotent.");
