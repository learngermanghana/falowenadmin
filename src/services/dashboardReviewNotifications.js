import { collection, getDocs, limit, orderBy, query, where } from 'firebase/firestore';
import { db } from '../firebase.js';
import { normalizeExamRoomPractices } from '../utils/examRoomPracticeMonitoring.js';
import { isAutomaticResultPublished } from '../utils/automaticReviewStatus.js';

export const DASHBOARD_REVIEW_LIMIT = 25;
export async function loadDashboardExamNotifications() {
  // Existing single-field source index; no roster joins, mocks, transcripts,
  // student profile hydration or history pagination on the homepage.
  const snapshot = await getDocs(query(collection(db, 'scores'), where('source', '==', 'exam_room_practice'), limit(DASHBOARD_REVIEW_LIMIT)));
  const rows = normalizeExamRoomPractices(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })));
  return { rows: rows.filter(row => row.percent < 60), sampled: snapshot.size, capped: snapshot.size === DASHBOARD_REVIEW_LIMIT };
}
export async function loadDashboardAiNotifications() {
  const snapshot = await getDocs(query(collection(db, 'markingResults'), orderBy('createdAt', 'desc'), limit(DASHBOARD_REVIEW_LIMIT)));
  // Same publication authority as the marking inbox. Never run the marker or
  // load submission/audit/student documents merely to display a notification.
  const rows = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })).filter(row =>
    row.source === 'automatic_course_marking' && !isAutomaticResultPublished(row) && !row.reviewClosedAt);
  return { rows, sampled: snapshot.size, capped: snapshot.size === DASHBOARD_REVIEW_LIMIT };
}
