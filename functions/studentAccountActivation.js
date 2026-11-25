"use strict";

const crypto = require("node:crypto");
const { sendOrganisationStudentConfirmation } = require("./organisationConfirmations");
const OWNER_EMAIL = "moxflex@gmail.com";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const clean = (value) => String(value ?? "").trim();
const lower = (value) => clean(value).toLowerCase();

function httpError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

async function requireVerifiedOwner(req, admin) {
  const match = clean(req.headers?.authorization).match(/^Bearer (\S+)$/);
  if (!match) throw httpError(401, "Sign in to Falowen Admin first.");
  let actor;
  try {
    actor = await admin.auth().verifyIdToken(match[1], true);
  } catch {
    throw httpError(401, "Your sign-in session has expired.");
  }
  if (actor.email_verified !== true || lower(actor.email) !== OWNER_EMAIL) {
    throw httpError(403, "Verified owner access is required to manage student logins.");
  }
  return actor;
}

function validEmail(value) {
  return EMAIL_RE.test(value) && value.length <= 254;
}

async function readStudent(db, studentId) {
  if (!studentId || studentId.length > 200 || studentId.includes("/")) {
    throw httpError(400, "Choose a valid student.");
  }
  const ref = db.collection("students").doc(studentId);
  const snap = await ref.get();
  if (!snap.exists) throw httpError(404, "Save the student profile before activating an account.");
  return { ref, student: snap.data() || {} };
}

async function linkedAuthUser(admin, student) {
  const uid = clean(student.uid || student.authUid || student.firebaseUid);
  if (!uid) return null;
  try {
    return await admin.auth().getUser(uid);
  } catch (error) {
    if (error?.code === "auth/user-not-found") {
      throw httpError(409, "The stored Firebase UID no longer exists. Investigate the account before proceeding.");
    }
    throw error;
  }
}

function loginState(student, authUser) {
  if (!authUser) return "not_prepared";
  if (authUser.disabled) return "disabled";
  return authUser.metadata?.lastSignInTime || (!student.accountProvisionedAt && !student.accountProvisionedBy && !student.activationEmailSentAt && (student.trialStartedAt || student.trialUsedAt || student.registrationSource === "self_signup")) ? "active" : student.activationEmailSentAt ? "invited" : "ready_to_invite";
}

async function accountStatus({ db, admin, studentId }) {
  const { student } = await readStudent(db, studentId);
  const authUser = await linkedAuthUser(admin, student);
  const email = lower(student.email);
  if (authUser && lower(authUser.email) !== lower(student.authEmail || email)) {
    throw httpError(409, "Stored account email does not match the Firebase sign-in. Correct the account link first.");
  }
  return {
    ok: true,
    studentId,
    email: authUser ? lower(authUser.email) : email,
    uid: authUser?.uid || null,
    state: loginState(student, authUser),
    emailVerified: Boolean(authUser?.emailVerified),
    lastSignInAt: authUser?.metadata?.lastSignInTime || null,
    invitationRequestedAt: student.activationEmailSentAt?.toDate?.()?.toISOString?.()
      || student.activationEmailSentAt || null,
  };
}


async function findExistingLogin({ db, admin, studentId }) {
  const { student } = await readStudent(db, studentId);
  const email = lower(student.email);
  if (!validEmail(email)) throw httpError(400, "Save a valid contact email first.");
  if (clean(student.uid || student.authUid || student.firebaseUid)) {
    return { ...(await accountStatus({ db, admin, studentId })), linkAvailable: false };
  }
  let user;
  try { user = await admin.auth().getUserByEmail(email); }
  catch (error) {
    if (error?.code === "auth/user-not-found") {
      return { ok: true, studentId, email, uid: null, state: "not_prepared", linkAvailable: false, existingLogin: false };
    }
    throw error;
  }
  if (user.disabled) throw httpError(409, "This Firebase login is disabled. Review it before linking.");
  if (lower(user.email) !== email) throw httpError(409, "Firebase login email does not match the saved student email.");
  const duplicate = await findUidConflicts(db, user.uid, studentId);
  if (duplicate) throw httpError(409, "This Firebase login is already linked to a different student. Resolve the duplicate first.");
  const lock = await db.collection("studentAuthLinks").doc(user.uid).get();
  if (lock.exists && lock.data()?.studentId !== studentId) {
    throw httpError(409, "This Firebase login is reserved for another student.");
  }
  return { ok: true, studentId, email, uid: user.uid, state: loginState(student, user),
    existingLogin: true, linkAvailable: true, lastSignInAt: user.metadata?.lastSignInTime || null };
}

