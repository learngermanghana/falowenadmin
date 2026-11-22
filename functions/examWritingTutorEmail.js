'use strict';
const crypto = require('node:crypto');
const { resolveLifecycleWebhookConfig } = require('./pendingStudentCleanup.js');
const RECIPIENT = 'learngermanghana@gmail.com';
const text = value => typeof value === 'string' ? value : '';
const fail = (message, status = 400) => Object.assign(new Error(message), { status });
function prepareSubmission(user, body = {}) {
  if (!user?.uid || user.firebase?.sign_in_provider === 'anonymous') throw fail('Sign in to send writing to your tutor.', 401);
  const draft = text(body.draft);
  const feedback = body.aiAssessment;
  if (!draft.trim() || draft.length > 30000 || !feedback || typeof feedback !== 'object' || Array.isArray(feedback)) throw fail('A complete letter and AI assessment are required.');
  const serialized = JSON.stringify(feedback);
  if (serialized.length > 100000) throw fail('The AI assessment is too large.');
  const level = text(body.level).toUpperCase();
  const promptId = text(body.promptId);
  if (!/^(A1|A2|B1|B2|C1|C2)$/.test(level) || !promptId || promptId.length > 160) throw fail('A valid writing level and task are required.');
  const id = crypto.createHash('sha256').update(JSON.stringify([user.uid, level, promptId, draft, feedback])).digest('hex');
  return { id, studentId: user.uid, studentEmail: text(user.email), studentName: text(user.name) || 'Student',
    level, promptId, promptTitle: text(body.promptTitle).slice(0, 300) || promptId,
    draft, aiAssessment: feedback, aiFeedback: serialized, source: 'exam-room-simple-writing', reviewStatus: 'pending' };
}
function emailRow(record) {
  // Announcement templates may render HTML. Keep all learner-supplied text inert.
  const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const message = ['Exams Room writing — student requested tutor review',
    `Student: ${record.studentName}`, `Student email: ${record.studentEmail}`, `Level: ${record.level}`,
    `Task: ${record.promptTitle}`, '', 'FULL LETTER', record.draft, '', 'COMPLETE AI ASSESSMENT (practice feedback)',
    JSON.stringify(record.aiAssessment, null, 2)].join('\n');
  return { email: RECIPIENT, topic: `Writing for tutor review · ${record.level}`,
    announcement: escape(message), delivery_mode: 'individual', allow_bcc_fallback: 'FALSE',
    attach_certificate: 'FALSE', show_progress: 'FALSE', show_review: 'FALSE', show_app_button: 'FALSE',
    show_class: 'FALSE', show_date: 'FALSE', email_type: 'exam_writing_tutor_review',
    event_id: `exam-writing:${record.id}`, dedupe_id: `exam-writing:${record.id}` };
}
async function sendWritingToTutor({ db, user, body, config, fetchImpl = fetch, now = Date.now() }) {
  const record = prepareSubmission(user, body);
  if (!config?.url || !config?.token) throw fail('Tutor email is not configured yet. Your letter is still saved in writing history.', 503);
  const ref = db.collection('examTutorReviewQueue').doc(record.id);
  const limitRef = db.collection('examWritingTutorEmailLimits').doc(crypto.createHash('sha256').update(user.uid).digest('hex'));
  const day = new Date(now).toISOString().slice(0, 10);
  const claimed = await db.runTransaction(async tx => {
    const [saved, limit] = await Promise.all([tx.get(ref), tx.get(limitRef)]);
    const delivery = saved.exists ? saved.data().tutorEmailDelivery || {} : {};
    if (delivery.status === 'sent') return 'sent';
    if (delivery.status === 'sending' && now - delivery.startedAt < 90000) throw fail('This letter is already being sent. Please retry shortly.', 409);
    const current = limit.exists ? limit.data() : {};
    const count = current.day === day ? current.count || 0 : 0;
    if (count >= 20) throw fail('Daily tutor email limit reached. Your letter remains saved.', 429);
    tx.set(limitRef, { day, count: count + 1 });
    tx.set(ref, { ...(saved.exists ? {} : { ...record, createdAt: new Date(now) }),
      tutorEmailDelivery: { status: 'sending', startedAt: now, recipient: RECIPIENT } }, { merge: true });
    return 'claimed';
  });
  if (claimed === 'sent') return { ok: true, saved: true, emailed: true, id: record.id, duplicate: true };
  try {
    const row = emailRow(record);
    const response = await fetchImpl(config.url, { method: 'POST', headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(30000), body: JSON.stringify({ token: config.token, event_id: row.event_id, rows: [row] }) });
    const result = await response.json().catch(() => null);
    if (!response.ok || result?.ok !== true || result.count === 0 || result.sent === 0) throw fail('Email delivery was not acknowledged. Your letter is saved; please retry Send to tutor.', 502);
    await ref.set({ tutorEmailDelivery: { status: 'sent', sentAt: new Date(now), recipient: RECIPIENT } }, { merge: true });
    return { ok: true, saved: true, emailed: true, id: record.id };
  } catch (error) {
    await ref.set({ tutorEmailDelivery: { status: 'failed', failedAt: new Date(now), recipient: RECIPIENT } }, { merge: true });
    throw fail('Could not confirm the tutor email. Your letter is saved; please retry Send to tutor.', 502);
  }
}
function registerExamWritingTutorEmail({ app, db, verifyToken, runtimeConfig = {} }) {
  app.post('/exam-writing/send-tutor', async (req, res) => {
    let user;
    try {
      const token = String(req.headers.authorization || '').match(/^Bearer (.+)$/)?.[1];
      if (!token) return res.status(401).json({ error: 'Sign in first.' });
      user = await verifyToken(token);
    } catch { return res.status(401).json({ error: 'Sign in again before sending your writing.' }); }
    try {
      return res.json(await sendWritingToTutor({ db, user, body: req.body,
        config: resolveLifecycleWebhookConfig(runtimeConfig) }));
    } catch (error) { return res.status(error.status || 503).json({ error: error.status ? error.message : 'Tutor email is temporarily unavailable. Your draft remains saved.' }); }
  });
}
module.exports = { RECIPIENT, prepareSubmission, emailRow, sendWritingToTutor, registerExamWritingTutorEmail };
