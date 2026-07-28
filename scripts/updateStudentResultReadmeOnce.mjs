import fs from "node:fs";

const path = "README.md";
const source = fs.readFileSync(path, "utf8");
const startMarker = "### Set up the marking sheet (auto-send scores)";
const endMarker = "### Auto-send troubleshooting";
const start = source.indexOf(startMarker);
const end = source.indexOf(endMarker);

if (start < 0 || end < 0 || end <= start) {
  throw new Error("Could not find the marking-sheet setup section in README.md");
}

const replacement = `### Set up the marking sheet (auto-send scores)

The previous inline Apps Script example used \`sheet.appendRow(...)\` and has been retired because it created duplicate rows when Student Results attempted to override an existing score.

Use the maintained upsert handler and deployment guide instead:

- Apps Script source: \`docs/apps-script/score-results-upsert.gs\`
- Setup and duplicate-cleanup instructions: \`docs/student-result-sheet-upsert.md\`

The handler uses the normalized student code plus canonical assignment ID as the permanent result identity. A later sync updates the matching row, while explicit resubmission attempt IDs remain separate. Falowen's Student Results override also requires an upsert acknowledgement, so it will not silently fall back to an append-only request.

`;

fs.writeFileSync(path, `${source.slice(0, start)}${replacement}${source.slice(end)}`, "utf8");
console.log("Updated README score-sheet setup to the upsert guide.");