async function findUidConflicts(db, uid, studentId) {
  for (const key of ["uid", "authUid", "firebaseUid"]) {
    const result = await db.collection("students").where(key, "==", uid).limit(2).get();
    if (result.docs.some(doc => doc.id !== studentId)) return true;
  }
  return false;
}

async function linkExistingLogin({ db, admin, studentId, actor }) {
  // An explicit owner action: checking registration never mutates data.
  const lookup = await findExistingLogin({ db, admin, studentId });
  if (!lookup.linkAvailable) {
    if (lookup.uid) return { ...lookup, linked: false };
    throw httpError(404, "No existing Firebase account matches this student's saved email.");
  }
  const studentRef = db.collection("students").doc(studentId);
  const linkRef = db.collection("studentAuthLinks").doc(lookup.uid);
  // Recheck identity and legacy aliases before reserving the UID.
  if (await findUidConflicts(db, lookup.uid, studentId)) {
    throw httpError(409, "Firebase login is already associated with another student.");
  }
  await db.runTransaction(async tx => {
    const [snap, lock] = await Promise.all([tx.get(studentRef), tx.get(linkRef)]);
    if (!snap.exists) throw httpError(404, "Student no longer exists.");
    const record = snap.data() || {};
    const linkedUid = clean(record.uid || record.authUid || record.firebaseUid);
    if (linkedUid && linkedUid !== lookup.uid) throw httpError(409, "Student already has a different Firebase UID.");
    if (lower(record.email) !== lookup.email) throw httpError(409, "Student email changed. Check again before linking.");
    if (lock.exists && lock.data()?.studentId !== studentId) throw httpError(409, "Firebase login belongs to another student.");
    tx.set(linkRef, { studentId, email: lookup.email, linkedBy: clean(actor.email || actor.uid),
      linkedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
    tx.update(studentRef, { uid: lookup.uid, authEmail: lookup.email,
      accountActivationState: lookup.state, accountLinkedBy: clean(actor.email || actor.uid),
      accountLinkedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp() });
  });
  return { ...(await accountStatus({ db, admin, studentId })), linked: true };
}

async function prepareAccount({ db, admin, studentId, actor }) {
  const { ref, student } = await readStudent(db, studentId);
  const email = lower(student.email);
  const name = clean(student.name || student.displayName);
  if (!name || !validEmail(email)) {
    throw httpError(400, "Save the student's full name and valid email before sending an invitation.");
  }
  const linked = await linkedAuthUser(admin, student);
  if (linked) {
    if (lower(linked.email) !== lower(student.authEmail || email)) {
      throw httpError(409, "This profile points to a different login email. Do not overwrite an existing account.");
    }
    if (lower(linked.email) !== email) {
      throw httpError(409, "Contact email differs from sign-in email. Review the profile before sending an invitation.");
    }
    if (linked.disabled) throw httpError(409, "This Firebase login is disabled. Review the account before inviting.");
    return { ...(await accountStatus({ db, admin, studentId })), created: false };
  }

  // Never silently claim an existing sign-in: it could belong to a different profile.
  let existing = null;
  try {
    existing = await admin.auth().getUserByEmail(email);
  } catch (error) {
    if (error?.code !== "auth/user-not-found") throw error;
  }
  if (existing) {
    throw httpError(409, "This email already has a Firebase login. Use Check Firebase registration to review and link it safely; no invitation was sent.");
  }

  // Random one-time secret is NOT shown, logged, emailed, or saved in Firestore.
  // The student selects their own password through Firebase's reset-password email.
  const created = await admin.auth().createUser({
    email,
    displayName: name,
    password: crypto.randomBytes(48).toString("base64url"),
    emailVerified: false,
  });
  try {
    await ref.update({
      uid: created.uid,
      authEmail: email,
      accountProvisionedAt: admin.firestore.FieldValue.serverTimestamp(),
      accountProvisionedBy: clean(actor.email || actor.uid),
      accountActivationState: "ready_to_invite",
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  } catch (error) {
    // Do not delete the newly created identity after an uncertain Firestore write:
    // it could already be linked, and deletion risks destroying a valid sign-in.
    console.error("student_auth_profile_link_failed", { studentId, code: error?.code || "unknown" });
    throw httpError(503, "Firebase login was created, but saving the UID failed. Review account lookup before retrying.");
  }
  return { ...(await accountStatus({ db, admin, studentId })), created: true };
}

async function recordInvitation({ db, admin, studentId, actor, runtimeConfig = {} }) {
  const { ref, student } = await readStudent(db, studentId);
  const authUser = await linkedAuthUser(admin, student);
  if (!authUser) throw httpError(409, "Prepare the student's Firebase login before emailing.");
  if (authUser.disabled || lower(authUser.email) !== lower(student.email)) {
    throw httpError(409, "The student email and Firebase login must match.");
  }
  await ref.update({
    activationEmailSentAt: admin.firestore.FieldValue.serverTimestamp(),
    activationEmailSentTo: lower(authUser.email),
    activationEmailSentBy: clean(actor.email || actor.uid),
    accountActivationState: "invited",
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
  let confirmation = { sent: false, reason: "not_applicable" };
  try { confirmation = await sendOrganisationStudentConfirmation({ db, admin, studentId, runtimeConfig }); }
  catch (error) { console.error("organisation_student_confirmation_failed", { studentId, message: error?.message }); confirmation = { sent: false, reason: "delivery_failed" }; }
  return { ok: true, studentId, email: lower(authUser.email), state: "invited", confirmation };
}

function registerStudentAccountActivationRoutes(app, { admin, db, runtimeConfig = {} }) {
  if (!app?.get || !app?.post || !admin?.auth || !db?.collection) {
    throw new Error("Student account activation route dependencies are incomplete.");
  }

  async function handle(req, res, operation) {
    res.set("Cache-Control", "private, no-store");
    try {
      const actor = await requireVerifiedOwner(req, admin);
      const studentId = clean(req.params.studentId);
      let result;
      if (operation === "status") result = await accountStatus({ db, admin, studentId });
      else if (operation === "lookup") result = await findExistingLogin({ db, admin, studentId });
      else if (operation === "link") result = await linkExistingLogin({ db, admin, studentId, actor });
      else if (operation === "prepare") result = await prepareAccount({ db, admin, studentId, actor });
      else if (operation === "organisation-confirmation") result = { ok: true, ...(await sendOrganisationStudentConfirmation({ db, admin, studentId, runtimeConfig })) };
      else result = await recordInvitation({ db, admin, studentId, actor, runtimeConfig });
      return res.json(result);
    } catch (error) {
      const status = Number(error.status) || 500;
      if (status >= 500) console.error("student_account_activation_error", { code: error?.code || "unknown" });
      return res.status(status).json({
        ok: false,
        error: status >= 500 ? (status === 503 ? error.message : "Student account service is temporarily unavailable.") : error.message,
      });
    }
  }

  app.get("/admin/student-accounts/:studentId/lookup", (req, res) => handle(req, res, "lookup"));
  app.post("/admin/student-accounts/:studentId/link", (req, res) => handle(req, res, "link"));
  app.get("/admin/student-accounts/:studentId", (req, res) => handle(req, res, "status"));
  app.post("/admin/student-accounts/:studentId/prepare", (req, res) => handle(req, res, "prepare"));
  app.post("/admin/student-accounts/:studentId/invitation-sent", (req, res) => handle(req, res, "invitation"));
  app.post("/admin/student-accounts/:studentId/organisation-confirmation", (req, res) => handle(req, res, "organisation-confirmation"));
}

module.exports = {
  registerStudentAccountActivationRoutes,
  accountStatus,
  findExistingLogin,
  linkExistingLogin,
  prepareAccount,
  recordInvitation,
  validEmail,
  loginState,
};
