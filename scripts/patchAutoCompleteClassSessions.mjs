import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const indexPath = path.join(root, "functions/index.js");
let source = fs.readFileSync(indexPath, "utf8");

const requireLine = 'const { createAutoCompleteClassSessionsJob } = require("./autoCompleteClassSessions.js");';
const exportLine = 'exports.autoCompleteClassSessions = createAutoCompleteClassSessionsJob({ admin, db, onSchedule });';

if (!source.includes(requireLine)) {
  source = `${source.trimEnd()}\n\n${requireLine}\n`;
}
if (!source.includes(exportLine)) {
  source = `${source.trimEnd()}\n${exportLine}\n`;
}

fs.writeFileSync(indexPath, source, "utf8");
console.log("Registered autoCompleteClassSessions Firebase scheduler.");
