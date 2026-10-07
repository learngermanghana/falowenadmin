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
  assert.doesNotMatch(workflow, /npm run prebuild/);
  assert.match(workflow, /Prepare production source exactly once[\s\S]*npm run sync:build/);
  assert.match(workflow, /Build production bundle without rerunning source sync[\s\S]*npx vite build/);
  assert.match(workflow, /tests\/student-leads-hub\.test\.js/);
  assert.doesNotMatch(workflow, /Build production bundle without rerunning source sync[\s\S]{0,120}npm run build/);
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

test("Presenter prebuild always defines nextLessonHref before passing it to standard slides", () => {
  const page = read("src/pages/TeachingSlidesPage.jsx");
  const patch = read("scripts/patchPresenterStudentPicker.mjs");

  assert.match(page, /const nextLessonHref = next/);
  assert.match(page, /<TeachingSlidePresenter[\s\S]{0,260}nextLessonHref=\{nextLessonHref\}/);
  assert.match(page, /nextLessonLabel=\{nextLessonLabel\}/);
  assert.match(patch, /if \(!pageSource\.includes\("const nextLessonHref = next"\)\)/);
  assert.doesNotMatch(
    patch,
    /const nextLessonHref = next \?"\) && !pageSource\.includes\("const nextA1BlockHref = nextA1Block"/,
  );
});

test("student profile sync patch matches the current directory structure", () => {
  const patch = read("scripts/patchStudentProfileUpdateApi.mjs");
  const directory = read("src/pages/StudentDirectoryPage.jsx");
  const functionsIndex = read("functions/index.js");

  assert.match(patch, /profileFieldsAnchor/);
  assert.match(patch, /renderEditableFields\(tab\.fields\)/);
  assert.doesNotMatch(patch, /Student profile field-grid anchor changed/);

  const emergencyAlreadyCommitted = directory.includes("STUDENT_EMERGENCY_CONTACT_FIELD");
  if (!emergencyAlreadyCommitted) {
    assert.match(directory, /function resolveStudentPhone\(student, draft = \{\}\)/);
    assert.match(directory, /resolveStudentPhone\(student\),[\s\S]{0,120}student\.level/);
    assert.match(directory, /\{renderEditableFields\(tab\.fields\)\}/);
  }

  const apiAlreadyRegistered = functionsIndex.includes(
    "registerStudentProfileUpdateRoute({ app, db, admin, requireAuth, staffEmails: teacherAllowlist });",
  );
  if (!apiAlreadyRegistered) {
    assert.match(functionsIndex, /function sessionDocRef\(classId, sessionId\)/);
  }
});

test("manual marking sync patch matches the current MarkingPage effect", () => {
  const patch = read("scripts/applyMarkingManualSelectionFix.mjs");
  const markingPage = read("src/pages/MarkingPage.jsx");

  assert.match(patch, /setFeedback\("\\"\\"\)/);
  assert.match(patch, /setSaveReceipt\(null\)/);
  assert.match(patch, /reviewIdentity,/);
  assert.match(patch, /selectedSubmission\?\.raw\?\.assignment_id/);

  assert.match(markingPage, /setFeedback\("\\"\\"\)/);
  assert.match(markingPage, /setSaveReceipt\(null\)/);
  assert.match(markingPage, /reviewIdentity,/);
  assert.match(markingPage, /const submissionAssignmentId = selectedSubmission\?\.assignmentId \|\| selectedSubmission\?\.assignmentKey \|\| "";/);
});

