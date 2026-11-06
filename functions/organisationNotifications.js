"use strict";
const { postPaymentRow, resolveWebhookConfig } = require('./studentPaymentUpdateEmails');
const PORTAL = 'https://www.falowen.app/organisation-enrolment';
function message(kind, record) {
  const welcome = kind === 'welcome';
  return {
    email: record.email, topic: welcome ? 'Welcome to Falowen — Your organisation is approved' : 'Your Falowen student payment link is ready',
    announcement: welcome ? [
      `Dear ${record.name || 'Partner'},`,
      'Congratulations! Your organisation has been approved. We look forward to working together to support your students’ German language learning.',
      `Open your organisation portal and sign in with your existing partner account: ${PORTAL}`,
      'For help getting started, book an optional onboarding appointment: https://www.falowen.app/book-appointment',
      'If you are comfortable using the portal, you can begin immediately. Add your students and select their German level and available class. After Falowen reviews their enrolments and confirms fees, we will email you a payment link.',
      'View current class fees at https://www.falowen.app/classes.',
      'We look forward to a successful partnership.\nThe Falowen Team',
    ].join('\n\n') : [
      `Dear ${record.organisationName || 'Partner'},`,
      'Your payment link for the approved student enrolments is ready.',
      `Payment reference: ${record.reference}`,
      `Amount to pay, including processing: GHS ${Number(record.checkoutAmount).toFixed(2)}`,
      `Pay securely: ${record.authorizationUrl}`,
      `View your organisation portal: ${PORTAL}`,
      'Please pay only once. If payment has already been completed, contact Falowen before paying again.',
      'The Falowen Team',
    ].join('\n\n'),
    delivery_mode: 'individual', email_type: 'organisation_' + kind,
    allow_bcc_fallback: 'FALSE', show_app_button: 'FALSE', show_class: 'FALSE',
    show_progress: 'FALSE', show_review: 'FALSE', attach_certificate: 'FALSE',
  };
}
async function notify({ db, admin, ref, kind, runtimeConfig = {}, send = postPaymentRow }) {
  const field = kind === 'welcome' ? 'welcomeEmail' : 'paymentLinkEmail';
  const row = await db.runTransaction(async tx => {
    const snap = await tx.get(ref), record = snap.data();
    if (!snap.exists || (kind === 'welcome' ? record.kind !== 'institutional' || record.status !== 'approved' || !record.signedAt : record.status !== 'pending' || !record.authorizationUrl)) return null;
    if (record[field]?.status === 'sent' || record[field]?.leaseUntil > Date.now()) return null;
    const payload = message(kind, record);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email || '')) throw new Error('Invalid organisation email');
    tx.update(ref, { [field]: { status: 'sending', leaseUntil: Date.now() + 120000 } });
    return payload;
  });
  if (!row) return { status: 'unchanged' };
  try {
    await send(resolveWebhookConfig(runtimeConfig), row);
    await ref.update({ [field]: { status: 'sent', sentAt: admin.firestore.FieldValue.serverTimestamp() } });
    return { status: 'sent' };
  } catch {
    await ref.update({ [field]: { status: 'failed' } });
    return { status: 'failed' };
  }
}
module.exports = { message, notify };
