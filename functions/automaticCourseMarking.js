const crypto = require('node:crypto');
const { familyRecordingReference } = require('./a1FamilyRecordingReference');
const { withMarkingTransport } = require('./automaticMarkingContext');
const RESULTS_URL = 'https://www.falowen.app/campus/results';
const idForPath = path => `auto_${crypto.createHash('sha256').update(path).digest('hex')}`;
const clean = value => JSON.parse(JSON.stringify(value));
const assignmentTitle = (...values) => values.find(value => typeof value === 'string'
  && value.trim() && !/^(true|false)$/i.test(value.trim()))?.trim() || '';

function eligible(submission, level, assignmentKey) {
  return ['A1', 'A2', 'B1'].includes(level)
    && new RegExp(`^${level}-[0-9]+(?:[._][0-9]+)*$`).test(assignmentKey)
    && !['draft', 'cancelled', 'deleted'].includes(String(submission.status || '').toLowerCase())
    && !submission.examTask && !submission.mockAttemptId && !submission.courseSpeakingAttemptId
    && !/mock|exam-speaking/i.test(String(submission.source || submission.type || ''));
}
function releasable(result = {}) {
  const score = result.finalScore ?? result.score;
  return result.status === 'marked' && score !== null && score !== ''
    && Number.isFinite(Number(score)) && Number(score) >= 0 && Number(score) <= 100
    && Number(result.confidence) >= 0.8
    && !(result.consistencyWarnings || []).length && !(result.reviewReasons || []).length
    && !result.secondExaminer?.requiresTutorReview;
}

