import fs from "node:fs";

const basePath = new URL("../src/services/liveClassCompatibilityServiceBase.js", import.meta.url);
const source = fs.readFileSync(basePath, "utf8");

if (!source.includes("dedupeCompatibleSessions")) {
  throw new Error("Live Class duplicate session suppression is missing from compatibility service.");
}

console.log("Live Class duplicate session suppression is installed.");
