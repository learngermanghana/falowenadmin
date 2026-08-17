import fs from "node:fs";

const target = new URL("../src/pages/MarkingQuickPage.jsx", import.meta.url);
let source = fs.readFileSync(target, "utf8");

const helperAnchor = `function asPercent(value) {\n  const numeric = Number(value);\n  if (!Number.isFinite(numeric)) return "—";\n  return \`\${Math.round(numeric)}%\`;\n}\n`;
const helperReplacement = `function asPercent(value) {\n  const numeric = Number(value);\n  if (!Number.isFinite(numeric)) return "—";\n  return \`\${Math.round(numeric)}%\`;\n}\n\nconst PASS_MARK = 60;\nconst FAIL_RESUBMISSION_NOTICE = \"FAIL — Your score is below the 60% pass mark. Please review the feedback, correct the work, and resubmit this assignment. We can mark a maximum of 2 additional resubmissions for this assignment.\";\n\nfunction withFailResubmissionNotice(value, finalScore) {\n  const feedback = String(value || \"\").trim();\n  const numericScore = Number(finalScore);\n  if (!Number.isFinite(numericScore) || numericScore >= PASS_MARK) return feedback;\n  if (feedback.includes(FAIL_RESUBMISSION_NOTICE)) return feedback;\n  return [feedback, FAIL_RESUBMISSION_NOTICE].filter(Boolean).join(\"\\n\\n\");\n}\n`;

if (!source.includes("const FAIL_RESUBMISSION_NOTICE")) {
  if (!source.includes(helperAnchor)) throw new Error("MarkingQuickPage score helper anchor changed.");
  source = source.replace(helperAnchor, helperReplacement);
}

const aiFeedbackBefore = `      setFeedback(aiResult.feedback || "");`;
const aiFeedbackAfter = `      setFeedback(withFailResubmissionNotice(aiResult.feedback || "", aiResult.finalScore ?? aiResult.score));`;
if (!source.includes(aiFeedbackAfter)) {
  if (!source.includes(aiFeedbackBefore)) throw new Error("AI feedback assignment anchor changed.");
  source = source.replace(aiFeedbackBefore, aiFeedbackAfter);
}

const finalFeedbackBefore = `      const finalFeedback = feedback.trim();`;
const finalFeedbackAfter = `      const finalFeedback = withFailResubmissionNotice(feedback, finalScore);`;
if (!source.includes(finalFeedbackAfter)) {
  if (!source.includes(finalFeedbackBefore)) throw new Error("Final feedback save anchor changed.");
  source = source.replace(finalFeedbackBefore, finalFeedbackAfter);
}

const finalResultBefore = `        feedback: finalFeedback,\n        manualOverride: Boolean(result),`;
const finalResultAfter = `        feedback: finalFeedback,\n        outcome: finalScore >= PASS_MARK ? "PASS" : "FAIL",\n        resubmissionRequired: finalScore < PASS_MARK,\n        additionalMarkingAttemptsAllowed: finalScore < PASS_MARK ? 2 : null,\n        manualOverride: Boolean(result),`;
if (!source.includes("additionalMarkingAttemptsAllowed")) {
  if (!source.includes(finalResultBefore)) throw new Error("Final result feedback anchor changed.");
  source = source.replace(finalResultBefore, finalResultAfter);
}

const scoreLabelBefore = `            <label style={{ display: "grid", gap: 4 }}>\n              Score\n              <input type="number" min="0" max="100" value={score} onChange={(event) => setScore(event.target.value)} />\n            </label>\n            <label style={{ display: "grid", gap: 4 }}>`;
const scoreLabelAfter = `            <label style={{ display: "grid", gap: 4 }}>\n              Score\n              <input type="number" min="0" max="100" value={score} onChange={(event) => setScore(event.target.value)} />\n            </label>\n            {score !== "" && Number.isFinite(Number(score)) && Number(score) < PASS_MARK ? (\n              <div style={{ border: "1px solid #fca5a5", borderRadius: 8, padding: 10, background: "#fef2f2", color: "#991b1b", fontSize: 13, lineHeight: 1.5 }}>\n                <strong>FAIL — resubmission required.</strong> The student is below the 60% pass mark and must resubmit. Falowen will add a warning to the saved student feedback that only 2 additional resubmissions can be marked.\n              </div>\n            ) : null}\n            <label style={{ display: "grid", gap: 4 }}>`;
if (!source.includes("FAIL — resubmission required.")) {
  if (!source.includes(scoreLabelBefore)) throw new Error("Marking score UI anchor changed.");
  source = source.replace(scoreLabelBefore, scoreLabelAfter);
}

fs.writeFileSync(target, source);
console.log("Failed marking feedback now clearly requires resubmission and warns about the two additional marking attempts.");
