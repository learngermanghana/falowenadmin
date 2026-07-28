import fs from "node:fs";

const path = "README.md";
const source = fs.readFileSync(path, "utf8");
const oldLine = "- If your browser blocks CORS for script responses, the app falls back to a `no-cors` request, so check the target sheet directly.";
const newLine = "- Ordinary **Mark Work** saves may use the legacy `no-cors` fallback when a script response is blocked. **Student Results** updates never use that fallback because an override must receive a verified upsert acknowledgement before it is considered successful.";

if (!source.includes(oldLine)) throw new Error("Could not find the old score webhook CORS troubleshooting line.");
fs.writeFileSync(path, source.replace(oldLine, newLine), "utf8");
console.log("Clarified the Student Results upsert acknowledgement requirement.");
