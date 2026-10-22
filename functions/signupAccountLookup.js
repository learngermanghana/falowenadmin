"use strict";

const clean = value => String(value || "").trim();
const lower = value => clean(value).toLowerCase();
const ownerEmail = "moxflex@gmail.com";
const emailPattern = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;

async function lookupSignupAccount({ admin, db, email }) {
  let authUser = null;
  try {
    authUser = await admin.auth().getUserByEmail(email);
  } catch (error) {
    if (error?.code !== "auth/user-not-found") throw error;
  }

  const matches = new Map();
  const add = snapshot => {
    for (const row of snapshot.docs || []) {
      const data = row.data() || {};
      matches.set(row.id, {
        id: row.id,
        studentCode: clean(data.studentCode || data.studentcode || row.id),
        status: clean(data.status),
        email: clean(data.email || data.authEmail),
        uid: clean(data.uid),
      });
    }
  };
  // Only point lookups and bounded indexed queries. Do not scan all students.
  for (const field of ["email", "authEmail"]) {
    add(await db.collection("students").where(field, "==", email).limit(3).get());
  }
  if (authUser) {
    add(await db.collection("students").where("uid", "==", authUser.uid).limit(3).get());
    const direct = await db.collection("students").doc(authUser.uid).get();
    if (direct.exists) add({ docs: [direct] });
  }
  const students = [...matches.values()];
  const outcome = authUser
    ? students.length ? "linked_student" : "auth_without_student"
    : students.length ? "student_without_auth" : "not_found";
  return {
    email, outcome,
    authExists: Boolean(authUser),
    authUid: authUser?.uid || null,
    authCreatedAt: authUser?.metadata?.creationTime || null,
    providers: (authUser?.providerData || []).map(row => row.providerId).filter(Boolean),
    students,
  };
}

function registerSignupAccountLookup(app, { admin, db }) {
  app.get("/admin/signup-account-lookup", async (req, res) => {
    const header = clean(req.headers.authorization);
    const token = header.match(/^Bearer (\\S+)$/);
    if (!token) return res.status(401).json({ ok: false, error: "Sign in to check an account." });
    let actor;
    try {
      actor = await admin.auth().verifyIdToken(token[1], true);
    } catch {
      return res.status(401).json({ ok: false, error: "Invalid sign-in session." });
    }
    if (actor.email_verified !== true || lower(actor.email) !== ownerEmail)
      return res.status(403).json({ ok: false, error: "Owner access is required." });

    const email = lower(req.query.email);
    if (!emailPattern.test(email) || email.length > 254)
      return res.status(400).json({ ok: false, error: "Enter a valid email address." });
    try {
      res.set("Cache-Control", "private, no-store");
      return res.json({ ok: true, ...(await lookupSignupAccount({ admin, db, email })) });
    } catch (error) {
      console.error("signup_account_lookup_failed", { code: error?.code || "unknown" });
      return res.status(500).json({ ok: false, error: "Account lookup is temporarily unavailable." });
    }
  });
}

module.exports = { lookupSignupAccount, registerSignupAccountLookup };
