"use strict";

// Read-only, on-demand historical view of cloud-saved assignments.
// One indexed date-range query per page; no polling, scans, or per-row joins.
const { inspectAttempt } = require("./timedDraftRecovery.js");
const { getDraftSubmissionState, queueMissingDraftMarking } = require("./draftSubmissionStatus.js");

const PAGE_LIMIT = 25;
const MAX_DATE_WINDOW_DAYS = 31;
const trimmed = value => String(value || "").trim();
const lower = value => trimmed(value).toLowerCase();
const validId = value => /^[A-Za-z0-9._-]{1,500}$/.test(value);
function dayUtc(value) {
  const text = trimmed(value);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) throw new Error("Select a date in YYYY-MM-DD format.");
  const date = Date.parse(text + "T00:00:00.000Z");
  if (!Number.isFinite(date) || new Date(date).toISOString().slice(0, 10) !== text)
    throw new Error("Invalid calendar date.");
  return date;
}
function filterDates({ from, to }) {
  const start = dayUtc(from);
  const end = dayUtc(to) + 86400000;
  if (end <= start || end - start > MAX_DATE_WINDOW_DAYS * 86400000)
    throw new Error("Choose a range of 1–31 days. Larger periods must be reviewed in smaller windows to control costs.");
  if (start > Date.now() + 86400000) throw new Error("Select a current or past date.");
  return { start, end };
}
const millis = value => value && typeof value.toMillis === "function" ? value.toMillis()
  : value && typeof value.seconds === "number" ? value.seconds * 1000
  : typeof value === "number" ? value : Date.parse(value || "") || 0;
