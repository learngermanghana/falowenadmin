import { collectionGroup, doc, getDoc, getDocs, limit, orderBy, query, runTransaction, serverTimestamp, startAfter, where } from "firebase/firestore";
import { db } from "../firebase.js";
import { canonicalSwahiliSubmission, swahiliReviewDocId } from "../utils/swahiliReviewQueue.js";

const PAGE_SIZE = 25;
const reviewRef = (studentId, day) => doc(db, "swahiliTeacherReviews", swahiliReviewDocId(studentId, day));

export async function loadSwahiliMarkingPage(day, cursor) {
  const constraints = [
    where("program", "==", "swahili"),
    where("lessonId", "==", `swahili-day-${day}`),
    where("status", "==", "submitted"),
    orderBy("submittedAt", "desc"),
  ];
  if (cursor) constraints.push(startAfter(cursor));
  const snapshot = await getDocs(query(collectionGroup(db, "swahiliLessons"), ...constraints, limit(PAGE_SIZE)));
  return {
    rows: snapshot.docs.map((entry) => canonicalSwahiliSubmission(entry, day)).filter(Boolean),
    nextCursor: snapshot.size === PAGE_SIZE ? snapshot.docs.at(-1) : null,
  };
}

export async function loadSwahiliReview(submission, day) {
  const snapshot = await getDoc(reviewRef(submission.studentId, day));
  return snapshot.exists() ? snapshot.data() : null;
}

export async function saveSwahiliReview({ submission, day, status, feedback }) {
  if (!["reviewed", "needs_revision"].includes(status)) throw new Error("Choose a valid review decision.");
  await runTransaction(db, async (transaction) => {
    const latest = canonicalSwahiliSubmission(await transaction.get(doc(db, submission.path)), day);
    if (!latest || !latest.submittedAt?.isEqual?.(submission.submittedAt)) {
      throw new Error("The learner updated this workbook. Refresh the queue and review the latest submission.");
    }
    transaction.set(reviewRef(latest.studentId, day), {
      studentId: latest.studentId,
      lessonId: latest.lessonId,
      program: "swahili",
      status,
      feedback: feedback.trim().slice(0, 3000),
      reviewedAt: serverTimestamp(),
    }, { merge: true });
  });
}
