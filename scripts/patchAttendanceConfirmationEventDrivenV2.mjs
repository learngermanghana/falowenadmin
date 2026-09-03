import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const targetPath = path.join(root, "scripts", "patchAttendanceConfirmationEventDriven.mjs");
let source = fs.readFileSync(targetPath, "utf8");

const oldBlock = `const firestoreImport = 'const { onDocumentCreated } = require("firebase-functions/v2/firestore");';
const firestoreEventImport = 'const { onDocumentCreated, onDocumentWritten } = require("firebase-functions/v2/firestore");';
if (index.includes(firestoreImport)) index = index.replace(firestoreImport, firestoreEventImport);
if (!index.includes(firestoreEventImport)) throw new Error("Could not register onDocumentWritten Firestore trigger.");`;

const newBlock = `const firestoreTriggerPattern = /const \\{ ([^}]+) \\} = require\\("firebase-functions\\/v2\\/firestore"\\);/;
const firestoreMatch = index.match(firestoreTriggerPattern);
if (!firestoreMatch) throw new Error("Could not find Firestore trigger import.");
const firestoreTriggers = [...new Set(firestoreMatch[1].split(",").map((value) => value.trim()).filter(Boolean))];
for (const trigger of ["onDocumentCreated", "onDocumentUpdated", "onDocumentWritten"]) {
  if (!firestoreTriggers.includes(trigger)) firestoreTriggers.push(trigger);
}
index = index.replace(firestoreTriggerPattern, \\`const { \\${firestoreTriggers.join(", ")} } = require("firebase-functions/v2/firestore");\\`);
if (!index.includes("onDocumentWritten")) throw new Error("Could not register onDocumentWritten Firestore trigger.");`;

if (source.includes(oldBlock)) {
  source = source.replace(oldBlock, newBlock);
  fs.writeFileSync(targetPath, source, "utf8");
}

await import(`${pathToFileURL(targetPath).href}?v=${Date.now()}`);
