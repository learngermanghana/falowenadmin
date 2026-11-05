"use strict";
const { createHash, randomBytes } = require("node:crypto");
const { owner } = require("./organisationEnrolment");
const TERMS = "first-tuition-10-v1";
const hash = text => createHash("sha256").update(text).digest("hex");
const fail = (status, message) => { throw Object.assign(new Error(message), { status }); };
function emailOf(input) {
  const email = String(input || "").trim().toLowerCase();
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) fail(400, "Enter a valid email.");
  return email;
}
function idOf(value) {
  if (!/^[a-f0-9]{64}$/.test(value || "")) fail(400, "Invalid review reference.");
  return value;
}
function millis(value) {
  return value?.toMillis?.() ?? Date.parse(value || "");
}
// Both existing tuition webhooks record tuition separately from processing fees.
function firstPayment(adminDocs, campusDocs, claimedAt) {
  const history = [];
  for (const doc of adminDocs) {
    const p = doc.data();
    if (p.status === "paid" || p.status === "refunded" || p.paidAt) history.push({
      ref: doc.id, amount: p.tuitionCredit, time: millis(p.paidAt), currency: p.currency,
      eligible: p.status === "paid" && !p.refundedAt && !p.refunded && !p.refundStatus && !["renewal", "level_upgrade"].includes(p.purpose),
    });
  }
  for (const doc of campusDocs) {
    const p = doc.data();
    if (p.status === "handled" || p.status === "refunded") history.push({
      ref: doc.id, amount: p.tuitionAmount, time: millis(p.createdAt), currency: p.currency || "GHS",
      eligible: p.status === "handled" && !p.refundedAt && !p.refunded && !p.refundStatus,
    });
  }
  if (!Number.isFinite(millis(claimedAt))) return null;
  if (history.some(p => !Number.isFinite(p.time))) return null;
  history.sort((a, b) => a.time - b.time || a.ref.localeCompare(b.ref));
  const first = history[0];
  if (!first?.eligible || first.time < millis(claimedAt) || first.currency !== "GHS") return null;
  const tuitionMinor = Math.round(Number(first.amount) * 100);
  if (!Number.isSafeInteger(tuitionMinor) || tuitionMinor <= 0) return null;
  return { reference: first.ref, tuitionMinor, commissionMinor: Math.round(tuitionMinor / 10), currency: "GHS" };
}
async function verifyReceipt(reference, getSecret, fetchImpl = fetch) {
  if (typeof reference !== "string" || !/^[A-Za-z0-9.=_-]{1,160}$/.test(reference)) fail(400, "Invalid payment reference.");
  const secret = getSecret();
  if (!secret) fail(503, "Payment verification is unavailable.");
  async function get(path) {
    const response = await fetchImpl("https://api.paystack.co/" + path, {
      headers: { Authorization: "Bearer " + secret }, signal: AbortSignal.timeout(8000),
    });
    const payload = await response.json();
    if (!response.ok || payload.status !== true) fail(503, "Paystack could not verify this payment. Retry later.");
    return payload.data;
  }
  const receipt = await get("transaction/verify/" + encodeURIComponent(reference));
  if (receipt?.reference !== reference || !receipt.id) fail(409, "Paystack reference mismatch.");
  const refunds = await get("refund?transaction=" + encodeURIComponent(receipt.id) + "&perPage=1");
  if (!Array.isArray(refunds)) fail(503, "Paystack could not confirm refund status.");
  return { receipt, refund: refunds.length > 0 || receipt.status === "reversed" };
}
function confirmReceipt(proof, claim, student, payment) {
  const r = proof.receipt;
  const m = r.metadata || {};
  const credited = Math.round(Number(m.tuitionCredit ?? m.tuitionAmount ?? m.amountRequested) * 100);
  const sameStudent = m.studentId ? m.studentId === student.id :
    [student.id, student.data().studentCode, student.data().studentcode].filter(Boolean).includes(m.studentCode || m.student_code);
  if (proof.refund || r.status !== "success" || r.currency !== "GHS" || !sameStudent ||
      credited !== payment.tuitionMinor || !(r.amount >= credited) ||
      !Number.isFinite(millis(r.paid_at)) || millis(r.paid_at) < millis(claim.createdAt) ||
      ["level_upgrade", "renewal"].includes(m.purpose) || Number(m.paidSoFar || 0) > 0) {
    fail(409, "Paystack could not confirm an eligible, non-refunded first tuition payment.");
  }
}
function registerReferralRoutes(app, { db, admin, getSecret = () => process.env.PAYSTACK_SECRET, verify = verifyReceipt }) {
  const now = () => admin.firestore.FieldValue.serverTimestamp();
  const partners = db.collection("referralApplications");
  const codes = db.collection("referralLinks");
  const claims = db.collection("referralClaims");
  const handle = (scope, action) => async (req, res) => {
    res.set("Cache-Control", "no-store");
    try {
      const actor = scope === "owner" ? await owner(req, admin) : null;
      return res.json({ ok: true, ...await action(req, actor) });
    } catch (error) {
      return res.status(error.status || 500).json({ ok: false, error: error.status ? error.message : "Referral service unavailable. Please retry." });
    }
  };
  // Limit new public writes, including attempts using many different emails.
  async function chargeQuota(tx, req, kind) {
    const day = new Date().toISOString().slice(0, 10);
    const ref = db.collection("referralLimits").doc(hash([kind, req.ip || "unknown", day].join(":")));
    const snap = await tx.get(ref);
    const count = snap.data()?.count || 0;
    if (count >= 50) fail(429, "Daily limit reached. Contact Falowen for help.");
    tx.set(ref, { count: count + 1, expiresAt: new Date(Date.now() + 2 * 86400000) });
  }
  app.post("/referrals/apply", handle("public", async req => {
    const { name, email: input, consent, website } = req.body || {};
    const email = emailOf(input);
    if (typeof name !== "string" || !name.trim() || name.length > 150 || consent !== true || website) fail(400, "Enter your name and accept the referral terms.");
    const ref = partners.doc(hash(email));
    await db.runTransaction(async tx => {
      if ((await tx.get(ref)).exists) return;
      await chargeQuota(tx, req, "apply");
      tx.create(ref, { name: name.trim(), email, terms: TERMS, status: "pending", createdAt: now() });
    });
  }));
  app.post("/referrals/claim", handle("public", async req => {
    const { code, email: input, consent, website } = req.body || {};
    const email = emailOf(input);
    if (!/^[a-f0-9]{32}$/.test(code || "") || consent !== true || website) fail(400, "Check your invitation link and confirm your email.");
    await db.runTransaction(async tx => {
      const link = await tx.get(codes.doc(code));
      if (!link.exists) fail(400, "This referral link is unavailable.");
      const partnerId = link.data().partnerId;
      if (partnerId === hash(email)) fail(400, "Use your own learner email. Self-referrals are excluded.");
      const claim = claims.doc(hash(email));
      if ((await tx.get(claim)).exists) return;
      await chargeQuota(tx, req, "claim");
      tx.create(claim, { email, partnerId, partnerName: link.data().name, partnerEmail: link.data().email, terms: TERMS, status: "pending", createdAt: now() });
    });
  }));
  app.post("/admin/referrals/applications/:id", handle("owner", async (req, actor) => {
    const ref = partners.doc(idOf(req.params.id));
    const status = req.body?.status;
    if (!["approved", "rejected"].includes(status)) fail(400, "Choose approve or reject.");
    await db.runTransaction(async tx => {
      const snap = await tx.get(ref);
      if (!snap.exists) fail(404, "Application not found.");
      if (snap.data().status === status) return;
      if (snap.data().status !== "pending") fail(409, "This application was already reviewed.");
      const code = status === "approved" ? randomBytes(16).toString("hex") : null;
      if (code) tx.create(codes.doc(code), { partnerId: ref.id, name: snap.data().name, email: snap.data().email });
      tx.update(ref, { status, code, reviewedBy: actor.uid, reviewedAt: now() });
    });
  }));
  for (const [kind, collection] of [["applications", partners], ["claims", claims]]) {
    app.get("/admin/referrals/" + kind, handle("owner", async req => {
      let query = collection.orderBy("createdAt", "desc");
      if (req.query?.cursor) {
        const cursor = await collection.doc(idOf(req.query.cursor)).get();
        if (!cursor.exists) fail(400, "Refresh the review list.");
        query = query.startAfter(cursor);
      }
      const docs = (await query.limit(40).get()).docs;
      return { rows: docs.map(d => ({ ...d.data(), id: d.id })), cursor: docs.length === 40 ? docs.at(-1).id : null };
    }));
  }
  app.post("/admin/referrals/claims/:id", handle("owner", async (req, actor) => {
    const ref = claims.doc(idOf(req.params.id));
    const action = req.body?.action;
    if (!["inspect", "approve", "reverse", "check-refund", "record-payout"].includes(action) || (["approve", "reverse", "record-payout"].includes(action) && req.body?.confirmed !== true)) fail(400, "Confirm the review before continuing.");
    const proof = ["approve", "check-refund", "record-payout"].includes(action) ? await verify(req.body.reference, getSecret) : null;
    return db.runTransaction(async tx => {
      const snap = await tx.get(ref);
      if (!snap.exists) fail(404, "Referral not found.");
      const claim = snap.data();
      if (action === "record-payout") {
        if (claim.status !== "approved" || claim.reference !== req.body.reference) fail(409, "Refresh the commission record.");
        const payoutReference = String(req.body.payoutReference || "").trim();
        if (!payoutReference || payoutReference.length > 120) fail(400, "Enter the payout receipt reference.");
        if (claim.payoutReference === payoutReference) return;
        if (claim.payoutReference) fail(409, "A payout has already been recorded.");
        if (proof.refund || proof.receipt.status !== "success") fail(409, "Payment is ineligible. Recheck refund status.");
        tx.update(ref, { payoutReference, payoutRecordedAt: now(), payoutRecordedBy: actor.uid });
        return;
      }
      if (action === "check-refund") {
        if (claim.reference !== req.body.reference || claim.status !== "approved") fail(409, "Refresh the commission record.");
        if (!proof.refund) return { refunded: false };
      }
      if (action === "reverse" || action === "check-refund") {
        if (claim.status === "reversed") return;
        tx.update(ref, { status: "reversed", reversedBy: actor.uid, reversedAt: now(), reason: action === "check-refund" ? "provider-refund" : "owner-review" });
        return { refunded: action === "check-refund" };
      }
      if (claim.status === "approved") return;
      if (claim.status !== "pending") fail(409, "This referral is closed.");
      const matches = await tx.get(db.collection("students").where("email", "==", claim.email).limit(2));
      if (matches.size !== 1) fail(409, "One matching student account is required.");
      const student = matches.docs[0];
      if (student.data().billingResponsibility === "organisation" || student.data().enrolmentSource === "organisation") fail(409, "Institutional enrolments are excluded.");
      const byStudent = name => db.collection(name).where("studentId", "==", student.id);
      const [payments, events] = await Promise.all([tx.get(byStudent("payments")), tx.get(byStudent("paystackWebhookEvents"))]);
      const payment = firstPayment(payments.docs, events.docs, claim.createdAt);
      if (!payment) fail(409, "No eligible first tuition payment found after this referral.");
      if (action === "inspect") return { payment };
      if (req.body.reference !== payment.reference || req.body.tuitionMinor !== payment.tuitionMinor) fail(409, "Payment changed. Inspect it again.");
      confirmReceipt(proof, claim, student, payment);
      const lock = db.collection("referralCommissionStudents").doc(student.id);
      if ((await tx.get(lock)).exists) fail(409, "This student already has a commission record.");
      tx.create(lock, { claimId: ref.id });
      tx.update(ref, { ...payment, studentId: student.id, status: "approved", reviewedBy: actor.uid, reviewedAt: now() });
    });
  }));
}
module.exports = { registerReferralRoutes, firstPayment, verifyReceipt };
