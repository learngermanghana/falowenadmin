import fs from "node:fs";
import { execFileSync } from "node:child_process";
import { pathToFileURL } from "node:url";

// Shared modules and unrecognised files deliberately fall back to every existing
// deployment group. Keep targeted mappings small and explicit.
export const WORKER_TARGETS = {
  "functions/automaticMarkingPipeline.cjs": ["api", "markCourseSubmissionAutomatically"],
  "src/utils/a1WritingTaskEvidence.js": ["api", "markCourseSubmissionAutomatically"],
  "src/utils/questionAwareWritingMarking.js": ["api", "markCourseSubmissionAutomatically"],
  "src/data/courseMarkingSnapshot.json": ["api", "markCourseSubmissionAutomatically"],
  "src/utils/canonicalCourseReference.js": ["api", "markCourseSubmissionAutomatically"],
  "src/utils/objectiveMarking.js": ["api", "markCourseSubmissionAutomatically"],
  "src/utils/autoMarking.js": ["api", "markCourseSubmissionAutomatically"],
  "src/utils/submissionSections.js": ["api", "markCourseSubmissionAutomatically"],
  "src/services/markingService.js": ["api", "markCourseSubmissionAutomatically"],
  "functions/markingReliability.js": ["api", "markCourseSubmissionAutomatically"],
  "functions/markingReliability.test.cjs": ["api", "markCourseSubmissionAutomatically"],
  "scripts/syncCourseMarkingSnapshot.mjs": ["api", "markCourseSubmissionAutomatically"],
  "scripts/buildAutomaticMarking.mjs": ["api", "markCourseSubmissionAutomatically"],

  // A new checked-in answer dictionary changes both the automatic marking worker
  // and the Admin marking API. Redeploy only those two consumers, not every function.
  "src/data/answers_dictionary.json": ["api", "markCourseSubmissionAutomatically"],
  // Saved Schreiben questions and task-evidence rules are part of the Firebase
  // marking bundle, not merely Admin UI copy.
  "src/data/a2WritingTaskSpecs.js": ["api", "markCourseSubmissionAutomatically"],
  "src/utils/writingTaskEvidence.js": ["api", "markCourseSubmissionAutomatically"],
  "functions/trialAccessEmails.js": ["sendTrialAccessWelcomeEmail", "sendTrialAccessReminderEmails"],
  "functions/finalMockResultEmails.js": ["sendFinalMockResultEmail"],
  "functions/studentLearningInterventionEmails.js": ["sendStudentLearningNudges"],
  "functions/classSessionReminderEmails.js": ["api", "sendClassSessionReminderEmails", "sendSaturdayClassSessionReminderEmails"],
  "functions/autoCompleteClassSessions.js": ["api", "autoCompleteClassSessions"],
};

// Frontend-only build patches must not consume Cloud Run deployment quota.
// This patch is used by npm sync:build, not by firebase.json predeploy.
const FRONTEND_ONLY_BUILD_SCRIPTS = new Set(["scripts/patchA1WritingPlaceholderReferences.mjs"]);

export function selectFirebaseDeployTargets({ changedPaths, predeployPaths = [], full = false }) {
  if (full || changedPaths === null) return { mode: "full", targets: [], reason: "Full deployment or no reliable successful baseline." };
  const targets = new Set();
  const predeploy = new Set(predeployPaths);
  for (const path of changedPaths) {
    if (FRONTEND_ONLY_BUILD_SCRIPTS.has(path) && !predeploy.has(path)) continue;
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

function readChangedPaths(before, head, readGit) {
  if (!before || /^0+$/.test(before)) return null;
  try {
    readGit(["merge-base", "--is-ancestor", before, head]);
    return readGit(["diff", "--name-only", "-z", before, head]).split("\0").filter(Boolean);
  } catch {
    return null;
  }
}

export function writeDeployPlan({ before, triggerBefore, head, full, outputPath, readGit = args => execFileSync("git", args, { encoding: "utf8" }) }) {
  const predeployPaths = readPredeployPaths();
  let plan;
  if (!full && triggerBefore) {
    const triggerPlan = selectFirebaseDeployTargets({ changedPaths: readChangedPaths(triggerBefore, head, readGit), predeployPaths });
    if (triggerPlan.mode === "skip") plan = triggerPlan;
  }
  // Only a runtime change needs recovery of earlier failed function changes.
  // Skipped workflow-only runs are excluded from the successful baseline below.
  if (!plan) plan = selectFirebaseDeployTargets({ changedPaths: readChangedPaths(before, head, readGit), predeployPaths, full });
  fs.writeFileSync(outputPath, JSON.stringify(plan, null, 2));
  if (process.env.GITHUB_OUTPUT) fs.appendFileSync(process.env.GITHUB_OUTPUT, `mode=${plan.mode}\n`);
  console.log(JSON.stringify(plan));
  return plan;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  writeDeployPlan({
    before: process.env.FIREBASE_DEPLOY_BASE_SHA,
    triggerBefore: process.env.FIREBASE_TRIGGER_BASE_SHA,
    head: process.env.GITHUB_SHA || "HEAD",
    full: process.env.FIREBASE_FULL_DEPLOY === "true",
    outputPath: process.env.FIREBASE_DEPLOY_PLAN || "/tmp/falowen-firebase-deploy-plan.json",
  });
}
