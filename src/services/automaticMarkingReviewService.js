import { collection, doc, getDoc, getDocs, limit, orderBy, query, runTransaction, startAfter, where } from 'firebase/firestore';
import { auth, db } from '../firebase.js';
import { buildManualScoreCorrection } from '../utils/manualScoreCorrection.js';
import { assignmentTitle } from '../utils/assignmentTitle.js';
import { isAutomaticResultPublished } from '../utils/automaticReviewStatus.js';

const PAGE_SIZE = 25;
export async function loadAutomaticMarkingPage(cursor = null) {
  // A single-field date index is available without a new composite deployment.
  // Filter the bounded page by source; advance by the raw page cursor even if it contains other sources.
  const snapshot = await getDocs(query(collection(db, 'markingResults'),
    orderBy('createdAt', 'desc'),
    ...(cursor ? [startAfter(cursor)] : []), limit(PAGE_SIZE)));
  const rows = await Promise.all(snapshot.docs.filter(entry => entry.data().source === 'automatic_course_marking').map(async entry => {
    const row = { ...entry.data(), id: entry.id };
    if (String(row.studentName || row.name || '').trim() && !/^student$/i.test(String(row.studentName || row.name).trim())) return row;
    try {
      const work = /^submissions\/[^/]+(?:\/[^/]+\/[^/]+)?$/.test(row.submissionPath || '')
        ? (await getDoc(doc(db, row.submissionPath))).data() || {} : {};
      const uid = row.studentId || work.studentId || work.uid || work.userId;
      const code = row.studentCode || work.studentCode || work.studentcode;
      let student = uid ? await getDoc(doc(db, 'students', uid)) : null;
      if (!student?.exists() && uid) student = (await getDocs(query(collection(db, 'students'), where('uid', '==', uid), limit(1)))).docs[0];
      if (!student?.exists() && code) student = (await getDocs(query(collection(db, 'students'), where('studentCode', '==', code), limit(1)))).docs[0];
      const profile = student?.exists() ? student.data() : {};
      const name = [profile.name, profile.fullName, profile.studentName, [profile.firstName, profile.lastName].filter(Boolean).join(' '), work.studentName, work.name, row.name]
        .find(value => String(value || '').trim() && !/^student$/i.test(String(value).trim()));
      return { ...row, studentName: name || '', studentCode: profile.studentCode || profile.studentcode || code || '', studentEmail: profile.email || profile.studentEmail || work.studentEmail || work.email || row.studentEmail || '' };
    } catch { return { ...row, identityUnavailable: true }; }
  }));
  return { rows, cursor: snapshot.docs.at(-1) || null, hasMore: snapshot.size === PAGE_SIZE };
}

export async function openAutomaticMarking(row) {
  if (!/^submissions\/[^/]+(?:\/[^/]+\/[^/]+)?$/.test(row.submissionPath || '')) throw new Error('Submission path unavailable.');
  const [submission, scores, audits, reviews, jobs] = await Promise.all([
    getDoc(doc(db, row.submissionPath)),
    getDocs(query(collection(db, 'scores'), where('submissionPath', '==', row.submissionPath), limit(2))),
    getDocs(query(collection(db, 'aiMarkingAudit'), where('submissionPath', '==', row.submissionPath), limit(1))),
    getDocs(query(collection(db, 'markingResults', row.id, 'tutorReviews'), orderBy('createdAt', 'desc'), limit(20))),
    getDocs(query(collection(db, 'markingJobs'), where('submissionPath', '==', row.submissionPath), limit(1))),
  ]);
  const score = scores.size === 1 ? scores.docs[0] : null;
  const work = submission.data() || row;
  const uid = row.studentId || work.studentId || work.uid || work.userId;
  let student = uid ? await getDoc(doc(db, 'students', uid)) : null;
  if (!student?.exists() && uid) student = (await getDocs(query(collection(db, 'students'), where('uid', '==', uid), limit(1)))).docs[0];
  if (!student?.exists() && row.studentCode) student = (await getDocs(query(collection(db, 'students'), where('studentCode', '==', row.studentCode), limit(1)))).docs[0];
  return { row, submission: submission.data() || row,
    score: score ? { ...score.data(), id: score.id } : null,
    studentPath: student?.exists() ? student.ref.path : null,
    job: jobs.docs[0]?.data() || null,
    audit: audits.docs[0]?.data() || null, reviews: reviews.docs.map(entry => ({ ...entry.data(), id: entry.id })) };
}

