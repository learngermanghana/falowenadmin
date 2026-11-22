import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { createLetterPdfBlob } from "../src/utils/letterPdf.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = (p) => fs.readFileSync(path.join(root, p), "utf8");

test("direct Admin PDF is a real A4 PDF with a valid cross-reference", async () => {
  const blob = createLetterPdfBlob({
    heading: "Confirmation (A1)",
    body: "Sehr geehrte Damen und Herren,\n\n" + "Falowen provides German and Kiswahili lessons. ".repeat(160),
    recipient: "Embassy",
    reference: "LLEA/2026/100",
    signatory: "Falowen Administration",
    date: "22 November 2026",
  });
  assert.equal(blob.type, "application/pdf");
  const content = await blob.text();
  assert.ok(content.startsWith("%PDF-1.4\n"));
  assert.match(content, /\/MediaBox \[0 0 595\.28 841\.89\]/);
  assert.match(content, /\/Count [2-9]/); // Long letters paginate automatically.
  assert.match(content, /DRAFT - Review and authorise before official use/);
  const start = Number(content.match(/startxref\n(\d+)\n%%EOF/)[1]);
  assert.equal(content.slice(start, start + 4), "xref");
  assert.match(content, /endobj\nxref\n/);
});

test("direct draft PDF requires heading and body", () => {
  assert.throws(() => createLetterPdfBlob({ heading: "Test" }), /heading and document body/i);
  assert.throws(() => createLetterPdfBlob({ body: "Test" }), /heading and document body/i);
});

test("verified Student Docs export uses the same existing PDF templates with sheet payment gating", () => {
  const script = source("docs/apps-script/registration-lifecycle-webhook.gs");
  const exporter = script.split("function exportEnrollmentDocumentFromSheet_(payload) {")[1]?.split("function doPost(e) {")[0];
  assert.ok(exporter);
  assert.match(exporter, /findStudentByLookup_\(lookup\)/);
  assert.match(exporter, /row\[idx\["Paid"\]\]/);
  assert.match(exporter, /isOrganisationFundedRow_/);
  assert.match(exporter, /buildEnrollmentPdf_\(row, idx, key\)/);
  assert.match(exporter, /buildAgreementPdf_\(row, idx, key\)/);
  assert.doesNotMatch(exporter, /sendEnrollmentPacketToStudent_|MailApp\.sendEmail|COL_ENROLL_SENT/);
});

test("export endpoint is owner-only and avoids storing PDF data in integration audit logs", () => {
  const hub = source("api/integration-hub.js");
  const route = source("api/router.js");
  const browser = source("src/services/studentDocumentsService.js");
  const page = source("src/pages/CommunicationWorkspacePage.jsx");
  assert.match(route, /integrations\/export/);
  assert.match(hub, /verifyFirebaseAdminUser\(bearerToken\(req\)\)/);
  assert.match(hub, /path === "integrations\/export"/);
  assert.match(hub, /Cache-Control", "no-store/);
  assert.match(hub, /exportEnrollmentDocumentFromSheet/);
  assert.match(browser, /getIdToken\(\)/);
  assert.doesNotMatch(browser, /ANNOUNCEMENT_WEBHOOK_TOKEN|script\.google\.com/);
  assert.match(page, /Download enrollment PDF/);
  assert.match(page, /Download payment agreement PDF/);
  assert.match(page, /Download PDF/);
});


test("certificate download uses the original signed PDF generator only for verified completion", () => {
  const script = source("docs/apps-script/certificate-direct-export.gs");
  const hub = source("api/integration-hub.js");
  const browser = source("src/services/studentDocumentsService.js");
  const page = source("src/pages/CommunicationWorkspacePage.jsx");

  assert.match(script, /loadStudents_\(\).*loadScores_\(\)/s);
  assert.match(script, /findCompletionFromRows_\(rows, resolvedCode, level\)/);
  assert.match(script, /completion\.completed && completion\.passedAll/);
  assert.match(script, /status\.passedAllRequired/);
  assert.match(script, /generateCertificatePdf_\(/);
  assert.match(script, /certificate\.getBytes\(\)/);
  assert.match(script, /Student code and email do not match/);
  assert.doesNotMatch(script, /MailApp\.sendEmail\(|sendOrQueueEmail_\(|PROCESSED_CERTS.*setProperty/);
  assert.match(hub, /isCertificate \? communicationConfig\(\) : registrationConfig\(\)/);
  assert.match(hub, /exportVerifiedCertificateFromScores/);
  assert.match(browser, /"certificate"/);
  assert.match(page, /Download certificate PDF/);
  assert.match(page, /setCertificateLevel/);
});
