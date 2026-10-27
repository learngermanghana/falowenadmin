import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const indexPath = path.join(root, "functions/index.js");
let source = fs.readFileSync(indexPath, "utf8");

const requireLine = 'const { registerPublicLiveClassApi } = require("./publicLiveClassApi.js");';
const requireAnchor = 'const { assignmentAttendanceEligibility } = require("./assignmentAttendanceEligibility.js");';
const registerLine = 'registerPublicLiveClassApi(app, { db });';
const registerAnchor = 'app.post("/openSession", async (req, res) => {';

if (!source.includes(requireLine)) {
  if (!source.includes(requireAnchor)) throw new Error("Public live-class API require anchor missing");
  source = source.replace(requireAnchor, `${requireAnchor}\n${requireLine}`);
}

if (!source.includes(registerLine)) {
  if (!source.includes(registerAnchor)) throw new Error("Public live-class API route anchor missing");
  source = source.replace(registerAnchor, `${registerLine}\n\n${registerAnchor}`);
}

fs.writeFileSync(indexPath, source, "utf8");
console.log("Public live-class schedule API registered.");
