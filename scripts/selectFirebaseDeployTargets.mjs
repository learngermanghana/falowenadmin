import fs from "node:fs";
import { execFileSync } from "node:child_process";
import { pathToFileURL } from "node:url";

// Shared modules and unrecognised files deliberately fall back to every existing
// deployment group. Keep targeted mappings small and explicit.
export const WORKER_TARGETS = {
  "functions/trialAccessEmails.js": ["sendTrialAccessWelcomeEmail", "sendTrialAccessReminderEmails"],
  "functions/finalMockResultEmails.js": ["sendFinalMockResultEmail"],
  "functions/studentLearningInterventionEmails.js": ["sendStudentLearningNudges"],
  "functions/classSessionReminderEmails.js": ["api", "sendClassSessionReminderEmails", "sendSaturdayClassSessionReminderEmails"],
  "functions/autoCompleteClassSessions.js": ["api", "autoCompleteClassSessions"],
};

export function selectFirebaseDeployTargets({ changedPaths, predeployPaths = [], full = false }) {
  if (full || changedPaths === null) return { mode: "full", targets: [], reason: "Full deployment or no reliable successful baseline." };
  const targets = new Set();
  const predeploy = new Set(predeployPaths);
  for (const path of changedPaths) {
    if (WORKER_TARGETS[path]) {
      WORKER_TARGETS[path].forEach(target => targets.add(target));
    } else if (path.startsWith("functions/") || path === "firebase.json" || predeploy.has(path) || (path.startsWith("scripts/") && path !== "scripts/selectFirebaseDeployTargets.mjs")) {
      return { mode: "full", targets: [], reason: `Shared or unmapped deployment input changed: ${path}` };
    }
  }
  return { mode: targets.size ? "targeted" : "skip", targets: [...targets].sort(), reason: targets.size ? "Deploy affected workers only." : "No Firebase function inputs changed." };
}

function readPredeployPaths() {
  const config = JSON.parse(fs.readFileSync("firebase.json", "utf8"));
  return config.functions.flatMap(entry => entry.predeploy || [])
    .flatMap(command => [...command.matchAll(/scripts\/[\w./-]+\.mjs/g)].map(match => match[0]));
}

export function writeDeployPlan({ before, head, full, outputPath, readGit = args => execFileSync("git", args, { encoding: "utf8" }) }) {
  let changedPaths = null;
  if (!full && before && !/^0+$/.test(before)) {
    try {
      readGit(["merge-base", "--is-ancestor", before, head]);
      changedPaths = readGit(["diff", "--name-only", "-z", before, head]).split("\0").filter(Boolean);
    } catch {
      // Missing/shallow/non-ancestor baselines must never silently omit workers.
    }
  }
  const plan = selectFirebaseDeployTargets({ changedPaths, predeployPaths: readPredeployPaths(), full });
  fs.writeFileSync(outputPath, JSON.stringify(plan, null, 2));
  if (process.env.GITHUB_OUTPUT) fs.appendFileSync(process.env.GITHUB_OUTPUT, `mode=${plan.mode}\n`);
  console.log(JSON.stringify(plan));
  return plan;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  writeDeployPlan({
    before: process.env.FIREBASE_DEPLOY_BASE_SHA,
    head: process.env.GITHUB_SHA || "HEAD",
    full: process.env.FIREBASE_FULL_DEPLOY === "true",
    outputPath: process.env.FIREBASE_DEPLOY_PLAN || "/tmp/falowen-firebase-deploy-plan.json",
  });
}
