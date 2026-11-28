"use strict";
const crypto = require('node:crypto');
const clean = value => String(value ?? '').trim();
const lower = value => clean(value).toLowerCase();
const hash = value => crypto.createHash('sha256').update(value).digest('hex');
const fail = (status, message) => { throw Object.assign(new Error(message), { status }); };
const idForEmail = value => hash('organisation-v5:' + lower(value));
const nameKey = value => hash(clean(value).normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}]/gu, ''));
const stamp = admin => admin.firestore.FieldValue.serverTimestamp();
async function verifiedPartner(req, admin) {
  const token = clean(req.headers?.authorization).match(/^Bearer (\S+)$/)?.[1];
  if (!token) fail(401, 'Sign in to your partner account first.');
  let actor;
  try { actor = await admin.auth().verifyIdToken(token, true); } catch { fail(401, 'Your session expired. Sign in again.'); }
  if (!actor.uid || !actor.email_verified || !actor.email) fail(403, 'Verify your email before accessing your organisation.');
  return actor;
}
async function partnerProfile(req, { db, admin }) {
  const actor = await verifiedPartner(req, admin);
  const member = await db.collection('organisationPartnerMembers').doc(actor.uid).get();
  if (!member.exists) fail(404, 'No partner profile is linked. Register a new organisation or ask Falowen to activate your existing profile.');
  const id = member.data().organisationId;
  const snap = await db.collection('organisationPartners').doc(id).get();
  if (!snap.exists || snap.data().disabled || member.data().disabled || lower(snap.data().loginEmail) !== lower(actor.email)) fail(403, 'Partner access is unavailable. Contact Falowen.');
  const agreement = await db.collection('referralApplications').doc(id).get();
  const signed = agreement.exists && agreement.data().kind === 'institutional' && Boolean(agreement.data().signedAt);
  return { actor, profile: { ...snap.data(), id }, agreement: signed ? { reference: id, status: agreement.data().status, terms: agreement.data().terms, signedAt: agreement.data().signedAt } : null };
}
function safeProfile({ profile, agreement }) {
  return { id: profile.id, name: profile.name, contactName: profile.contactName, email: profile.loginEmail,
    phone: profile.phone, address: profile.address || '', agreement, legacy: Boolean(profile.legacy) };
}
async function registerPartner(req, { db, admin }) {
  const actor = await verifiedPartner(req, admin);
  const name = clean(req.body?.name), contactName = clean(req.body?.contactName), phone = clean(req.body?.phone), address = clean(req.body?.address);
  if (!name || name.length > 150 || !contactName || contactName.length > 150 || !phone || phone.length > 40 || !address || address.length > 300) fail(400, 'Enter your organisation name, representative, phone and address.');
  const id = idForEmail(actor.email);
  const linkedStudent = await db.collection('students').where('uid', '==', actor.uid).limit(1).get();
  // Historical claims require explicit owner preparation, even with the same email.
  const legacy = await db.collection('organisationEnrolments').where('organisation.email', '==', lower(actor.email)).limit(1).get();
  const agreement = await db.collection('referralApplications').doc(id).get();
  const [sameAgreementName, sameSubmissionName] = await Promise.all([db.collection('referralApplications').where('name', '==', name).limit(1).get(), db.collection('organisationEnrolments').where('organisation.name', '==', name).limit(1).get()]);
  if (!sameAgreementName.empty || !sameSubmissionName.empty) fail(409, 'This company name appears in earlier records. Contact Falowen to activate or review the existing organisation.');
  if (!legacy.empty || agreement.exists) fail(409, 'An existing organisation uses this email. Ask Falowen to activate that profile; do not register it again.');
  await db.runTransaction(async tx => {
    const ref = db.collection('organisationPartners').doc(id), member = db.collection('organisationPartnerMembers').doc(actor.uid);
    const reservation = db.collection('organisationPartnerNames').doc(nameKey(name));
    const [prior, membership, reserved] = await Promise.all([tx.get(ref), tx.get(member), tx.get(reservation)]);
    if (membership.exists) { if (membership.data().organisationId === id) return; fail(409, 'This login is already linked to an organisation.'); }
    if (prior.exists || reserved.exists) fail(409, 'This organisation may already be registered. Contact Falowen to check it before creating another profile.');
    tx.create(ref, { name, contactName, phone, address, loginEmail: lower(actor.email), createdAt: stamp(admin), createdBy: actor.uid });
    tx.create(member, { organisationId: id, courseAccessAllowed: !linkedStudent.empty, createdAt: stamp(admin) });
    tx.create(reservation, { organisationId: id });
  });
  return { ok: true, profile: safeProfile(await partnerProfile(req, { db, admin })) };
}
async function prepareLegacyPartner({ db, admin, email, actor }) {
  email = lower(email);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) fail(400, 'Choose a valid organisation email.');
  const id = idForEmail(email), ref = db.collection('organisationPartners').doc(id);
  const [existing, agreement, batches] = await Promise.all([ref.get(), db.collection('referralApplications').doc(id).get(),
    db.collection('organisationEnrolments').where('organisation.email', '==', email).limit(100).get()]);
  const source = batches.docs.map(doc => doc.data()).find(batch => !batch.deleted)?.organisation;
  const signed = agreement.exists && agreement.data().kind === 'institutional' ? agreement.data() : null;
  if (!existing.exists && !signed && !source) fail(404, 'No historical organisation was found for this email.');
  const p = existing.exists ? existing.data() : { name: signed?.name || source.name, contactName: signed?.signerName || source.contactName,
    phone: signed?.phone || source.phone, address: signed?.address || '', loginEmail: email, legacy: true };
  let user;
  try { user = await admin.auth().getUserByEmail(email); }
  catch (e) {
    if (e.code !== 'auth/user-not-found') throw e;
    try { user = await admin.auth().createUser({ email, displayName: p.name, password: crypto.randomBytes(48).toString('base64url'), emailVerified: false }); }
    catch (race) { if (race.code !== 'auth/email-already-exists') throw race; user = await admin.auth().getUserByEmail(email); }
  }
  if (user.disabled) fail(409, 'This login is disabled. Review it before sending an invitation.');
  const linkedStudent = await db.collection('students').where('uid', '==', user.uid).limit(1).get();
  // Existing login credentials and student/staff roles are never changed.
  await db.runTransaction(async tx => {
    const member = db.collection('organisationPartnerMembers').doc(user.uid);
    const reservation = db.collection('organisationPartnerNames').doc(nameKey(p.name));
    const [prior, membership, reserved] = await Promise.all([tx.get(ref), tx.get(member), tx.get(reservation)]);
    if (membership.exists && membership.data().organisationId !== id) fail(409, 'This login belongs to another organisation. Review the records manually.');
    if (prior.exists && (prior.data().disabled || lower(prior.data().loginEmail) !== email)) fail(409, 'This profile needs manual access review.');
    if (!prior.exists) tx.create(ref, { ...p, createdAt: stamp(admin), preparedBy: actor.uid });
    if (!membership.exists) tx.create(member, { organisationId: id, courseAccessAllowed: !linkedStudent.empty, createdAt: stamp(admin), preparedBy: actor.uid });
    if (!reserved.exists) tx.create(reservation, { organisationId: id });
    tx.set(db.collection('auditLogs').doc(), { type: 'organisation.partner_account_prepared', organisationId: id, actor: actor.uid, createdAt: stamp(admin) });
  });
  return { ok: true, organisationId: id, email, state: 'ready_to_invite' };
}

