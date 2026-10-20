"use strict";

// Staff-only recovery of saved cloud drafts. Never recreates lost browser-local data.
// Every mutation is explicit, auditable and idempotent.
const crypto = require("node:crypto");
const norm = value => String(value || "").trim();
const lower = value => norm(value).toLowerCase();
const assignment = value => norm(value).toUpperCase();
const validKey = value => /^(A1|A2|B1)-[0-9]+(?:[._][0-9]+)*$/.test(value);
const stamp = value => value && typeof value.toMillis === "function" ? value.toMillis()
  : value && typeof value.seconds === "number" ? value.seconds * 1000
  : typeof value === "number" ? value : Date.parse(value || "") || 0;
const textOf = record => norm(record.submissionText || record.answer || record.workContent);
const keyOf = record => assignment(record.canonicalAssignmentKey || record.assignmentKey || record.assignmentId || record.assignment_id);
const endedAt = timer => {
  const start = stamp(timer.startedAt) || Number(timer.clientStartedAt) || stamp(timer.createdAt);
  return start && Number(timer.durationSeconds) ? start + Number(timer.durationSeconds) * 1000 : stamp(timer.endsAt);
};
const sanitizeDate = value => {
  const valueDate = norm(value);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(valueDate)) throw new Error("Enter a valid YYYY-MM-DD date.");
  const millis = Date.parse(valueDate + "T00:00:00Z");
  if (!Number.isFinite(millis) || new Date(millis).toISOString().slice(0, 10) !== valueDate) throw new Error("Invalid date.");
  return millis;
};
const recoveryId = draftId => "recovered_" + crypto.createHash("sha256").update(draftId).digest("hex").slice(0, 40);
const matching = (row, uid, email, expectedKey) => {
  if (keyOf(row) !== expectedKey) return false;
  const rowUid = norm(row.studentId || row.uid || row.userId || row.ownerUid);
  const rowEmail = lower(row.studentEmail || row.email);
  if (rowUid && uid) return rowUid === uid;
  return Boolean(rowEmail && email && rowEmail === email);
};
async function readMatches(db, name, uid, email, expectedKey, cap = 80) {
  const queries = [];
  if (uid) queries.push(db.collection(name).where("studentId", "==", uid).limit(cap));
  if (email) queries.push(db.collection(name).where("studentEmail", "==", email).limit(cap));
  if (!queries.length) throw new Error("Missing verified student identity.");
  const results = await Promise.all(queries.map(q => q.get()));
  if (results.some(s => s.size >= cap)) throw new Error(name + " lookup reached its safety limit; review records manually.");
  const unique = new Map();
  results.forEach(s => s.docs.forEach(d => {
    if (matching(d.data() || {}, uid, email, expectedKey)) unique.set(d.ref.path, { ref: d.ref, data: d.data() });
  }));
  return [...unique.values()];
}
async function findDraft(db, timer, expectedKey) {
  const uid = norm(timer.studentId || timer.uid);
  const email = lower(timer.studentEmail);
  const drafts = await readMatches(db, "submissionDrafts", uid, email, expectedKey, 80);
  const eligible = drafts.filter(e => {
    const data = e.data || {};
    const owner = norm(data.studentId || data.ownerUid || data.uid);
    return (!uid || !owner || uid === owner) && (!email || !data.studentEmail || lower(data.studentEmail) === email);
  }).sort((a, b) => stamp(b.data.updatedAt) - stamp(a.data.updatedAt));
  return eligible[0] || null;
}
async function inspectAttempt(db, timerRef, timer, options = {}) {
  const expectedKey = keyOf(timer);
  if (!validKey(expectedKey)) return { state: "unsupported", reason: "Only canonical A1, A2 and B1 tutor assignments can be recovered." };
  const uid = norm(timer.studentId || timer.uid);
  const email = lower(timer.studentEmail);
  if (!uid && !email) return { state: "needs-review", reason: "Student identity is missing." };
  const [draft, submissions] = await Promise.all([
    findDraft(db, timer, expectedKey),
    readMatches(db, "submissions", uid, email, expectedKey),
  ]);
  let scoreExists = false;
  const code = norm(draft?.data?.studentCode || timer.studentCode);
  if (code) {
    const scoreRef = db.collection("scores").doc((code + "__" + expectedKey).replace(/[/#?[\]]+/g, "_"));
    scoreExists = (await scoreRef.get()).exists;
  }
  const scoreMatches = await readMatches(db, "scores", uid, email, expectedKey);
  scoreExists ||= scoreMatches.length > 0;
  const base = {
    timerId: timerRef.id,
    assignmentKey: expectedKey,
    studentEmail: email,
    studentId: uid,
    studentCode: code,
    startedAt: stamp(timer.startedAt) || Number(timer.clientStartedAt) || 0,
    endsAt: endedAt(timer),
    timerStatus: lower(timer.status),
    draftId: draft?.ref.id || "",
    draftPath: draft?.ref.path || "",
    draftUpdatedAt: stamp(draft?.data?.updatedAt),
    draftText: draft ? textOf(draft.data).slice(0, 2500) : "",
    textLength: draft ? textOf(draft.data).length : 0,
    submissionPaths: submissions.map(s => s.ref.path),
  };
  if (submissions.length || scoreExists) return { ...base, state: "already-submitted", reason: "Final submission or score already exists; do not recover again." };
  if (!draft) return { ...base, state: "no-cloud-draft", reason: "No saved cloud draft found; browser-only answers cannot be recovered from Admin." };
  if (!textOf(draft.data)) return { ...base, state: "empty-cloud-draft", reason: "Draft exists but has no saved answer text." };
  const lock = await db.collection("submissionLocks").doc(draft.ref.id).get();
  if (lock.exists) return { ...base, state: "needs-review", reason: "Submission lock already exists; inspect before restoring." };
  if (!uid || norm(draft.data.studentId || draft.data.ownerUid || draft.data.uid) !== uid)
    return { ...base, state: "needs-review", reason: "Draft ownership requires staff verification." };
  if (draft.data.recoveredSubmissionPath) return { ...base, state: "needs-review", reason: "Draft already has recovery history." };
  if (base.endsAt && base.draftUpdatedAt > base.endsAt + 5 * 60 * 1000)
    return { ...base, state: "needs-review", reason: "Draft changed after the timer; requires manual investigation." };
  if (base.endsAt && Date.now() < base.endsAt)
    return { ...base, state: "needs-review", reason: "Timer is still active." };
  return { ...base, state: "recoverable", reason: "Verified unsent cloud draft; eligible for staff-confirmed recovery." };
}
async function listTimedDraftRecovery({ db, date, student = "", assignmentKey = "" }) {
  const start = sanitizeDate(date);
  const end = start + 86400000;
  const studentFilter = lower(student);
  const keyFilter = assignment(assignmentKey);
  if (keyFilter && !validKey(keyFilter)) throw new Error("Invalid assignment code.");
  // Bounded, single-field indexed lookups. Never report an exhaustive result if capped.
  let q = db.collection("submissionLocks");
  if (studentFilter.includes("@")) q = q.where("studentEmail", "==", studentFilter);
  else if (studentFilter && keyFilter) {
    const id = "timed__" + studentFilter.replace(/[^a-z0-9._-]/g, "_").slice(0, 140)
      + "__" + keyFilter.toLowerCase().replace(/[^a-z0-9._-]/g, "_");
    const doc = await q.doc(id).get();
    if (!doc.exists) return { cases: [], incomplete: false, checked: 0 };
    const item = doc.data() || {};
    const result = await inspectAttempt(db, doc.ref, item);
    return { cases: [{ ...result, timerId: doc.id }], incomplete: false, checked: 1 };
  } else q = q.where("timerRecord", "==", true);
  const snap = await q.limit(501).get();
  const candidates = snap.docs.filter(doc => {
    const record = doc.data() || {};
    if (record.timerRecord !== true && !doc.id.startsWith("timed__")) return false;
    if (keyFilter && keyOf(record) !== keyFilter) return false;
    const at = endedAt(record);
    return at >= start && at < end && at <= Date.now();
  }).sort((a, b) => endedAt(b.data()) - endedAt(a.data())).slice(0, 40);
  const cases = [];
  for (const doc of candidates) {
    try { cases.push(await inspectAttempt(db, doc.ref, doc.data() || {})); }
    catch (error) { cases.push({ timerId: doc.id, assignmentKey: keyOf(doc.data()), state: "lookup-error",
      reason: error?.message || "Cloud lookup incomplete; no recovery permitted." }); }
  }
  return { cases, checked: candidates.length, incomplete: snap.size >= 501 || candidates.length >= 40,
    warning: snap.size >= 501 ? "Timer scan hit the 500-record safety cap; search a student specifically for exhaustive recovery." : "" };
}
async function recoverTimedDraft({ admin, db, timerId, draftId, actor }) {
  if (!/^timed__[A-Za-z0-9._-]+__[A-Za-z0-9._-]+$/.test(norm(timerId))) throw new Error("Invalid timed attempt ID.");
  if (!/^[A-Za-z0-9._-]{1,500}$/.test(norm(draftId))) throw new Error("Invalid draft ID.");
  const timerRef = db.collection("submissionLocks").doc(timerId);
  const draftRef = db.collection("submissionDrafts").doc(draftId);
  const timerSnap = await timerRef.get();
  if (!timerSnap.exists) throw new Error("Timed attempt no longer exists.");
  const timer = timerSnap.data() || {};
  const inspection = await inspectAttempt(db, timerRef, timer);
  if (inspection.state !== "recoverable" || inspection.draftId !== draftId) {
    throw new Error("Recovery blocked: " + (inspection.reason || "Eligibility changed. Refresh."));
  }
  const submissionRef = db.collection("submissions").doc(recoveryId(draftId));
  const lockRef = db.collection("submissionLocks").doc(draftId);
  const auditRef = db.collection("timedDraftRecoveryAudit").doc(recoveryId(draftId));
  await db.runTransaction(async tx => {
    const [freshTimer, freshDraft, existingSubmission, existingLock, existingAudit] = await Promise.all([
      tx.get(timerRef), tx.get(draftRef), tx.get(submissionRef), tx.get(lockRef), tx.get(auditRef),
    ]);
    if (!freshTimer.exists || !freshDraft.exists || existingSubmission.exists || existingLock.exists || existingAudit.exists)
      throw new Error("An attempt or recovery lock changed; nothing was overwritten.");
    const t = freshTimer.data() || {};
    const d = freshDraft.data() || {};
    if (lower(t.status) !== inspection.timerStatus || keyOf(d) !== inspection.assignmentKey ||
      textOf(d) !== inspection.draftText || stamp(d.updatedAt) !== inspection.draftUpdatedAt ||
      norm(d.studentId || d.ownerUid || d.uid) !== inspection.studentId ||
      norm(t.studentId || t.uid) !== inspection.studentId)
      throw new Error("Source changed during recovery; refresh before retrying.");
    const now = admin.firestore.FieldValue.serverTimestamp();
    const title = norm(d.assignmentTitle || d.title) || inspection.assignmentKey;
    const payload = {
      submissionId: submissionRef.id, path: submissionRef.path, submissionPath: submissionRef.path,
      title, assignmentTitle: title, level: inspection.assignmentKey.split("-")[0],
      day: Number(d.day || 0), chapter: norm(d.chapter) || inspection.assignmentKey.split("-").slice(1).join("-"),
      chapterKey: norm(d.chapterKey) || "chapter-" + inspection.assignmentKey.toLowerCase().split("-").slice(1).join("-"),
      assignmentId: inspection.assignmentKey, assignment_id: inspection.assignmentKey,
      assignmentKey: inspection.assignmentKey, canonicalAssignmentKey: inspection.assignmentKey,
      submissionText: textOf(d), answer: textOf(d), workContent: textOf(d),
      status: "submitted", reviewStatus: "pending_review", assignment: true, progressionEligible: true,
      attempt: 1, attemptNumber: 1, isResubmission: false,
      studentId: inspection.studentId, userId: inspection.studentId, uid: inspection.studentId,
      ownerUid: inspection.studentId, studentEmail: inspection.studentEmail, studentCode: inspection.studentCode,
      studentName: norm(d.studentName), studentScopeKey: norm(d.studentScopeKey),
      className: norm(d.className), source: "admin_recovered_cloud_draft",
      recoveredDraftId: draftId, recoveredFromTimerId: timerId,
      originalTimerEndedAt: inspection.endsAt, originalDraftUpdatedAt: d.updatedAt || null,
      createdAt: now, updatedAt: now, submittedAt: now, recoveredAt: now,
      recoveredBy: actor.uid, recoveredByEmail: lower(actor.email),
    };
    tx.create(submissionRef, payload);
    tx.create(lockRef, {
      studentId: inspection.studentId, userId: inspection.studentId, ownerUid: inspection.studentId,
      studentEmail: inspection.studentEmail, studentCode: inspection.studentCode,
      level: payload.level, day: payload.day, chapter: payload.chapter, chapterKey: payload.chapterKey,
      assignmentKey: inspection.assignmentKey, canonicalAssignmentKey: inspection.assignmentKey,
      assignmentId: inspection.assignmentKey, submissionId: submissionRef.id, submissionPath: submissionRef.path,
      lockedAt: now, updatedAt: now, recoveredByAdmin: true,
    });
    tx.update(draftRef, { recoveredSubmissionPath: submissionRef.path, recoveredAt: now, recoveredBy: actor.uid });
    tx.update(timerRef, { originalTimerStatus: lower(t.status), status: "submitted", recoveredByAdmin: true,
      recoveredSubmissionPath: submissionRef.path, updatedAt: now });
    tx.create(auditRef, { timerId, draftId, submissionPath: submissionRef.path,
      assignmentKey: inspection.assignmentKey, studentId: inspection.studentId,
      actorUid: actor.uid, actorEmail: lower(actor.email), recoveredAt: now });
  });
  return { submissionPath: submissionRef.path, status: "submitted", marking: "Automatic marking will be queued by the submission-created trigger." };
}
function registerTimedDraftRecoveryRoutes(app, { admin, db, requireAuth }) {
  const guard = async req => {
    const actor = await requireAuth(req);
    const email = lower(actor.email);
    if (!actor.email_verified || !["moxflex@gmail.com", "staff@falowen.app"].includes(email))
      throw new Error("Admin recovery access denied.");
    return actor;
  };
  app.get("/admin/timed-drafts", async (req, res) => {
    try {
      await guard(req);
      res.set("Cache-Control", "no-store");
      return res.json({ ok: true, ...await listTimedDraftRecovery({
        db, date: req.query.date, student: req.query.student, assignmentKey: req.query.assignmentKey,
      }) });
    } catch (error) { return res.status(403).json({ ok: false, error: error.message || "Cannot scan drafts." }); }
  });
  app.post("/admin/timed-drafts/recover", async (req, res) => {
    try {
      const actor = await guard(req);
      if (req.body?.confirmation !== "RECOVER SAVED DRAFT") throw new Error("Explicit recovery confirmation is required.");
      return res.json({ ok: true, ...await recoverTimedDraft({
        admin, db, actor, timerId: req.body?.timerId, draftId: req.body?.draftId,
      }) });
    } catch (error) { return res.status(409).json({ ok: false, error: error.message || "Recovery blocked." }); }
  });
}
module.exports = { listTimedDraftRecovery, recoverTimedDraft, registerTimedDraftRecoveryRoutes,
  textOf, keyOf, endedAt, recoveryId, sanitizeDate };
