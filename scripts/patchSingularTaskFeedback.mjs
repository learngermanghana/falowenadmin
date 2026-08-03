import fs from "node:fs";

const target = new URL("../src/utils/essayFeedbackEvidence.js", import.meta.url);
let source = fs.readFileSync(target, "utf8");

const before = '    if (!missing.length && completed >= total) return `You addressed all ${total} task points`;';
const after = [
  '    if (!missing.length && completed >= total) {',
  '      if (total === 1) return "You completed the required task";',
  '      return `You addressed all ${total} task points`;',
  '    }',
].join("\n");

if (source.includes(before)) {
  source = source.replace(before, after);
} else if (!source.includes('if (total === 1) return "You completed the required task";')) {
  throw new Error("Singular task feedback anchor changed; update patchSingularTaskFeedback.mjs");
}

fs.writeFileSync(target, source);
console.log("Singular writing-task feedback now uses clear natural wording.");