function checkoutLink(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && url.hostname === 'checkout.paystack.com' && !url.username && !url.password && !url.port ? url.href : null;
  } catch { return null; }
}
async function partnerBilling(req, { db, admin }) {
  const { profile, agreement } = await partnerProfile(req, { db, admin });
  const id = clean(req.params.id);
  if (!/^[a-zA-Z0-9_-]{1,100}$/.test(id)) fail(400, 'Invalid submission reference.');
  const batch = await db.collection('organisationEnrolments').doc(id).get();
  const data = batch.exists ? batch.data() : null;
  if (!data || data.deleted || lower(data.organisation?.email) !== profile.loginEmail || (data.organisationId && data.organisationId !== profile.id)) fail(404, 'Submission not found.');
  const { organisationStudentLedger } = require('./organisationDirectory');
  const { balanceOf, minor } = require('./organisationPayments');
  const submitted = (Array.isArray(data.students) ? data.students : []).filter(row => row.status === 'approved' && row.studentId);
  const approved = new Set(submitted.map(row => row.studentId));
  const snapshots = await Promise.all([...approved].slice(0, 50).map(studentId => db.collection('students').doc(studentId).get()));
  const own = new Map(snapshots.filter(snap => snap.exists && snap.data().organisationSubmissionId === id &&
    (!snap.data().organisationId || snap.data().organisationId === profile.id) &&
    (!snap.data().organisationContactEmail || lower(snap.data().organisationContactEmail) === profile.loginEmail) &&
    snap.data().billingResponsibility === 'organisation').map(snap => [snap.id, snap.data()]));
  const students = submitted.map(row => {
    const student = own.get(row.studentId);
    const ledger = student ? organisationStudentLedger([{ ...student, id: row.studentId }]).students[0] : null;
    return { name: row.name, level: ledger?.level || row.level, className: student?.className || '', tuitionFee: ledger?.tuitionFee ?? null,
      paid: ledger?.paid ?? null, balanceDue: ledger?.balanceDue ?? null, paymentStatus: ledger?.paymentStatus || 'Needs review',
      paymentDeadline: ledger?.paymentDueDate || '', accessEndDate: ledger?.accessEndDate || '' };
  });
  const snapshot = await db.collection('payments').where('organisationSubmissionId', '==', id).limit(51).get();
  const truncated = snapshot.docs.length > 50 || approved.size > 50;
  const records = snapshot.docs.slice(0, 50).map(doc => doc.data()).filter(p => ['organisation_group','organisation_manual'].includes(p.purpose));
  const pendingCounts = new Map();
  for (const p of records.filter(p => ['pending','initializing','paid_needs_review','expired'].includes(p.status))) {
    for (const line of Array.isArray(p.lines) ? p.lines : []) pendingCounts.set(line.studentId, (pendingCounts.get(line.studentId) || 0) + 1);
  }
  const payments = records.flatMap(p => {
    const lines = Array.isArray(p.lines) ? p.lines : [];
    // Never expose checkout links or allocations with unknown or foreign student ownership.
    if (!lines.length || !lines.every(line => approved.has(line.studentId))) return [];
    let payUrl = null, reason = '';
    if (p.purpose === 'organisation_group' && p.status === 'pending') {
      if (agreement?.status !== 'approved') reason = 'Partnership approval required.';
      else if (truncated) reason = 'Contact Falowen to review the full payment history.';
      else if (lines.some(line => (pendingCounts.get(line.studentId) || 0) > 1)) reason = 'Multiple invoices need Falowen review before payment.';
      else if (!lines.every(line => {
        const student = own.get(line.studentId);
        if (!student || student.partialTuitionTermination?.state === 'pending_purge' ||
          (student.partialTuitionClosedEnrollmentId && student.partialTuitionClosedEnrollmentId === student.effectiveEnrollmentId) ||
          (line.enrollmentId || student.effectiveEnrollmentId) && line.enrollmentId !== student.effectiveEnrollmentId) return false;
        try {
          const lifecycle = require('./partialTuitionLifecycle');
          const dates = lifecycle.recoveryDates(lifecycle.legacyRow(student) || { ...student,
            contractStart: require('./studentContractLifecycle').isoDate(student.contractStart),
            contractEnd: require('./studentContractLifecycle').isoDate(student.contractEnd),
            paymentDeadline: require('./studentContractLifecycle').isoDate(student.paymentDeadline) });
          if (dates && new Date().toISOString().slice(0,10) >= dates.terminateOn) return false;
          const paid = organisationStudentLedger([{ ...student, id: line.studentId }]).students[0].paid;
          return paid !== null && minor(line.grossAmount) > 0 && minor(line.grossAmount) <= balanceOf(student) &&
            (paid > 0 ? minor(line.discount || 0) === 0 : minor(line.discount || 0) === Math.round(minor(line.grossAmount) * 0.1));
        } catch { return false; }
      })) reason = 'Student balances or enrolments changed. Ask Falowen to review this invoice.';
      else if (p.currency !== 'GHS' || !Number.isFinite(p.checkoutAmount) || p.checkoutAmount <= 0 || !(payUrl = checkoutLink(p.authorizationUrl))) reason = 'Checkout unavailable. Contact Falowen.';
    }
    const amount = value => typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : null;
    return [{ reference: clean(p.reference), status: clean(p.status), purpose: p.purpose,
      tuitionCredit: amount(p.tuitionCredit), discount: amount(p.discount), checkoutAmount: amount(p.checkoutAmount),
      processingShare: amount(p.processingShare), receiptStatus: clean(p.receiptStatus),
      lines: lines.map(line => ({ name: submitted.find(row => row.studentId === line.studentId)?.name || 'Student',
        grossAmount: amount(line.grossAmount), tuitionCredit: amount(line.tuitionCredit), discount: amount(line.discount) })),
      payUrl, reason }];
  });
  return { ok: true, students, payments, truncated };
}

