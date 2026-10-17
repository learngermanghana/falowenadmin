const DAY_MS = 24 * 60 * 60 * 1000;
const clean = (value) => String(value ?? "").trim();
const lower = (value) => clean(value).toLowerCase();
const number = (value) => Number(String(value ?? "0").replace(/,/g, ""));
const dateMs = (value) => {
  const date = Date.parse(clean(value));
  return Number.isFinite(date) ? date : 0;
};

function validateTrialRecovery(payload = {}, now = Date.now()) {
  if (payload.confirm !== true) throw Object.assign(new Error("Explicit staff confirmation is required"), { statusCode: 400 });
  const uid = clean(payload.uid);
  const studentCode = clean(payload.studentCode);
  const email = lower(payload.email);
  const name = clean(payload.name);
  const expiredAt = dateMs(payload.trialExpiredAt);
  const registration = dateMs(payload.registrationDate);
  const purgeAt = Math.max(expiredAt + 30 * DAY_MS, dateMs(payload.trialPurgeAt));
  if (!uid || uid.includes("/") || uid.length > 128 || !studentCode || !email.includes("@") || !name) {
    throw Object.assign(new Error("Missing Firebase UID or student identity in master sheet"), { statusCode: 400 });
  }
  if (!expiredAt || expiredAt > now || now >= purgeAt || (registration && registration > expiredAt)) {
    throw Object.assign(new Error("Trial is not within its 30-day recovery window"), { statusCode: 400 });
  }
  if (lower(payload.paymentStatus) && !["pending", "unpaid"].includes(lower(payload.paymentStatus))) {
    throw Object.assign(new Error("Only unpaid trial accounts may be recovered through this route"), { statusCode: 400 });
  }
  if (number(payload.paid) > 0) {
    throw Object.assign(new Error("Existing payment must be reconciled before trial recovery"), { statusCode: 400 });
  }
  return {
    uid,
    name,
    email,
    studentCode,
    level: clean(payload.level).toUpperCase(),
    className: clean(payload.className),
    phone: clean(payload.phone),
    location: clean(payload.location),
    learningMode: clean(payload.learningMode),
    registrationAt: registration || expiredAt - 7 * DAY_MS,
    expiredAt,
    purgeAt,
  };
}

function registerStudentTrialRecoveryRoute({ app, db, admin, requireAuth, assertStaff }) {
  if (!app?.post || !db?.collection || !requireAuth || !assertStaff) {
    throw new Error("Missing trial recovery route dependencies");
  }

  app.post("/students/recover-trial", async (req, res) => {
    try {
      const actor = await requireAuth(req);
      assertStaff(actor);
      const recovery = validateTrialRecovery(req.body || {});
      if (typeof admin?.auth !== "function" || !admin?.firestore?.Timestamp?.fromMillis || !admin?.firestore?.FieldValue?.serverTimestamp) {
        throw new Error("Firebase Admin identity recovery is unavailable");
      }
      // Never create an unrelated account just because a published sheet row exists.
      const authUser = await admin.auth().getUser(recovery.uid);
      if (lower(authUser.email) !== recovery.email) {
        return res.status(409).json({ ok: false, error: "Firebase Auth email does not match sheet UID. Manual identity verification required." });
      }
      const students = db.collection("students");
      const ref = students.doc(recovery.uid);
      const existing = await Promise.all([
        ref.get(),
        students.where("uid", "==", recovery.uid).limit(1).get(),
        students.where("studentCode", "==", recovery.studentCode).limit(1).get(),
        students.where("studentcode", "==", recovery.studentCode).limit(1).get(),
        students.where("email", "==", recovery.email).limit(1).get(),
      ]);
      const existingRecord = existing[0].exists
        ? existing[0] : existing.slice(1).flatMap((snap) => snap.docs || [])[0];
      if (existingRecord) {
        return res.json({ ok: true, recovered: false, alreadyExists: true, studentId: existingRecord.id });
      }

      const timestamp = admin.firestore.Timestamp;
      const now = admin.firestore.FieldValue.serverTimestamp();
      // Atomic create refuses to overwrite an account that appeared concurrently.
      await ref.create({
        role: "student",
        uid: recovery.uid,
        authEmail: lower(authUser.email),
        email: recovery.email,
        name: recovery.name,
        studentCode: recovery.studentCode,
        studentcode: recovery.studentCode,
        level: recovery.level,
        className: recovery.className,
        phone: recovery.phone,
        location: recovery.location,
        learningMode: recovery.learningMode,
        paymentStatus: "pending",
        paid: 0,
        status: "trial_expired",
        trialStatus: "expired",
        trialStartedAt: timestamp.fromMillis(recovery.registrationAt),
        createdAt: timestamp.fromMillis(recovery.registrationAt),
        trialExpiredAt: timestamp.fromMillis(recovery.expiredAt),
        trialPurgeAt: timestamp.fromMillis(recovery.purgeAt),
        trialAccessBlockedAt: now,
        trialRecoveredFromSheetAt: now,
        trialRecoveredFromSheetBy: clean(actor.email || actor.uid || "staff"),
        updatedAt: now,
      });
      // Audit is best effort; do not report a failed restore after create succeeded.
      try {
        await db.collection("auditLogs").add({
          type: "student.trial_restored_from_sheet",
          studentId: ref.id,
          studentCode: recovery.studentCode,
          actor: clean(actor.email || actor.uid || "staff"),
          at: admin.firestore.FieldValue.serverTimestamp(),
        });
      } catch (auditError) {
        console.error("trial_recovery_audit_failed", { uid: recovery.uid, message: auditError?.message });
      }
      return res.json({ ok: true, recovered: true, studentId: ref.id });
    } catch (error) {
      const code = lower(error?.code);
      const status = Number(error?.statusCode) || (code === "auth/user-not-found" ? 409 : code === "6" || code === "already-exists" ? 409 : 500);
      return res.status(status).json({
        ok: false,
        error: code === "auth/user-not-found"
          ? "Firebase Auth account is missing. Cannot safely restore from the sheet without identity verification."
          : error?.message || "Trial recovery failed",
      });
    }
  });
}

module.exports = { validateTrialRecovery, registerStudentTrialRecoveryRoute };