export async function saveAutomaticMarkingReview(detail, { score, feedback, reason, approve = false }) {
  if (!auth.currentUser || !detail.studentPath) throw new Error('A registered student and signed-in tutor are required.');
  if (!approve && (score === '' || !Number.isFinite(Number(score)) || Number(score) < 0 || Number(score) > 100)) throw new Error('Enter a score from 0 to 100.');
  if (!approve && (!feedback.trim() || !reason.trim())) throw new Error('Enter feedback and a reason for the correction.');
  const timestamp = new Date().toISOString();
  const markingRef = doc(db, 'markingResults', detail.row.id);
  const studentRef = doc(db, detail.studentPath);
  const profile = await getDoc(studentRef);
  const studentCode = profile.data()?.studentCode || profile.data()?.studentcode;
  const assignmentId = detail.row.assignmentId || detail.row.result?.assignmentKey;
  if (!studentCode || !/^(A1|A2|B1)-[0-9]+(?:[._][0-9]+)*$/.test(assignmentId || '')) throw new Error('Registered student code or assignment identity is missing.');
  const scoreRef = doc(db, 'scores', detail.score?.id || `${studentCode}__${assignmentId}`.replace(/[/#?[\]]+/g, '_'));
  const submissionRef = doc(db, detail.row.submissionPath);
  const reviewRef = doc(collection(markingRef, 'tutorReviews'));
  const syncRef = doc(collection(db, 'automaticScoreSync'));
  await runTransaction(db, async tx => {
    const [saved, marking, submission, registered] = await Promise.all([tx.get(scoreRef), tx.get(markingRef), tx.get(submissionRef), tx.get(studentRef)]);
    if (!marking.exists() || !submission.exists() || !registered.exists()) throw new Error('This result is no longer available.');
    if ((registered.data().studentCode || registered.data().studentcode) !== studentCode) throw new Error('Student identity changed. Reopen the result.');
    const current = saved.data() || {};
    if (marking.data().updatedAt !== detail.row.updatedAt || (detail.score
      ? !saved.exists() || current.submissionPath !== detail.row.submissionPath || current.updatedAt !== detail.score.updatedAt
      : saved.exists())) throw new Error('This score changed or another score already exists. Reopen the result before editing.');
    const ai = marking.data().result || {};
    if (approve) { score = ai.finalScore ?? ai.score; feedback = ai.feedback; reason = 'Tutor verified AI assessment'; }
    if (score === null || score === undefined || score === '' || !Number.isFinite(Number(score)) || Number(score) < 0 || Number(score) > 100 || !String(feedback || '').trim()) throw new Error('A valid AI score and feedback are required to publish.');
    const correction = buildManualScoreCorrection(score, timestamp);
    if (approve && (typeof ai.passed === 'boolean' || ai.writingMinimumMet === false)) {
      const passed = typeof ai.passed === 'boolean' ? ai.passed : false;
      Object.assign(correction, { passed, failed: !passed, status: passed ? 'passed' : 'failed', result: passed ? 'passed' : 'failed' });
    }
    const student = registered.data();
    const evidence = Object.fromEntries([
      'objectiveScore', 'objectiveCorrect', 'objectiveTotal', 'objectiveDetails', 'wrongAnswers',
      'writingScore', 'writingScorePercent', 'maxWritingScore', 'writingMinimumMet',
      'markingRubricVersion', 'scoreBreakdown', 'taskPointEvidence', 'writingDimensions',
      'taskCompletion', 'missingTaskPoints', 'improvementSummary', 'confidence',
    ].filter(key => ai[key] !== undefined).map(key => [key, ai[key]]));
    Object.assign(evidence, {
      corrections: JSON.stringify(ai.corrections || []),
      objective_score: ai.objectiveScore ?? '', objective_correct: ai.objectiveCorrect ?? '',
      objective_total: ai.objectiveTotal ?? '', writing_score: ai.writingScorePercent ?? ai.writingScore ?? '',
    });
    const updated = { ...evidence, ...current, ...correction, passStatus: correction.passed ? 'passed' : 'failed', comments: feedback.trim(), feedback: feedback.trim(),
      studentCode, studentcode: studentCode, studentId: student.uid || detail.row.studentId,
      studentEmail: student.email || '', name: student.name || student.fullName || detail.row.studentName || '',
      assignmentId, assignment_id: assignmentId, level: detail.row.level || assignmentId.split('-')[0],
      submissionId: detail.row.submissionId || detail.row.id, submissionPath: detail.row.submissionPath,
      source: 'automatic_course_marking', date: current.date || timestamp, createdAt: current.createdAt || timestamp,
      assignment: assignmentTitle(current.assignment, current.assignmentId, current.assignment_id),
      reviewedByTutor: true, reviewedBy: auth.currentUser.uid, sheetSaved: false };
    updated.assignment = assignmentTitle(current.assignment, detail.row.assignmentTitle, assignmentId);
    if (!updated.studentId) throw new Error('Registered student UID is missing.');
    const review = { score: correction.score, feedback: feedback.trim(), reason: reason.trim(),
      action: approve ? 'approve' : 'edit', tutorUid: auth.currentUser.uid, createdAt: timestamp };
    tx.set(reviewRef, { ...review, previousScore: current.score ?? null, previousFeedback: current.comments || current.feedback || '' });
    tx.set(scoreRef, updated);
    // Keep the original AI result and its evidence intact; tutor changes have a separate history.
    tx.set(markingRef, { finalScore: correction.score, feedback: feedback.trim(), tutorReview: review,
      status: 'marked', sentToStudent: true, publicationStatus: 'published',
      reviewClosedAt: timestamp, reviewClosedBy: auth.currentUser.uid, updatedAt: timestamp }, { merge: true });
    tx.set(submissionRef, { finalScore: correction.score, aiFeedback: feedback.trim(), markingStatus: 'marked',
      feedbackSentToStudent: true, resultUrl: 'https://www.falowen.app/campus/results',
      markingUpdatedAt: timestamp, tutorReviewed: true }, { merge: true });
    const notification = { type: 'Scores', category: 'feedback', title: 'Your assignment has been marked',
      body: `Score: ${correction.score}/100. Open Results to read your feedback.`, score: correction.score,
      status: updated.passStatus,
      assignmentId, studentCode: studentCode.toLowerCase(), studentCodeOriginal: studentCode,
      route: '/campus/results', timestamp: Date.now(), createdAt: timestamp,
      data: { type: 'marked_assignment', route: '/campus/results', assignmentId } };
    tx.set(doc(db, 'studentNotifications', reviewRef.id || reviewRef.path.split('/').at(-1)), notification);
    tx.set(doc(db, `${detail.studentPath}/notifications/${reviewRef.id || reviewRef.path.split('/').at(-1)}`), notification);
    tx.set(syncRef, { scorePath: scoreRef.path, row: updated, status: 'pending', attempts: 0, createdAt: timestamp });
  });
}

export async function closeAutomaticMarkingReview(detail) {
  if (!auth.currentUser) throw new Error('Sign in before closing a review.');
  const ref = doc(db, 'markingResults', detail.row.id);
  await runTransaction(db, async tx => {
    const saved = await tx.get(ref);
    if (!saved.exists()) throw new Error('This result is no longer available.');
    if (!isAutomaticResultPublished(saved.data())) throw new Error('Approve or edit and publish this result before marking it reviewed.');
    // Closing acknowledges the review; it never changes the student's mark or AI evidence.
    tx.set(ref, { reviewClosedAt: new Date().toISOString(), reviewClosedBy: auth.currentUser.uid }, { merge: true });
  });
}


// Explicit owner action only: bounded Firestore job/sync samples from the server.
export async function loadMarkingHealth() {
  const user = auth.currentUser;
  if (!user) throw new Error('Sign in before checking marking health.');
  const response = await fetch('/api/admin/marking-health', {
    cache: 'no-store',
    headers: { Authorization: 'Bearer ' + await user.getIdToken() },
  });
  const body = await response.json().catch(() => null);
  if (!response.ok || body?.ok !== true)
    throw new Error(body?.error || 'Could not check marking health.');
  return body;
}


// Explicit, bounded historical lookup. Unlike the 25-row inbox, these
// queries can find older published results without paging through all students.
// No polling, AI call or new index is required.
export async function searchAutomaticMarkingResults(input) {
  const term = String(input || '').trim();
  if (term.length < 2) throw new Error('Enter at least two characters to search.');
  const candidate = term[0].toUpperCase() + term.slice(1);
  const searches = [
    ['studentCode', term], ['studentCode', term.toLowerCase()],
    ['studentEmail', term], ['studentEmail', term.toLowerCase()],
    ['assignmentId', term.toUpperCase()], ['studentName', term],
    ['studentName', candidate]
  ];
  const unique = [...new Map(searches.map(([field, value]) => [field + ':' + value, [field, value]])).values()];
  const settled = await Promise.allSettled(unique.map(([field, value]) =>
    getDocs(field === 'studentName'
      ? query(collection(db, 'markingResults'), where(field, '>=', value),
        where(field, '<=', value + '\uf8ff'), limit(PAGE_SIZE))
      : query(collection(db, 'markingResults'), where(field, '==', value), limit(PAGE_SIZE)))));
  if (!settled.some(item => item.status === 'fulfilled')) {
    throw new Error('Historical lookup is unavailable. Try the recent results list.');
  }
  const rows = new Map();
  for (const result of settled) {
    if (result.status !== 'fulfilled') continue;
    for (const entry of result.value.docs) {
      if (entry.data().source !== 'automatic_course_marking') continue;
      rows.set(entry.id, { ...entry.data(), id: entry.id });
    }
  }
  return [...rows.values()].sort((a, b) =>
    String(b.createdAt || '').localeCompare(String(a.createdAt || '')));
}
