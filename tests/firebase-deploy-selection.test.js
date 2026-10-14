import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { selectFirebaseDeployTargets, writeDeployPlan, WORKER_TARGETS } from "../scripts/selectFirebaseDeployTargets.mjs";

test("trial email edits deploy both trial workers without unrelated attendance workers", () => {
  const plan = selectFirebaseDeployTargets({ changedPaths: ["functions/trialAccessEmails.js"] });
  assert.equal(plan.mode, "targeted");
  assert.deepEqual(plan.targets, ["sendTrialAccessReminderEmails", "sendTrialAccessWelcomeEmail"]);
});

test("multiple changes union targets and retain API consumers", () => {
  const plan = selectFirebaseDeployTargets({ changedPaths: ["functions/autoCompleteClassSessions.js", "functions/classSessionReminderEmails.js"] });
  assert.deepEqual(plan.targets, ["api", "autoCompleteClassSessions", "sendClassSessionReminderEmails", "sendSaturdayClassSessionReminderEmails"]);
});

test("shared dependencies, patch scripts, unknown modules and package changes use full deployment", () => {
  for (const path of ["functions/index.js", "functions/main.js", "functions/package-lock.json", "functions/shared/newHelper.js", "scripts/patchCloudCostOptimizations.mjs", "firebase.json"]) {
    assert.equal(selectFirebaseDeployTargets({ changedPaths: ["functions/trialAccessEmails.js", path] }).mode, "full", path);
  }
});

test("manual recovery or missing baseline never silently skips functions", () => {
  assert.equal(selectFirebaseDeployTargets({ changedPaths: [], full: true }).mode, "full");
  assert.equal(selectFirebaseDeployTargets({ changedPaths: null }).mode, "full");
});

test("frontend, selector, and workflow-only edits have no runtime deployment targets", () => {
  assert.equal(selectFirebaseDeployTargets({ changedPaths: ["src/pages/MarkingPage.jsx", "scripts/selectFirebaseDeployTargets.mjs", ".github/workflows/deploy-firebase.yml"] }).mode, "skip");
});

test("frontend marking build patches do not redeploy Cloud Run functions", () => {
  const plan = selectFirebaseDeployTargets({ changedPaths: [
    "src/pages/MarkingPage.jsx",
    "scripts/patchA1WritingPlaceholderReferences.mjs",
    "scripts/selectFirebaseDeployTargets.mjs",
  ]});
  assert.equal(plan.mode, "skip");
  assert.equal(selectFirebaseDeployTargets({
    changedPaths: ["scripts/patchA1WritingPlaceholderReferences.mjs"],
    predeployPaths: ["scripts/patchA1WritingPlaceholderReferences.mjs"],
  }).mode, "full", "predeploy changes must never be skipped");
});

test("every selected worker belongs to an existing quota-safe deployment group", () => {
  const workflow = fs.readFileSync(".github/workflows/deploy-firebase.yml", "utf8");
  for (const targets of Object.values(WORKER_TARGETS)) {
    for (const target of targets) assert.ok(workflow.includes(`functions:falowenadmin:${target}`), target);
  }
  assert.match(workflow, /fetch-depth: 0/);
  assert.match(workflow, /cancel-in-progress: false/);
  assert.match(workflow, /status: 'success'/);
});


test("a workflow-only push does not redeploy old changes or a missing baseline", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "falowen-plan-"));
  try {
    const plan = writeDeployPlan({ before: "old-release", triggerBefore: "current-push", head: "HEAD", full: false, outputPath: path.join(dir, "plan.json"), readGit: args => {
      if (args[0] === "merge-base") return "";
      assert.equal(args.at(-2), "current-push");
      return ".github/workflows/deploy-firebase.yml\0scripts/selectFirebaseDeployTargets.mjs\0";
    } });
    assert.equal(plan.mode, "skip");
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

test("runtime pushes still include shared changes left behind by failed deployments", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "falowen-plan-"));
  try {
    const plan = writeDeployPlan({ before: "last-real-release", triggerBefore: "current-push", head: "HEAD", full: false, outputPath: path.join(dir, "plan.json"), readGit: args => {
      if (args[0] === "merge-base") return "";
      return args.at(-2) === "current-push" ? "functions/trialAccessEmails.js\0" : "functions/index.js\0functions/trialAccessEmails.js\0";
    } });
    assert.equal(plan.mode, "full");
    assert.match(fs.readFileSync(".github/workflows/deploy-firebase.yml", "utf8"), /step.conclusion === 'success'/);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});
