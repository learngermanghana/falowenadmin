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
    let gross, discount;
    try { gross = minor(line.amount); } catch (error) { fail(400, "Tuition amount for " + studentId + ": " + error.message); }
    try { discount = minor(line.discount == null || String(line.discount).trim() === "" ? 0 : line.discount); }
    catch (error) { fail(400, "Partner share for " + studentId + ": " + error.message); }
    if (!gross || discount >= gross) fail(400, "Each student must have a positive amount after discount.");
    return { studentId, tuitionCredit: (gross - discount) / 100, discount: discount / 100, grossAmount: gross / 100 };
  });
}
function paidOf(student) {
  // initialPaymentAmount is a planned collection, not money received.
  for (const key of ["paid", "amountPaid", "paidAmount", "amount_paid", "totalPaid"]) {
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
  if (payment.status === "paid_needs_review") return { duplicate: true, reference: payment.reference, needsReview: true };
  if (payment.status === "withdrawn") {
    tx.update(paymentRef, { status: "paid_needs_review", reviewReason: "withdrawn_link_paid", paidAt: admin.firestore.FieldValue.serverTimestamp(), paystackTransactionId: eventData.id || null, verifiedCurrency: eventData.currency, verifiedAmountSubunit: Number(eventData.amount) });
    return { reference: payment.reference, needsReview: true, duplicate: false };
  }
  if (!["pending", "initializing", "expired"].includes(payment.status)) throw new Error("Group payment is not pending.");
  const lines = validateLines(payment.lines.map(line => ({ ...line, amount: line.grossAmount })));
  const snapshots = await Promise.all(lines.map(line => tx.get(db.collection("students").doc(line.studentId))));
  if (snapshots.some(snap => !snap.exists || snap.data().partialTuitionTermination?.state === "pending_purge" || snap.data().partialTuitionClosedEnrollmentId&&snap.data().partialTuitionClosedEnrollmentId===snap.data().effectiveEnrollmentId || snap.data().organisationSubmissionId !== payment.organisationSubmissionId)) {
    tx.update(paymentRef,{status:"paid_needs_review",reviewReason:"student_enrollment_unavailable",paidAt:admin.firestore.FieldValue.serverTimestamp(),paystackTransactionId:eventData.id||null,verifiedCurrency:eventData.currency,verifiedAmountSubunit:Number(eventData.amount)});
    return {reference:payment.reference,needsReview:true,duplicate:false};
  }
  if (snapshots.every(snap => snap.exists && snap.data().organisationSubmissionId === payment.organisationSubmissionId) &&
      snapshots.some((snap, i) => minor(lines[i].grossAmount) > balanceOf(snap.data()))) {
    tx.update(paymentRef, { status: "paid_needs_review", reviewReason: "outstanding_balance_changed", paidAt: admin.firestore.FieldValue.serverTimestamp(), paystackTransactionId: eventData.id || null, verifiedCurrency: eventData.currency, verifiedAmountSubunit: Number(eventData.amount) });
    return { reference: payment.reference, needsReview: true, duplicate: false };
  }
  const now = admin.firestore.FieldValue.serverTimestamp();
  const paidDate = eventData.paid_at && !Number.isNaN(Date.parse(eventData.paid_at))
    ? new Date(eventData.paid_at) : new Date();
  const paidAt = eventData.paid_at ? admin.firestore.Timestamp.fromDate(paidDate) : now;
  const date=paidDate.toISOString().slice(0,10);
  const managed=await Promise.all(snapshots.map(async (snap,i)=>{
    const student=snap.data(),id=student.effectiveEnrollmentId;
    const expected=payment.lines[i].enrollmentId;
    if(expected&&expected!==id||student.partialTuitionClosedEnrollmentId&&!expected)return {error:"Payment no longer belongs to the current enrollment"};
    if(!id){const lifecycle=require("./partialTuitionLifecycle"),legacy=lifecycle.legacyRow(student),dates=legacy&&lifecycle.recoveryDates(legacy);return dates&&date>=dates.terminateOn?{error:"The 30-day recovery period ended"}:null;}
    const ref=snap.ref.collection("levelEnrollments").doc(id),row=await tx.get(ref);
    try{
      if(!row.exists||lines[i].discount!==0||!require("./partialTuitionLifecycle").matchesRoot(student,{id,...row.data()}))throw Error("Level accounting requires reconciliation");
      return {ref,patch:require("./studentLevelEnrollments").paymentPatch(row.data(),lines[i].tuitionCredit,date)};
    }catch(error){return {error:error.message};}
  }));
  if(managed.some(m=>m?.error)){
    tx.update(paymentRef,{status:"paid_needs_review",reviewReason:"managed_enrollment_payment_requires_review",paidAt,paystackTransactionId:eventData.id||null,verifiedCurrency:eventData.currency,verifiedAmountSubunit:Number(eventData.amount)});
    return {reference:payment.reference,needsReview:true,duplicate:false};
  }
  snapshots.forEach((snap, i) => {
    const line = lines[i];
    if (!snap.exists || snap.data().organisationSubmissionId !== payment.organisationSubmissionId) throw new Error("Group student no longer matches the organisation.");
    const student = snap.data(), balance = balanceOf(student);
    // Keep actual cash separate from the agreed tuition reduction.
    const nextBalance = Math.max(0, balance - minor(line.tuitionCredit) - minor(line.discount)) / 100;
    const partial = nextBalance > 0;
    const firstPayment = paidOf(student) === 0;
    // Only a verified, signed Paystack charge can confirm an approved student.
    // The student's Firebase account setup / invitation remains separate, and
    // an unapproved requested class must not be silently assigned.
    const termPatch = partial && !student.contractEnd ? {
      contractStart: paidDate.toISOString(),
      contractEnd: oneCalendarMonthFrom(paidDate),
      contractTermMonths: "1",
    } : (!student.contractEnd && !partial ? {
      // Full-paid access is six months from actual account activation.
      // Do not start a six-month clock merely because the company paid.
      contractTermMonths: "6",
    } : {});
    line.studentName = payment.lines[i].studentName || student.name || line.studentId;
    line.remainingBalance = nextBalance;
    line.courseTuitionFee = Number(student.tuitionFee || 0);
    if (partial && !student.contractEnd) line.accessEndDate = termPatch.contractEnd;
    const effectiveEnd = termPatch.contractEnd || student.contractEnd;
    const active = !partial || !effectiveEnd || Number.isNaN(Date.parse(String(effectiveEnd)))
      || Date.parse(String(effectiveEnd)) > Date.now();
    tx.set(snap.ref, {
      paid: (paidOf(student) + minor(line.tuitionCredit)) / 100,
      tuitionDiscount: (minor(student.tuitionDiscount ?? 0) + minor(line.discount)) / 100,
      balanceDue: nextBalance, balance: nextBalance,
      paymentStatus: partial ? "Partially Paid" : "Paid",
      status: active ? "Active" : "Expired",
      ...(firstPayment ? { trialStatus: "converted", trialConvertedAt: paidAt } : {}),
      ...termPatch,
      ...(managed[i]?.patch?Object.fromEntries(Object.entries(managed[i].patch).filter(([key])=>["contractStart","contractEnd","paymentDeadline"].includes(key))):{}),
      paidLevel: student.level || student.paidLevel || "",
      organisationClassAssignmentPending: !String(student.className || "").trim(),
      organisationPaymentConfirmedAt: paidAt,
      organisationPaymentReference: payment.reference,
      organisationPaymentGross: line.grossAmount, organisationRetainedShare: line.discount,
      organisationNetTuition: line.tuitionCredit, billingResponsibility: "organisation",
      lastPaymentAmount: line.tuitionCredit, lastPaymentReference: payment.reference,
      lastPaymentProvider: "Paystack", lastPaymentAt: paidAt, syncedToSheets: false, updated_at: now,
    }, { merge: true });
    if(managed[i]){
      tx.update(managed[i].ref,{...managed[i].patch,updatedAt:now});
      tx.create(managed[i].ref.collection("payments").doc(payment.reference+"-"+i),{studentId:line.studentId,enrollmentId:managed[i].ref.id,reference:payment.reference+"-"+i,amount:line.tuitionCredit,receivedDate:date,method:"paystack",source:"organisation_allocation",createdAt:now});
    }
    tx.create(db.collection("payments").doc(`${payment.reference}-${i}`), {
      reference: `${payment.reference}-${i}`, parentReference: payment.reference,
      studentId: line.studentId, studentName: line.studentName || student.name || "", email: student.email,
      purpose: "organisation_allocation", billingResponsibility: "organisation", referralEligible: false,
      tuitionCredit: line.tuitionCredit, discount: line.discount, currency: "GHS", provider: "Paystack",
      status: "paid", paidAt, createdAt: now,
    });
  });
  tx.update(paymentRef, { status: "paid", paidAt, updatedAt: now, receiptStatus: "pending", paystackTransactionId: eventData.id || null,
    // Persist the actual per-student allocation so the same company receipt
    // displays an accurate remainder and first-month access end date.
    lines, verifiedCurrency: "GHS", verifiedAmountSubunit: Number(eventData.amount) });
  return { group: true, duplicate: false, reference: payment.reference };
}
// The upstream announcement service may return a private error message.
// Expose only a stable, operator-actionable classification to the signed-in owner.
function receiptFailure(error) {
  const detail = String(error?.message || "");
  if (/webhook is not configured/i.test(detail)) return {
    code: "email_webhook_not_configured", status: 503,
    message: "Company receipt email service is not configured. The tuition payment is safely recorded; ask an administrator to configure the payment-update email webhook.",
  };
  if (/receipt is being delivered/i.test(detail)) return {
    code: "receipt_in_progress", status: 409,
    message: "A company receipt attempt is already in progress. Refresh payment history before retrying; the tuition payment remains recorded.",
  };
  const upstreamStatus = detail.match(/webhook returned HTTP (\d{3})/i);
  if (upstreamStatus) return {
    code: "email_provider_http_" + upstreamStatus[1], status: 502,
    message: "Company receipt email service returned HTTP " + upstreamStatus[1] + ". The tuition payment remains recorded. Check the email webhook configuration and delivery logs.",
  };
  if (/fetch failed|econnreset|enotfound|eai_again|etimedout|network|aborterror/i.test(detail)) return {
    code: "email_provider_unreachable", status: 502,
    message: "Company receipt email service could not be reached. The tuition payment remains recorded. Check the email service endpoint and retry later.",
  };
  return {
    code: "email_delivery_failed", status: 502,
    message: "Company receipt email delivery failed. The tuition payment remains recorded. Check the email service logs or use the manual confirmation fallback.",
  };
}

async function sendGroupReceipt({ db, admin, reference, runtimeConfig, send = postPaymentRow }) {
  const ref = db.collection("payments").doc(reference);
  const snap = await ref.get(), payment = snap.data();
  if (!payment) fail(404, "Payment reference was not found.");
  if (!["organisation_group", "organisation_manual"].includes(payment.purpose) || payment.status !== "paid") fail(409, "A company receipt requires an existing paid organisation payment.");
  if (payment.receiptStatus === "sent") return { status: "sent", alreadySent: true };
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
      // The announcement webhook formats a purpose-built, email-client-safe receipt
      // from structured and verified server-side payment data. The full agreement
      // remains in Firestore, not in the public receipt layout.
      subject: "Falowen tuition payment receipt — " + payment.organisationName,
      receipt_payload_json: JSON.stringify({
        version: 1,
        reference,
        organisationName: payment.organisationName,
        billingEmail: payment.email,
        paymentMethod: manual ? (MANUAL_METHOD_LABELS[payment.method] || "Verified offline payment") : "Paystack",
        transferReference: manual ? payment.transactionReference : "",
        receivedDate: manual
          ? (payment.receivedDate || "")
          : (payment.paidAt?.toDate?.()?.toISOString?.().slice(0, 10) || ""),
        amountReceived: Number(payment.checkoutAmount),
        tuitionAllocated: Number(payment.tuitionCredit),
        organisationShare: Number(payment.discount),
        processingCharges: manual ? 0 : processing,
        isManual: manual,
        students: payment.lines.map(line => ({
          name: line.studentName || line.studentId,
          courseTuition: manual ? Number(line.courseTuitionFee ?? line.grossAmount) : Number(line.grossAmount),
          tuitionReceived: Number(line.tuitionCredit),
          balanceRemaining: manual && Number.isFinite(Number(line.remainingBalance)) ? Number(line.remainingBalance) : null,
          accessEndDate: manual && Number(line.remainingBalance) > 0 ? String(line.accessEndDate || "") : "",
        })),
      }),
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
    await ref.update({
      receiptStatus: "sent", receiptSentAt: admin.firestore.FieldValue.serverTimestamp(),
      receiptLeaseUntil: 0, receiptErrorCode: "",
    });
    return { status: "sent", alreadySent: false };
  } catch (error) {
    const failure = receiptFailure(error);
    // Persist a safe reason without storing secrets or raw provider response.
    await ref.update({
      receiptStatus: "failed", receiptLeaseUntil: 0,
      receiptErrorCode: failure.code,
      receiptFailedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    console.warn("organisation_receipt_delivery_failed", { reference, code: failure.code });
    throw error;
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

function registerOrganisationPaymentRoutes(app, { db, admin, initializePaystackPayment, calculateStudentCheckoutAmount, runtimeConfig, reconcilePaymentReference, sendReceipt = sendGroupReceipt, sendNotification = require("./organisationNotifications").notify }) {
  const handle = action => async (req, res) => {
    res.set("Cache-Control", "no-store");
    try { const actor = await owner(req, admin); res.json({ ok: true, ...await action(req, actor) }); }
    catch (error) { res.status(error.status || 500).json({
      ok: false, error: error.status ? error.message : "Payment service unavailable. Retry shortly.",
      ...(error.publicCode ? { code: error.publicCode } : {}),
    }); }
  };
  app.get("/payments/organisations/:batchId", handle(async req => {
    const id = String(req.params.batchId);
    if (!/^[a-zA-Z0-9_-]{1,100}$/.test(id)) fail(400, "Invalid submission reference.");
    const batch = await db.collection("organisationEnrolments").doc(id).get();
    if (!batch.exists || batch.data().deleted) fail(404, "Submission not found.");
    const records = await db.collection("payments").where("organisationSubmissionId", "==", id).limit(50).get();
    const submission = { id, ...batch.data() };
    const rows = await Promise.all((submission.students || []).filter(row => row.status === "approved" && row.studentId).map(async row => {
      const snap = await db.collection("students").doc(row.studentId).get();
      if (!snap.exists || snap.data().organisationSubmissionId !== id) return { studentId: row.studentId, balance: null, firstPayment: null };
      try { return { studentId: row.studentId, balance: balanceOf(snap.data()) / 100, firstPayment: paidOf(snap.data()) === 0 }; }
      catch { return { studentId: row.studentId, balance: null, firstPayment: null }; }
    }));
    return { submission, billingRows: rows, payments: records.docs.map(doc => ({ id: doc.id, ...doc.data() })) };
  }));
  app.post("/payments/organisations/manual", handle(async (req, actor) => {
    const result = await recordManualOrganisationPayment({ db, admin, actor, body: req.body || {} });
    // A failed email never reverses verified student credits. Owner can retry the
    // existing receipt endpoint; the payment ledger remains the source of truth.
    let receiptStatus = "sent";
    try { await sendReceipt({ db, admin, reference: result.reference, runtimeConfig }); }
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
      if (prior.exists) { if (!["pending", "initializing"].includes(prior.data().status) || prior.data().requestSignature !== signature) fail(409, "Start a new request after changing or withdrawing the invoice."); return; }
      const batch = await tx.get(db.collection("organisationEnrolments").doc(batchId));
      if (!batch.exists || batch.data().deleted) fail(404, "Submission not found.");
      const approved = new Set(batch.data().students.filter(row => row.status === "approved").map(row => row.studentId));
      const students = await Promise.all(lines.map(line => tx.get(db.collection("students").doc(line.studentId))));
      students.forEach((snap, i) => {
        if (!approved.has(lines[i].studentId) || !snap.exists || snap.data().organisationSubmissionId !== batchId) fail(409, "Only approved students in this organisation can be billed.");
        if(snap.data().partialTuitionTermination?.state==="pending_purge"||snap.data().partialTuitionClosedEnrollmentId&&snap.data().partialTuitionClosedEnrollmentId===snap.data().effectiveEnrollmentId)fail(409,"This enrollment has ended; register a new enrollment.");
        const lifecycle=require("./partialTuitionLifecycle"),student=snap.data(),legacy=lifecycle.legacyRow(student),dates=lifecycle.recoveryDates(legacy||{...student,contractStart:require("./studentContractLifecycle").isoDate(student.contractStart),contractEnd:require("./studentContractLifecycle").isoDate(student.contractEnd),paymentDeadline:require("./studentContractLifecycle").isoDate(student.paymentDeadline)});
        if(dates&&new Date().toISOString().slice(0,10)>=dates.terminateOn)fail(409,"The recovery period ended; register a new enrollment.");
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
        if(snap.data().effectiveEnrollmentId)lines[i].enrollmentId=snap.data().effectiveEnrollmentId;
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
    if (payment.authorizationUrl) {
      await sendNotification({ db, admin, ref, kind: "payment_link", runtimeConfig });
      return { payment: (await ref.get()).data() };
    }
    // Reuse the persisted reference on retry; never initialize a second charge intent.
    const checkout = await initializePaystackPayment({ email: payment.email, checkoutAmount: payment.checkoutAmount, reference,
      metadata: { source: "falowen_organisation", purpose: "organisation_group", organisationSubmissionId: batchId, referralEligible: false } });
    await db.runTransaction(async tx => {
      const current = await tx.get(ref);
      if (current.data().status !== "initializing") return;
      tx.update(ref, { status: "pending", authorizationUrl: checkout.authorization_url });
    });
    await sendNotification({ db, admin, ref, kind: "payment_link", runtimeConfig });
    return { payment: (await ref.get()).data() };
  }));
  app.post("/payments/organisations/withdraw/:reference", handle(async (req, actor) => {
    const reference = req.params.reference;
    if (!/^FAL-ORG-[a-f0-9-]{36}$/.test(reference)) fail(400, "Invalid reference.");
    const ref = db.collection("payments").doc(reference);
    const snap = await ref.get();
    if (!snap.exists || snap.data().purpose !== "organisation_group") fail(404, "Organisation payment link not found.");
    if (snap.data().status === "withdrawn") return { status: "withdrawn" };
    if (snap.data().status !== "pending") fail(409, "Only unpaid generated links can be withdrawn.");
    const verification = await reconcilePaymentReference(reference);
    if (!verification?.checked || verification.applied || verification.reason === "already_paid" || !["pending", "abandoned", "failed", "reversed"].includes(verification.reason)) fail(409, "Paystack could not confirm an unpaid link. Refresh payment status first.");
    await db.runTransaction(async tx => {
      const current = await tx.get(ref);
      if (current.data().status === "withdrawn") return;
      if (current.data().status !== "pending" || current.data().paymentLinkEmail?.leaseUntil > Date.now()) fail(409, "Payment status or email delivery changed. Refresh and retry.");
      tx.update(ref, { status: "withdrawn", withdrawnAt: admin.firestore.FieldValue.serverTimestamp(), withdrawnBy: actor.uid, updatedAt: admin.firestore.FieldValue.serverTimestamp() });
    });
    return { status: "withdrawn" };
  }));
  app.post("/payments/organisations/payment-link-email/:reference", handle(async req => {
    if (!/^FAL-ORG-[a-f0-9-]{36}$/.test(req.params.reference)) fail(400, "Invalid reference.");
    return { paymentLinkEmail: await sendNotification({ db, admin, ref: db.collection("payments").doc(req.params.reference), kind: "payment_link", runtimeConfig }) };
  }));
  app.post("/payments/organisations/verify/:reference", handle(async req => {
    if (!/^FAL-ORG-[a-f0-9-]{36}$/.test(req.params.reference)) fail(400, "Invalid reference.");
    const result = await reconcilePaymentReference(req.params.reference);
    const current = await db.collection("payments").doc(req.params.reference).get();
    if (current.exists && current.data().status === "paid") await sendReceipt({ db, admin, reference: req.params.reference, runtimeConfig });
    return { result };
  }));
  app.post("/payments/organisations/receipt/:reference", handle(async req => {
    if (!/^FAL-ORG-[a-f0-9-]{36}$/.test(req.params.reference) && !/^FAL-ORG-MAN-[a-f0-9]{48}$/.test(req.params.reference)) fail(400, "Invalid reference.");
    try {
      const delivery = await sendReceipt({ db, admin, reference: req.params.reference, runtimeConfig });
      return { receiptStatus: delivery?.status || "sent", alreadySent: Boolean(delivery?.alreadySent) };
    } catch (error) {
      if (error.status) throw error;
      const failure = receiptFailure(error);
      throw Object.assign(new Error(failure.message), { status: failure.status, publicCode: failure.code });
    }
  }));
}
module.exports = { minor, validateLines, balanceOf, applyGroupPayment, sendGroupReceipt, receiptFailure, recordManualOrganisationPayment, registerOrganisationPaymentRoutes };
