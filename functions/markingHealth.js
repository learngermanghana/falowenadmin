"use strict";

// Owner-only, on-demand health samples. No cron, collection-wide scan, or continuous listeners.
const STATUS_LIMIT = 25;
const trim = x => String(x || "").trim();
const lower = x => trim(x).toLowerCase();
const timestamp = value => value?.toMillis?.() || (value?.seconds ? value.seconds * 1000 : Date.parse(value || "") || 0);
const HEALTH_STATES = ["pending", "marking", "needs_review"];
async function markingHealth(db, now = Date.now()) {
  const rows = [];
  const samples = {};
  for (const state of HEALTH_STATES) {
    const snap = await db.collection("markingJobs").where("status", "==", state).limit(STATUS_LIMIT + 1).get();
    samples[state] = { sampled: Math.min(snap.docs.length, STATUS_LIMIT), capped: snap.docs.length > STATUS_LIMIT };
    for (const doc of snap.docs.slice(0, STATUS_LIMIT)) {
      const job = doc.data() || {};
      if (!job.automatic) continue;
      const createdAt = timestamp(job.createdAt);
      const overdue = state === "marking"
        ? Number(job.leaseUntil || 0) > 0 && Number(job.leaseUntil) < now
        : state === "pending" && createdAt > 0 && now - createdAt > 10 * 60000;
      rows.push({
        id: doc.id, submissionPath: trim(job.submissionPath),
        assignmentKey: trim(job.assignmentKey), level: trim(job.level),
        studentCode: trim(job.studentCode), status: state, attempts: Number(job.attempts || 0),
        overdue, createdAt: createdAt || null, errorKind: trim(job.errorKind),
        error: trim(job.error).slice(0, 200),
      });
    }
  }
  const sync = {};
  for (const state of ["pending", "needs_review"]) {
    const snap = await db.collection("automaticScoreSync").where("status", "==", state).limit(STATUS_LIMIT + 1).get();
    sync[state] = { sampled: Math.min(snap.docs.length, STATUS_LIMIT), capped: snap.docs.length > STATUS_LIMIT };
  }
  return { checkedAt: new Date(now).toISOString(), sampleLimit: STATUS_LIMIT,
    samples, sheetSync: sync, rows: rows.sort((a, b) => Number(b.overdue) - Number(a.overdue) || (a.createdAt || 0) - (b.createdAt || 0)) };
}
function registerMarkingHealthRoutes(app, { admin, db }) {
  app.get("/admin/marking-health", async (req, res) => {
    try {
      const match = trim(req.headers.authorization).match(/^Bearer (\S+)$/);
      if (!match) return res.status(401).json({ ok: false, error: "Sign in to view marking health." });
      const user = await admin.auth().verifyIdToken(match[1], true);
      if (user.email_verified !== true || lower(user.email) !== "moxflex@gmail.com")
        return res.status(403).json({ ok: false, error: "Owner access is required." });
      res.set("Cache-Control", "private, no-store");
      return res.json({ ok: true, ...await markingHealth(db) });
    } catch (error) {
      return res.status(500).json({ ok: false, error: "Marking health is temporarily unavailable." });
    }
  });
}
module.exports = { markingHealth, registerMarkingHealthRoutes, STATUS_LIMIT };
