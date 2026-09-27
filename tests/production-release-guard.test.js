import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

function read(path) {
  return fs.readFileSync(path, "utf8");
}

test("dashboard regression workflow mirrors build-badge paths on pull_request and push", () => {
  const workflow = read(".github/workflows/teacher-lesson-dashboard-tests.yml");
  const [beforePush, afterPush] = workflow.split("\n  push:\n");

  assert.match(beforePush, /src\/App\.css/);
  assert.match(beforePush, /vite\.config\.js/);
  assert.match(afterPush, /src\/App\.css/);
  assert.match(afterPush, /vite\.config\.js/);
});

test("production release workflow gates, verifies and retries Vercel production", () => {
  const workflow = read(".github/workflows/production-release.yml");

  assert.match(workflow, /branches: \[main\]/);
  assert.match(workflow, /release-gate:/);
  assert.match(workflow, /release-gate:[\s\S]*github\.ref == 'refs\/heads\/main'/);
  assert.match(workflow, /verify-production:[\s\S]*github\.ref == 'refs\/heads\/main'/);
  assert.match(workflow, /compare\/\$TARGET_SHA\.\.\.\$deployed/);
  assert.match(workflow, /relation" = "ahead"/);
  assert.match(workflow, /newer descendant/);
  assert.match(workflow, /patchPresenterStudentPicker\.mjs/);
  assert.match(workflow, /patchPresenterRandomAndAttendanceDiagnostics\.mjs/);
  assert.match(workflow, /npm run build/);
  assert.match(workflow, /Wait for Vercel Git deployment/);
  assert.match(workflow, /Verify production contains this main commit/);
  assert.match(workflow, /scheduled-rate-limit-retry:/);
  assert.match(workflow, /rate limited/);
  assert.match(workflow, /\.vercel-production-retry\.txt/);
  assert.match(workflow, /VERCEL_PROJECT_ID: "prj_LPtknLn9PLUo0TXQEPPKAMGbMsvQ"/);
  assert.match(workflow, /VERCEL_ORG_ID: "team_vYAAqPf7zycxvsCSqqPFo5qc"/);
});

test("Admin exposes a cached production-vs-main freshness endpoint", () => {
  const router = read("api/router.js");

  assert.match(router, /path === "deployment-status"/);
  assert.match(router, /VERCEL_GIT_COMMIT_SHA/);
  assert.match(router, /commits\/main/);
  assert.match(router, /compare\/\$\{deployedSha\}\.\.\.main/);
  assert.match(router, /behindBy/);
  assert.match(router, /s-maxage=300/);
});

test("Admin top bar warns when production is behind main", () => {
  const app = read("src/App.jsx");
  const css = read("src/App.css");

  assert.match(app, /fetch\("\/api\/deployment-status"/);
  assert.match(app, /Production behind main/);
  assert.match(app, /Production \$\{deploymentStatus\.behindBy\} commit/);
  assert.match(css, /\.topbar-deployment-warning/);
});
