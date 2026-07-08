import fs from "node:fs";

function replaceOnce(source, search, replacement, label) {
  if (source.includes(search)) return { source: source.replace(search, replacement), changed: true };
  if (source.includes(replacement)) return { source, changed: false };
  throw new Error(`Could not patch marking score consistency: ${label}`);
}

const servicePath = new URL("../src/services/markingServiceBase.js", import.meta.url);
let serviceSource = fs.readFileSync(servicePath, "utf8");
let serviceChanged = false;

({ source: serviceSource, changed: serviceChanged } = replaceOnce(
  serviceSource,
  `  forceSheetDedupeId = false,\n}) {`,
  `  forceSheetDedupeId = false,\n  requireAllTargets = false,\n}) {`,
  "saveScoreRow requireAllTargets parameter",
));

const requireAllTargetsBlock = `\n  if (requireAllTargets) {\n    const failedTargets = [];\n    if (receipt.sheet.attempted && !receipt.sheet.success) {\n      failedTargets.push(\`Google Sheets: \${receipt.sheet.message || "failed"}\`);\n    }\n    if (receipt.firestore.attempted && !receipt.firestore.success) {\n      failedTargets.push(\`Firestore: \${receipt.firestore.message || "failed"}\`);\n    }\n    if (failedTargets.length) {\n      const saveError = new Error(\`Final score was not saved to all required targets. \${failedTargets.join(" | ")}\`);\n      saveError.receipt = receipt;\n      throw saveError;\n    }\n  }\n`;

if (!serviceSource.includes("Final score was not saved to all required targets")) {
  ({ source: serviceSource, changed: serviceChanged } = replaceOnce(
    serviceSource,
    `\n  if (!receipt.sheet.success && !receipt.firestore.success) {\n    const saveError = new Error("Save failed for both Google Sheets and Firestore.");`,
    `${requireAllTargetsBlock}\n  if (!receipt.sheet.success && !receipt.firestore.success) {\n    const saveError = new Error("Save failed for both Google Sheets and Firestore.");`,
    "saveScoreRow required target validation",
  ));
}

fs.writeFileSync(servicePath, serviceSource);
console.log(serviceChanged ? "markingServiceBase saveScoreRow now requires all targets when requested." : "markingServiceBase saveScoreRow consistency already patched.");

const pagePath = new URL("../src/pages/MarkingPage.jsx", import.meta.url);
let pageSource = fs.readFileSync(pagePath, "utf8");
let pageChanged = false;

({ source: pageSource, changed: pageChanged } = replaceOnce(
  pageSource,
  `        allowDuplicate: true,\n        forceSheetDedupeId: true,\n        markingDetails: {`,
  `        allowDuplicate: true,\n        forceSheetDedupeId: true,\n        requireAllTargets: true,\n        markingDetails: {`,
  "MarkingPage final score save requires sheet and Firestore",
));

fs.writeFileSync(pagePath, pageSource);
console.log(pageChanged ? "MarkingPage final score save now requires Google Sheet and Firestore consistency." : "MarkingPage final score consistency already patched.");