const assignmentOf = row => trimmed(row.canonicalAssignmentKey || row.assignmentKey || row.assignmentId || row.assignment_id).toUpperCase();
const extractText = row => trimmed(row.submissionText || row.answer || row.workContent);
function safeSummary(snapshot) {
  const d = snapshot.data() || {};
  return {
    id: snapshot.id, studentEmail: trimmed(d.studentEmail), studentId: trimmed(d.studentId || d.uid || d.ownerUid),
    studentCode: trimmed(d.studentCode), studentName: trimmed(d.studentName),
    assignmentKey: assignmentOf(d), level: trimmed(d.level), day: d.day ?? null,
    title: trimmed(d.assignmentTitle || d.title),
    status: d.recoveredSubmissionPath ? "recovered" : trimmed(d.status || "draft"),
    updatedAt: millis(d.updatedAt), createdAt: millis(d.createdAt),
    answerLength: extractText(d).length, hasAnswer: Boolean(extractText(d)),
    recoveredSubmissionPath: trimmed(d.recoveredSubmissionPath),
    submissionHint: d.recoveredSubmissionPath ? "recovered" : "unverified",
  };
}
async function listDraftHistory({ db, admin, from, to, studentEmail = "", cursor = "" }) {
  const { start, end } = filterDates({ from, to });
  const email = lower(studentEmail);
  if (email && (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254))
    throw new Error("Enter a complete student email address.");
  if (cursor && !validId(cursor)) throw new Error("Invalid page cursor.");

  const source = db.collection("submissionDrafts");
  const limit = PAGE_LIMIT + 1;
  let snap;
  if (email) {
    // Equality-only query avoids a composite index and reads at most 151 docs.
    // Warn explicitly if there are more; do not claim an exhaustive search.
    if (cursor) throw new Error("Student search does not accept a page cursor.");
    snap = await source.where("studentEmail", "==", email).limit(151).get();
    const rows = snap.docs.map(safeSummary)
      .filter(row => row.updatedAt >= start && row.updatedAt < end)
      .sort((a, b) => b.updatedAt - a.updatedAt);
    return { rows, nextCursor: "", incomplete: snap.size >= 151, examined: snap.size,
      message: snap.size >= 151 ? "Student lookup reached its 150-record read cap. Narrow the date range or use date browsing; earlier records may be omitted." : "" };
  }

  let query = source
    .where("updatedAt", ">=", admin.firestore.Timestamp.fromMillis(start))
    .where("updatedAt", "<", admin.firestore.Timestamp.fromMillis(end))
    .orderBy("updatedAt", "desc");
  if (cursor) {
    // A snapshot cursor handles multiple drafts sharing the same timestamp.
    // The extra document read happens only when Next page is explicitly clicked.
    const cursorDoc = await source.doc(cursor).get();
    if (!cursorDoc.exists) throw new Error("Page cursor expired. Run the date search again.");
    const moment = millis(cursorDoc.data()?.updatedAt);
    if (moment < start || moment >= end) throw new Error("Cursor is outside the chosen date range.");
    query = query.startAfter(cursorDoc);
  }
  snap = await query.limit(limit).get();
  const hasMore = snap.docs.length > PAGE_LIMIT;
  const visible = snap.docs.slice(0, PAGE_LIMIT);
  return { rows: visible.map(safeSummary), nextCursor: hasMore ? visible.at(-1).id : "",
    incomplete: false, examined: visible.length };
}
function timedId(uid, key) {
  const normalize = value => trimmed(value).toLowerCase().replace(/[^a-z0-9._-]/g, "_").slice(0, 140);
  return "timed__" + normalize(uid) + "__" + normalize(key);
}
async function readDraftHistoryDetail({ db, draftId }) {
  if (!validId(draftId)) throw new Error("Invalid draft ID.");
  const draft = await db.collection("submissionDrafts").doc(draftId).get();
  if (!draft.exists) throw new Error("Saved draft not found.");
  const record = draft.data() || {};
  const owner = trimmed(record.studentId || record.uid || record.ownerUid);
  const key = assignmentOf(record);
  const summary = safeSummary(draft);
  // Check the real final submission and score, not the draft's own "draft"
  // status or the timer's optimistic "submitted" flag.
  const submission = await getDraftSubmissionState({ db, draft: record });
  let assessment = { state: "not-checked", reason: "Only a saved cloud draft is known. No expired timed attempt was verified.", eligible: false };
  if (submission.status === "not-submitted" && owner && /^(A1|A2|B1)-[0-9]+(?:[._][0-9]+)*$/.test(key)) {
    const timerRef = db.collection("submissionLocks").doc(timedId(owner, key));
    const timer = await timerRef.get();
    if (timer.exists && trimmed(timer.data()?.studentId || timer.data()?.uid) === owner) {
      const check = await inspectAttempt(db, timerRef, timer.data() || {});
      assessment = { state: check.state, reason: check.reason,
        timerId: timer.id, eligible: check.state === "recoverable" && check.draftId === draftId,
        submissionPaths: check.submissionPaths || [] };
    }
  }
  return { draft: summary, answer: extractText(record).slice(0, 30000),
    answerTruncated: extractText(record).length > 30000,
    submission, assessment };
}
function registerDraftHistoryRoutes(app, { admin, db }) {
  const guard = async req => {
    const bearer = String(req.headers.authorization || "").match(/^Bearer (\S+)$/);
    if (!bearer) throw new Error("Firebase sign-in is required.");
    const actor = await admin.auth().verifyIdToken(bearer[1], true);
    if (actor.email_verified !== true || lower(actor.email) !== "moxflex@gmail.com")
      throw new Error("Owner access is required to review student drafts.");
    return actor;
  };
  app.get("/admin/draft-history", async (req, res) => {
    try {
      await guard(req);
      res.set("Cache-Control", "private, no-store");
      return res.json({ ok: true, ...await listDraftHistory({ db, admin,
        from: req.query.from, to: req.query.to, studentEmail: req.query.studentEmail, cursor: req.query.cursor }) });
    } catch (error) { return res.status(/access|sign-in/i.test(error.message) ? 403 : 400)
      .json({ ok: false, error: error.message || "Could not read saved drafts." }); }
  });
  app.get("/admin/draft-history/:draftId", async (req, res) => {
    try {
      await guard(req);
      res.set("Cache-Control", "private, no-store");
      return res.json({ ok: true, ...await readDraftHistoryDetail({ db, draftId: req.params.draftId }) });
    } catch (error) { return res.status(/access|sign-in/i.test(error.message) ? 403 : 400)
      .json({ ok: false, error: error.message || "Could not preview saved draft." }); }
  });
  app.post("/admin/draft-history/:draftId/queue-marking", async (req, res) => {
    try {
      const actor = await guard(req);
      if (req.body?.confirmation !== "QUEUE EXISTING SUBMISSION")
        throw new Error("Explicit marking confirmation is required.");
      return res.json({ ok: true, ...await queueMissingDraftMarking({
        db, admin, actor, draftId: req.params.draftId, submissionPath: req.body.submissionPath,
      }) });
    } catch (error) { return res.status(/access|sign-in/i.test(error.message) ? 403 : 409)
      .json({ ok: false, error: error.message || "Cannot queue marking." }); }
  });
}
module.exports = { listDraftHistory, readDraftHistoryDetail, registerDraftHistoryRoutes,
  filterDates, safeSummary, PAGE_LIMIT };
