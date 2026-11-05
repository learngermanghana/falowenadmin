"use strict";
const crypto = require("node:crypto");

// One stable identity across signed agreements and later student batches.
// Old records do not need rewriting: the directory joins them by normalized email.
const organisationId = address => crypto.createHash("sha256").update("organisation-v5:" + String(address || "").trim().toLowerCase()).digest("hex");
const asString = value => String(value ?? "").trim();
function organisationDirectoryRows(agreements, submissions) {
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
  return [...groups.values()].sort((a,b) => Number(Boolean(b.agreementSignedAt)) - Number(Boolean(a.agreementSignedAt)) || a.name.localeCompare(b.name));
}
async function loadOrganisationDirectory(db, limit = 100) {
  // Single-field indexed queries; existing historical records are not modified.
  const [agreements, submissions] = await Promise.all([
    db.collection("referralApplications").where("kind", "==", "institutional").limit(limit).get(),
    db.collection("organisationEnrolments").orderBy("createdAt", "desc").limit(limit).get(),
  ]);
  const rows = organisationDirectoryRows(
    agreements.docs.map(doc => ({ id: doc.id, ...doc.data() })),
    submissions.docs.map(doc => ({ id: doc.id, ...doc.data() })),
  );
  return { organisations: rows, truncated: agreements.docs.length === limit || submissions.docs.length === limit };
}
module.exports = { organisationId, organisationDirectoryRows, loadOrganisationDirectory };
