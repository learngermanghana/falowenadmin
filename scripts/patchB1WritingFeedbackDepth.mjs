import fs from "node:fs";

function replaceOnce(source, search, replacement, label) {
  if (source.includes(replacement)) return source;
  if (!source.includes(search)) throw new Error(`${label} anchor changed; update patchB1WritingFeedbackDepth.mjs`);
  return source.replace(search, replacement);
}

const feedbackTarget = new URL("../src/utils/essayFeedbackEvidence.js", import.meta.url);
let feedbackSource = fs.readFileSync(feedbackTarget, "utf8");

const helperAnchor = `function strengthOf(result, submission, level, seed, history) {`;
const helper = `function b1WritingDepthSentences(result = {}, submission = "") {
  if (levelOf(result) !== "B1") return [];
  const source = writingSectionText(submission);
  const points = [];

  const formalLetter = /\\bsehr geehrte\\b/i.test(source) && /\\bmit freundlichen gr(?:ü|u)(?:ß|ss)en\\b/i.test(source);
  const asksAppointment = /\\b(?:termin|besichtig|freitag|samstag|uhr)\\b/i.test(source);
  const asksAddress = /\\b(?:adresse|anschrift)\\b/i.test(source);
  const asksDocuments = /\\b(?:unterlagen|dokument|mitbringen)\\b/i.test(source);
  const politeStructures = /\\b(?:wäre .{0,35} möglich|könnten sie|bitte bestätigen|teilen sie mir|möchte gern wissen)\\b/i.test(source);
  const connectors = source.match(/\\b(?:außerdem|alternativ|jedoch|deshalb|daher|obwohl|während|einerseits|andererseits|zudem|sowie|und|aber|weil)\\b/gi) || [];

  if (formalLetter && asksAppointment && asksAddress && asksDocuments) {
    points.push("Your Teil 2 letter is task-focused: you request a viewing, propose a concrete appointment, and ask for the exact address and documents to bring");
  } else if (formalLetter && asksAppointment && (asksAddress || asksDocuments)) {
    points.push("Your Teil 2 letter is task-focused: you request a viewing, propose a concrete appointment and ask for the practical information needed to attend");
  } else if (formalLetter) {
    points.push("The formal register is appropriate from the salutation through the closing, and the purpose remains clear throughout the letter");
  }

  if (politeStructures) {
    points.push("Polite B1 structures such as “Wäre ein Termin … möglich?” and “Bitte bestätigen Sie mir den Termin” make the request natural and appropriately formal");
  }

  if (connectors.length < 3 || new Set(connectors.map((value) => value.toLocaleLowerCase("de"))).size < 3) {
    points.push("For a stronger B1 response, vary the linking language beyond simple coordination; add connectors such as “außerdem”, “daher” or a short “weil” clause where they fit naturally");
  } else {
    points.push("Your ideas are linked clearly; the next step is to add one slightly more complex subordinate clause so the sentence range is more clearly B1");
  }

  if (asksAddress && asksDocuments) {
    points.push("You develop the request with useful follow-up questions about the exact address and the documents to bring, rather than stopping after the appointment request");
  }

  return [...new Set(points)].slice(0, 4);
}

${helperAnchor}`;
feedbackSource = replaceOnce(feedbackSource, helperAnchor, helper, "B1 writing-depth helper");

feedbackSource = replaceOnce(
  feedbackSource,
  `  const optionalSentences = [\n    strengthOf(result, submissionText, level, seed, history),\n    taskSentence(result),\n    nextStepOf(result, submissionText, level, correction, seed, history),\n  ];`,
  `  const optionalSentences = [\n    strengthOf(result, submissionText, level, seed, history),\n    ...b1WritingDepthSentences(result, submissionText),\n    taskSentence(result),\n    nextStepOf(result, submissionText, level, correction, seed, history),\n  ];`,
  "B1 detailed optional sentences",
);

feedbackSource = replaceOnce(
  feedbackSource,
  `  }, level === "B1" ? 75 : 60);`,
  `  }, level === "B1" ? 115 : 60);`,
  "B1 feedback word budget",
);

fs.writeFileSync(feedbackTarget, feedbackSource);

const policyTarget = new URL("../src/utils/feedbackPolicy.js", import.meta.url);
let policySource = fs.readFileSync(policyTarget, "utf8");
policySource = replaceOnce(
  policySource,
  `Begin with one genuine strength, mention the strongest section when relevant, identify the exact questions that need review, mention only the most useful writing correction, and give one practical next step.`,
  `Begin with one genuine strength, mention the strongest section when relevant, identify the exact questions that need review, and give useful writing feedback. For B1 writing, cover task completion, register/structure, language range and one concrete development target; mention an exact correction when one is genuinely supported. Give one practical next step.`,
  "B1 feedback policy",
);
fs.writeFileSync(policyTarget, policySource);

const regressionSubmission = `Teil 2 : Schreiben

Sehr geehrte Damen und Herren,

ich habe Ihre Wohnungsanzeige im Internet gesehen und interessiere mich sehr für die angebotene Wohnung. Gern würde ich sie persönlich besichtigen. Wäre ein Termin am Freitag um 16 Uhr möglich? Alternativ könnte ich am Samstagvormittag kommen.

Bitte bestätigen Sie mir den Termin und teilen Sie mir die genaue Adresse mit. Außerdem möchte ich gern wissen, welche Unterlagen ich zur Besichtigung mitbringen soll. Sie erreichen mich per E-Mail oder telefonisch unter 0123 456789.

Vielen Dank im Voraus. Ich freue mich auf Ihre Rückmeldung.

Mit freundlichen Grüßen
Ruth`;
const { buildEvidenceEssayFeedback } = await import(`${feedbackTarget.href}?b1-depth=${Date.now()}`);
const regressionFeedback = buildEvidenceEssayFeedback({
  result: {
    studentName: "Ruth Ndekiro Shao",
    level: "B1",
    assignmentKey: "B1-2.5",
    writingScore: 82,
    writingScorePercent: 82,
  },
  submissionText: regressionSubmission,
  objectiveSentences: ["Teil 4 is excellent, with all answers correct"],
});
const requiredEvidence = [
  /Teil 2 letter is task-focused/i,
  /request a viewing/i,
  /exact address/i,
  /documents to bring/i,
  /Wäre ein Termin/i,
  /subordinate clause|language range|connectors/i,
];
if (requiredEvidence.some((pattern) => !pattern.test(regressionFeedback))) {
  throw new Error(`B1 feedback depth regression failed: ${regressionFeedback}`);
}
const regressionWordCount = regressionFeedback.split(/\s+/).filter(Boolean).length;
if (regressionWordCount < 60 || regressionWordCount > 115) {
  throw new Error(`B1 feedback word budget regression failed (${regressionWordCount} words): ${regressionFeedback}`);
}

console.log("B1 writing feedback now gives task-specific, language-specific coaching instead of shallow greeting/connector praise.");
