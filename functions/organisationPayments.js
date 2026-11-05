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
      organisationPaymentReference: payment.reference,
      organisationPaymentGross: line.grossAmount, organisationRetainedShare: line.discount,
      organisationNetTuition: line.tuitionCredit, billingResponsibility: "organisation",
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
  if (!payment || !["organisation_group", "organisation_manual"].includes(payment.purpose) || payment.status !== "paid" || payment.receiptStatus === "sent") return;
  // A short lease prevents overlapping webhook retries from sending together.
  const reserved = await db.runTransaction(async tx => {
    const current = (await tx.get(ref)).data();
    if (current.receiptStatus === "sent" || Number(current.receiptLeaseUntil || 0) > Date.now()) return false;
    tx.update(ref, { receiptLeaseUntil: Date.now() + 60000 }); return true;
  });
  if (!reserved) throw new Error("Company receipt is being delivered; retry shortly.");
  try {
    const manual = payment.purpose === "organisation_manual";
    const format = value => "GHS " + Number(value || 0).toFixed(2);
    const breakdown = payment.lines.map((line, index) =>
      manual ? [index + 1, line.studentName || line.studentId, "Tuition received " + format(line.tuitionCredit)].join(" | ") :
      [index + 1, line.studentName || line.studentId, "Gross " + format(line.grossAmount),
        "retained organisation share " + format(line.discount), "net tuition allocated " + format(line.tuitionCredit)].join(" | ")
    ).join("\n");
    const processing = Number(payment.processingShare ?? (payment.checkoutAmount - payment.tuitionCredit));
    const gross = Number(payment.tuitionCredit) + Number(payment.discount);
    await send(resolveWebhookConfig(runtimeConfig), {
      email: payment.email,
      topic: "Falowen organisation tuition receipt — " + reference,
      announcement: [
        "Dear " + payment.organisationName + ",",
        "Falowen confirms receipt of your organisation-funded group tuition payment.",
        "Payment reference: " + reference,
        "Organisation: " + payment.organisationName,
        "Billing email: " + payment.email,
        "Payment status: Verified and allocated to student accounts",
        ...(manual ? [
          "Payment method: " + (MANUAL_METHOD_LABELS[payment.method] || "Verified manual payment"),
          "External receipt/transfer reference: " + payment.transactionReference,
          "Received date: " + (payment.receivedDate || payment.paidAt?.toDate?.()?.toISOString?.().slice(0, 10) || "Verified by Falowen"),
          "Original full-tuition arrangement: " + payment.agreement,
        ] : []),
        "Student tuition breakdown:",
        breakdown,
        manual ? "Tuition payment received: " + format(gross) : "Gross tuition before retained share: " + format(gross),
        ...(manual ? payment.lines.map(line => (
          (line.studentName || line.studentId) + " | Course tuition " + format(line.courseTuitionFee ?? line.grossAmount) +
          " | Remaining balance " + format(line.remainingBalance ?? 0) +
          (Number(line.remainingBalance || 0) > 0 ? " | One-month paid access until " + (line.accessEndDate || "see student contract") : "")
        )) : []),
        manual ? "Partner deduction from Falowen tuition: GHS 0.00 (legacy full-tuition arrangement)" : "Retained 10% organisation share: " + format(payment.discount),
        "Net tuition paid to Falowen: " + format(payment.tuitionCredit),
        manual ? "Payment processing charge deducted by Falowen: GHS 0.00" : "Checkout processing charges: " + format(processing),
        manual ? "Total received by Falowen: " + format(payment.checkoutAmount) : "Total charged to organisation: " + format(payment.checkoutAmount),
        manual ? "No organisation commission or Paystack fee was deducted from this payment. An outstanding balance, where shown, remains payable to Falowen." : "The retained organisation share is a deduction from the first tuition payment, not a second payout. Processing charges are not tuition credited to students.",
        manual && payment.lines.some(line => Number(line.remainingBalance || 0) > 0)
          ? "This is a partial tuition payment. One-month paid access runs from the recorded receipt date, subject to student account invitation. The remaining tuition is still due; it is not a full-paid six-month contract."
          : "Each class lasts 10 weeks. Student access is six months from account activation. Any class change needs approval and availability and does not extend access.",
        "Please retain this reference and breakdown as your organisation payment receipt. Your students will receive separate enrolment confirmations when their class and account invitations are ready.",
        "Falowen · Learn Language Education Academy",
      ].join("\n\n"),
      delivery_mode: "individual", allow_bcc_fallback: "FALSE", email_type: "organisation_payment_receipt",
      show_app_button: "FALSE", show_progress: "FALSE", show_review: "FALSE", attach_certificate: "FALSE",
      receipt_reference: reference, organisation_name: payment.organisationName,
      organisation_billing_email: payment.email, gross_tuition: gross,
      organisation_share: Number(payment.discount), net_tuition: Number(payment.tuitionCredit),
      processing_charges: processing, checkout_total: Number(payment.checkoutAmount),
      student_allocations: payment.lines.map(line => ({
        student_id: line.studentId, student_name: line.studentName,
        gross_tuition: Number(line.grossAmount), organisation_share: Number(line.discount),
        net_tuition: Number(line.tuitionCredit),
      })),
    });
    await ref.update({ receiptStatus: "sent", receiptSentAt: admin.firestore.FieldValue.serverTimestamp(), receiptLeaseUntil: 0 });
  } catch (error) {
    await ref.update({ receiptStatus: "failed", receiptLeaseUntil: 0 }); throw error;
  }
}

