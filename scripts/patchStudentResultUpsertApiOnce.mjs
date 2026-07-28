import fs from "node:fs";

const path = "api/router.js";
let source = fs.readFileSync(path, "utf8");

const importLine = 'import studentResultsSheetUpsertHandler from "./student-results-sheet-upsert.js";';
if (!source.includes(importLine)) {
  const importAnchor = 'import socialMetricsHandler from "./social-metrics.js";';
  if (!source.includes(importAnchor)) throw new Error("Could not find API router import anchor.");
  source = source.replace(importAnchor, `${importAnchor}\n${importLine}`);
}

const routeLine = 'if (path === "student-results/sheet-upsert") return studentResultsSheetUpsertHandler(req, res);';
if (!source.includes(routeLine)) {
  const routeAnchor = 'if (path === "social-metrics") return socialMetricsHandler(req, res);';
  if (!source.includes(routeAnchor)) throw new Error("Could not find API router local-route anchor.");
  source = source.replace(routeAnchor, `${routeAnchor}\n\n  ${routeLine}`);
}

fs.writeFileSync(path, source, "utf8");
console.log("Added the authenticated Student Results sheet-upsert API route.");
