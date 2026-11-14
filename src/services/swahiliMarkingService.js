import { collection, collectionGroup, doc, getDoc, getDocs, limit, orderBy, query, runTransaction, serverTimestamp, startAfter, where } from "firebase/firestore";
import { db } from "../firebase.js";
import { canonicalSwahiliSubmission, swahiliReviewDocId } from "../utils/swahiliReviewQueue.js";

const PAGE_SIZE = 25;
const reviewRef = (studentId, day) => doc(db, "swahiliTeacherReviews", swahiliReviewDocId(studentId, day));

export async function loadSwahiliRoster(cursor) {
  const constraints = [where("program", "==", "swahili")];
  if (cursor) constraints.push(startAfter(cursor));
  const snapshot = await getDocs(query(collection(db, "students"), ...constraints, limit(PAGE_SIZE)));
  return {
    students: Array.from(new Map(snapshot.docs.map(entry => entry.data())
      .filter(student => typeof student.uid === "string" && student.uid && !student.uid.includes("/"))
      .map(student => [student.uid, student])).values()),
    nextCursor: snapshot.size === PAGE_SIZE ? snapshot.docs.at(-1) : null,
  };
}

export async function loadSwahiliStudentSubmission(uid, day) {
  return canonicalSwahiliSubmission(await getDoc(doc(db, "users", uid, "swahiliLessons", `day-${day}`)), day);
}

async function loadRosterSubmissions(day, cursor) {
  const roster = await loadSwahiliRoster(cursor);
  const documents = await Promise.all(roster.students.map(student => loadSwahiliStudentSubmission(student.uid, day)));
  return {
    rows: documents.filter(Boolean).sort((a, b) => (b.submittedAt?.toMillis?.() || 0) - (a.submittedAt?.toMillis?.() || 0)),
    nextCursor: roster.nextCursor ? { rosterCursor: roster.nextCursor } : null,
  };
}

export async function loadAllSwahiliMarkingPage(cursors = { 1: null, 6: null }) {
  const pages = await Promise.all(Object.entries(cursors).map(async ([day, cursor]) => ({
    day,
    ...await loadSwahiliMarkingPage(Number(day), cursor),
  })));
  const rows = pages.flatMap(page => page.rows)
    .sort((a, b) => (b.submittedAt?.toMillis?.() || 0) - (a.submittedAt?.toMillis?.() || 0));
  const next = Object.fromEntries(pages.filter(page => page.nextCursor).map(page => [page.day, page.nextCursor]));
  return { rows, nextCursor: Object.keys(next).length ? next : null };
}

export async function loadSwahiliMarkingPage(day, cursor) {
  if (cursor?.rosterCursor) return loadRosterSubmissions(day, cursor.rosterCursor);
  const constraints = [
    where("program", "==", "swahili"),
    where("lessonId", "==", `swahili-day-${day}`),
    where("status", "==", "submitted"),
    orderBy("submittedAt", "desc"),
  ];
  if (cursor) constraints.push(startAfter(cursor));
  let snapshot;
  try {
    snapshot = await getDocs(query(collectionGroup(db, "swahiliLessons"), ...constraints, limit(PAGE_SIZE)));
  } catch (error) {
    if (!cursor && error.code === "failed-precondition") return loadRosterSubmissions(day);
    throw error;
  }
  return {
    rows: snapshot.docs.map((entry) => canonicalSwahiliSubmission(entry, day)).filter(Boolean),
    nextCursor: snapshot.size === PAGE_SIZE ? snapshot.docs.at(-1) : null,
  };
}

export async function loadSwahiliReview(submission, day) {
  const snapshot = await getDoc(reviewRef(submission.studentId, day));
  return snapshot.exists() ? snapshot.data() : null;
}

export async function saveSwahiliReview({ submission, day, status, feedback, score }) {
  if (!["reviewed", "needs_revision"].includes(status)) throw new Error("Choose a valid review decision.");
  if (!Number.isInteger(score) || score < 0 || score > 100) throw new Error("Enter a whole-number score from 0 to 100.");
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
      score,
      submissionVersion: `${latest.submittedAt.seconds}:${latest.submittedAt.nanoseconds}`,
      feedback: feedback.trim().slice(0, 3000),
      reviewedAt: serverTimestamp(),
    }, { merge: true });
  });
}
