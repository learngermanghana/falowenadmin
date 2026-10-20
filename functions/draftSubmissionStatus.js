"use strict";
const { eligible, idForPath } = require("./automaticCourseMarking.js");

// This is called only when an owner opens ONE draft. The history list has no joins.
const tidy = x => String(x ?? "").trim();
const lower = x => tidy(x).toLowerCase();
const keyOf = row => tidy(row.canonicalAssignmentKey || row.assignmentKey || row.assignmentId || row.assignment_id).toUpperCase();
const uidOf = row => tidy(row.studentId || row.uid || row.userId || row.ownerUid);
const statusOf = row => lower(row.status || row.submissionStatus);
const scoreId = (code, key) => (code + "__" + key).replace(/[/#?[\]]+/g, "_");
const cap = 50;
const belongs = (row, draft, key) => {
  if (keyOf(row) !== key) return false;
  const expectedUid = uidOf(draft);
  const actualUid = uidOf(row);
  if (actualUid && expectedUid) return actualUid === expectedUid;
  return Boolean(lower(row.studentEmail || row.email) && lower(row.studentEmail || row.email) === lower(draft.studentEmail));
};
async function queryBy(db, name, field, value) {
  if (!tidy(value)) return { docs: [], capped: false };
  const snapshot = await db.collection(name).where(field, "==", value).limit(cap).get();
  return { docs: snapshot.docs, capped: snapshot.size >= cap };
}
async function findSubmission(db, draft, key) {
  const uid = uidOf(draft), email = lower(draft.studentEmail), code = tidy(draft.studentCode);
  const found = new Map();
  let capped = false;
  const add = list => list.filter(d => statusOf(d.data() || {}) !== "draft" &&
    belongs(d.data() || {}, draft, key)).forEach(d => found.set(d.ref.path, d));

  let response = await queryBy(db, "submissions", "studentId", uid);
  capped ||= response.capped; add(response.docs);
  if (!found.size && email) {
    response = await queryBy(db, "submissions", "studentEmail", email);
    capped ||= response.capped; add(response.docs);
  }

  // Historical submissions may be nested rather than flat. Consult these
  // only if the primary lookup finds no final receipt.
  if (!found.size && code) {
    const level = key.split("-")[0];
    for (const collection of [
      db.collection("submissions").doc(level).collection(code),
      db.collection("submissions").doc(level).collection("posts"),
    ]) {
      const q = collection.where("studentId", "==", uid).limit(cap);
      const result = await q.get();
      capped ||= result.size >= cap;
      add(result.docs);
    }
  }
  return { docs: [...found.values()], capped };
}
async function findScore(db, draft, key) {
  const code = tidy(draft.studentCode), uid = uidOf(draft);
  if (code) {
    const direct = await db.collection("scores").doc(scoreId(code, key)).get();
    if (direct.exists) return { record: direct.data() || {}, capped: false };
  }
  const q = await queryBy(db, "scores", "studentId", uid);
  const matched = q.docs.find(d => belongs(d.data() || {}, draft, key));
  return { record: matched?.data() || null, capped: q.capped };
}
const state = (status, reason, extra = {}) => ({ status, reason, canQueue: false,
  submissionPath: "", submissionPaths: [], score: null, ...extra });
async function getDraftSubmissionState({ db, draft }) {
  const uid = uidOf(draft), key = keyOf(draft);
  if (!uid || !/^(A1|A2|B1)-\d+(?:[._]\d+)*$/.test(key)) {
    return state("needs-review", "Student identity or assignment code is missing. No marking action is allowed.");
  }
  const receipts = await findSubmission(db, draft, key);
  const score = await findScore(db, draft, key);
  if (receipts.capped || score.capped) return state("needs-review", "Submission lookup hit a safety limit. Check Marking Hub before taking action.");
  if (score.record) return state("marked", "A saved result already exists. Do not mark this assignment twice.",
    { score: score.record.score ?? score.record.finalScore ?? null, submissionPaths: receipts.docs.map(d => d.ref.path) });
  if (!receipts.docs.length) return state("not-submitted", "No verified final submission or score was found in the checked records.");
  if (receipts.docs.length > 1) return state("needs-review", "Multiple final submissions were found. Review them in Marking Hub.", {
    submissionPaths: receipts.docs.map(d => d.ref.path),
  });
  const receipt = receipts.docs[0], submission = receipt.data() || {};
  const path = receipt.ref.path, marking = lower(submission.markingStatus);
  if (marking === "marked") return state("needs-review", "The submission reports marked, but the score was not found. Check Marking Hub.", { submissionPath: path, submissionPaths: [path] });
  const jobRef = db.collection("markingJobs").doc(idForPath(path));
  const job = await jobRef.get();
  const currentJob = job.exists ? lower(job.data()?.status) : "";
  if (currentJob === "marked") return state("needs-review", "Marking job finished but no score was found. Review in Marking Hub.", { submissionPath: path, submissionPaths: [path] });
  if (currentJob === "needs_review" || marking === "needs_review") return state("needs-review", "Marking needs tutor review. Open Marking Hub instead of creating another job.", { submissionPath: path, submissionPaths: [path] });
  if (job.exists) return state("marking", "Final submission verified. A marking job already exists (" + (currentJob || "pending") + ").", {
    submissionPath: path, submissionPaths: [path], markingStatus: currentJob || marking || "pending",
  });
  if (!eligible(submission, key.split("-")[0], key) || path.split("/").length !== 2) {
    return state("needs-review", "Submission exists but cannot be safely queued automatically. Review in Marking Hub.", { submissionPath: path, submissionPaths: [path] });
  }
  if (!tidy(draft.studentCode || submission.studentCode)) return state("needs-review", "Student code is missing; verify identity before auto marking.", { submissionPath: path, submissionPaths: [path] });
  return state("submitted-unmarked", "Final submission verified, but its automatic marking job is missing.", {
    canQueue: true, submissionPath: path, submissionPaths: [path],
  });
}
async function queueMissingDraftMarking({ db, admin, draftId, submissionPath, actor }) {
  const draft = await db.collection("submissionDrafts").doc(draftId).get();
  if (!draft.exists) throw new Error("Draft no longer exists.");
  const row = draft.data() || {}, expectedUid = uidOf(row), key = keyOf(row);
  const check = await getDraftSubmissionState({ db, draft: row });
  if (!check.canQueue || check.submissionPath !== submissionPath || !expectedUid)
    throw new Error("Marking blocked: " + check.reason);
  const submissionRef = db.doc(submissionPath);
  const jobRef = db.collection("markingJobs").doc(idForPath(submissionPath));
  const auditRef = db.collection("timedDraftRecoveryAudit").doc("mark_" + idForPath(submissionPath));
  const code = tidy(row.studentCode);
  const scoreRef = db.collection("scores").doc(scoreId(code, key));
  const now = admin.firestore.FieldValue.serverTimestamp();
  await db.runTransaction(async tx => {
    const [submission, job, score, audit] = await Promise.all([
      tx.get(submissionRef), tx.get(jobRef), tx.get(scoreRef), tx.get(auditRef),
    ]);
    if (!submission.exists || job.exists || score.exists || audit.exists)
      throw new Error("Submission, marking job or score changed; no duplicate job created.");
    const data = submission.data() || {};
    if (!belongs(data, row, key) || uidOf(data) !== expectedUid ||
        statusOf(data) === "draft" || lower(data.markingStatus) === "marked" ||
        !eligible(data, key.split("-")[0], key))
      throw new Error("Submission no longer meets verified marking requirements.");
    tx.create(jobRef, {
      submissionId: submission.id, submissionPath, collectionShape: "flat",
      assignmentKey: key, level: key.split("-")[0], studentCode: code,
      automatic: true, status: "pending", createdAt: now, updatedAt: now,
      queuedByAdmin: true, queueReason: "missing_automatic_marking_job",
    });
    tx.set(submissionRef, { markingStatus: "pending", markingJobCreatedAt: now }, { merge: true });
    tx.create(auditRef, { action: "queue_missing_marking_job", submissionPath,
      draftId, studentId: expectedUid, assignmentKey: key,
      actorUid: actor.uid, actorEmail: lower(actor.email), createdAt: now });
  });
  return { submissionPath, status: "marking", message: "Existing submission queued once for automatic marking. Original work and scores were not overwritten." };
}
module.exports = { getDraftSubmissionState, queueMissingDraftMarking, belongs, keyOf };
