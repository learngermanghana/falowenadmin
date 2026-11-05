"use strict";
const crypto = require("node:crypto");
const { owner } = require("./organisationEnrolment");
const { resolveWebhookConfig, postPaymentRow } = require("./studentPaymentUpdateEmails");
const fail = (status, message) => { throw Object.assign(new Error(message), { status }); };
const minor = value => {
  if (!["number", "string"].includes(typeof value) || String(value).trim() === "") fail(400, "Enter an amount in GHS.");
  const n = Number(value), amount = Math.round(n * 100);
  if (!Number.isFinite(n) || n < 0 || amount > 100000000 || Math.abs(n * 100 - amount) > 0.00001) fail(400, "Amounts must be non-negative, with at most two decimal places.");
  return amount;
};
function validateLines(lines) {
  if (!Array.isArray(lines) || !lines.length || lines.length > 50) fail(400, "Select between 1 and 50 approved students.");
  const seen = new Set();
  return lines.map(line => {
    const studentId = String(line.studentId || "");
    if (!/^[a-zA-Z0-9_-]{1,100}$/.test(studentId) || seen.has(studentId)) fail(400, "Invalid or duplicate student.");
    seen.add(studentId);
    const gross = minor(line.amount), discount = minor(line.discount ?? 0);
    if (!gross || discount >= gross) fail(400, "Each student must have a positive amount after discount.");
    return { studentId, tuitionCredit: (gross - discount) / 100, discount: discount / 100, grossAmount: gross / 100 };
  });
}
function paidOf(student) {
  for (const key of ["paid", "amountPaid", "paidAmount", "amount_paid", "totalPaid", "initialPaymentAmount"]) {
    if (student[key] !== undefined && student[key] !== null && student[key] !== "") return minor(student[key]);
  }
  return 0;
}
function balanceOf(student) {
  for (const key of ["balanceDue", "balance", "outstandingBalance", "amountDue"]) {
    if (student[key] !== undefined && student[key] !== null && student[key] !== "") return minor(student[key]);
  }
  if (student.tuitionFee === undefined || student.tuitionFee === "") fail(409, "Configure each student's tuition and balance in Students first.");
  return Math.max(0, minor(student.tuitionFee) - paidOf(student) - minor(student.tuitionDiscount ?? 0));
}
async function applyGroupPayment({ transaction: tx, paymentRef, payment, eventData, db, admin }) {
  if (eventData.currency !== "GHS" || Number(eventData.amount) !== minor(payment.checkoutAmount)) throw new Error("Group payment amount or currency mismatch.");
  if (payment.status === "paid") return { duplicate: true, reference: payment.reference, group: true };
  if (!["pending", "initializing"].includes(payment.status)) throw new Error("Group payment is not pending.");
  const lines = validateLines(payment.lines.map(line => ({ ...line, amount: line.grossAmount })));
  const snapshots = await Promise.all(lines.map(line => tx.get(db.collection("students").doc(line.studentId))));
  const now = admin.firestore.FieldValue.serverTimestamp();
  const paidAt = eventData.paid_at ? admin.firestore.Timestamp.fromDate(new Date(eventData.paid_at)) : now;
  snapshots.forEach((snap, i) => {
    const line = lines[i];
    if (!snap.exists || snap.data().organisationSubmissionId !== payment.organisationSubmissionId) throw new Error("Group student no longer matches the organisation.");
    const student = snap.data(), balance = balanceOf(student);
    // Keep actual cash separate from the agreed tuition reduction.
    const nextBalance = Math.max(0, balance - minor(line.tuitionCredit) - minor(line.discount)) / 100;
    tx.set(snap.ref, {
      paid: (paidOf(student) + minor(line.tuitionCredit)) / 100,
      tuitionDiscount: (minor(student.tuitionDiscount ?? 0) + minor(line.discount)) / 100,
      balanceDue: nextBalance, balance: nextBalance, paymentStatus: nextBalance === 0 ? "Paid" : "Partially Paid",
      lastPaymentAmount: line.tuitionCredit, lastPaymentReference: payment.reference,
      lastPaymentProvider: "Paystack", lastPaymentAt: paidAt, syncedToSheets: false, updated_at: now,
    }, { merge: true });
    tx.create(db.collection("payments").doc(`${payment.reference}-${i}`), {
      reference: `${payment.reference}-${i}`, parentReference: payment.reference,
      studentId: line.studentId, studentName: line.studentName || student.name || "", email: student.email,
      purpose: "organisation_allocation", billingResponsibility: "organisation", referralEligible: false,
      tuitionCredit: line.tuitionCredit, discount: line.discount, currency: "GHS", provider: "Paystack",
      status: "paid", paidAt, createdAt: now,
    });
  });
  tx.update(paymentRef, { status: "paid", paidAt, updatedAt: now, receiptStatus: "pending", paystackTransactionId: eventData.id || null,
    verifiedCurrency: "GHS", verifiedAmountSubunit: Number(eventData.amount) });
  return { group: true, duplicate: false, reference: payment.reference };
}
async function sendGroupReceipt({ db, admin, reference, runtimeConfig, send = postPaymentRow }) {
  const ref = db.collection("payments").doc(reference);
  const snap = await ref.get(), payment = snap.data();
  if (!payment || payment.purpose !== "organisation_group" || payment.status !== "paid" || payment.receiptStatus === "sent") return;
  // A short lease prevents overlapping webhook retries from sending together.
  const reserved = await db.runTransaction(async tx => {
    const current = (await tx.get(ref)).data();
    if (current.receiptStatus === "sent" || Number(current.receiptLeaseUntil || 0) > Date.now()) return false;
    tx.update(ref, { receiptLeaseUntil: Date.now() + 60000 }); return true;
  });
  if (!reserved) throw new Error("Company receipt is being delivered; retry shortly.");
  try {
    const breakdown = payment.lines.map(line => `${line.studentName}: GHS ${line.tuitionCredit.toFixed(2)} paid; discount GHS ${line.discount.toFixed(2)}`).join("\n");
    await send(resolveWebhookConfig(runtimeConfig), {
      email: payment.email, topic: "Falowen organisation payment receipt", announcement: [
        `Hello ${payment.organisationName},`, `Payment received. Reference: ${reference}`,
        breakdown, `Tuition paid: GHS ${payment.tuitionCredit.toFixed(2)}`,
        `Discount: GHS ${payment.discount.toFixed(2)}`, `Checkout total including processing share: GHS ${payment.checkoutAmount.toFixed(2)}`,
        "The payment has been allocated to the listed student accounts.",
      ].join("\n\n"), delivery_mode: "individual", allow_bcc_fallback: "FALSE", email_type: "payment_update",
      show_app_button: "FALSE", show_progress: "FALSE", show_review: "FALSE", attach_certificate: "FALSE", receipt_reference: reference,
    });
    await ref.update({ receiptStatus: "sent", receiptSentAt: admin.firestore.FieldValue.serverTimestamp(), receiptLeaseUntil: 0 });
  } catch (error) {
    await ref.update({ receiptStatus: "failed", receiptLeaseUntil: 0 }); throw error;
  }
}
function registerOrganisationPaymentRoutes(app, { db, admin, initializePaystackPayment, calculateStudentCheckoutAmount, runtimeConfig, reconcilePaymentReference }) {
  const handle = action => async (req, res) => {
    res.set("Cache-Control", "no-store");
    try { const actor = await owner(req, admin); res.json({ ok: true, ...await action(req, actor) }); }
    catch (error) { res.status(error.status || 500).json({ ok: false, error: error.status ? error.message : "Payment service unavailable. Retry shortly." }); }
  };
  app.get("/payments/organisations/:batchId", handle(async req => {
    const id = String(req.params.batchId);
    if (!/^[a-zA-Z0-9_-]{1,100}$/.test(id)) fail(400, "Invalid submission reference.");
    const batch = await db.collection("organisationEnrolments").doc(id).get();
    if (!batch.exists || batch.data().deleted) fail(404, "Submission not found.");
    const records = await db.collection("payments").where("organisationSubmissionId", "==", id).limit(50).get();
    return { payments: records.docs.map(doc => ({ id: doc.id, ...doc.data() })) };
  }));
  app.post("/payments/organisation-link", handle(async (req, actor) => {
    const batchId = String(req.body.batchId || ""), requestId = String(req.body.requestId || "");
    if (!/^[a-zA-Z0-9_-]{1,100}$/.test(batchId) || !/^[a-f0-9-]{36}$/.test(requestId)) fail(400, "Invalid request reference.");
    const lines = validateLines(req.body.lines);
    const email = String(req.body.email || "").trim().toLowerCase();
    const agreement = String(req.body.agreement || "").trim().slice(0, 500);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !agreement) fail(400, "Company billing email and institutional agreement reference are required.");
    const reference = `FAL-ORG-${requestId}`, ref = db.collection("payments").doc(reference);
    const signature = crypto.createHash("sha256").update(JSON.stringify({ batchId, lines, email, agreement })).digest("hex");
    await db.runTransaction(async tx => {
      const prior = await tx.get(ref);
      if (prior.exists) { if (prior.data().requestSignature !== signature) fail(409, "Start a new request after changing the invoice."); return; }
      const batch = await tx.get(db.collection("organisationEnrolments").doc(batchId));
      if (!batch.exists || batch.data().deleted) fail(404, "Submission not found.");
      const approved = new Set(batch.data().students.filter(row => row.status === "approved").map(row => row.studentId));
      const students = await Promise.all(lines.map(line => tx.get(db.collection("students").doc(line.studentId))));
      students.forEach((snap, i) => {
        if (!approved.has(lines[i].studentId) || !snap.exists || snap.data().organisationSubmissionId !== batchId) fail(409, "Only approved students in this organisation can be billed.");
        if (minor(lines[i].grossAmount) > balanceOf(snap.data())) fail(409, "An amount exceeds a student's outstanding balance.");
        if (lines[i].discount && !String(req.body.discountReason || "").trim()) fail(400, "Enter a reason for the discount.");
        lines[i].studentName = snap.data().name || snap.data().fullName || lines[i].studentId;
      });
      const tuitionCredit = lines.reduce((sum, line) => sum + minor(line.tuitionCredit), 0) / 100;
      const discount = lines.reduce((sum, line) => sum + minor(line.discount), 0) / 100;
      const checkoutAmount = calculateStudentCheckoutAmount(tuitionCredit);
      minor(checkoutAmount);
      tx.create(ref, { reference, requestSignature: signature, organisationSubmissionId: batchId,
        organisationName: batch.data().organisation.name, email, agreement, lines, tuitionCredit, discount,
        checkoutAmount, processingShare: checkoutAmount - tuitionCredit, currency: "GHS", provider: "Paystack",
        purpose: "organisation_group", referralEligible: false, status: "initializing", createdBy: actor.uid,
        discountReason: String(req.body.discountReason || "").trim().slice(0, 500), createdAt: admin.firestore.FieldValue.serverTimestamp() });
    });
    const payment = (await ref.get()).data();
    if (payment.authorizationUrl) return { payment };
    // Reuse the persisted reference on retry; never initialize a second charge intent.
    const checkout = await initializePaystackPayment({ email: payment.email, checkoutAmount: payment.checkoutAmount, reference,
      metadata: { source: "falowen_organisation", purpose: "organisation_group", organisationSubmissionId: batchId, referralEligible: false } });
    await ref.update({ status: "pending", authorizationUrl: checkout.authorization_url });
    return { payment: { ...payment, status: "pending", authorizationUrl: checkout.authorization_url } };
  }));
  app.post("/payments/organisations/verify/:reference", handle(async req => {
    if (!/^FAL-ORG-[a-f0-9-]{36}$/.test(req.params.reference)) fail(400, "Invalid reference.");
    const result = await reconcilePaymentReference(req.params.reference);
    await sendGroupReceipt({ db, admin, reference: req.params.reference, runtimeConfig });
    return { result };
  }));
  app.post("/payments/organisations/receipt/:reference", handle(async req => {
    if (!/^FAL-ORG-[a-f0-9-]{36}$/.test(req.params.reference)) fail(400, "Invalid reference.");
    await sendGroupReceipt({ db, admin, reference: req.params.reference, runtimeConfig }); return {};
  }));
}
module.exports = { minor, validateLines, balanceOf, applyGroupPayment, sendGroupReceipt, registerOrganisationPaymentRoutes };
