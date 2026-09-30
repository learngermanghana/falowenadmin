import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "..");
const outputPath = path.join(repoRoot, "public", "__falowen-admin-build.json");

const gitValue = (args) => {
  try {
    return execFileSync("git", args, { cwd: repoRoot, encoding: "utf8" }).trim();
  } catch {
    return "";
  }
};

const commitSha =
  process.env.VERCEL_GIT_COMMIT_SHA ||
  process.env.GITHUB_SHA ||
  process.env.CI_COMMIT_SHA ||
  gitValue(["rev-parse", "HEAD"]);

const commitRef =
  process.env.VERCEL_GIT_COMMIT_REF ||
  process.env.GITHUB_REF_NAME ||
  gitValue(["rev-parse", "--abbrev-ref", "HEAD"]);

const payload = {
  app: "falowen-admin",
  commitSha,
  commitRef,
  environment: process.env.VERCEL_ENV || process.env.NODE_ENV || "local",
  generatedAt: new Date().toISOString(),
};

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, JSON.stringify(payload, null, 2) + "\n", "utf8");
console.log(`Falowen Admin build identity: ${commitSha || "unknown"} (${commitRef || "unknown"})`);
