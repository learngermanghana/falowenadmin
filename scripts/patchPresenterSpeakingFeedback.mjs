import fs from "node:fs";

const pickerTarget = new URL("../src/components/PresenterStudentPicker.jsx", import.meta.url);
const cssTarget = new URL("../src/components/PresenterStudentPicker.css", import.meta.url);

const picker = fs.readFileSync(pickerTarget, "utf8");
const css = fs.readFileSync(cssTarget, "utf8");

const forbiddenPickerTokens = [
  "SPEAKING_RUBRIC_ITEMS",
  "Grammar controlled",
  "Language clear",
  "Task completed",
  "presenter-speaking-rubric",
  "Finish speaking → feedback",
  "speakingRubricCount",
];

for (const token of forbiddenPickerTokens) {
  if (picker.includes(token)) {
    throw new Error(`Deprecated speaking rubric UI returned: ${token}. Keep speaking marking to Correct / Needs review / Skip / Absent.`);
  }
}

if (css.includes("presenter-structured-speaking-feedback") || css.includes(".presenter-speaking-rubric")) {
  throw new Error("Deprecated speaking-rubric CSS returned. Remove the three-box speaking rubric.");
}

console.log("Presenter speaking marking stays simple: Correct / Needs review / Skip / Absent.");