const MANUAL_METHOD_LABELS = Object.freeze({
  bank_transfer: "Bank transfer",
  mobile_money: "Mobile money",
  cash: "Cash",
});

function oneCalendarMonthFrom(value) {
  const date = new Date(value);
  const year = date.getUTCFullYear(), month = date.getUTCMonth(), day = date.getUTCDate();
  const lastDay = new Date(Date.UTC(year, month + 2, 0)).getUTCDate();
  const next = new Date(date);
  next.setUTCDate(1);
  next.setUTCMonth(month + 1);
  next.setUTCDate(Math.min(day, lastDay));
  return next.toISOString();
}

function confirmedPaidOf(student) {
  for (const key of ["paid", "amountPaid", "paidAmount", "amount_paid", "totalPaid"]) {
    if (student[key] !== undefined && student[key] !== null && student[key] !== "") return minor(student[key]);
  }
  // initialPaymentAmount is a payment *intent* in the Admin editor, not evidence of received funds.
  return 0;
}

// Staff must independently verify the bank/MoMo/cash receipt. No provider charge or
// discount is created for historical agreements that predate the 10% programme.
async function recordManualOrganisationPayment({ db, admin, actor, body = {} }) {
  const batchId = String(body.batchId || "").trim();
  const method = String(body.method || "").trim();
  const transactionReference = String(body.transactionReference || "").trim().replace(/\s+/g, " ");
  const receivedDate = String(body.receivedDate || "").trim();
  const agreementNote = String(body.agreementNote || "").trim();
  const verificationNote = String(body.verificationNote || "").trim();
  if (!/^[a-zA-Z0-9_-]{1,100}$/.test(batchId)) fail(400, "Select an organisation submission.");
  if (body.agreementType !== "legacy_full_tuition") fail(400, "This manual-payment form supports verified legacy full-tuition agreements only.");
  if (!MANUAL_METHOD_LABELS[method]) fail(400, "Select the verified payment method.");
  if (!/^[a-zA-Z0-9._:/\s-]{5,120}$/.test(transactionReference)) fail(400, "Enter the bank, mobile money or cash receipt reference (at least five characters).");
  const date = new Date(receivedDate + "T12:00:00.000Z");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(receivedDate) || Number.isNaN(date.getTime()) ||
      date.toISOString().slice(0, 10) !== receivedDate || receivedDate > new Date().toISOString().slice(0, 10)) {
    fail(400, "Enter the actual date the payment was received.");
  }
  if (agreementNote.length < 12 || agreementNote.length > 500) fail(400, "Describe the original full-tuition agreement (12–500 characters).");
  if (verificationNote.length < 12 || verificationNote.length > 500) fail(400, "Describe how you verified funds were received (12–500 characters).");
  if (body.fundsVerified !== true) fail(400, "Confirm funds were independently verified before recording a payment.");
  const lines = validateLines(body.lines);
  if (lines.some(line => minor(line.discount) !== 0)) fail(400, "Legacy full-tuition payments cannot deduct a partner share.");
  const normalizedExternal = transactionReference.toUpperCase();
  const reference = "FAL-ORG-MAN-" + crypto.createHash("sha256").update(method + ":" + normalizedExternal).digest("hex").slice(0, 48);
  const signature = crypto.createHash("sha256").update(JSON.stringify({
    batchId, method, normalizedExternal, receivedDate, agreementNote, verificationNote, lines,
  })).digest("hex");
  const paymentRef = db.collection("payments").doc(reference);
  const result = await db.runTransaction(async tx => {
    const prior = await tx.get(paymentRef);
    if (prior.exists) {
      if (prior.data().purpose !== "organisation_manual" || prior.data().requestSignature !== signature) {
        fail(409, "This transaction reference has already been recorded with different details. Review payment history before proceeding.");
      }
      return { duplicate: true };
    }
    const batchSnap = await tx.get(db.collection("organisationEnrolments").doc(batchId));
    if (!batchSnap.exists || batchSnap.data().deleted) fail(404, "Organisation submission not found.");
    const batch = batchSnap.data();
    const billingEmail = String(batch.organisation?.email || "").trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(billingEmail)) fail(409, "Configure a valid organisation billing email before recording payment.");
    const approved = new Set((batch.students || []).filter(row => row.status === "approved").map(row => row.studentId));
    const snapshots = await Promise.all(lines.map(line => tx.get(db.collection("students").doc(line.studentId))));
    const now = admin.firestore.FieldValue.serverTimestamp();
    const paidAt = admin.firestore.Timestamp.fromDate(date);
    snapshots.forEach((snap, i) => {
      const line = lines[i];
      if (!approved.has(line.studentId) || !snap.exists ||
          snap.data().organisationSubmissionId !== batchId ||
          String(snap.data().billingResponsibility).toLowerCase() !== "organisation") {
        fail(409, "Only approved students belonging to this organisation can receive a manual tuition payment.");
      }
      const student = snap.data();
      if (student.tuitionFee === undefined || minor(student.tuitionFee) <= 0 ||
          (student.balanceDue === undefined && student.balance === undefined)) {
        fail(409, "Configure the student's tuition fee and outstanding balance in Students first.");
      }
      const balance = balanceOf(student);
      const credit = minor(line.tuitionCredit);
      const tuition = minor(student.tuitionFee);
      if (balance === 0 || credit > balance || confirmedPaidOf(student) + credit > tuition ||
          String(student.paymentStatus || "").trim().toLowerCase() === "paid") {
        fail(409, "The recorded amount must not exceed the student's unpaid balance or agreed course tuition. Review any existing payments first.");
      }
      if (credit < balance && String(student.contractEnd || "").trim()) {
        fail(409, "This student already has contract access dates. Review the existing contract before granting one-month partial-payment access.");
      }
      line.studentName = student.name || student.fullName || line.studentId;
      line.courseTuitionFee = tuition / 100;
      line.remainingBalance = (balance - credit) / 100;
      if (line.remainingBalance > 0) {
        line.accessStartDate = date.toISOString();
        line.accessEndDate = oneCalendarMonthFrom(date);
      }
    });
    const totalMinor = lines.reduce((sum, line) => sum + minor(line.tuitionCredit), 0);
    snapshots.forEach((snap, i) => {
      const line = lines[i];
      const student = snap.data();
      const remainingBalance = line.remainingBalance;
      const partial = remainingBalance > 0;
      const accessEndDate = partial ? new Date(line.accessEndDate) : null;
      tx.set(snap.ref, {
        paid: (confirmedPaidOf(student) + minor(line.tuitionCredit)) / 100,
        balanceDue: remainingBalance, balance: remainingBalance,
        paymentStatus: partial ? "Partially Paid" : "Paid",
        ...(partial ? {
          status: accessEndDate.getTime() > Date.now() ? "Active" : "Expired",
          trialStatus: "converted", trialConvertedAt: paidAt,
          contractStart: line.accessStartDate, contractEnd: line.accessEndDate,
          contractTermMonths: "1", paidLevel: student.level || student.paidLevel || "",
        } : {}),
        organisationPaymentReference: reference, organisationPaymentGross: line.grossAmount,
        organisationRetainedShare: 0, organisationNetTuition: line.tuitionCredit,
        billingResponsibility: "organisation", lastPaymentAmount: line.tuitionCredit,
        lastPaymentReference: reference, lastPaymentProvider: MANUAL_METHOD_LABELS[method],
        lastPaymentAt: paidAt, syncedToSheets: false, updated_at: now,
      }, { merge: true });
      tx.create(db.collection("payments").doc(reference + "-" + i), {
        reference: reference + "-" + i, parentReference: reference,
        studentId: line.studentId, studentName: line.studentName, email: student.email,
        purpose: "organisation_allocation", billingResponsibility: "organisation",
        referralEligible: false, tuitionCredit: line.tuitionCredit, discount: 0,
        courseTuitionFee: line.courseTuitionFee, remainingBalance: line.remainingBalance,
        currency: "GHS", provider: "Manual", method, status: "paid", paidAt, createdAt: now,
      });
    });
    tx.create(paymentRef, {
      reference, requestSignature: signature, organisationSubmissionId: batchId,
      organisationName: String(batch.organisation?.name || "").trim(), email: billingEmail,
      agreement: agreementNote, agreementType: "legacy_full_tuition",
      verificationNote, transactionReference, receivedDate, method, lines,
      tuitionCredit: totalMinor / 100, discount: 0, checkoutAmount: totalMinor / 100,
      processingShare: 0, currency: "GHS", provider: "Manual",
      purpose: "organisation_manual", referralEligible: false, status: "paid",
      fundsVerified: true, verifiedBy: actor.email || actor.uid, verifiedAt: now,
      receiptStatus: "pending", createdBy: actor.uid, paidAt, createdAt: now,
    });
    return { duplicate: false };
  });
  return { reference, duplicate: result.duplicate };
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
  app.post("/payments/organisations/manual", handle(async (req, actor) => {
    const result = await recordManualOrganisationPayment({ db, admin, actor, body: req.body || {} });
    // A failed email never reverses verified student credits. Owner can retry the
    // existing receipt endpoint; the payment ledger remains the source of truth.
    let receiptStatus = "sent";
    try { await sendGroupReceipt({ db, admin, reference: result.reference, runtimeConfig }); }
    catch (error) {
      receiptStatus = "failed";
      console.warn("organisation_manual_receipt_failed", { reference: result.reference, reason: String(error?.message || "delivery_error").slice(0, 120) });
    }
    return { ...result, receiptStatus };
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
        // Retain 10% only on the first tuition payment, never a later instalment.
        const shareMinor = minor(lines[i].discount);
        const expectedFirstShare = Math.round(minor(lines[i].grossAmount) * 0.1);
        if (paidOf(snap.data()) === 0 && shareMinor !== expectedFirstShare) {
          fail(409, "The first tuition payment must retain exactly the agreed 10% organisation share.");
        }
        if (paidOf(snap.data()) > 0 && shareMinor !== 0) {
          fail(409, "Organisation share applies only to each student's first tuition payment.");
        }
        if (lines[i].discount && !String(req.body.discountReason || "").trim()) fail(400, "Enter a reason for the partner share deduction.");
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
    if (!/^FAL-ORG-[a-f0-9-]{36}$/.test(req.params.reference) && !/^FAL-ORG-MAN-[a-f0-9]{48}$/.test(req.params.reference)) fail(400, "Invalid reference.");
    await sendGroupReceipt({ db, admin, reference: req.params.reference, runtimeConfig }); return {};
  }));
}
module.exports = { minor, validateLines, balanceOf, applyGroupPayment, sendGroupReceipt, recordManualOrganisationPayment, registerOrganisationPaymentRoutes };
