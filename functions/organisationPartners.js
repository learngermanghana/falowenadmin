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
function registerOrganisationPartnerRoutes(app, { db, admin }) {
  const handle = action => async (req, res) => {
    res.set('Cache-Control', 'private, no-store');
    try { res.json(await action(req)); } catch (e) { res.status(e.status || 500).json({ ok: false, error: e.status ? e.message : 'Partner service unavailable. Please retry.' }); }
  };
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
