import fs from "node:fs";

const pickerTarget = new URL("../src/components/PresenterStudentPicker.jsx", import.meta.url);
let source = fs.readFileSync(pickerTarget, "utf8");

function replaceRequired(before, after, label) {
  if (source.includes(after)) return;
  if (!source.includes(before)) throw new Error(`Student answer timer patch anchor changed: ${label}`);
  source = source.replace(before, after);
}

replaceRequired(
  'const RESPONSE_TIME_KEY = "falowen:presenter:response-seconds";',
  'const RESPONSE_TIME_KEY = "falowen:presenter:response-seconds:v2";',
  "response preference version",
);
replaceRequired(
  'const DEFAULT_RESPONSE_SECONDS = 30;',
  'const DEFAULT_RESPONSE_SECONDS = 60;',
  "default response seconds",
);
replaceRequired(
  'Default: 30 seconds.',
  'Default: 1 minute.',
  "settings help text",
);

if (!source.includes('const DEFAULT_RESPONSE_SECONDS = 60;')) {
  throw new Error("Student answer timer default was not updated to 60 seconds.");
}
if (!source.includes('const RESPONSE_TIME_KEY = "falowen:presenter:response-seconds:v2";')) {
  throw new Error("Student answer timer preference key was not migrated.");
}
if (!source.includes('RESPONSE_TIME_PRESETS = [15, 30, 45, 60]')) {
  throw new Error("Student answer timer presets changed unexpectedly.");
}

fs.writeFileSync(pickerTarget, source, "utf8");
console.log("Presenter student answer timer now defaults to one minute.");
