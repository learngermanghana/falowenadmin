"use strict";
const crypto = require("node:crypto");
const { owner } = require("./organisationEnrolment");
const VERSION = "partnership-2026-11-05-v2";
const hash = text => crypto.createHash("sha256").update(text).digest("hex");
const fail = (status, message) => { throw Object.assign(new Error(message), { status }); };
const TERMS = {
  referral: ["Subject to Falowen approval, an approved partner earns 10% of a referred learner’s first completed, non-refunded course payment. The amount is based on tuition received, excluding processing fees. Later instalments, renewals, institutional enrolments and self-referrals are excluded. A refund cancels the commission."],
  institutional: ["Schools, employers and sponsoring organisations can enrol a group under an agreement with Falowen. Our team reviews the group and confirms who will pay before inviting students."],
};
function validateApplication(body = {}) {
  const kind = body.kind;
  if (!TERMS[kind] || body.termsVersion !== VERSION || body.consent !== true || body.signatureConsent !== true || body.website) fail(400, "Read the current agreement and accept electronic signing.");
  const text = (key, max, required = true) => {
    const value = String(body[key] || "").trim();
    if ((required && !value) || value.length > max || /[\x00-\x1f]/.test(value)) fail(400, `Check ${key}.`);
    return value;
  };
  const email = text("email", 254).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) fail(400, "Enter a valid contact email.");
  if (!/^[a-f0-9]{64}$/.test(body.receiptToken || "")) fail(400, "Refresh the form and retry.");
  const publicData = { kind, name: text("name", 150), email, phone: text("phone", 40), address: text("address", 300),
    signerName: text("signerName", 150), signerRole: text("signerRole", 100), terms: VERSION,
    billingResponsibility: kind === "institutional" ? text("billingResponsibility", 30) : "learner" };
  if (kind === "institutional" && !["organisation", "learner"].includes(publicData.billingResponsibility)) fail(400, "Choose who will pay tuition.");
  let bank = null;
  if (kind === "referral") {
    const type = text("payoutType", 20), bankCode = text("bankCode", 20), accountNumber = text("accountNumber", 30), accountName = text("accountName", 150);
    if (!["ghipss", "mobile_money"].includes(type) || !/^[a-zA-Z0-9_-]+$/.test(bankCode) || !/^\d{8,20}$/.test(accountNumber) || body.payoutConsent !== true) fail(400, "Enter Ghana bank or mobile money details and authorise commission payments.");
    bank = { type, bank_code: bankCode, account_number: accountNumber, name: accountName, currency: "GHS" };
  }
  return { publicData, bank, tokenHash: hash(body.receiptToken) };
}
function encryptBank(bank, secret) {
  if (!secret) fail(503, "Payment configuration is unavailable. Please retry later.");
  const key = crypto.hkdfSync("sha256", secret, "falowen", "partnership-bank-v1", 32);
  const iv = crypto.randomBytes(12), cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const content = Buffer.concat([cipher.update(JSON.stringify(bank)), cipher.final()]);
  return { version: 1, iv: iv.toString("base64"), tag: cipher.getAuthTag().toString("base64"), data: content.toString("base64") };
}
function decryptBank(value, secret) {
  const key = crypto.hkdfSync("sha256", secret, "falowen", "partnership-bank-v1", 32);
  const cipher = crypto.createDecipheriv("aes-256-gcm", key, Buffer.from(value.iv, "base64"));
  cipher.setAuthTag(Buffer.from(value.tag, "base64"));
  return JSON.parse(Buffer.concat([cipher.update(Buffer.from(value.data, "base64")), cipher.final()]).toString());
}
async function loadDirectorSignature() {
  const fileId = process.env.PARTNERSHIP_SIGNATURE_DRIVE_FILE_ID;
  if (!fileId || !/^[a-zA-Z0-9_-]+$/.test(fileId)) fail(503, "Configure the private Falowen signature before approving agreements.");
  const { GoogleAuth } = require("google-auth-library");
  const client = await new GoogleAuth({ scopes: ["https://www.googleapis.com/auth/drive.readonly"] }).getClient();
  const response = await client.request({ url: `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, responseType: "arraybuffer" });
  const png = Buffer.from(response.data);
  if (png.length > 70000 || png.subarray(0, 8).toString("hex") !== "89504e470d0a1a0a") fail(503, "Falowen's signature must be a PNG under 70 KB.");
  return png;
}
async function buildAgreementPdf(record = {}, { sample = false, signature } = {}) {
  const { PDFDocument, rgb } = require("pdf-lib");
  const doc = await PDFDocument.create();
  doc.registerFontkit(require("@pdf-lib/fontkit"));
  const fs = require("node:fs"), path = require("node:path");
  const font = await doc.embedFont(fs.readFileSync(path.join(__dirname, "assets/DejaVuSans.ttf")), { subset: true });
  const bold = font;
  let page, y;
  const printable = value => String(value ?? "");
  const addPage = () => { page = doc.addPage([595, 842]); y = 785;
    page.drawRectangle({ x: 0, y: 822, width: 595, height: 20, color: rgb(0.08, 0.23, 0.29) });
    page.drawText("FALOWEN / PARTNERSHIPS", { x: 48, y: y, size: 10, font: bold, color: rgb(0.08, 0.23, 0.29) }); y -= 30;
    page.drawText(`${VERSION}  |  Page ${doc.getPageCount()}`, { x: 48, y: 28, size: 8, font });
  };
  const write = (value, { heading = false } = {}) => {
    const size = heading ? 12 : 10, face = heading ? bold : font;
    for (const paragraph of printable(value).split("\n")) {
      let line = "";
      const flush = () => { if (y < 65) addPage(); page.drawText(line, { x: 48, y, font: face, size }); y -= 15; line = ""; };
      for (const word of paragraph.split(" ")) {
        if (line && face.widthOfTextAtSize(line + " " + word, size) > 495) flush();
        if (face.widthOfTextAtSize(word, size) > 495) {
          for (const character of word) { if (face.widthOfTextAtSize(line + character, size) > 495) flush(); line += character; }
        } else line = line ? line + " " + word : word;
      }
      flush(); y -= 5;
    }
  };
  addPage();
  write(`${record.kind === "institutional" ? "Institutional Partnership" : "Referral Partnership"} Agreement`, { heading: true });
  write(sample ? "SAMPLE - unsigned; for review only" : record.status === "approved" ? "Signed agreement receipt - partner approved" : "Signed agreement receipt - partnership approval pending");
  write(`Reference: ${record.id || "SAMPLE"}\nTerms version: ${VERSION}`);
  write(`Partner: ${record.name || "To be completed"}\nContact email: ${record.email || "To be completed"}\nPhone: ${record.phone || "To be completed"}\nAddress: ${record.address || "To be completed"}`);
  if (record.kind === "institutional") write(`Tuition payer: ${record.billingResponsibility || "To be confirmed"}`);
  if (record.payoutSummary) write(`Payout destination: ${record.payoutSummary.type}; account ending ${record.payoutSummary.last4}. Full banking details are held privately.`);
  (record.termsSnapshot || TERMS[record.kind] || TERMS.referral).forEach((term, index) => { write(`${index + 1}. ${term}`); });
  write("Electronic signature record", { heading: true });
  write(`Applicant signature: ${sample ? "Unsigned sample" : record.signerName}\nCapacity: ${record.signerRole || "To be completed"}\nSigned at (UTC): ${record.signedAt || "Unsigned sample"}\nTerms SHA-256: ${record.termsHash || hash(JSON.stringify(TERMS[record.kind] || TERMS.referral))}`);
  if (signature && !sample) {
    if (y < 180) addPage();
    write("For Learn Language Education Academy (Falowen)", { heading: true });
    const image = await doc.embedPng(signature), size = image.scaleToFit(150, 55);
    page.drawImage(image, { x: 48, y: y - size.height, width: size.width, height: size.height }); y -= size.height + 20;
    write(`Director's authorised signature\nReceipt issued at (UTC): ${record.signedAt}`);
  } else write("Unsigned sample. The submitted receipt includes the applicant signature and Falowen director signature.");
  return Buffer.from(await doc.save());
}
function registerAgreementRoutes(app, { db, admin, getSecret = () => process.env.PAYSTACK_SECRET, loadSignature = loadDirectorSignature, pdf = buildAgreementPdf }) {
  const now = () => admin.firestore.FieldValue.serverTimestamp();
  const resolveSignature = async () => {
    const stored = await db.collection("partnershipSettings").doc("directorSignature").get();
    return stored.exists ? Buffer.from(stored.data().png, "base64") : loadSignature();
  };
  const partners = db.collection("referralApplications"), privateData = db.collection("partnershipPrivate");
  const handle = action => async (req, res) => { res.set("Cache-Control", "no-store"); try { await action(req, res); }
    catch (e) { res.status(e.status || 500).json({ ok: false, error: e.status ? e.message : "Agreement service unavailable. Your entries are unchanged; retry shortly." }); } };
  app.get("/admin/referrals/signature", handle(async (req, res) => {
    await owner(req, admin);
    const stored = await db.collection("partnershipSettings").doc("directorSignature").get();
    res.json({ ok: true, installed: stored.exists, driveConfigured: Boolean(process.env.PARTNERSHIP_SIGNATURE_DRIVE_FILE_ID) });
  }));
  app.post("/admin/referrals/signature", handle(async (req, res) => {
    const actor = await owner(req, admin), value = req.body?.png;
    if (typeof value !== "string" || value.length > 94000 || !/^[a-zA-Z0-9+/=]+$/.test(value)) fail(400, "Upload a PNG under 70 KB.");
    const png = Buffer.from(value, "base64");
    if (png.length > 70000 || png.subarray(0, 8).toString("hex") !== "89504e470d0a1a0a") fail(400, "A valid PNG signature is required.");
    const { PDFDocument } = require("pdf-lib"); await (await PDFDocument.create()).embedPng(png);
    await db.collection("partnershipSettings").doc("directorSignature").set({ png: value, hash: hash(png), updatedBy: actor.uid, updatedAt: now() });
    res.json({ ok: true });
  }));
  app.get("/referrals/agreement-terms", handle(async (req, res) => {
    const kind = req.query.kind === "institutional" ? "institutional" : "referral";
    res.json({ ok: true, version: VERSION, kind, terms: TERMS[kind] });
  }));
  app.get("/referrals/agreement-sample", handle(async (req, res) => {
    const kind = req.query.kind === "institutional" ? "institutional" : "referral";
    res.set("Content-Type", "application/pdf"); res.set("Content-Disposition", 'attachment; filename="Falowen-agreement-sample.pdf"');
    res.send(await pdf({ kind }, { sample: true }));
  }));
  app.post("/referrals/apply-signed", handle(async (req, res) => {
    const { publicData, bank, tokenHash } = validateApplication(req.body);
    const id = publicData.kind === "referral" ? hash(publicData.email) : hash("institutional:" + publicData.email);
    const ref = partners.doc(id), secretRef = privateData.doc(id);
    const signedAt = new Date().toISOString();
    const record = { ...publicData, id, status: "pending", signedAt, termsSnapshot: TERMS[publicData.kind], termsHash: hash(JSON.stringify(TERMS[publicData.kind])),
      consent: true, signatureConsent: true, payoutConsent: Boolean(bank), signatureMethod: "typed-name-with-explicit-consent", payoutSummary: bank ? { type: bank.type, bankCode: bank.bank_code, last4: bank.account_number.slice(-4), accountName: bank.name } : null };
    const encryptedBank = bank ? encryptBank(bank, getSecret()) : null;
    const signature = await resolveSignature();
    const pendingPdf = await pdf(record, { signature });
    await db.runTransaction(async tx => {
      const existing = await tx.get(ref), priorPrivate = await tx.get(secretRef);
      const quota = db.collection("referralLimits").doc(hash(`signed:${req.ip || "unknown"}:${new Date().toISOString().slice(0, 10)}`));
      const limit = await tx.get(quota);
      const upgradeLegacyPending = existing.exists && existing.data().status === "pending" && !existing.data().signedAt && !priorPrivate.exists;
      if (existing.exists && !upgradeLegacyPending) {
        if (!priorPrivate.exists || priorPrivate.data().tokenHash !== tokenHash) fail(409, "An application already exists for this email. Contact Falowen to amend it or request a copy.");
        return;
      }
      if ((limit.data()?.count || 0) >= 10) fail(429, "Daily application limit reached. Contact Falowen for assistance.");
      tx.set(quota, { count: (limit.data()?.count || 0) + 1, expiresAt: new Date(Date.now() + 2 * 86400000) });
      if (upgradeLegacyPending) tx.set(ref, { ...record, createdAt: existing.data().createdAt || now() });
      else tx.create(ref, { ...record, createdAt: now() });
      tx.create(secretRef, { tokenHash, encryptedBank, pendingPdf: pendingPdf.toString("base64"), signatureHash: hash(signature), createdAt: now() });
    });
    res.json({ ok: true, reference: id, termsVersion: VERSION });
  }));
  app.post("/referrals/agreement-copy", handle(async (req, res) => {
    const { reference, receiptToken } = req.body || {};
    if (!/^[a-f0-9]{64}$/.test(reference || "") || !/^[a-f0-9]{64}$/.test(receiptToken || "")) fail(404, "Agreement copy unavailable.");
    const stored = await privateData.doc(reference).get();
    if (!stored.exists || stored.data().tokenHash !== hash(receiptToken)) fail(404, "Agreement copy unavailable.");
    res.set("Content-Type", "application/pdf"); res.set("Content-Disposition", 'attachment; filename="Falowen-signed-agreement.pdf"');
    res.send(Buffer.from(stored.data().pendingPdf, "base64"));
  }));
  app.post("/admin/referrals/agreements/:id/copy", handle(async (req, res) => {
    await owner(req, admin); if (!/^[a-f0-9]{64}$/.test(req.params.id || "")) fail(404, "Agreement not found.");
    const stored = await privateData.doc(req.params.id).get(); if (!stored.exists) fail(404, "Agreement not found.");
    res.set("Content-Type", "application/pdf"); res.send(Buffer.from(stored.data().pendingPdf, "base64"));
  }));
}
module.exports = { VERSION, TERMS, hash, validateApplication, encryptBank, decryptBank, buildAgreementPdf, registerAgreementRoutes };
