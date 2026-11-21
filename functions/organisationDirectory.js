"use strict";
const crypto = require("node:crypto");

// One stable identity across signed agreements and later student batches.
// Old records do not need rewriting: the directory joins them by normalized email.
const organisationId = address => crypto.createHash("sha256").update("organisation-v5:" + String(address || "").trim().toLowerCase()).digest("hex");
const asString = value => String(value ?? "").trim();
function organisationDirectoryRows(agreements, submissions, profiles = []) {
  const groups = new Map();
  const upsert = email => {
    const normalized = asString(email).toLowerCase();
    if (!normalized) return null;
    const id = organisationId(normalized);
    if (!groups.has(id)) groups.set(id, {
      id, contactEmail: normalized, billingEmail: normalized,
      name: "", contactName: "", phone: "", address: "",
      agreementReference: "", agreementSignedAt: null, agreementStatus: "not_linked",
      submissions: [], studentCount: 0, approvedCount: 0,
    });
    return groups.get(id);
  };
  for (const record of agreements) {
    if (record.kind !== "institutional") continue;
    const entry = upsert(record.email);
    if (!entry) continue;
    entry.name = record.name || entry.name;
    entry.phone = record.phone || entry.phone;
    entry.address = record.address || entry.address;
    entry.contactName = record.signerName || entry.contactName;
    entry.agreementReference = record.id || entry.id;
    entry.agreementSignedAt = record.signedAt || null;
    entry.agreementStatus = record.status || "pending";
  }
  for (const batch of submissions) {
    if (batch.deleted) continue;
    const entry = upsert(batch.organisation?.email);
    if (!entry) continue;
    const org = batch.organisation || {};
    entry.name ||= org.name || "";
    entry.contactName ||= org.contactName || "";
    entry.phone ||= org.phone || "";
    if (!entry.agreementReference && batch.agreementReference) {
      entry.agreementReference = batch.agreementReference;
      entry.agreementStatus = "linked_legacy";
    }
    const students = Array.isArray(batch.students) ? batch.students : [];
    entry.submissions.push({
      id: batch.id, createdAt: batch.createdAt || null, agreementReference: batch.agreementReference || "",
      studentCount: students.length, approvedCount: students.filter(s => s.status === "approved").length,
      studentIds: students.filter(s => s.studentId).map(s => s.studentId),
    });
    entry.studentCount += students.length;
    entry.approvedCount += students.filter(s => s.status === "approved").length;
  }
  for (const profile of profiles) {
    const entry = upsert(profile.loginEmail);
    if (!entry || entry.id !== profile.id) continue;
    entry.name = profile.name || entry.name;
    entry.contactName = profile.contactName || entry.contactName;
    entry.phone = profile.phone || entry.phone;
    entry.address = profile.address || entry.address;
    entry.accountPrepared = true;
    entry.accountDisabled = Boolean(profile.disabled);
  }
  const names = new Map();
  for (const row of groups.values()) {
    const key = row.name.normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');
    if (key) names.set(key, (names.get(key) || 0) + 1);
  }
  for (const row of groups.values()) {
    const key = row.name.normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');
    row.possibleDuplicate = (names.get(key) || 0) > 1;
  }
  return [...groups.values()].sort((a,b) => Number(Boolean(b.agreementSignedAt)) - Number(Boolean(a.agreementSignedAt)) || a.name.localeCompare(b.name));
}
async function loadOrganisationDirectory(db, limit = 100) {
  // Single-field indexed queries; existing historical records are not modified.
  const [agreements, submissions, profiles] = await Promise.all([
    db.collection("referralApplications").where("kind", "==", "institutional").limit(limit).get(),
    db.collection("organisationEnrolments").orderBy("createdAt", "desc").limit(limit).get(),
    db.collection("organisationPartners").limit(limit).get(),
  ]);
  const rows = organisationDirectoryRows(
    agreements.docs.map(doc => ({ id: doc.id, ...doc.data() })),
    submissions.docs.map(doc => ({ id: doc.id, ...doc.data() })),
    profiles.docs.map(doc => ({ id: doc.id, ...doc.data() })),
  );
  return { organisations: rows, truncated: agreements.docs.length === limit || submissions.docs.length === limit || profiles.docs.length === limit };
}

function amount(value) {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(String(value).replace(/,/g, "").trim());
  return Number.isFinite(parsed) && parsed >= 0 ? Math.round(parsed * 100) / 100 : null;
}
function firstAmount(student, keys) {
  for (const key of keys) {
    const value = amount(student[key]);
    if (value !== null) return value;
  }
  return null;
}
// Use canonical paid/balance fields, never initialPaymentAmount (an intention, not a receipt).
// Missing tuition configuration is UNKNOWN, not zero owed.
function organisationStudentLedger(rows) {
  let outstandingTotal = 0, owingCount = 0, unverifiedCount = 0;
  const students = rows.map(({ id, ...student }) => {
    const paid = firstAmount(student, ["paid", "amountPaid", "paidAmount", "amount_paid", "totalPaid"]);
    const fee = firstAmount(student, ["tuitionFee"]);
    const discount = firstAmount(student, ["tuitionDiscount"]) ?? 0;
    let balance = firstAmount(student, ["balanceDue", "balance", "outstandingBalance", "amountDue"]);
    if (balance === null && fee !== null) balance = Math.max(0, Math.round((fee - (paid ?? 0) - discount) * 100) / 100);
    if (balance === null) unverifiedCount += 1;
    else if (balance > 0) { outstandingTotal += balance; owingCount += 1; }
    return {
      id, name: asString(student.name || student.fullName), email: asString(student.email),
      level: asString(student.level), studentCode: asString(student.studentCode || student.studentcode),
      paymentStatus: asString(student.paymentStatus || "Not set"),
      tuitionFee: fee, paid, balanceDue: balance,
    };
  });
  return { students, outstandingTotal: Math.round(outstandingTotal * 100) / 100, owingCount, unverifiedCount };
}
async function loadOrganisationStudents(db, id, limit = 100) {
  if (!/^[a-f0-9]{64}$/.test(id)) {
    throw Object.assign(new Error("Invalid organisation reference."), { status: 400 });
  }
  // One indexed, owner-only query on demand. Never scan every student on page load.
  const snapshot = await db.collection("students").where("organisationId", "==", id).limit(limit + 1).get();
  const truncated = snapshot.docs.length > limit;
  const rows = snapshot.docs.slice(0, limit).map(doc => ({ id: doc.id, ...doc.data() }));
  return { ...organisationStudentLedger(rows), truncated };
}

module.exports = { organisationId, organisationDirectoryRows, loadOrganisationDirectory, organisationStudentLedger, loadOrganisationStudents };
