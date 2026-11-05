"use strict";
const { owner } = require("./organisationEnrolment");
const { hash, decryptBank, VERSION, ORGANISATION_VERSION } = require("./partnershipAgreements");
const { firstPayment, verifyReceipt, confirmReceipt } = require("./referralProgramme");
const fail = (status, message) => { throw Object.assign(new Error(message), { status }); };
const enabled = () => process.env.REFERRAL_AUTO_PAYOUTS_ENABLED === "true";
async function provider(path, { method = "GET", body, secret, fetchImpl = fetch } = {}) {
  if (!secret) fail(503, "Paystack is not configured.");
  const response = await fetchImpl("https://api.paystack.co/" + path, {
    method, headers: { Authorization: "Bearer " + secret, "Content-Type": "application/json" },
    ...(body ? { body: JSON.stringify(body) } : {}), signal: AbortSignal.timeout(15000),
  });
  const data = await response.json();
  if (!response.ok || data.status !== true) fail(503, "Paystack could not complete this operation. Review the payout status before retrying.");
  return data.data;
}
function verifyTransfer(transfer, claim) {
  const recipient = typeof transfer.recipient === "object" ? transfer.recipient.recipient_code : transfer.recipient;
  if (transfer.reference !== claim.transferReference || transfer.currency !== "GHS" || Number(transfer.amount) !== claim.commissionMinor || recipient !== claim.recipientCode) fail(409, "Transfer does not match the commission record.");
  return String(transfer.status || "pending");
}
async function processReferral({ db, admin, studentId, getSecret = () => process.env.PAYSTACK_SECRET, isEnabled = enabled, verify = verifyReceipt, api = provider }) {
  if (!isEnabled()) return { skipped: "automatic_payouts_not_enabled" };
  const studentRef = db.collection("students").doc(studentId), student = await studentRef.get();
  if (!student.exists || !student.data().email) return { skipped: "student_not_found" };
  const email = student.data().email.trim().toLowerCase(), ref = db.collection("referralClaims").doc(hash(email));
  const snap = await ref.get(); if (!snap.exists) return { skipped: "no_referral" };
  const claim = snap.data();
  if (claim.status === "reversed" || claim.payoutReference) return { skipped: "closed_or_already_paid" };
  const partner = await db.collection("referralApplications").doc(claim.partnerId).get();
  if (!partner.exists || partner.data().status !== "approved" || partner.data().terms !== VERSION || partner.data().kind !== "referral" || !partner.data().autoPayoutEnabled || !partner.data().recipientCode) return { skipped: "partner_not_ready" };
  if (student.data().billingResponsibility === "organisation" || student.data().enrolmentSource === "organisation" || hash(email) === claim.partnerId) return { skipped: "ineligible_student" };
  const [payments, events] = await Promise.all(["payments", "paystackWebhookEvents"].map(name => db.collection(name).where("studentId", "==", studentId).limit(500).get()));
  if (payments.size >= 500 || events.size >= 500) return { skipped: "manual_history_review_required" };
  const payment = firstPayment(payments.docs, events.docs, claim.createdAt);
  if (!payment) return { skipped: "no_eligible_first_payment" };
  // Ambiguous historical/offline tuition must be reviewed, never paid automatically.
  const recordedTuition = [...payments.docs.map(d => d.data().status === "paid" ? Number(d.data().tuitionCredit || 0) : 0),
    ...events.docs.map(d => d.data().status === "handled" ? Number(d.data().tuitionAmount || 0) : 0)].reduce((a, b) => a + b, 0);
  if (Number(student.data().paid || student.data().paidAmount || student.data().initialPaymentAmount || 0) > recordedTuition + 0.01) return { skipped: "offline_payment_review_required" };
  const proof = await verify(payment.reference, getSecret);
  if (!Object.prototype.hasOwnProperty.call(proof.receipt.metadata || {}, "paidSoFar")) return { skipped: "prior_payment_metadata_review_required" };
  confirmReceipt(proof, claim, student, payment);
  const transferReference = "fal-ref-" + ref.id.slice(0, 40), now = () => admin.firestore.FieldValue.serverTimestamp();
  const reserved = await db.runTransaction(async tx => {
    const current = await tx.get(ref), approvedPartner = await tx.get(partner.ref);
    const lock = db.collection("referralCommissionStudents").doc(studentId), commission = await tx.get(lock);
    if (current.data().status === "reversed" || current.data().payoutReference || Number(current.data().payoutLeaseUntil || 0) > Date.now()) return false;
    if (approvedPartner.data().status !== "approved" || !approvedPartner.data().autoPayoutEnabled) return false;
    if (commission.exists && commission.data().claimId !== ref.id) return false;
    if (!commission.exists) tx.create(lock, { claimId: ref.id });
    tx.update(ref, { ...payment, status: "approved", studentId, automatic: true, transferReference,
      recipientCode: approvedPartner.data().recipientCode, paystackTransactionId: proof.receipt.id, payoutState: "processing", payoutLeaseUntil: Date.now() + 60000, updatedAt: now() });
    return true;
  });
  if (!reserved) return { skipped: "already_processing" };
  const intent = (await ref.get()).data();
  let transfer;
  try {
    const latestProof = await verify(payment.reference, getSecret);
    if (latestProof.refund) {
      await cancelRefundedCommission({ db, admin, reference: payment.reference });
      return { state: "cancelled_refund" };
    }
    confirmReceipt(latestProof, claim, student, payment);
    if ((await ref.get()).data().status === "reversed") return { state: "cancelled" };
    // Unknown outcomes keep the same provider reference; never generate another transfer.
    if (claim.transferReference) {
      transfer = await api("transfer/verify/" + transferReference, { secret: getSecret() });
    } else {
      transfer = await api("transfer", { method: "POST", secret: getSecret(), body: { source: "balance", amount: payment.commissionMinor,
        currency: "GHS", recipient: intent.recipientCode, reference: transferReference, reason: "Falowen first tuition referral commission" } });
    }
    transfer = await api("transfer/verify/" + transferReference, { secret: getSecret() });
    const status = verifyTransfer(transfer, intent);
    await db.runTransaction(async tx => {
      const latest = (await tx.get(ref)).data();
      // Do not overwrite a refund cancellation that arrived during the API request.
      tx.update(ref, { payoutState: status, payoutLeaseUntil: 0, transferCode: transfer.transfer_code || "", updatedAt: now(),
        ...(status === "success" ? { payoutReference: transferReference, payoutRecordedAt: now(), recoveryRequired: latest.status === "reversed" } : {}) });
    });
    return { state: status };
  } catch (e) {
    await ref.update({ payoutState: "needs_review", payoutLeaseUntil: 0, updatedAt: now() }); throw e;
  }
}
async function handlePayoutWebhook({ db, admin, event, getSecret = () => process.env.PAYSTACK_SECRET, api = provider }) {
  if (!["transfer.success", "transfer.failed", "transfer.reversed"].includes(event.event)) return false;
  const reference = event.data?.reference;
  if (!/^fal-ref-[a-f0-9]{40}$/.test(reference || "")) return false;
  const rows = await db.collection("referralClaims").where("transferReference", "==", reference).limit(2).get();
  if (rows.size !== 1) throw new Error("Unknown referral transfer.");
  const ref = rows.docs[0].ref, transfer = await api("transfer/verify/" + reference, { secret: getSecret() });
  await db.runTransaction(async tx => {
    const current = (await tx.get(ref)).data(), status = verifyTransfer(transfer, current);
    tx.update(ref, { payoutState: status, payoutLeaseUntil: 0, transferCode: transfer.transfer_code || "", updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      ...(status === "success" ? { payoutReference: reference, payoutRecordedAt: admin.firestore.FieldValue.serverTimestamp(), recoveryRequired: current.status === "reversed" } : {}) });
  });
  return true;
}
async function cancelRefundedCommission({ db, admin, reference }) {
  const claims = await db.collection("referralClaims").where("reference", "==", reference).limit(2).get();
  for (const row of claims.docs) await db.runTransaction(async tx => {
    const current = (await tx.get(row.ref)).data();
    tx.update(row.ref, { status: "reversed", reason: "provider-refund", reversedAt: admin.firestore.FieldValue.serverTimestamp(),
      recoveryRequired: Boolean(current.payoutReference || current.transferReference) });
  });
}
async function handleRefundWebhook({ db, admin, event, getSecret = () => process.env.PAYSTACK_SECRET, verify = verifyReceipt }) {
  if (!String(event.event || "").startsWith("refund.")) return false;
  const transaction = event.data?.transaction;
  const reference = transaction?.reference;
  const txId = transaction?.id || (typeof transaction !== "object" ? transaction : null);
  if (!reference && !txId) return false;
  const rows = await db.collection("referralClaims").where(reference ? "reference" : "paystackTransactionId", "==", reference || txId).limit(2).get();
  for (const row of rows.docs) {
    const proof = await verify(row.data().reference, getSecret);
    if (proof.refund) await cancelRefundedCommission({ db, admin, reference: row.data().reference });
  }
  return true;
}
let cachedBanks = {};
function registerPayoutRoutes(app, { db, admin, getSecret = () => process.env.PAYSTACK_SECRET, api = provider }) {
  app.get("/referrals/payout-banks", async (req, res) => {
    res.set("Cache-Control", "public, max-age=3600");
    try {
      const type = req.query?.type === "mobile_money" ? "mobile_money" : "ghipss";
      if (!cachedBanks[type] || cachedBanks[type].until < Date.now()) {
        const values = await api(`bank?country=ghana&currency=GHS&type=${type}&perPage=100`, { secret: getSecret() });
        cachedBanks[type] = { until: Date.now() + 3600000, banks: values.filter(bank => bank.active !== false).map(bank => ({ name: bank.name, code: bank.code })) };
      }
      res.json({ ok: true, banks: cachedBanks[type].banks });
    } catch { res.status(503).json({ ok: false, error: "Payout banks are unavailable. Retry later." }); }
  });
  const handle = action => async (req, res) => { res.set("Cache-Control", "no-store"); try {
    const actor = await owner(req, admin); res.json({ ok: true, ...await action(req, actor) });
  } catch (e) { res.status(e.status || 500).json({ ok: false, error: e.status ? e.message : "Payout service unavailable. Check the recorded status before retrying." }); } };
  app.post("/admin/referrals/payout-account/:id", handle(async (req, actor) => {
    if (!/^[a-f0-9]{64}$/.test(req.params.id || "") || req.body.confirmed !== true) fail(400, "Confirm the payout destination review.");
    const ref = db.collection("referralApplications").doc(req.params.id), snap = await ref.get();
    const secret = await db.collection("partnershipPrivate").doc(req.params.id).get();
    if (!snap.exists || !secret.exists || snap.data().terms !== VERSION || snap.data().kind !== "referral" || snap.data().status !== "approved") fail(409, "Approve a signed referral partnership first.");
    if (snap.data().recipientCode && snap.data().autoPayoutEnabled) return { ready: true };
    const bank = decryptBank(secret.data().encryptedBank, getSecret());
    const resolved = await api("bank/resolve?account_number=" + encodeURIComponent(bank.account_number) + "&bank_code=" + encodeURIComponent(bank.bank_code), { secret: getSecret() });
    const comparable = value => String(value || "").normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9 ]/g, " ").split(/\s+/).filter(Boolean).sort().join(" ");
    if (resolved.account_number !== bank.account_number || !resolved.account_name || comparable(resolved.account_name) !== comparable(bank.name)) fail(409, "Paystack's account holder name does not match the submitted name. Confirm the details with the partner before enabling payments.");
    const recipient = await api("transferrecipient", { method: "POST", secret: getSecret(), body: bank });
    if (!recipient.recipient_code || recipient.currency !== "GHS" || recipient.active === false) fail(409, "Paystack did not accept this payout destination.");
    await ref.update({ recipientCode: recipient.recipient_code, autoPayoutEnabled: true, payoutApprovedAt: admin.firestore.FieldValue.serverTimestamp(), payoutApprovedBy: actor.uid, verifiedAccountName: resolved.account_name });
    return { ready: true, automaticTransfersConfigured: enabled() };
  }));
  app.post("/admin/referrals/process/:id", handle(async req => {
    if (!/^[a-f0-9]{64}$/.test(req.params.id || "")) fail(400, "Invalid referral.");
    const claim = await db.collection("referralClaims").doc(req.params.id).get();
    if (!claim.exists) fail(404, "Referral not found.");
    const matches = await db.collection("students").where("email", "==", claim.data().email).limit(2).get();
    if (matches.size !== 1) fail(409, "One matching student account is required.");
    return { result: await processReferral({ db, admin, studentId: matches.docs[0].id, getSecret, api }) };
  }));
}
function registerPayoutTriggers({ db, admin, onDocumentWritten, paystackSecret }) {
  const exports = {};
  for (const [name, collection] of [["processAdminReferralCommission", "payments"], ["processCampusReferralCommission", "paystackWebhookEvents"]]) {
    exports[name] = onDocumentWritten({ document: collection + "/{id}", secrets: [paystackSecret], retry: true }, async event => {
      if (!enabled()) return;
      const after = event.data?.after; if (!after?.exists) return;
      const value = after.data(), before = event.data.before?.data() || {};
      if (value.refunded || value.refundedAt || value.refundStatus || value.status === "refunded") {
        return cancelRefundedCommission({ db, admin, reference: value.reference || after.id });
      }
      if (!["paid", "handled"].includes(value.status) || before.status === value.status || !value.studentId || value.referralEligible === false) return;
      const result = await processReferral({ db, admin, studentId: value.studentId });
      if (result.skipped === "already_processing") throw new Error("Payout lease is active; retry later.");
      return result;
    });
  }
  exports.notifyApprovedPartnership = onDocumentWritten({ document: "referralApplications/{id}", retry: true, secrets: [paystackSecret] }, async event => {
    const after = event.data?.after; if (!after?.exists) return;
    const partner = after.data(), before = event.data.before?.data() || {};
    if (partner.status !== "approved" || ![VERSION, "organisation-partnership-2026-11-05-v3", "organisation-partnership-2026-11-05-v4", ORGANISATION_VERSION].includes(partner.terms)) return;
    if (before.status !== "approved") {
      const marker = db.collection("partnershipNotifications").doc(after.id), current = await marker.get();
      if (!current.exists || current.data().status !== "sent") {
        const reserved = await db.runTransaction(async tx => {
          const state = await tx.get(marker);
          if (state.data()?.status === "sent") return false;
          if (Number(state.data()?.leaseUntil || 0) > Date.now()) throw new Error("Approval email is being delivered.");
          tx.set(marker, { status: "sending", leaseUntil: Date.now() + 60000 }); return true;
        });
        if (reserved) {
          try {
            const { postPaymentRow, resolveWebhookConfig } = require("./studentPaymentUpdateEmails");
            const runtimeConfig = JSON.parse(process.env.CLOUD_RUNTIME_CONFIG || "{}");
            const link = partner.kind === "institutional" && partner.billingResponsibility === "organisation" ? "https://www.falowen.app/organisation-enrolment" : "https://www.falowen.app/signup?program=german";
            await postPaymentRow(resolveWebhookConfig(runtimeConfig), { email: partner.email, topic: "Falowen partnership approved", announcement: `Hello ${partner.name},\nYour Falowen partnership has been approved.\n${partner.kind === "institutional" && partner.billingResponsibility === "organisation" ? "Submit your organisation-paid students here:" : "Clients paying for themselves can use normal signup here:"}\n${link}\nClients paying individually use normal signup and pay the full advertised fee. No referral commission applies.`, link, button_label: "Open partnership link", delivery_mode: "individual", allow_bcc_fallback: "FALSE", show_progress: "FALSE", show_review: "FALSE", show_app_button: "TRUE", attach_certificate: "FALSE" });
            await marker.set({ status: "sent", sentAt: admin.firestore.FieldValue.serverTimestamp(), leaseUntil: 0 });
          } catch (error) { await marker.set({ status: "failed", leaseUntil: 0 }); throw error; }
        }
      }
    }
    if (!enabled() || !partner.autoPayoutEnabled || before.autoPayoutEnabled === partner.autoPayoutEnabled) return;
    const claims = await db.collection("referralClaims").where("partnerId", "==", after.id).limit(100).get();
    for (const row of claims.docs) {
      if (row.data().status === "reversed" || row.data().payoutReference) continue;
      const students = await db.collection("students").where("email", "==", row.data().email).limit(2).get();
      if (students.size === 1) await processReferral({ db, admin, studentId: students.docs[0].id });
    }
  });
  return exports;
}
module.exports = { provider, verifyTransfer, processReferral, handlePayoutWebhook, handleRefundWebhook, cancelRefundedCommission, registerPayoutRoutes, registerPayoutTriggers };
