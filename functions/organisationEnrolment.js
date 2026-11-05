"use strict";
const crypto = require("node:crypto");
const clean = v => String(v ?? "").trim();
const email = v => clean(v).toLowerCase();
const validEmail = v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
const fail = (status, message) => { throw Object.assign(new Error(message), { status }); };
const hash = v => crypto.createHash("sha256").update(v).digest("hex");
function validateSubmission(body = {}) {
  const organisation = Object.fromEntries(["name", "contactName", "email", "phone"].map(k => [k, clean(body.organisation?.[k]).slice(0, 254)]));
  organisation.email = email(organisation.email);
  if (!organisation.name || !organisation.contactName || !validEmail(organisation.email) || !organisation.phone) fail(400, "Enter the organisation name and contact details.");
  if (body.website) fail(400, "Unable to accept submission.");
  if (body.consent !== true) fail(400, "Confirm you have permission to submit these student details.");
  if (!Array.isArray(body.students) || !body.students.length || body.students.length > 50) fail(400, "Submit between 1 and 50 students.");
  const seen = new Set();
  const students = body.students.map((row, i) => {
    const student = Object.fromEntries(["name", "email", "phone", "level", "location", "emergencyContactPhone"].map(k => [k, clean(row?.[k]).slice(0, 254)]));
    student.email = email(student.email); student.level = student.level.toUpperCase();
    if (!student.name || !validEmail(student.email) || !student.phone || !["A1", "A2", "B1", "B2", "C1", "C2"].includes(student.level)) fail(400, `Row ${i + 1}: name, valid email, phone and level are required.`);
    if (seen.has(student.email)) fail(400, `Row ${i + 1}: duplicate email in this submission.`);
    seen.add(student.email); return { ...student, status: "pending" };
  });
  const agreementReference = clean(body.agreementReference);
  if (agreementReference && !/^[a-f0-9]{64}$/.test(agreementReference)) fail(400, "Invalid agreement reference.");
  return { organisation, students, ...(agreementReference ? { agreementReference } : {}) };
}
async function owner(req, admin) {
  const token = clean(req.headers?.authorization).match(/^Bearer (\S+)$/)?.[1];
  if (!token) fail(401, "Sign in first.");
  let actor; try { actor = await admin.auth().verifyIdToken(token, true); } catch { fail(401, "Sign in again."); }
  if (!actor.email_verified || email(actor.email) !== "moxflex@gmail.com") fail(403, "Owner access required.");
  return actor;
}
async function reviewRow({ db, admin, batchId, index, decision, actor }) {
  if (!/^[a-zA-Z0-9_-]{1,100}$/.test(batchId) || !Number.isInteger(index) || index < 0 || !["approve", "reject"].includes(decision)) fail(400, "Invalid review request.");
  const ref = db.collection("organisationEnrolments").doc(batchId);
  return db.runTransaction(async tx => {
    const snap = await tx.get(ref); if (!snap.exists) fail(404, "Submission not found.");
    const batch = snap.data();
    if (batch.deleted) fail(404, "Submission not found.");
    const rows = [...batch.students], row = rows[index];
    if (!row) fail(404, "Student row not found.");
    if (row.status !== "pending") return { ok: true, studentId: row.studentId || null, status: row.status };
    const now = admin.firestore.FieldValue.serverTimestamp();
    let studentId = null;
    if (decision === "approve") {
      studentId = `ORG-${hash(row.email).slice(0, 24)}`;
      const studentRef = db.collection("students").doc(studentId);
      const existing = await tx.get(db.collection("students").where("email", "==", row.email).limit(1));
      const canonical = await tx.get(studentRef);
      if (!existing.empty || canonical.exists) fail(409, "A student already uses this email. Review the existing student in the directory; no duplicate was created.");
      tx.create(studentRef, {
        name: row.name, fullName: row.name, email: row.email, phone: row.phone,
        level: row.level, location: row.location, emergencyContactPhone: row.emergencyContactPhone,
        role: "student", studentCode: studentId, studentcode: studentId, program: "german",
        organisationName: batch.organisation.name, organisationContactEmail: batch.organisation.email,
        organisationSubmissionId: batchId, enrolmentSource: "organisation", billingResponsibility: "organisation",
        status: "pending", paymentStatus: "pending", className: "", contractStart: "", contractEnd: "",
        accountActivationState: "not_prepared", syncedToSheets: false, joined_at: new Date().toISOString(),
        createdAt: now, updated_at: now,
      });
    }
    rows[index] = { ...row, status: decision === "approve" ? "approved" : "rejected", studentId, reviewedBy: actor.email, reviewedAt: new Date().toISOString() };
    tx.update(ref, { students: rows, updatedAt: now });
    return { ok: true, studentId, status: rows[index].status };
  });
}
async function deleteSubmission({ db, admin, batchId, actor }) {
  if (!/^[a-zA-Z0-9_-]{1,100}$/.test(batchId)) fail(400, "Invalid submission reference.");
  const ref = db.collection("organisationEnrolments").doc(batchId);
  await db.runTransaction(async tx => {
    const snap = await tx.get(ref);
    if (!snap.exists || snap.data().deleted) return;
    // Replace submitted personal data; retain only a retry marker and audit metadata.
    // Student accounts and sheet records are managed independently in Students.
    tx.set(ref, { deleted: true, createdAt: snap.data().createdAt || admin.firestore.FieldValue.serverTimestamp(),
      deletedAt: admin.firestore.FieldValue.serverTimestamp(), deletedBy: actor.email });
  });
  return { ok: true };
}
function registerOrganisationEnrolmentRoutes(app, { db, admin }) {
  const handle = fn => async (req, res) => {
    res.set("Cache-Control", "no-store");
    try { return res.json(await fn(req)); } catch (e) { return res.status(e.status || 500).json({ ok: false, error: e.status ? e.message : "Enrolment service unavailable. Please retry." }); }
  };
  app.post("/organisation-enrolments", handle(async req => {
    const data = validateSubmission(req.body);
    const key = clean(req.body.requestId);
    if (!/^[a-f0-9-]{36}$/.test(key)) fail(400, "Refresh the page and try again.");
    const ref = db.collection("organisationEnrolments").doc(key);
    // Atomic per-contact daily quota works across function instances.
    const quota = db.collection("organisationEnrolmentLimits").doc(hash(`${data.organisation.email}:${new Date().toISOString().slice(0, 10)}`));
    await db.runTransaction(async tx => {
      const prior = await tx.get(ref), limit = await tx.get(quota);
      if (data.agreementReference && !prior.exists) {
        const agreement = await tx.get(db.collection("referralApplications").doc(data.agreementReference));
        if (!agreement.exists || agreement.data().kind !== "institutional" || !agreement.data().signedAt || agreement.data().status === "rejected" || agreement.data().email !== data.organisation.email) fail(409, "Use the contact email from your signed organisation agreement.");
      }
      if (prior.exists) {
        if (prior.data().deleted) fail(409, "This submission was deleted by Falowen. Start a new submission if needed.");
        return;
      }
      const count = limit.exists ? limit.data().count || 0 : 0;
      if (count >= 10) fail(429, "Daily submission limit reached. Contact Falowen for help.");
      tx.set(quota, { count: count + 1, expiresAt: new Date(Date.now() + 2 * 86400000) });
      tx.create(ref, { ...data, createdAt: admin.firestore.FieldValue.serverTimestamp() });
    });
    return { ok: true, reference: key };
  }));
  app.get("/admin/organisation-enrolments", handle(async req => {
    await owner(req, admin);
    let query = db.collection("organisationEnrolments").orderBy("createdAt", "desc");
    const cursor = clean(req.query?.cursor);
    if (cursor) {
      if (!/^[a-zA-Z0-9_-]{1,100}$/.test(cursor)) fail(400, "Invalid page cursor.");
      const last = await db.collection("organisationEnrolments").doc(cursor).get();
      if (!last.exists) fail(400, "Refresh submissions and try again.");
      query = query.startAfter(last);
    }
    const snapshot = await query.limit(50).get();
    return { ok: true, submissions: snapshot.docs.filter(d => !d.data().deleted).map(d => ({ id: d.id, ...d.data() })), nextCursor: snapshot.docs.length === 50 ? snapshot.docs.at(-1).id : null };
  }));
  app.post("/admin/organisation-enrolments/:batchId/delete", handle(async req => deleteSubmission({ db, admin, actor: await owner(req, admin), batchId: req.params.batchId })));
  app.post("/admin/organisation-enrolments/:batchId/review", handle(async req => reviewRow({ db, admin, actor: await owner(req, admin), batchId: req.params.batchId, index: req.body.index, decision: req.body.decision })));
}
module.exports = { deleteSubmission, validateSubmission, owner, reviewRow, registerOrganisationEnrolmentRoutes };
