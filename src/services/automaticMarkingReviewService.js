import { collection, doc, getDoc, getDocs, limit, orderBy, query, runTransaction, startAfter, where } from 'firebase/firestore';
import { auth, db } from '../firebase.js';
import { buildManualScoreCorrection } from '../utils/manualScoreCorrection.js';
import { assignmentTitle } from '../utils/assignmentTitle.js';

const PAGE_SIZE = 25;
export async function loadAutomaticMarkingPage(cursor = null) {
  // One indexed field avoids a deployment-dependent composite index. Cursor order is stable.
  const snapshot = await getDocs(query(collection(db, 'markingResults'),
    where('source', '==', 'automatic_course_marking'),
    ...(cursor ? [startAfter(cursor)] : []), limit(PAGE_SIZE)));
  return { rows: snapshot.docs.map(entry => ({ ...entry.data(), id: entry.id })),
    cursor: snapshot.docs.at(-1) || null, hasMore: snapshot.size === PAGE_SIZE };
}

export async function openAutomaticMarking(row) {
  if (!/^submissions\/[^/]+(?:\/[^/]+\/[^/]+)?$/.test(row.submissionPath || '')) throw new Error('Submission path unavailable.');
  const [submission, scores, audits, reviews] = await Promise.all([
    getDoc(doc(db, row.submissionPath)),
    getDocs(query(collection(db, 'scores'), where('submissionPath', '==', row.submissionPath), limit(2))),
    getDocs(query(collection(db, 'aiMarkingAudit'), where('submissionPath', '==', row.submissionPath), limit(1))),
    getDocs(query(collection(db, 'markingResults', row.id, 'tutorReviews'), orderBy('createdAt', 'desc'), limit(20))),
  ]);
  const score = scores.size === 1 ? scores.docs[0] : null;
  return { row, submission: submission.data() || row,
    score: score ? { ...score.data(), id: score.id } : null,
    audit: audits.docs[0]?.data() || null, reviews: reviews.docs.map(entry => ({ ...entry.data(), id: entry.id })) };
}

export async function saveAutomaticMarkingReview(detail, { score, feedback, reason }) {
  if (!auth.currentUser || !detail.score) throw new Error('A saved score and signed-in tutor are required.');
  if (score === '' || !Number.isFinite(Number(score)) || Number(score) < 0 || Number(score) > 100) throw new Error('Enter a score from 0 to 100.');
  if (!feedback.trim() || !reason.trim()) throw new Error('Enter feedback and a reason for the correction.');
  const timestamp = new Date().toISOString();
  const markingRef = doc(db, 'markingResults', detail.row.id);
  const scoreRef = doc(db, 'scores', detail.score.id);
  const submissionRef = doc(db, detail.row.submissionPath);
  const reviewRef = doc(collection(markingRef, 'tutorReviews'));
  const syncRef = doc(collection(db, 'automaticScoreSync'));
  const correction = buildManualScoreCorrection(score, timestamp);
  await runTransaction(db, async tx => {
    const [saved, marking, submission] = await Promise.all([tx.get(scoreRef), tx.get(markingRef), tx.get(submissionRef)]);
    if (!saved.exists() || !marking.exists() || !submission.exists()) throw new Error('This result is no longer available.');
    const current = saved.data();
    if (current.submissionPath !== detail.row.submissionPath || current.updatedAt !== detail.score.updatedAt) throw new Error('This score changed. Reopen the result before editing.');
    const updated = { ...current, ...correction, passStatus: correction.passed ? 'passed' : 'failed', comments: feedback.trim(), feedback: feedback.trim(),
      assignment: assignmentTitle(current.assignment, current.assignmentId, current.assignment_id),
      reviewedByTutor: true, reviewedBy: auth.currentUser.uid, sheetSaved: false };
    const review = { score: correction.score, feedback: feedback.trim(), reason: reason.trim(),
      tutorUid: auth.currentUser.uid, createdAt: timestamp };
    tx.set(reviewRef, { ...review, previousScore: current.score, previousFeedback: current.comments || current.feedback || '' });
    tx.set(scoreRef, updated);
    // Keep the original AI result and its evidence intact; tutor changes have a separate history.
    tx.set(markingRef, { finalScore: correction.score, feedback: feedback.trim(), tutorReview: review, updatedAt: timestamp }, { merge: true });
    tx.set(submissionRef, { finalScore: correction.score, aiFeedback: feedback.trim(), markingStatus: 'marked',
      markingUpdatedAt: timestamp, tutorReviewed: true }, { merge: true });
    tx.set(syncRef, { scorePath: scoreRef.path, row: updated, status: 'pending', attempts: 0, createdAt: timestamp });
  });
}
