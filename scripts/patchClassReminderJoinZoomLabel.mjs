import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const workerPath = path.join(repoRoot, "functions", "classSessionReminderEmails.js");
let source = fs.readFileSync(workerPath, "utf8");

const zoomExpressions = [
  "zoom.url",
  "zoom.url || DEFAULT_CLASS_REMINDER_ZOOM.joinUrl",
];
const zoomExpression = zoomExpressions.find((expression) =>
  source.includes(`    link: text(${expression}),`));
if (!zoomExpression) throw new Error("Class reminder Zoom link is missing.");

const buttonLine = `    button_label: text(${zoomExpression}) ? "Join Zoom" : "",`;
const linkLabelLine = `    link_label: text(${zoomExpression}) ? "Join Zoom" : "",`;
if (!source.includes(linkLabelLine)) {
  if (!source.includes(buttonLine)) throw new Error("Class reminder Zoom button label anchor is missing.");
  source = source.replace(buttonLine, `${buttonLine}\n${linkLabelLine}`);
  fs.writeFileSync(workerPath, source, "utf8");
}

console.log("Class reminder Zoom CTA writes link_label=Join Zoom for the announcement email template.");
