"use strict";
const crypto = require("node:crypto");
const { postPaymentRow, resolveWebhookConfig } = require("./studentPaymentUpdateEmails");
const plain = value => String(value ?? "").trim();

function money(value) {
  return Number(value || 0).toLocaleString("en-GH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function contractEndLabel(value) {
  const d = value?.toDate?.() || (value ? new Date(value) : null);
  return d instanceof Date && !Number.isNaN(d.getTime())
    ? new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "Africa/Accra" }).format(d)
    : "";
}

function organisationStudentConfirmation(student = {}) {
  if (plain(student.billingResponsibility).toLowerCase() !== "organisation") return null;
  const amount = Number(student.paid ?? student.amountPaid ?? 0);
  if (!Number.isFinite(amount) || amount <= 0) return null;
  const className = plain(student.className || student.class);
  const email = plain(student.email).toLowerCase();
  const organisation = plain(student.organisationName);
  if (!email || !organisation || !className || !plain(student.lastPaymentReference)) return null;
  const level = plain(student.level);
  const remaining = Number(student.balanceDue ?? student.balance ?? 0);
  const partial = plain(student.paymentStatus).toLowerCase().includes("partial")
    || (Number.isFinite(remaining) && remaining > 0 && amount > 0);
  const accessEnd = contractEndLabel(student.contractEnd);
  const tuitionStatement = partial
    ? "Your organisation has paid GHS " + money(amount) + " toward your course tuition. GHS " + money(remaining) + " remains outstanding and payable under the original organisation agreement."
    : "Your tuition was paid by " + organisation + ".";
  const accessStatement = partial
    ? "Your current payment provides one month of paid access from the recorded receipt date" + (accessEnd ? ", ending " + accessEnd : "") + ". Account activation or a class change does not automatically extend this term."
    : "Each class lasts 10 weeks. Your Falowen access lasts six months from account activation, including the remaining time after your class finishes.";
  const classChangeStatement = partial
    ? "Any class change requires Falowen approval and an available place and does not extend your current paid access."
    : "Any class change requires Falowen approval and an available place. A class change does not restart or extend your six-month access.";
  return {
    email,
    topic: "Falowen enrolment confirmed — tuition paid by " + organisation,
    announcement: [
      "Hello " + plain(student.name || student.fullName || "Student") + ",",
      tuitionStatement,
      "Your class: " + className + (level ? " (" + level + ")" : "") + ".",
      "Group payment reference: " + plain(student.lastPaymentReference) + ".",
      accessStatement,
      classChangeStatement,
      "Use your secure account setup email to activate your login. You can find your class and account details at https://www.falowen.app/campus/account and https://www.falowen.app/campus/course.",
      "The organisation is the tuition payer. Do not make a duplicate personal payment; any remaining tuition balance must be settled under the organisation agreement.",
      "Falowen · Learn Language Education Academy",
    ].join("\n\n"),
    class: className, delivery_mode: "individual", email_type: "organisation_enrolment_confirmation",
    allow_bcc_fallback: "FALSE", show_app_button: "TRUE", show_class: "TRUE",
    show_progress: "FALSE", show_review: "FALSE", attach_certificate: "FALSE",
    receipt_reference: plain(student.lastPaymentReference),
  };
}
async function sendOrganisationStudentConfirmation({ db, admin, studentId, runtimeConfig = {}, send = postPaymentRow }) {
  const studentRef = db.collection("students").doc(studentId);
  const studentSnap = await studentRef.get();
  if (!studentSnap.exists) return { sent: false, reason: "student_missing" };
  const student = studentSnap.data();
  if (!["invited", "active"].includes(plain(student.accountActivationState).toLowerCase())) return { sent: false, reason: "account_not_invited" };
  const message = organisationStudentConfirmation(student);
  if (!message) return { sent: false, reason: "not_ready_or_not_organisation" };
  const key = crypto.createHash("sha256").update(studentId + ":" + message.receipt_reference).digest("hex");
  const ref = db.collection("organisationStudentConfirmations").doc(key);
  const reserved = await db.runTransaction(async tx => {
    const snap = await tx.get(ref);
    const state = snap.exists ? snap.data() : {};
    if (state.status === "sent" || Number(state.leaseUntil || 0) > Date.now()) return false;
    tx.set(ref, { studentId, paymentReference: message.receipt_reference, status: "sending", leaseUntil: Date.now() + 120000,
      ...(snap.exists ? {} : { createdAt: admin.firestore.FieldValue.serverTimestamp() }) }, { merge: true });
    return true;
  });
  if (!reserved) return { sent: false, reason: "sent_or_in_progress" };
  try {
    await send(resolveWebhookConfig(runtimeConfig), message);
    await ref.set({ status: "sent", sentAt: admin.firestore.FieldValue.serverTimestamp(), leaseUntil: 0 }, { merge: true });
    return { sent: true };
  } catch (error) {
    await ref.set({ status: "failed", lastError: String(error?.message || error).slice(0, 250), leaseUntil: 0 }, { merge: true });
    throw error;
  }
}
module.exports = { organisationStudentConfirmation, sendOrganisationStudentConfirmation };