function createCourseMarkingWorker({ admin, db, loadReference, callAi, mark, now = () => Date.now() }) {
  return async function processJob(event) {
    const jobRef = event.data.ref;
    const job = event.data.data();
    if (!job.automatic || !/^submissions\/[^/]+(?:\/[^/]+\/[^/]+)?$/.test(job.submissionPath || '')) return;
    const submissionRef = db.doc(job.submissionPath);
    const snap = await submissionRef.get();
    if (!snap.exists) return;
    const submission = snap.data();
    if (!eligible(submission, job.level, job.assignmentKey)) return;
    const token = crypto.randomUUID();
    const claimed = await db.runTransaction(async tx => {
      const fresh = (await tx.get(jobRef)).data();
      if (['marked', 'needs_review'].includes(fresh.status)) return false;
      if (fresh.status === 'marking' && fresh.leaseUntil > now()) throw new Error('Marking lease is still active');
      if ((fresh.attempts || 0) >= 2) {
        tx.set(jobRef, { status: 'needs_review', error: 'Automatic marking retry limit reached' }, { merge: true });
        tx.set(submissionRef, { markingStatus: 'needs_review' }, { merge: true });
        return false;
      }
      tx.set(jobRef, { status: 'marking', leaseUntil: now() + 540000, token, attempts: (fresh.attempts || 0) + 1 }, { merge: true });
      tx.set(submissionRef, { markingStatus: 'marking' }, { merge: true });
      return true;
    });
    if (!claimed) return;
    try {
      // Resolve identity from the server-owned student record, never from form fields.
      const requestedUid = String(submission.studentId || submission.uid || submission.userId || '').trim();
      const pathSegments = snap.ref.path.split('/');
      const pathCode = pathSegments.length === 4 && pathSegments[2] !== 'posts' ? pathSegments[2] : '';
      const serverCode = String(job.studentCode || pathCode || '').trim();
      let studentSnap = requestedUid ? await db.collection('students').doc(requestedUid).get() : null;
      if (requestedUid && !studentSnap?.exists) {
        const matches = await db.collection('students').where('uid', '==', requestedUid).limit(1).get();
        studentSnap = matches.docs[0] || null;
      }
      if (!studentSnap?.exists && serverCode) {
        studentSnap = await db.collection('students').doc(serverCode).get();
        for (const field of ['studentCode', 'studentcode']) {
          if (studentSnap?.exists) break;
          const matches = await db.collection('students').where(field, '==', serverCode).limit(1).get();
          studentSnap = matches.docs[0] || null;
        }
      }
      const student = studentSnap?.exists ? studentSnap.data() : null;
      const registeredCode = String(student?.studentCode || student?.studentcode || '').trim();
      const studentId = String(student?.uid || requestedUid || student?.userId || student?.studentId || studentSnap?.id || '').trim();
      if (!registeredCode || !studentId || (requestedUid && studentId !== requestedUid)) {
        throw new Error('Registered student identity unavailable; tutor review required');
      }
      let referenceEntry = await loadReference(job.assignmentKey);
      if (!referenceEntry?.parts) throw new Error('No registered answer key; tutor review required');
      referenceEntry = familyRecordingReference(referenceEntry, submission, job.assignmentKey);
      const text = String(submission.submissionText || submission.text || submission.answer || submission.workContent || '').trim();
      if (!text) throw new Error('Submission text is missing; tutor review required');
      const result = await withMarkingTransport(callAi, () => mark({
        submission: { ...submission, id: snap.id, path: snap.ref.path, text },
        submissionText: text, referenceEntry,
      }));
      const release = releasable(result);
      const timestamp = new Date(now()).toISOString();
      const studentCode = registeredCode;
      if (!studentCode || !studentId) throw new Error('Student identity missing; tutor review required');
      const scoreId = `${studentCode}__${job.assignmentKey}`.replace(/[/#?[\]]+/g, '_');
      const scoreRef = db.collection('scores').doc(scoreId);
      await db.runTransaction(async tx => {
        const fresh = (await tx.get(jobRef)).data();
        const existingScore = await tx.get(scoreRef);
        const currentSubmission = (await tx.get(submissionRef)).data();
        if (fresh.token !== token || currentSubmission.markingStatus === 'marked') return;
        // Never overwrite a tutor's decision or a previous attempt automatically.
        const publish = release && !existingScore.exists;
        const status = publish ? 'marked' : 'needs_review';
        const publicationReviewReasons = publish ? [] : [
          ...(existingScore.exists ? ['An existing score is saved for this assignment; automatic marking cannot overwrite it.'] : []),
          ...(result.status !== 'marked' ? ['The marking pipeline requested tutor review.'] : []),
          ...(!Number.isFinite(Number(result.confidence)) || Number(result.confidence) < 0.8 ? ['AI confidence is below the automatic-release threshold.'] : []),
          ...(result.consistencyWarnings || []).map(value => typeof value === 'string' ? value : value.message || value.code || 'Marking consistency warning.'),
          ...(result.reviewReasons || []).map(value => typeof value === 'string' ? value : value.message || value.code || 'Marking validation requires review.'),
          ...(result.secondExaminer?.requiresTutorReview ? ['The second examiner requested tutor review.'] : []),
          ...((result.finalScore ?? result.score) == null || !Number.isFinite(Number(result.finalScore ?? result.score)) ? ['A valid final score is unavailable.'] : []),
        ];
        tx.set(db.collection('markingResults').doc(snap.id), clean({
          ...submission, submissionId: snap.id, submissionPath: snap.ref.path,
          studentId, studentCode, studentName: student.name || student.fullName || submission.studentName || '', assignmentId: job.assignmentKey,
          assignmentTitle: assignmentTitle(submission.assignmentTitle, submission.title, referenceEntry.title, job.assignmentKey),
          result, status, publicationReviewReasons, publicationStatus: publish ? 'published' : 'awaiting_approval', finalScore: result.finalScore ?? result.score, feedback: result.feedback,
          sentToStudent: publish, source: 'automatic_course_marking', createdAt: timestamp, updatedAt: timestamp,
        }));
        tx.set(db.collection('aiMarkingAudit').doc(idForPath(snap.ref.path)), clean({
          submissionId: snap.id, submissionPath: snap.ref.path, submission,
          referenceEntry, referenceVersion: referenceEntry.version || referenceEntry.updatedAt || '',
          result, status, publicationReviewReasons, automatic: true, createdAt: timestamp,
        }));
        tx.set(submissionRef, clean({
          markingStatus: status, markingUpdatedAt: timestamp,
          ...(publish ? { finalScore: result.finalScore ?? result.score, aiFeedback: result.feedback,
            feedbackSentToStudent: true, resultUrl: RESULTS_URL, automaticMarking: true } : {}),
        }), { merge: true });
        tx.set(jobRef, { status, publicationReviewReasons, completedAt: timestamp, leaseUntil: 0 }, { merge: true });
        if (!publish) return;
        const row = clean({
          studentcode: studentCode, studentCode, studentId,
          studentEmail: student.email || student.studentEmail || '',
          studentName: student.name || student.fullName || submission.studentName || '', name: student.name || student.fullName || submission.studentName || '',
          assignment: assignmentTitle(submission.assignmentTitle, submission.title, submission.assignment,
            referenceEntry.title, job.assignmentKey),
          assignment_id: job.assignmentKey, assignmentId: job.assignmentKey,
          score: result.finalScore ?? result.score, comments: result.feedback,
          passed: result.passed, passStatus: result.passStatus, writingMinimumMet: result.writingMinimumMet,
          markingRubricVersion: result.markingRubricVersion,
          objectiveScore: result.objectiveScore, objectiveCorrect: result.objectiveCorrect, objectiveTotal: result.objectiveTotal,
          writingScore: result.writingScore, writingScorePercent: result.writingScorePercent, maxWritingScore: result.maxWritingScore,
          date: timestamp, createdAt: timestamp, updatedAt: timestamp, level: job.level,
          link: RESULTS_URL, source: 'automatic_course_marking', dedupe_id: scoreId,
          objective_score: result.objectiveScore ?? '', objective_correct: result.objectiveCorrect ?? '',
          objective_total: result.objectiveTotal ?? '', writing_score: result.writingScorePercent ?? result.writingScore ?? '',
          corrections: JSON.stringify(result.corrections || []), sheetSaved: false,
          submissionId: snap.id, submissionPath: snap.ref.path,
        });
        tx.set(scoreRef, row);
        // Persist the same inbox event used by tutor marking, atomically with the score.
        // The existing notification consumer mirrors it and delivers device push.
        const notificationId = idForPath(snap.ref.path);
        const score = Number(row.score);
        const passed = typeof result.passed === 'boolean'
          ? result.passed : result.writingMinimumMet !== false && score >= 60;
        const body = `Score: ${score}/100 · ${passed ? 'Passed' : 'Needs improvement'}. Open Results to read your feedback and correction points.`;
        const notification = {
          type: 'Scores', category: 'feedback', title: 'Your assignment has been marked',
          body, message: body, timestamp: now(), createdAt: timestamp, sentAt: timestamp,
          route: '/campus/results', source: 'automatic_course_marking',
          studentCode: studentCode.toLowerCase(), studentCodeOriginal: studentCode,
          studentName: row.studentName, assignment: row.assignment, assignmentId: job.assignmentKey,
          level: job.level, score, status: passed ? 'passed' : 'needs_improvement', read: false,
          data: { type: 'marked_assignment', category: 'feedback', route: '/campus/results',
            assignmentId: job.assignmentKey, submissionId: snap.id, score: String(score),
            status: passed ? 'passed' : 'needs_improvement' },
        };
        tx.set(db.collection('studentNotifications').doc(notificationId), notification);
        tx.set(db.doc(`${studentSnap.ref.path}/notifications/${notificationId}`), notification);
        tx.create(db.collection('automaticScoreSync').doc(idForPath(snap.ref.path)), { row, scorePath: scoreRef.path, status: 'pending', attempts: 0 });
      });
    } catch (error) {
      // Keep the saved work in the tutor queue; never invent a mark on failure.
      await db.runTransaction(async tx => {
        const fresh = (await tx.get(jobRef)).data();
        if (fresh.token !== token) return;
        tx.set(jobRef, { status: 'needs_review', error: String(error.message).slice(0, 500), leaseUntil: 0 }, { merge: true });
        tx.set(submissionRef, { markingStatus: 'needs_review' }, { merge: true });
      });
    }
  };
}

function createScoreSyncWorker({ db, config, post = fetch }) {
  return async event => {
    const ref = event.data.ref;
    const job = (await ref.get()).data();
    if (!job || job.status === 'synced' || job.status === 'needs_review') return;
    const attempts = Number(job.attempts || 0) + 1;
    await ref.set({ attempts }, { merge: true });
    try {
      const settings = config();
      if (!settings.url || !settings.token) throw new Error('Score Sheet webhook is not configured');
      // Read the latest saved score so a later tutor correction wins over a retry.
      const score = await db.doc(job.scorePath).get();
      if (!score.exists) throw new Error('Saved score is missing');
      const response = await post(settings.url, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: AbortSignal.timeout(30000),
        body: JSON.stringify({ token: settings.token, action: 'upsertScoreRows', mode: 'upsert',
          event_id: ref.id, source: 'falowen-admin',
          ...(settings.sheetName ? { sheet_name: settings.sheetName } : {}),
          ...(settings.sheetGid ? { sheet_gid: settings.sheetGid } : {}),
          dedupe_columns: ['studentcode', 'assignment_id'], remove_duplicate_rows: true,
          create_missing_columns: true, rows: [score.data()] }),
      });
      const receipt = await response.json();
      if (!response.ok || receipt.ok !== true || !(receipt.action === 'upsertScoreRows' || receipt.mode === 'upsert' || receipt.upsert === true)) throw new Error('Score Sheet did not confirm an upsert');
      const batch = db.batch();
      batch.set(ref, { status: 'synced', receipt: clean(receipt) }, { merge: true });
      batch.set(db.doc(job.scorePath), { sheetSaved: true }, { merge: true });
      if (job.source === 'course_speaking_mock') {
        batch.set(db.doc(job.scorePath), { sheetSyncStatus: 'complete', sheetSyncError: '', sheetSyncLeaseUntil: 0 }, { merge: true });
      }
      await batch.commit();
    } catch (error) {
      await ref.set({ status: attempts >= 5 ? 'needs_review' : 'pending', error: String(error.message).slice(0, 500) }, { merge: true });
      if (attempts < 5) throw error;
    }
  };
}
module.exports = { idForPath, eligible, releasable, createCourseMarkingWorker, createScoreSyncWorker };
