import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), "utf8");

test("student directory exposes Completion Pack controls", () => {
  const page = read("src/pages/StudentDirectoryPage.jsx");
  const panel = read("src/components/CompletionPackPanel.jsx");

  assert.match(page, /CompletionPackPanel/);
  assert.match(panel, /Preview attendance record/);
  assert.match(panel, /Regenerate PDF/);
  assert.match(panel, /Resend full completion pack/);
  assert.match(panel, /Latest delivery/);
  assert.match(panel, /Certificate · rebuilt on resend/);
  assert.match(panel, /Score Transcript · rebuilt on resend/);
});

test("completion pack service uses protected admin routes and existing communication delivery", () => {
  const service = read("src/services/completionPackService.js");

  assert.match(service, /\/api\/completion-pack\/report/);
  assert.match(service, /\/api\/completion-pack\/pdf/);
  assert.match(service, /getIdToken\(\)/);
  assert.match(service, /Authorization: `Bearer \$\{token\}`/);
  assert.match(service, /saveAnnouncementRow/);
  assert.match(service, /attachCertificate: true/);
  assert.match(service, /skipDuplicateGuard: true/);
});

test("Firebase API protects completion pack report and PDF routes", () => {
  const worker = read("functions/completionParticipationDocument.js");
  const index = read("functions/index.js");
  const router = read("api/router.js");

  assert.match(worker, /\/completion-pack\/report/);
  assert.match(worker, /\/completion-pack\/pdf/);
  assert.match(worker, /await requireAuth\(req\)/);
  assert.match(index, /registerCompletionDocumentRoute\(\{ app, db, runtimeConfig, requireAuth \}\)/);
  assert.match(router, /path\.startsWith\("completion-pack\/"\)/);
});

test("branded completion PDF follows the academy certificate visual language", () => {
  const worker = read("functions/completionParticipationDocument.js");

  assert.match(worker, /FALOWEN/);
  assert.match(worker, /LEARN LANGUAGE EDUCATION ACADEMY/);
  assert.match(worker, /Certificate of Attendance/);
  assert.match(worker, /Class Participation Record/);
  assert.match(worker, /Felix Asadu/);
  assert.match(worker, /Director/);
  assert.match(worker, /Accra, Ghana/);
  assert.match(worker, /Verification ID/);
  assert.match(worker, /Course dates:/);
  assert.match(worker, /participation is diagnostic learning data/i);
});

test("missing Presenter history never becomes a false zero-percent participation claim", () => {
  const worker = read("functions/completionParticipationDocument.js");

  assert.match(worker, /participation\.dataAvailable = participation\.trackedLessons > 0/);
  assert.match(worker, /Participation data was not sufficiently recorded for this course/);
  assert.match(worker, /No participation percentage is assigned/);
});
