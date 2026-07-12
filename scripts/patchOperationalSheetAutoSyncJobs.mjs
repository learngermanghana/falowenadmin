import { readFileSync, writeFileSync } from "node:fs";

const path = "functions/index.js";
const snippetUrl = new URL("./snippets/operationalSheetAutoSyncJobs.js.txt", import.meta.url);
let source = readFileSync(path, "utf8");

const marker = "function readSubmissionLevel";
const block = readFileSync(snippetUrl, "utf8").trim();

if (!source.includes("autoSyncNewStudentToOrientationSheet")) {
  const index = source.indexOf(marker);
  if (index === -1) throw new Error(`Could not find marker: ${marker}`);
  source = `${source.slice(0, index)}${block}\n\n${source.slice(index)}`;
}

writeFileSync(path, source);
console.log("Operational sheet auto-sync jobs are present in functions/index.js.");
