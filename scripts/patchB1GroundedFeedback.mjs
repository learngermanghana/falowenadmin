import fs from "node:fs";

function replaceOnce(source, before, after, label) {
  if (source.includes(after)) return source;
  if (!source.includes(before)) throw new Error(`${label} anchor missing.`);
  return source.replace(before, after);
}

// 1) If multiple objective parts are perfect, acknowledge all of them.
const naturalPath = new URL("../src/utils/naturalMarkingFeedback.js", import.meta.url);
let natural = fs.readFileSync(naturalPath, "utf8");

const objectiveBefore = `  const strongestPart = perfectParts.includes("Teil 4") ? "Teil 4" : perfectParts[0];
  if (strongestPart) {
    objectiveSentences.push(\`${"${strongestPart}"} is excellent, with all answers correct\`);
  } else if (objectiveTotal > 0) {
    objectiveSentences.push(\`You answered ${"${objectiveCorrect}"} of ${"${objectiveTotal}"} objective questions correctly\`);
  }`;

const objectiveAfter = `  const perfectPartLabels = perfectParts
    .filter((part) => /^Teil [34]$/i.test(part))
    .sort((left, right) => left.localeCompare(right, "de"));
  if (perfectPartLabels.length > 1) {
    objectiveSentences.push(\`${"${humanList(perfectPartLabels)}"} are excellent, with all answers correct\`);
  } else if (perfectPartLabels.length === 1) {
    objectiveSentences.push(\`${"${perfectPartLabels[0]}"} is excellent, with all answers correct\`);
  } else if (objectiveTotal > 0) {
    objectiveSentences.push(\`You answered ${"${objectiveCorrect}"} of ${"${objectiveTotal}"} objective questions correctly\`);
  }`;

natural = replaceOnce(natural, objectiveBefore, objectiveAfter, "perfect objective parts");
fs.writeFileSync(naturalPath, natural, "utf8");

// 2) Make B1 writing feedback prefer evidence from the student's actual text.
const evidencePath = new URL("../src/utils/essayFeedbackEvidence.js", import.meta.url);
let evidence = fs.readFileSync(evidencePath, "utf8");

const strengthBefore = `function submissionAnchoredStrength(submission = "") {
  const source = writingSectionText(submission);
  if (/informationen[^.!?]{0,40}inhalt[^.!?]{0,40}termine[^.!?]{0,40}kosten/i.test(source)) {`;
const strengthAfter = `function submissionAnchoredStrength(submission = "") {
  const source = writingSectionText(submission);
  const hasOpinion = /\\b(?:meiner meinung nach|meiner ansicht nach|ich bin der meinung|ich denke|ich finde|ich glaube)\\b/i.test(source);
  const hasTwoSides = /\\beinerseits\\b/i.test(source) && /\\bandererseits\\b/i.test(source);
  const hasConclusion = /\\b(?:zusammenfassend|abschließend|insgesamt)\\b/i.test(source);
  if (hasOpinion && hasTwoSides && hasConclusion) {
    return "Your opinion is easy to follow: you state a position, contrast both sides with “Einerseits … Andererseits …” and finish with a clear conclusion";
  }
  if (hasOpinion && hasTwoSides) {
    return "Your position is clear, and “Einerseits … Andererseits …” gives the discussion a useful B1 argument structure";
  }
  if (/informationen[^.!?]{0,40}inhalt[^.!?]{0,40}termine[^.!?]{0,40}kosten/i.test(source)) {`;
evidence = replaceOnce(evidence, strengthBefore, strengthAfter, "B1 anchored strength");

const nextBefore = `function submissionAnchoredNextStep(submission = "") {
  const source = writingSectionText(submission);
  if (/\\bauf\\s+widersehen\\b/i.test(source)) {`;
const nextAfter = `function submissionAnchoredNextStep(submission = "") {
  const source = writingSectionText(submission);
  if (/persönlicher\\s+kontakt\\s+im\\s+traumberuf/i.test(source)) {
    return "Use “persönlicher Kontakt am Arbeitsplatz” instead of “persönlicher Kontakt im Traumberuf” for a more natural expression";
  }
  if (/die\\s+meisten\\s+menschen\\s+am\\s+arbeitsplatz\\s+arbeiten/i.test(source)) {
    return "Replace “die meisten Menschen am Arbeitsplatz arbeiten” with “die meisten Menschen arbeiten vor Ort” to avoid repeating Arbeitsplatz/arbeiten";
  }
  if (/\\bauf\\s+widersehen\\b/i.test(source)) {`;
evidence = replaceOnce(evidence, nextBefore, nextAfter, "B1 anchored next step");

const genericNext = `    choices.push("Develop one central argument more fully instead of adding several short points");`;
const groundedNext = `    const anchor = writingAnchor(submission);
    if (anchor) choices.push(\`Develop the point in “${"${anchor.replace(/[.!?]+$/, \"\")}"}” by adding one concrete consequence or example before moving on\`);`;
evidence = replaceOnce(evidence, genericNext, groundedNext, "B1 grounded fallback next step");
fs.writeFileSync(evidencePath, evidence, "utf8");

// 3) In B1, put the contextual, submission-grounded sentence before generic rubric prose.
const depthPath = new URL("../src/utils/writingFeedbackDepth.js", import.meta.url);
let depth = fs.readFileSync(depthPath, "utf8");
const depthBefore = `  return combineRubricAndContext(rubric, contextual);`;
const depthAfter = `  return unique([contextual, ...rubric]).slice(0, 4);`;
depth = replaceOnce(depth, depthBefore, depthAfter, "B1 contextual feedback ordering");
fs.writeFileSync(depthPath, depth, "utf8");

const finalNatural = fs.readFileSync(naturalPath, "utf8");
const finalEvidence = fs.readFileSync(evidencePath, "utf8");
const finalDepth = fs.readFileSync(depthPath, "utf8");
if (!finalNatural.includes("perfectPartLabels.length > 1")) throw new Error("Multi-part perfect objective feedback is missing.");
if (!finalEvidence.includes("persönlicher Kontakt am Arbeitsplatz")) throw new Error("B1 grounded wording correction is missing.");
if (finalEvidence.includes("Develop one central argument more fully instead of adding several short points")) throw new Error("Generic B1 central-argument fallback remains.");
if (!finalDepth.includes("unique([contextual, ...rubric])")) throw new Error("B1 contextual feedback is not prioritized.");

console.log("B1 feedback now acknowledges all perfect objective parts and prioritizes submission-grounded writing feedback.");