function registerOrganisationPartnerRoutes(app, { db, admin }) {
  const handle = action => async (req, res) => {
    res.set('Cache-Control', 'private, no-store');
    try { res.json(await action(req)); } catch (e) { res.status(e.status || 500).json({ ok: false, error: e.status ? e.message : 'Partner service unavailable. Please retry.' }); }
  };
  app.get('/organisation-partners/billing/:id', handle(req => partnerBilling(req, { db, admin })));
  app.get('/organisation-partners/me', handle(async req => ({ ok: true, profile: safeProfile(await partnerProfile(req, { db, admin })) })));
  app.post('/organisation-partners/register', handle(req => registerPartner(req, { db, admin })));
  app.get('/organisation-partners/submissions', handle(async req => {
    const { profile } = await partnerProfile(req, { db, admin });
    // Exact verified profile email also finds pre-profile submissions. Never accept
    // a client-provided company ID, company name or student email as authority.
    const snapshot = await db.collection('organisationEnrolments').where('organisation.email', '==', profile.loginEmail).limit(50).get();
    return { ok: true, truncated: snapshot.docs.length === 50, submissions: snapshot.docs.filter(doc => !doc.data().deleted && (!doc.data().organisationId || doc.data().organisationId === profile.id)).map(doc => ({ id: doc.id, students: (doc.data().students || []).map(row => ({ name: row.name, level: row.level, status: row.status })) })) };
  }));
  app.post('/organisation-partners/contact', handle(async req => {
    const { profile } = await partnerProfile(req, { db, admin });
    const phone = clean(req.body?.phone), contactName = clean(req.body?.contactName);
    if (!phone || phone.length > 40 || !contactName || contactName.length > 150) fail(400, 'Enter a contact name and phone.');
    await db.collection('organisationPartners').doc(profile.id).update({ phone, contactName, updatedAt: stamp(admin) });
    return { ok: true };
  }));
  app.post('/admin/organisation-partners/prepare', handle(async req => {
    const { owner } = require('./organisationEnrolment');
    return prepareLegacyPartner({ db, admin, actor: await owner(req, admin), email: req.body?.email });
  }));
  app.post('/organisation-partners/agreement-copy', async (req, res) => {
    res.set('Cache-Control', 'private, no-store');
    try {
      const { profile, agreement } = await partnerProfile(req, { db, admin });
      if (!agreement) fail(404, 'No signed agreement found.');
      const stored = await db.collection('partnershipPrivate').doc(profile.id).get();
      if (!stored.exists || !stored.data().pendingPdf) fail(404, 'Agreement copy unavailable. Contact Falowen.');
      res.set('Content-Type', 'application/pdf'); res.set('Content-Disposition', 'attachment; filename="Falowen-signed-agreement.pdf"');
      res.send(Buffer.from(stored.data().pendingPdf, 'base64'));
    } catch (e) { res.status(e.status || 500).json({ ok: false, error: e.status ? e.message : 'Agreement unavailable.' }); }
  });
}
module.exports = { verifiedPartner, partnerProfile, safeProfile, registerPartner, prepareLegacyPartner, registerOrganisationPartnerRoutes, idForEmail, nameKey };
