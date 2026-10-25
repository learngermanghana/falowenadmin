// Manual operator diagnostic: one short, non-student utterance; never logs keys/audio.
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import fs from "node:fs";
const require = createRequire(import.meta.url);
const { buildSpeechPayload, extractAudio } = require("../functions/hoerenStudioApi.js");
const key = execFileSync("gcloud", ["secrets", "versions", "access", "latest", "--secret=GEMINI_API_KEY", "--project=falowen-examiner-trainer"], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
if (!key) throw new Error("Gemini secret is empty.");
const payload = buildSpeechPayload({ engine: "lite", turns: [{ speaker: "A", text: "Guten Tag." }] });
const response = await fetch("https://generativelanguage.googleapis.com/v1beta/interactions", {
  method: "POST", headers: { "x-goog-api-key": key, "Content-Type": "application/json" },
  body: JSON.stringify(payload), signal: AbortSignal.timeout(65000),
});
const body = await response.json();
const safe = response.ok ? `Google HTTP ${response.status}: valid WAV, ${extractAudio(body).size} bytes.`
  : `Google HTTP ${response.status}: ${String(body?.error?.message || body?.error || "Unknown provider error").split(key).join("[redacted]").replace(/[\r\n]+/g, " ").slice(0, 760)}`;
console.log(safe);
// Readable status chunks remain accessible if the CI log download is blocked.
for (let index = 0; index < 6; index++) {
  const status = { state: response.ok ? "success" : "failure", context: `AI Studio probe ${index + 1}`, description: safe.slice(index * 130, (index + 1) * 130) || "End of diagnostic." };
  const file = `${process.env.RUNNER_TEMP}/studio-probe-${index}.json`;
  fs.writeFileSync(file, JSON.stringify(status));
  execFileSync("gh", ["api", "--method", "POST", `repos/${process.env.GITHUB_REPOSITORY}/statuses/${process.env.GITHUB_SHA}`, "--input", file], { stdio: "ignore" });
}
if (!response.ok) process.exitCode = 1;
