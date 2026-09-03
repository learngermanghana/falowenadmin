const admin = require("firebase-admin");
const express = require("express");
const cors = require("cors");
const crypto = require("crypto");
const { CONTRACT_TERM_MONTHS, normalizeLevel: normalizeContractLevel, nextLevel: nextContractLevel, computeUpgradeGraceEnd, contractIsActive, computeExtendedContractEnd, isUpgradeGraceExpired, asDate: contractAsDate } = require("./studentContractLifecycle.js");
const { parseAssignmentChapter } = require("./assignmentChapter.js");
const { buildCanonicalClassKeys, studentMatchesCanonicalClass } = require("./checkinClassMembership.js");
const { isStudentOnPublishedRoster } = require("./publishedRosterMembership.js");
const { registerStudentProfileUpdateRoute } = require("./studentProfileUpdate.js");
const { onRequest } = require("firebase-functions/v2/https");
const { onDocumentCreated, onDocumentUpdated } = require("firebase-functions/v2/firestore");
const { onSchedule } = require("firebase-functions/v2/scheduler");
const { setGlobalOptions } = require("firebase-functions/v2");
const { defineSecret } = require("firebase-functions/params");
const { createOrientationAutoSyncHandler } = require("./orientationAutoSync");
const { createStudentPaymentUpdateEmailTrigger } = require("./studentPaymentUpdateEmails.js");
const { createAttendanceConfirmationEmailJob, sendAssignmentAttendanceCreditEmail } = require("./attendanceConfirmationEmails.js");
const { retryFailedAttendanceDeliveries } = require("./attendanceConfirmationRetry.js");
const { assignmentAttendanceEligibility } = require("./assignmentAttendanceEligibility.js");

setGlobalOptions({ region: "us-central1" });

admin.initializeApp();
const db = admin.firestore();

const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

const STUDENTS_COLLECTION = "students";
const CHECKIN_RATE_LIMIT_WINDOW_MS = 60 * 1000;
const CHECKIN_RATE_LIMIT_MAX = 8;
const checkinRateLimitBuckets = new Map();

function maskEmail(value) {
  return String(value || "").trim().replace(/(^.).*(@.*$)/, "$1***$2");
}

function clientRateLimitKey(req, body = {}) {
  const forwarded = String(req.headers["x-forwarded-for"] || "").split(",")[0].trim();
  const ip = forwarded || req.ip || req.socket?.remoteAddress || "unknown";
  const email = normalizeText(body.email || "");
  return `${ip}:${email}`;
}

function consumeCheckinRateLimit(req, body = {}) {
  const now = Date.now();
  const key = clientRateLimitKey(req, body);
  for (const [bucketKey, bucket] of checkinRateLimitBuckets.entries()) {
    if (!bucket || now - bucket.windowStart > CHECKIN_RATE_LIMIT_WINDOW_MS * 2) checkinRateLimitBuckets.delete(bucketKey);
  }
  const bucket = checkinRateLimitBuckets.get(key);
  if (!bucket || now - bucket.windowStart > CHECKIN_RATE_LIMIT_WINDOW_MS) {
    checkinRateLimitBuckets.set(key, { windowStart: now, count: 1 });
    return { allowed: true };
  }
  bucket.count += 1;
  if (bucket.count > CHECKIN_RATE_LIMIT_MAX) {
    return { allowed: false, retryAfterSeconds: Math.ceil((CHECKIN_RATE_LIMIT_WINDOW_MS - (now - bucket.windowStart)) / 1000) };
  }
  return { allowed: true };
}
const attendancePinSaltSecret = defineSecret("ATTENDANCE_PIN_SALT");
const orientationSyncSecret = defineSecret("ORIENTATION_SYNC_SECRET");
const orientationAppsScriptUrlSecret = defineSecret("ORIENTATION_APPS_SCRIPT_URL");
const classScheduleSyncSecret = defineSecret("CLASS_SCHEDULE_SYNC_SECRET");
const classScheduleAppsScriptUrlSecret = defineSecret("CLASS_SCHEDULE_APPS_SCRIPT_URL");
const holidaysAppsScriptUrlSecret = defineSecret("HOLIDAYS_APPS_SCRIPT_URL");
const holidaysSyncSecret = defineSecret("HOLIDAYS_SYNC_SECRET");
const openAiApiKeySecret = defineSecret("OPENAI_API_KEY");
const studentDeleteAppsScriptUrlSecret = defineSecret("STUDENT_DELETE_APPS_SCRIPT_URL");
const studentDeleteSyncSecret = defineSecret("STUDENT_DELETE_SYNC_SECRET");
const paystackSecretKeySecret = defineSecret("PAYSTACK_SECRET");

function parseRuntimeConfig() {
  const raw = process.env.CLOUD_RUNTIME_CONFIG || "{}";
  try {
    return JSON.parse(raw);
  } catch {
    throw new Error("Invalid CLOUD_RUNTIME_CONFIG JSON");
  }
}

const runtimeConfig = parseRuntimeConfig();
const attendanceConfig = runtimeConfig.attendance || {};
const teacherAllowlist = String(attendanceConfig.teacher_emails || process.env.ATTENDANCE_TEACHER_EMAILS || "")
  .split(",")
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean);

function resolvePinSalt() {
  return String(
    attendancePinSaltSecret.value() ||
      attendanceConfig.pin_salt ||
      process.env.ATTENDANCE_PIN_SALT ||
      ""
  ).trim();
}

function normalizeClassId(value) {
  return String(value || "").trim();
}

function normalizeClassLookupKey(value) {
  return normalizeClassId(value)
    .toLowerCase()
    .replace(/\s+/g, " ");
}

const CLASS_ID_ALIASES = new Map([
  ["a1 leipzig", "A1 Leipzig Klasse"],
  ["a1 leipzig klasse", "A1 Leipzig Klasse"],
  ["a1 leipzip", "A1 Leipzig Klasse"],
  ["a1 leipzip klasse", "A1 Leipzig Klasse"],
]);

function normalizeClassComparable(value) {
  const normalized = normalizeClassId(value);
  if (!normalized) return "";
  return CLASS_ID_ALIASES.get(normalizeClassLookupKey(normalized)) || normalized;
}

async function resolveCanonicalClassKeys(classId) {
  const fallbackKeys = buildCanonicalClassKeys(classId);
  const normalizedId = String(classId || "").trim();
  if (!normalizedId) return fallbackKeys;

  try {
    const classSnap = await db.collection("classes").doc(normalizedId).get();
    if (classSnap.exists) {
      return buildCanonicalClassKeys(classId, classSnap.data(), classSnap.id);
    }
  } catch (error) {
    console.warn("checkin_class_lookup_failed", {
      classId: normalizedId,
      message: error?.message || String(error),
    });
  }

  return fallbackKeys;
}

function normalizeText(value) {
  return String(value || "").trim().toLowerCase();
}

function normalizePhone(value) {
  return String(value || "").replace(/\D+/g, "");
}

function normalizePhoneKey(value) {
  const digits = normalizePhone(value);
  if (!digits) return "";
  return digits.length > 9 ? digits.slice(-9) : digits;
}

function candidatePhoneNumbers(value) {
  const digits = normalizePhone(value);
  if (!digits) return [];

  const key = normalizePhoneKey(digits);
  const variants = new Set([digits, key]);
  if (digits.startsWith("0") && digits.length > 1) variants.add(digits.slice(1));
  if (!digits.startsWith("0")) variants.add(`0${digits}`);
  if (key) {
    variants.add(`0${key}`);
    variants.add(`233${key}`);
  }

  return Array.from(variants);
}

function buildSecretCode({ classId, date, email, phone }) {
  const pinSalt = resolvePinSalt();
  if (!pinSalt) {
    throw new Error("Missing required secret: ATTENDANCE_PIN_SALT");
  }

  const payload = [normalizeClassId(classId), String(date || "").trim(), normalizeText(email), normalizePhone(phone)].join("::");
  return crypto.createHash("sha256").update(`${pinSalt}::${payload}`).digest("hex").slice(0, 10).toUpperCase();
}

function resolveStudentPhone(student = {}) {
  return (
    student.phone ||
    student.phoneNumber ||
    student.phone_number ||
    student.contactNumber ||
    student.contactNo ||
    ""
  );
}

function isStudentRoleAllowed(student = {}) {
  const role = normalizeText(student.role);
  return !role || role === "student";
}

function isStudentStatusAllowed(student = {}) {
  const status = normalizeText(student.status);
  if (!status) return true;

  if (["inactive", "suspended", "blocked", "deleted", "archived"].includes(status)) {
    return false;
  }

  return ["active", "paid", "enrolled"].includes(status) || true;
}

async function requireAuth(req) {
  const header = req.headers.authorization || "";
  const match = header.match(/^Bearer (.+)$/);
  if (!match) {
    console.warn("auth_failure", { reason: "missing_bearer" });
    throw new Error("Missing Authorization Bearer token");
  }

  const decoded = await admin.auth().verifyIdToken(match[1]);

  if (teacherAllowlist.length > 0) {
    const email = String(decoded.email || "").toLowerCase();
    if (!teacherAllowlist.includes(email)) {
      console.warn("auth_failure", { reason: "allowlist_reject", uid: decoded.uid, email });
      throw new Error("Not allowed");
    }
  }

  return decoded;
}

registerStudentProfileUpdateRoute({ app, db, admin, requireAuth, staffEmails: teacherAllowlist });

function sessionDocRef(classId, sessionId) {
  return db.doc(`attendance/${classId}/sessions/${sessionId}`);
}

function resolveSessionMetadata({ assignmentId, sessionLabel, lesson, topic, chapter, existingSession = {} }) {
  const canonicalAssignmentId = String(
    assignmentId || existingSession.assignmentId || existingSession.assignment_id || ""
  ).trim();
  const resolvedTopic = String(topic || existingSession.topic || sessionLabel || lesson || existingSession.sessionLabel || "").trim();
  const resolvedChapter = String(chapter || existingSession.chapter || parseAssignmentChapter(canonicalAssignmentId)).trim();
  const resolvedSessionLabel = String(sessionLabel || lesson || existingSession.sessionLabel || resolvedTopic).trim();

  return {
    assignmentId: canonicalAssignmentId,
    topic: resolvedTopic,
    chapter: resolvedChapter,
    sessionLabel: resolvedSessionLabel,
  };
}


function isIsoDate(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(value || "").trim());
}

function toDateValue(value) {
  return new Date(`${String(value || "").trim()}T00:00:00.000Z`);
}

function resolveSessionIdCandidates(sessionId) {
  const normalized = String(sessionId || "").trim();
  if (!normalized) return [];

  // Always resolve to the exact session id to avoid accidental day offsets
  // (for example, checking into Day 2 while opening Day 1).
  return [normalized];
}

async function getExistingSessionRef(classId, sessionId) {
  const candidates = resolveSessionIdCandidates(sessionId);

  for (const candidateSessionId of candidates) {
    const candidateRef = sessionDocRef(classId, candidateSessionId);
    const candidateSnap = await candidateRef.get();
    if (candidateSnap.exists) {
      return {
        requestedRef: sessionDocRef(classId, String(sessionId || "").trim()),
        existingRef: candidateRef,
        existingSnap: candidateSnap,
        usedFallback: candidateSessionId !== String(sessionId || "").trim(),
      };
    }
  }

  return {
    requestedRef: sessionDocRef(classId, String(sessionId || "").trim()),
    existingRef: null,
    existingSnap: null,
    usedFallback: false,
  };
}

app.post("/openSession", async (req, res) => {
  try {
    const user = await requireAuth(req);

    const body = req.body || {};
    const classId = normalizeClassComparable(body.classId || body.className);
    const {
      sessionId: rawSessionId,
      date,
      action,
      windowMinutes,
      sessionLabel,
      lesson,
      assignmentId,
      topic,
      chapter,
    } = body;
    const sessionId = String(rawSessionId || "").trim();

    if (!classId || !sessionId) {
      return res.status(400).json({ error: "classId and sessionId are required" });
    }

    const ref = sessionDocRef(classId, sessionId);

    if (action === "close") {
      await ref.set(
        {
          classId,
          sessionId,
          opened: false,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          closedBy: user.uid,
        },
        { merge: true }
      );
      return res.json({ ok: true, opened: false });
    }

    const now = admin.firestore.Timestamp.now();
    const mins = Number(windowMinutes || 180);
    const openTo = admin.firestore.Timestamp.fromMillis(now.toMillis() + mins * 60 * 1000);

    const existing = await ref.get();
    const existingSession = existing.exists ? existing.data() : {};
    const metadata = resolveSessionMetadata({ assignmentId, sessionLabel, lesson, topic, chapter, existingSession });
    const payload = {
      classId,
      sessionId,
      date: String(date || existingSession.date || "").trim(),
      sessionLabel: metadata.sessionLabel,
      assignmentId: metadata.assignmentId,
      topic: metadata.topic,
      chapter: metadata.chapter,
      assignment_id: admin.firestore.FieldValue.delete(),
      opened: true,
      openFrom: now,
      openTo,
      createdBy: user.uid,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    if (!existing.exists) {
      payload.createdAt = admin.firestore.FieldValue.serverTimestamp();
    }

    await ref.set(payload, { merge: true });

    return res.json({ ok: true, opened: true, openFrom: now.toMillis(), openTo: openTo.toMillis() });
  } catch (e) {
    return res.status(401).json({ error: e?.message || "Unauthorized" });
  }
});

app.post("/checkin", async (req, res) => {
  try {
    const body = req.body || {};
    const rateLimit = consumeCheckinRateLimit(req, body);
    if (!rateLimit.allowed) {
      res.set("Retry-After", String(rateLimit.retryAfterSeconds || 60));
      return res.status(429).json({ error: "Too many check-in attempts. Please wait a minute and try again." });
    }
    const classId = normalizeClassComparable(body.classId || body.className);
    const {
      sessionId: rawSessionId,
      date,
      email,
      phoneNumber,
      sessionLabel,
      lesson,
      assignmentId,
      topic,
      chapter,
    } = body;
    const sessionId = String(rawSessionId || "").trim();

    if (!classId || !sessionId || !email || !phoneNumber) {
      return res.status(400).json({ error: "classId, sessionId, email, phoneNumber are required" });
    }

    const sessionLookup = await getExistingSessionRef(classId, sessionId);
    if (!sessionLookup.existingSnap) {
      return res.status(400).json({ error: "Session not opened" });
    }

    const sessionRef = sessionLookup.existingRef || sessionLookup.requestedRef;
    const sessionSnap = sessionLookup.existingSnap;

    const session = sessionSnap.data();
    const metadata = resolveSessionMetadata({ assignmentId, sessionLabel, lesson, topic, chapter, existingSession: session });
    if (!session.opened) return res.status(400).json({ error: "Check-in is closed" });

    const now = admin.firestore.Timestamp.now();
    const openFrom = session.openFrom;
    const openTo = session.openTo;

    if (openFrom && now.toMillis() < openFrom.toMillis()) return res.status(400).json({ error: "Check-in not started" });
    if (openTo && now.toMillis() > openTo.toMillis()) return res.status(400).json({ error: "Check-in time ended" });

    const rawEmail = String(email || "").trim();
    const normalizedEmail = normalizeText(rawEmail);
    const normalizedPhone = normalizePhoneKey(phoneNumber);

    function uniqueStudentDocs(docs = []) {
      const seen = new Set();
      return docs.filter((studentDoc) => {
        if (!studentDoc?.id || seen.has(studentDoc.id)) return false;
        seen.add(studentDoc.id);
        return true;
      });
    }

    async function findStudentsByEmail(candidateEmail) {
      if (!candidateEmail) return [];
      const qs = await db.collection(STUDENTS_COLLECTION).where("email", "==", candidateEmail).limit(10).get();
      return qs.docs;
    }

    async function findStudentsByPhone(candidatePhone) {
      if (!candidatePhone) return [];
      const phoneFields = ["phone", "phoneNumber", "phone_number", "contactNumber", "contactNo"];
      const matches = [];
      for (const field of phoneFields) {
        const qs = await db.collection(STUDENTS_COLLECTION).where(field, "==", candidatePhone).limit(10).get();
        matches.push(...qs.docs);
      }
      return uniqueStudentDocs(matches);
    }

    const emailCandidates = [];
    for (const emailCandidate of [...new Set([rawEmail, normalizedEmail].filter(Boolean))]) {
      emailCandidates.push(...await findStudentsByEmail(emailCandidate));
    }

    const phoneCandidates = [];
    for (const phoneCandidate of candidatePhoneNumbers(phoneNumber)) {
      phoneCandidates.push(...await findStudentsByPhone(phoneCandidate));
    }

    const candidateDocs = uniqueStudentDocs([...emailCandidates, ...phoneCandidates]);
    if (!candidateDocs.length) return res.status(404).json({ error: "Student not found" });

    const candidatesWithStoredPhone = candidateDocs.filter((candidate) => normalizePhoneKey(resolveStudentPhone(candidate.data())));
    if (!candidatesWithStoredPhone.length) {
      return res.status(400).json({ error: "Student phone is missing in records" });
    }

    const identityMatchedDocs = candidatesWithStoredPhone.filter((candidate) => {
      const candidateData = candidate.data();
      const candidateEmail = normalizeText(candidateData.email || candidateData.emailAddress || candidateData["e-mail"]);
      const candidatePhone = normalizePhoneKey(resolveStudentPhone(candidateData));
      return Boolean(normalizedEmail && normalizedPhone && candidateEmail === normalizedEmail && candidatePhone === normalizedPhone);
    });
    if (!identityMatchedDocs.length) {
      return res.status(400).json({ error: "Email and phone number do not match student records" });
    }

    const studentRoleDocs = identityMatchedDocs.filter((candidate) => isStudentRoleAllowed(candidate.data()));
    if (!studentRoleDocs.length) return res.status(400).json({ error: "Not a student account" });

    const activeStudentDocs = studentRoleDocs.filter((candidate) => isStudentStatusAllowed(candidate.data()));
    if (!activeStudentDocs.length) return res.status(400).json({ error: "Student not active" });

    const canonicalClassKeys = await resolveCanonicalClassKeys(classId);
    let studentDoc = activeStudentDocs.find((candidate) =>
      studentMatchesCanonicalClass(candidate.data(), canonicalClassKeys)
    );

    if (!studentDoc) {
      for (const candidate of activeStudentDocs) {
        const candidateData = candidate.data();
        const candidateEmail = normalizeText(candidateData.email || candidateData.emailAddress || candidateData["e-mail"] || normalizedEmail);
        try {
          if (await isStudentOnPublishedRoster(candidateEmail, canonicalClassKeys)) {
            studentDoc = candidate;
            break;
          }
        } catch (error) {
          console.warn("published_roster_check_failed", {
            classId,
            email: candidateEmail,
            message: error?.message || String(error),
          });
        }
      }
    }

    if (!studentDoc) return res.status(400).json({ error: "Student not in this class" });

    const st = studentDoc.data();
    const storedPhone = normalizePhoneKey(resolveStudentPhone(st));

    const uid = st.uid || studentDoc.id;

    const checkinDocId = String(uid || st.studentCode || st.studentcode || studentDoc.id || "").trim();
    const checkinRef = sessionRef.collection("checkins").doc(checkinDocId);
    const checkinSnap = await checkinRef.get();
    if (checkinSnap.exists) {
      await checkinRef.set({
        attemptCount: admin.firestore.FieldValue.increment(1),
        lastDuplicateAttemptAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      }, { merge: true });
      return res.status(409).json({
        error: "You have already checked in for this session.",
        ok: true,
        duplicate: true,
        savedSessionId: sessionRef.id,
        requestedSessionId: sessionId,
        maskedEmail: maskEmail(rawEmail),
        submittedAt: Date.now(),
      });
    }

    const checkinPayload = {
      uid,
      studentCode: st.studentCode || st.studentcode || "",
      name: st.name || "",
      email: st.email || "",
      phoneNumber: resolveStudentPhone(st),
      secretCode: buildSecretCode({ classId, date: sessionId, email: st.email || normalizedEmail, phone: storedPhone }),
      classId,
      sessionId: sessionRef.id,
      date: String(date || session.date || "").trim(),
      sessionLabel: metadata.sessionLabel,
      assignmentId: metadata.assignmentId,
      topic: metadata.topic,
      chapter: metadata.chapter,
      assignment_id: admin.firestore.FieldValue.delete(),
      status: "present",
      method: "qr",
      source: "student_self_checkin",
      submittedAt: admin.firestore.FieldValue.serverTimestamp(),
      attemptCount: 1,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      checkedInAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    if (!checkinSnap.exists) {
      checkinPayload.createdAt = admin.firestore.FieldValue.serverTimestamp();
    }

    await checkinRef.set(checkinPayload, { merge: true });

    return res.json({
      ok: true,
      savedSessionId: sessionRef.id,
      requestedSessionId: sessionId,
      usedFallbackSession: sessionLookup.usedFallback,
      maskedEmail: maskEmail(rawEmail),
      submittedAt: Date.now(),
    });
  } catch (e) {
    return res.status(500).json({ error: e?.message || "Server error" });
  }
});

app.get("/checkinStatus", async (req, res) => {
  try {
    const classId = normalizeClassComparable(req.query.classId || req.query.className);
    const sessionId = String(req.query.sessionId || req.query.session || "").trim();

    if (!classId || !sessionId) {
      return res.status(400).json({ error: "classId and sessionId are required" });
    }

    const sessionLookup = await getExistingSessionRef(classId, sessionId);
    const sessionRef = sessionLookup.requestedRef;
    const sessionSnap = sessionLookup.existingSnap || await sessionRef.get();
    if (!sessionSnap.exists) {
      return res.json({
        ok: true,
        status: "not_opened",
        opened: false,
        serverTime: admin.firestore.Timestamp.now().toMillis(),
      });
    }

    const session = sessionSnap.data() || {};
    const now = admin.firestore.Timestamp.now().toMillis();
    const opened = Boolean(session.opened);
    const openFrom = session.openFrom?.toMillis?.() || null;
    const openTo = session.openTo?.toMillis?.() || null;

    let status = "closed";
    if (opened) {
      if (openFrom && now < openFrom) status = "scheduled";
      else if (openTo && now > openTo) status = "ended";
      else status = "open";
    }

    return res.json({
      ok: true,
      status,
      opened,
      openFrom,
      openTo,
      serverTime: now,
    });
  } catch (e) {
    return res.status(500).json({ error: e?.message || "Server error" });
  }
});


async function mergeSessionDocuments({ classId, sourceSessionId, targetSessionId, deleteSource = false }) {
  const sourceRef = sessionDocRef(classId, sourceSessionId);
  const targetRef = sessionDocRef(classId, targetSessionId);

  const sourceSnap = await sourceRef.get();
  if (!sourceSnap.exists) {
    return { migrated: false, reason: "source_missing" };
  }

  const sourceData = sourceSnap.data() || {};
  const sourceCheckins = await sourceRef.collection("checkins").get();

  await targetRef.set(
    {
      ...sourceData,
      classId,
      sessionId: targetSessionId,
      legacySessionIds: admin.firestore.FieldValue.arrayUnion(String(sourceSessionId)),
      migratedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  for (const checkinDoc of sourceCheckins.docs) {
    await targetRef.collection("checkins").doc(checkinDoc.id).set(checkinDoc.data() || {}, { merge: true });
  }

  if (deleteSource && String(sourceSessionId) !== String(targetSessionId)) {
    for (const checkinDoc of sourceCheckins.docs) {
      await sourceRef.collection("checkins").doc(checkinDoc.id).delete();
    }
    await sourceRef.set(
      {
        migratedToSessionId: String(targetSessionId),
        migratedAt: admin.firestore.FieldValue.serverTimestamp(),
        opened: false,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
  }

  return {
    migrated: true,
    copiedCheckins: sourceCheckins.size,
  };
}

app.post("/migrateSessionIds", async (req, res) => {
  try {
    await requireAuth(req);

    const body = req.body || {};
    const classId = normalizeClassId(body.classId || body.className);
    const mapping = body.mapping && typeof body.mapping === "object" ? body.mapping : {};
    const dryRun = Boolean(body.dryRun);
    const deleteSource = Boolean(body.deleteSource);

    if (!classId) return res.status(400).json({ error: "classId is required" });
    const mapEntries = Object.entries(mapping)
      .map(([from, to]) => [String(from || "").trim(), String(to || "").trim()])
      .filter(([from, to]) => from && to && from !== to);

    if (mapEntries.length === 0) {
      return res.status(400).json({ error: "mapping must include at least one from->to sessionId pair" });
    }

    const result = [];
    for (const [fromSessionId, toSessionId] of mapEntries) {
      if (dryRun) {
        const sourceSnap = await sessionDocRef(classId, fromSessionId).get();
        const targetSnap = await sessionDocRef(classId, toSessionId).get();
        result.push({
          fromSessionId,
          toSessionId,
          sourceExists: sourceSnap.exists,
          targetExists: targetSnap.exists,
        });
        continue;
      }

      const migrated = await mergeSessionDocuments({
        classId,
        sourceSessionId: fromSessionId,
        targetSessionId: toSessionId,
        deleteSource,
      });
      result.push({ fromSessionId, toSessionId, ...migrated });
    }

    return res.json({ ok: true, classId, dryRun, deleteSource, result });
  } catch (e) {
    return res.status(500).json({ error: e?.message || "Server error" });
  }
});




function parseHolidayDateInput(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(value || "").trim());
}


function getAccraIsoDateParts(baseDate = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Accra",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(baseDate);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return {
    year: Number(values.year),
    month: Number(values.month),
    day: Number(values.day),
  };
}

function addDaysToIsoDate(year, month, day, days) {
  const utcDate = new Date(Date.UTC(year, month - 1, day + days));
  return utcDate.toISOString().slice(0, 10);
}

function getTomorrowIsoInAccra(baseDate = new Date()) {
  const { year, month, day } = getAccraIsoDateParts(baseDate);
  return addDaysToIsoDate(year, month, day, 1);
}

function normalizeNoticeAudienceType(value) {
  return value === "class" ? "class" : "all_active";
}

function normalizeNoticeStatus(value) {
  return ["not_scheduled", "scheduled", "sent", "failed"].includes(value) ? value : "not_scheduled";
}

function resolveHolidayName(holiday = {}) {
  return String(holiday.name || holiday.localName || "Holiday").trim() || "Holiday";
}

function resolveNoticeConfig(source = {}, fallback = {}) {
  const audienceType = normalizeNoticeAudienceType(source.noticeAudienceType || fallback.noticeAudienceType);
  return {
    studentMessage: typeof source.studentMessage === "string" ? source.studentMessage : (typeof fallback.studentMessage === "string" ? fallback.studentMessage : ""),
    audienceType,
    className: audienceType === "class"
      ? String(source.noticeClassName || fallback.noticeClassName || "").trim()
      : "",
  };
}

function buildHolidayNoticePayload({ holiday, date, countryCode, noticeConfig, syncSecret }) {
  return {
    secret: syncSecret,
    action: "sendHolidayNotice",
    date,
    countryCode,
    holidayName: resolveHolidayName(holiday),
    studentMessage: noticeConfig.studentMessage,
    audienceType: noticeConfig.audienceType,
    className: noticeConfig.className,
  };
}

async function callHolidayNoticeAppsScript(payload) {
  const appsScriptUrl = String(holidaysAppsScriptUrlSecret.value() || process.env.HOLIDAYS_APPS_SCRIPT_URL || "").trim();
  if (!appsScriptUrl) throw new Error("Missing required env var: HOLIDAYS_APPS_SCRIPT_URL");

  const upstreamResponse = await fetch(appsScriptUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const responseJson = await upstreamResponse.json().catch(() => ({}));
  if (!upstreamResponse.ok || responseJson?.ok === false) {
    const upstreamError = responseJson?.error || responseJson?.message || `HTTP ${upstreamResponse.status}`;
    const error = new Error(upstreamError);
    error.details = responseJson;
    throw error;
  }

  return responseJson;
}

async function sendHolidayNoticeForDoc({ docRef, holiday, date, countryCode, noticeConfig }) {
  const syncSecret = String(holidaysSyncSecret.value() || process.env.HOLIDAYS_SYNC_SECRET || "").trim();
  if (!syncSecret) throw new Error("Missing required env var: HOLIDAYS_SYNC_SECRET");

  const payload = buildHolidayNoticePayload({ holiday, date, countryCode, noticeConfig, syncSecret });

  try {
    const responseJson = await callHolidayNoticeAppsScript(payload);
    const sent = Number(responseJson?.sent || 0);
    const skipped = Number(responseJson?.skipped || 0);
    const failed = Number(responseJson?.failed || 0);
    const recipientCount = sent;
    const status = failed > 0 && sent === 0 ? "failed" : "sent";
    const lastError = status === "failed" ? `Failed: ${failed}; skipped: ${skipped}` : "";

    await docRef.set({
      noticeStatus: status,
      noticeSentAt: status === "sent" ? admin.firestore.FieldValue.serverTimestamp() : null,
      noticeRecipientCount: recipientCount,
      noticeLastError: lastError,
      noticeLastCheckedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });

    return {
      ok: true,
      noticeStatus: status,
      noticeRecipientCount: recipientCount,
      noticeSentAt: new Date().toISOString(),
      noticeLastError: lastError,
      upstream: responseJson,
    };
  } catch (error) {
    const message = error?.message || "Holiday notice send failed";
    await docRef.set({
      noticeStatus: "failed",
      noticeLastError: message,
      noticeLastCheckedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });
    error.noticeResult = {
      ok: false,
      noticeStatus: "failed",
      noticeLastError: message,
      details: error?.details || null,
    };
    throw error;
  }
}

app.get("/holidays/upcoming", async (req, res) => {
  try {
    await requireAuth(req);

    const year = Number(req.query.year);
    const countryCode = String(req.query.countryCode || "GH").trim().toUpperCase() || "GH";
    if (!Number.isInteger(year) || year < 2000 || year > 2100) {
      return res.status(400).json({ error: "year must be a valid YYYY number" });
    }

    const todayIso = new Date().toISOString().slice(0, 10);
    const startDate = year === Number(todayIso.slice(0, 4)) ? todayIso : `${year}-01-01`;
    const endDate = `${year}-12-31`;

    const snapshot = await db
      .collection("holidayCalendar")
      .where("countryCode", "==", countryCode)
      .where("date", ">=", startDate)
      .where("date", "<=", endDate)
      .orderBy("date", "asc")
      .get();

    const holidays = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    return res.json({ holidays });
  } catch (e) {
    return res.status(401).json({ error: e?.message || "Unauthorized" });
  }
});

app.post("/holidays/import", async (req, res) => {
  try {
    await requireAuth(req);

    const year = Number(req.body?.year);
    const countryCode = String(req.body?.countryCode || "GH").trim().toUpperCase() || "GH";
    if (!Number.isInteger(year) || year < 2000 || year > 2100) {
      return res.status(400).json({ error: "year must be a valid YYYY number" });
    }

    const endpoint = `https://date.nager.at/api/v3/PublicHolidays/${year}/${countryCode}`;
    const upstreamResponse = await fetch(endpoint);
    if (!upstreamResponse.ok) {
      return res.status(502).json({ error: "Failed to fetch holidays from Nager.Date" });
    }

    const payload = await upstreamResponse.json();
    const holidays = Array.isArray(payload) ? payload : [];

    const batch = db.batch();
    for (const holiday of holidays) {
      const date = String(holiday?.date || "").trim();
      if (!parseHolidayDateInput(date)) continue;
      const docId = `${countryCode}_${date}`;
      const docRef = db.collection("holidayCalendar").doc(docId);
      const existingSnap = await docRef.get();
      const existing = existingSnap.exists ? existingSnap.data() : {};

      batch.set(
        docRef,
        {
          countryCode,
          date,
          localName: String(holiday?.localName || "").trim(),
          name: String(holiday?.name || "").trim(),
          types: Array.isArray(holiday?.types) ? holiday.types : [],
          schoolClosed: typeof existing?.schoolClosed === "boolean" ? existing.schoolClosed : true,
          adminNote: typeof existing?.adminNote === "string" ? existing.adminNote : (typeof existing?.notes === "string" ? existing.notes : ""),
          studentMessage: typeof existing?.studentMessage === "string" ? existing.studentMessage : "",
          autoSendNotice: typeof existing?.autoSendNotice === "boolean" ? existing.autoSendNotice : false,
          noticeAudienceType: normalizeNoticeAudienceType(existing?.noticeAudienceType),
          noticeClassName: typeof existing?.noticeClassName === "string" ? existing.noticeClassName : "",
          noticeStatus: normalizeNoticeStatus(existing?.noticeStatus),
          noticeRecipientCount: typeof existing?.noticeRecipientCount === "number" ? existing.noticeRecipientCount : 0,
          noticeLastError: typeof existing?.noticeLastError === "string" ? existing.noticeLastError : "",
          source: "Nager.Date",
          importedAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
    }

    await batch.commit();
    return res.json({ ok: true, year, countryCode, imported: holidays.length });
  } catch (e) {
    return res.status(500).json({ error: e?.message || "Server error" });
  }
});

async function updateHolidayHandler(req, res) {
  try {
    await requireAuth(req);

    const date = String(req.params.date || "").trim();
    const countryCode = String(req.body?.countryCode || "GH").trim().toUpperCase() || "GH";
    if (!parseHolidayDateInput(date)) return res.status(400).json({ error: "date must be YYYY-MM-DD" });

    const schoolClosed = req.body?.schoolClosed;
    const adminNote = typeof req.body?.adminNote === "string"
      ? req.body.adminNote
      : (typeof req.body?.notes === "string" ? req.body.notes : "");
    const studentMessage = typeof req.body?.studentMessage === "string" ? req.body.studentMessage : "";
    const autoSendNotice = req.body?.autoSendNotice === true;
    const noticeAudienceType = normalizeNoticeAudienceType(req.body?.noticeAudienceType);
    const noticeClassName = noticeAudienceType === "class" ? String(req.body?.noticeClassName || "").trim() : "";

    const docRef = db.collection("holidayCalendar").doc(`${countryCode}_${date}`);
    const existingSnap = await docRef.get();
    const existing = existingSnap.exists ? existingSnap.data() : {};
    const existingStatus = normalizeNoticeStatus(existing?.noticeStatus);
    const noticeStatus = existingStatus === "sent"
      ? "sent"
      : (autoSendNotice ? "scheduled" : "not_scheduled");

    const updatePayload = {
      countryCode,
      date,
      adminNote,
      studentMessage,
      autoSendNotice,
      noticeAudienceType,
      noticeClassName,
      noticeStatus,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    if (typeof schoolClosed === "boolean") {
      updatePayload.schoolClosed = schoolClosed;
    }

    await docRef.set(updatePayload, { merge: true });

    return res.json({ ok: true, date, countryCode, noticeStatus });
  } catch (e) {
    return res.status(500).json({ error: e?.message || "Server error" });
  }
}

app.post("/holidays/:date/update", updateHolidayHandler);
app.patch("/holidays/:date/update", updateHolidayHandler);



app.post("/holidays/:date/send-now", async (req, res) => {
  try {
    await requireAuth(req);

    const date = String(req.params.date || "").trim();
    const countryCode = String(req.body?.countryCode || "GH").trim().toUpperCase() || "GH";
    if (!parseHolidayDateInput(date)) return res.status(400).json({ error: "date must be YYYY-MM-DD" });

    const docRef = db.collection("holidayCalendar").doc(`${countryCode}_${date}`);
    const snap = await docRef.get();
    if (!snap.exists) return res.status(404).json({ error: "Holiday not found" });

    const holiday = snap.data() || {};
    const noticeConfig = resolveNoticeConfig(req.body || {}, holiday);
    if (!noticeConfig.studentMessage.trim()) {
      return res.status(400).json({ error: "studentMessage is required before sending a holiday notice" });
    }
    if (noticeConfig.audienceType === "class" && !noticeConfig.className) {
      return res.status(400).json({ error: "className is required when audienceType is class" });
    }

    await docRef.set({
      studentMessage: noticeConfig.studentMessage,
      noticeAudienceType: noticeConfig.audienceType,
      noticeClassName: noticeConfig.className,
      noticeLastCheckedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });

    const result = await sendHolidayNoticeForDoc({
      docRef,
      holiday,
      date,
      countryCode,
      noticeConfig,
    });

    return res.json(result);
  } catch (e) {
    const status = e?.noticeResult ? 502 : 500;
    return res.status(status).json({ error: e?.message || "Holiday notice send failed", details: e?.noticeResult || e?.details || null });
  }
});

app.post("/holidays/sync-sheet", async (req, res) => {
  try {
    await requireAuth(req);

    const appsScriptUrl = String(holidaysAppsScriptUrlSecret.value() || process.env.HOLIDAYS_APPS_SCRIPT_URL || "").trim();
    const syncSecret = String(holidaysSyncSecret.value() || process.env.HOLIDAYS_SYNC_SECRET || "").trim();

    if (!appsScriptUrl) {
      return res.status(500).json({ error: "Missing required env var: HOLIDAYS_APPS_SCRIPT_URL" });
    }
    if (!syncSecret) {
      return res.status(500).json({ error: "Missing required env var: HOLIDAYS_SYNC_SECRET" });
    }

    const year = Number(req.body?.year);
    const countryCode = String(req.body?.countryCode || "GH").trim().toUpperCase() || "GH";
    if (!Number.isInteger(year) || year < 2000 || year > 2100) {
      return res.status(400).json({ error: "year must be a valid YYYY number" });
    }

    const snapshot = await db
      .collection("holidayCalendar")
      .where("countryCode", "==", countryCode)
      .where("date", ">=", `${year}-01-01`)
      .where("date", "<=", `${year}-12-31`)
      .orderBy("date", "asc")
      .get();

    const holidays = snapshot.docs.map((doc) => {
      const holiday = doc.data() || {};
      return {
        date: String(holiday.date || "").trim(),
        name: String(holiday.name || "").trim(),
        localName: String(holiday.localName || "").trim(),
        countryCode: String(holiday.countryCode || countryCode).trim().toUpperCase(),
        types: Array.isArray(holiday.types) ? holiday.types : [],
        schoolClosed: Boolean(holiday.schoolClosed),
        adminNote: typeof holiday.adminNote === "string"
          ? holiday.adminNote
          : (typeof holiday.notes === "string" ? holiday.notes : ""),
        studentMessage: typeof holiday.studentMessage === "string" ? holiday.studentMessage : "",
        autoSendNotice: Boolean(holiday.autoSendNotice),
        noticeAudienceType: normalizeNoticeAudienceType(holiday.noticeAudienceType),
        noticeClassName: typeof holiday.noticeClassName === "string" ? holiday.noticeClassName : "",
        noticeStatus: normalizeNoticeStatus(holiday.noticeStatus),
      };
    });

    const upstreamResponse = await fetch(appsScriptUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        secret: syncSecret,
        action: "syncHolidays",
        year,
        countryCode,
        holidays,
      }),
    });

    const responseJson = await upstreamResponse.json().catch(() => ({}));
    if (!upstreamResponse.ok || responseJson?.ok === false) {
      return res.status(502).json({ error: "Holiday sheet sync upstream request failed", details: responseJson });
    }

    return res.json(responseJson);
  } catch (e) {
    return res.status(401).json({ error: e?.message || "Unauthorized" });
  }
});

app.post("/class-schedule/sync", async (req, res) => {
  try {
    await requireAuth(req);

    const appsScriptUrl = String(classScheduleAppsScriptUrlSecret.value() || process.env.CLASS_SCHEDULE_APPS_SCRIPT_URL || "").trim();
    const syncSecret = String(classScheduleSyncSecret.value() || process.env.CLASS_SCHEDULE_SYNC_SECRET || "").trim();

    if (!appsScriptUrl) {
      return res.status(500).json({ error: "Missing required env var: CLASS_SCHEDULE_APPS_SCRIPT_URL" });
    }
    if (!syncSecret) {
      return res.status(500).json({ error: "Missing required env var: CLASS_SCHEDULE_SYNC_SECRET" });
    }

    const body = req.body || {};
    const className = String(body.className || "").trim();
    const startDate = String(body.startDate || "").trim();
    const endDate = String(body.endDate || "").trim();
    const time = String(body.time || "").trim();
    const meetingDays = Array.isArray(body.meetingDays)
      ? body.meetingDays.map((day) => String(day || "").trim()).filter(Boolean)
      : [];

    const monTime = String(body.monTime || "").trim();
    const tueTime = String(body.tueTime || "").trim();
    const wedTime = String(body.wedTime || "").trim();
    const thuTime = String(body.thuTime || "").trim();
    const friTime = String(body.friTime || "").trim();
    const satTime = String(body.satTime || "").trim();
    const sunTime = String(body.sunTime || "").trim();

    if (!className) return res.status(400).json({ error: "className is required" });
    if (!isIsoDate(startDate)) return res.status(400).json({ error: "startDate must be YYYY-MM-DD" });
    if (!isIsoDate(endDate)) return res.status(400).json({ error: "endDate must be YYYY-MM-DD" });
    if (toDateValue(endDate) < toDateValue(startDate)) {
      return res.status(400).json({ error: "endDate must be the same day or after startDate" });
    }
    if (!time) return res.status(400).json({ error: "time is required" });
    if (meetingDays.length === 0) return res.status(400).json({ error: "meetingDays must contain at least one day" });

    const upstreamResponse = await fetch(appsScriptUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "syncClassSchedule",
        secret: syncSecret,
        className,
        startDate,
        endDate,
        time,
        meetingDays,
        monTime,
        tueTime,
        wedTime,
        thuTime,
        friTime,
        satTime,
        sunTime,
      }),
    });

    const responseJson = await upstreamResponse.json().catch(() => ({}));
    if (!upstreamResponse.ok) {
      return res.status(502).json({ error: "Class schedule sync upstream request failed", details: responseJson });
    }

    return res.json(responseJson);
  } catch (e) {
    return res.status(401).json({ error: e?.message || "Unauthorized" });
  }
});

app.post("/orientation/sync", async (req, res) => {
  try {
    await requireAuth(req);

    const appsScriptUrl = String(orientationAppsScriptUrlSecret.value() || process.env.ORIENTATION_APPS_SCRIPT_URL || "").trim();
    const syncSecret = String(orientationSyncSecret.value() || process.env.ORIENTATION_SYNC_SECRET || "").trim();

    if (!appsScriptUrl) {
      return res.status(500).json({ error: "Missing required env var: ORIENTATION_APPS_SCRIPT_URL" });
    }
    if (!syncSecret) {
      return res.status(500).json({ error: "Missing required env var: ORIENTATION_SYNC_SECRET" });
    }

    const body = req.body || {};
    const name = String(body.name || "").trim();
    const email = String(body.email || "").trim();
    const level = String(body.level || "").trim().toUpperCase();
    const startDate = String(body.startDate || "").trim();
    const studentCode = String(body.studentCode || "").trim();

    if (!name) return res.status(400).json({ error: "name is required" });
    if (!email) return res.status(400).json({ error: "email is required" });
    if (!["A1", "A2", "B1"].includes(level)) return res.status(400).json({ error: "level must be A1, A2, or B1" });
    if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate)) return res.status(400).json({ error: "startDate must be YYYY-MM-DD" });

    const upstreamResponse = await fetch(appsScriptUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ secret: syncSecret, name, email, level, startDate, studentCode }),
    });

    const responseJson = await upstreamResponse.json().catch(() => ({}));
    if (!upstreamResponse.ok) {
      return res.status(502).json({ error: "Orientation sync upstream request failed", details: responseJson });
    }

    return res.json(responseJson);
  } catch (e) {
    return res.status(401).json({ error: e?.message || "Unauthorized" });
  }
});

function safeRegistryId(value) {
  return String(value || "")
    .trim()
    .replace(/[/#?[\]]+/g, "_")
    .replace(/_{2,}/g, "_");
}

async function loadAnswerKeyRegistryEntry(assignmentKey = "") {
  const safeAssignmentKey = safeRegistryId(assignmentKey);
  if (!safeAssignmentKey) return null;
  const snap = await db.collection("answerKeyRegistry").doc(safeAssignmentKey).get();
  return snap.exists ? { id: snap.id, ...snap.data() } : null;
}

function readSubmissionAssignmentKey(data = {}) {
  return String(data.assignmentKey || data.assignment_key || data.assignmentId || data.assignment_id || data.canonicalAssignmentKey || data.assignment || "").trim();
}


const AI_FEEDBACK_MIN_WORDS = 80;
const AI_FEEDBACK_MAX_WORDS = 120;

function countWords(value) {
  return String(value || "").trim().split(/\s+/).filter(Boolean).length;
}

function limitWords(value, maxWords = AI_FEEDBACK_MAX_WORDS) {
  const words = String(value || "").trim().split(/\s+/).filter(Boolean);
  return words.slice(0, maxWords).join(" ");
}

function stripBoldMarkdown(value = "") {
  return String(value || "").replace(/\*\*/g, "");
}

function normalizeAiMarkingResult(result = {}, payload = {}) {
  const assignmentKey = String(result.assignmentKey || payload.assignmentKey || payload.referenceEntry?.assignmentKey || "").trim();
  const level = String(result.level || payload.level || payload.referenceEntry?.level || payload.submission?.level || "UNKNOWN").trim() || "UNKNOWN";
  const feedback = limitWords(stripBoldMarkdown(result.feedback || "AI marking completed. Review the score, corrections, and suggested improvements before sending feedback to the student."));
  const finalScore = Number.isFinite(Number(result.finalScore ?? result.score)) ? Math.max(0, Math.min(100, Math.round(Number(result.finalScore ?? result.score)))) : 0;
  const status = ["marked", "needs_review"].includes(String(result.status || "").toLowerCase()) ? String(result.status).toLowerCase() : "needs_review";

  return {
    score: finalScore,
    passed: Boolean(result.passed ?? finalScore >= 60),
    level,
    assignmentKey,
    detectedParts: Array.isArray(result.detectedParts) ? result.detectedParts : [],
    parts: Array.isArray(result.parts) ? result.parts : [],
    objectiveScore: result.objectiveScore ?? null,
    objectiveCorrect: Number(result.objectiveCorrect || 0),
    objectiveTotal: Number(result.objectiveTotal || 0),
    writingScore: result.writingScore ?? null,
    writingScorePercent: result.writingScorePercent ?? result.writingScore ?? null,
    maxWritingScore: result.maxWritingScore ?? null,
    writingStrengths: Array.isArray(result.writingStrengths)
      ? result.writingStrengths
      : result.writingStrengths ? [String(result.writingStrengths)] : [],
    taskCompletion: result.taskCompletion && typeof result.taskCompletion === "object" ? result.taskCompletion : null,
    missingTaskPoints: Array.isArray(result.missingTaskPoints) ? result.missingTaskPoints : [],
    nextStep: String(result.nextStep || result.writingNextStep || result.improvementTarget || "").trim(),
    writingNextStep: String(result.writingNextStep || result.nextStep || result.improvementTarget || "").trim(),
    writing: result.writing && typeof result.writing === "object" ? result.writing : null,
    rubric: result.rubric && typeof result.rubric === "object" ? result.rubric : null,
    finalScore,
    feedback,
    corrections: Array.isArray(result.corrections) ? result.corrections : [],
    improvementSummary: stripBoldMarkdown(result.improvementSummary || feedback),
    confidence: Number.isFinite(Number(result.confidence)) ? Math.max(0, Math.min(1, Number(result.confidence))) : 0.5,
    status,
    shouldSendAutomatically: Boolean(result.shouldSendAutomatically) && status === "marked",
    dataModel: {
      answerKeyPath: assignmentKey ? `answerKeyRegistry/${assignmentKey}` : "answerKeyRegistry/{assignmentKey}",
      markingResultPath: payload.submission?.id ? `markingResults/${payload.submission.id}` : "markingResults/{submissionId}",
      markingJobPath: "markingJobs/{jobId}",
    },
    ai: {
      provider: "openai",
      feedbackWordCount: countWords(feedback),
    },
  };
}

function buildMarkingPrompt(payload = {}) {
  return [
    "You are Falowen's German examiner AI. Mark the complete submission with AI.",
    "Use the supplied answerKeyRegistry entry as the source of truth for objective answers. Do not invent missing objective keys; if a required key is missing, set status to needs_review and explain it.",
    "For objective answers, accept correct option letters, correct text, letter plus text, close spelling, and meaningful stems. If the student gives a wrong option letter with the correct text, mark that item needs_review for conflicting option letter and answer text. If the option letter is correct but text is different, the letter is primary and correct.",
    "Route A2/B1 teil2 as writing, teil3 Lesen as objective, and teil4 Hören as objective. Use parts.teil3 for Lesen, parts.teil4 for Hören, and parts.main for A1 objective work. If any required objective answer key is missing, do not guess; mark needs_review.",
    "Teil 2 Schreiben must be graded even when the reference answer only contains Teil 3/Teil 4 objective keys. Never award 100 solely because objective questions are all correct when a writing section is present; include a writingScore and combine it with the objectiveScore for finalScore.",
    "For writing, assess task completion, CEFR-appropriate grammar, word order, vocabulary, spelling, structure, and clarity. Return writingStrengths as one or two short evidence-based strengths that quote or name exact details from the student's text. Return taskCompletion as an object with completed, total, and missing. Return corrections as one or two objects with from, to, reason, and partId 'teil2'; use an empty array when there is no genuine correction. Return nextStep as one specific task-relevant improvement or extension goal. Never invent a correction merely to fill a field, and avoid generic writing comments.",
    "Develop feedback uniquely from this assignment’s title, task, answer-key objectives, objectiveFeedbackContext, and the student’s actual response. Do not reuse a stock opening or a fixed feedback template. Every feedback response must include at least two unique anchors from the student's work, such as a quoted short phrase they wrote, the assignment topic, a missed question number, a specific option selected, or a task requirement they completed or missed.",
    "Do not start with reusable phrases such as \"Good effort\", \"Well done\", \"Great job\", or \"You did a good job\" unless immediately followed by a specific quoted detail from this submission. If the draft feedback could be sent unchanged to another student, rewrite it with exact evidence from this submission.",
    "When a submission contains both objective and writing work, integrate both naturally in one response and match the emphasis to the result. If both sections are perfect, enthusiastically praise the student. If the objective section is strong but writing needs work, praise the objective understanding before prioritizing specific writing improvements. If the writing is strong but the objective section needs work, praise the writing before directing the student to the exact missed objectives. State the supplied objective result accurately and never invent errors or corrections.",
    `Return JSON only. The feedback field must be ${AI_FEEDBACK_MIN_WORDS} to ${AI_FEEDBACK_MAX_WORDS} words, plain text only, with no Markdown, bold markers, or asterisks. Use the available space for specific, actionable guidance rather than filler. Include score/finalScore 0-100, status marked or needs_review, confidence 0-1, detectedParts, parts, objective totals, writingScore, writingScorePercent, writingStrengths, taskCompletion, missingTaskPoints, corrections, nextStep, and improvementSummary.`,
    `Payload: ${JSON.stringify(payload)}`,
  ].join("\n\n");
}

async function callOpenAiForMarking(payload = {}) {
  const apiKey = String(openAiApiKeySecret.value() || process.env.OPENAI_API_KEY || "").trim();
  if (!apiKey) {
    const error = new Error("OPENAI_API_KEY is not configured");
    error.statusCode = 503;
    throw error;
  }

  const model = String(process.env.OPENAI_MARKING_MODEL || "gpt-4o-mini").trim();
  const assignmentKey = String(payload.assignmentKey || payload.referenceEntry?.assignmentKey || "").trim();
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      authorization: `Bearer ${apiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model,
      temperature: 0.1,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: "Return valid JSON only. Do not include markdown." },
        { role: "user", content: buildMarkingPrompt(payload) },
      ],
    }),
  });

  const bodyText = await response.text();
  if (!response.ok) {
    const error = new Error(bodyText || "OpenAI marking request failed");
    error.statusCode = response.status;
    throw error;
  }

  const body = JSON.parse(bodyText);
  const content = body?.choices?.[0]?.message?.content || "{}";
  const parsed = JSON.parse(content);
  const normalized = normalizeAiMarkingResult(parsed, payload);
  console.info("[marking-diagnostic]", {
    assignmentKey,
    detectedWritingPart: normalized.detectedParts.some((part) => /teil\s*2|writing|schreiben/i.test(String(part?.partId || part?.id || part))),
    model,
    returnedFields: Object.keys(parsed).sort(),
    structuredWritingEvidence: Boolean(normalized.writingStrengths.length || normalized.taskCompletion || normalized.corrections.length || normalized.nextStep),
    originalAiFeedbackExists: Boolean(String(parsed.feedback || "").trim()),
    deploymentRevision: String(process.env.K_REVISION || process.env.GITHUB_SHA || "unknown"),
  });
  return normalized;
}


function cleanIdentifier(value) {
  return String(value || "").trim();
}

function normalizeLower(value) {
  return cleanIdentifier(value).toLowerCase();
}

function uniqueNonEmpty(values = []) {
  return [...new Set(values.map(cleanIdentifier).filter(Boolean))];
}

async function deleteQuerySnapshot(queryRef, summary, label) {
  const snap = await queryRef.get();
  await Promise.all(snap.docs.map((docSnap) => docSnap.ref.delete()));
  summary.deleted += snap.size;
  summary.collections[label] = (summary.collections[label] || 0) + snap.size;
}

async function deleteMatchingCollectionDocs(collectionId, fieldNames, values, summary) {
  for (const fieldName of fieldNames) {
    for (const value of values) {
      await deleteQuerySnapshot(
        db.collection(collectionId).where(fieldName, "==", value),
        summary,
        collectionId,
      );
    }
  }
}

async function deleteMatchingCollectionGroupDocs(collectionId, fieldNames, values, summary) {
  for (const fieldName of fieldNames) {
    for (const value of values) {
      await deleteQuerySnapshot(
        db.collectionGroup(collectionId).where(fieldName, "==", value),
        summary,
        `${collectionId}/*`,
      );
    }
  }
}

async function deleteKnownNestedSubmissionScopes(studentCodeValues, summary) {
  const levelValues = ["A1", "A2", "B1", "a1", "a2", "b1"];
  for (const level of levelValues) {
    for (const code of studentCodeValues) {
      const scopeRef = db.doc(`submissions/${level}/${code}`);
      await db.recursiveDelete(scopeRef).catch(() => undefined);
      summary.deleted += 1;
      summary.collections["submissions/nested-scope"] = (summary.collections["submissions/nested-scope"] || 0) + 1;
    }
  }
}

async function removeStudentFromAttendanceMaps(identifierValues, summary) {
  const sessions = await db.collectionGroup("sessions").get();
  const deleteValue = admin.firestore.FieldValue.delete();
  const exactIdentifiers = new Set(identifierValues.map(cleanIdentifier));
  const lowerIdentifiers = new Set(identifierValues.map(normalizeLower));
  let updated = 0;
  for (const session of sessions.docs) {
    const data = session.data() || {};
    if (!data.students || typeof data.students !== "object") continue;
    const updateArgs = [];
    for (const key of Object.keys(data.students)) {
      const entry = data.students[key] || {};
      const candidates = [key, entry.studentCode, entry.studentId, entry.uid, entry.email].map(cleanIdentifier);
      if (candidates.some((candidate) => exactIdentifiers.has(candidate) || lowerIdentifiers.has(normalizeLower(candidate)))) {
        updateArgs.push(new admin.firestore.FieldPath("students", key), deleteValue);
      }
    }
    if (updateArgs.length) {
      await session.ref.update(...updateArgs);
      updated += 1;
    }
  }
  summary.attendanceSessionMapsUpdated = updated;
}

async function deleteAuthUserIfPresent({ uid, email }) {
  const candidates = uniqueNonEmpty([uid]);
  if (email) {
    const user = await admin.auth().getUserByEmail(email).catch(() => null);
    if (user?.uid) candidates.push(user.uid);
  }
  const deleted = [];
  for (const candidate of uniqueNonEmpty(candidates)) {
    await admin.auth().deleteUser(candidate).then(() => deleted.push(candidate)).catch(() => undefined);
  }
  return deleted;
}

async function deleteStudentRowsFromSheet({ studentId, studentCode, email, student }) {
  const appsScriptUrl = String(studentDeleteAppsScriptUrlSecret.value() || process.env.STUDENT_DELETE_APPS_SCRIPT_URL || "").trim();
  const syncSecret = String(studentDeleteSyncSecret.value() || process.env.STUDENT_DELETE_SYNC_SECRET || "").trim();
  if (!appsScriptUrl || !syncSecret) {
    return { attempted: false, success: true, message: "Student delete Google Sheets webhook is not configured." };
  }

  const response = await fetch(appsScriptUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      secret: syncSecret,
      action: "deleteStudentAccount",
      studentId,
      studentCode,
      email,
      student,
    }),
  });
  const data = await response.json().catch(() => ({}));
  return {
    attempted: true,
    success: response.ok && data?.ok !== false,
    message: data?.message || (response.ok ? "Google Sheet cleanup completed." : "Google Sheet cleanup failed."),
    details: data,
  };
}

// BEGIN STUDENT PAYMENT LINKS
const PAYSTACK_API_BASE_URL = "https://api.paystack.co";
const PAYSTACK_CURRENCY = "GHS";
const PAYSTACK_CHARGE_RATE_FOR_STUDENTS = 0.0195;
const PAYSTACK_STUDENT_CHARGE_SHARE = 0.5;

function paymentNumber(value) {
  const parsed = Number(String(value ?? "").replace(/[^0-9.-]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

function roundMoney(value) {
  return Math.round((paymentNumber(value) + Number.EPSILON) * 100) / 100;
}

function calculateStudentCheckoutAmount(netAmount) {
  const amount = roundMoney(netAmount);
  if (amount <= 0) return 0;
  return Math.ceil(amount / (1 - PAYSTACK_CHARGE_RATE_FOR_STUDENTS * PAYSTACK_STUDENT_CHARGE_SHARE));
}

function paystackSecret() {
  return String(paystackSecretKeySecret.value() || process.env.PAYSTACK_SECRET || process.env.PAYSTACK_SECRET_KEY || "").trim();
}

function paystackCallbackUrl() {
  const paymentConfig = runtimeConfig.payments || {};
  return String(paymentConfig.callback_url || process.env.PAYSTACK_CALLBACK_URL || "").trim();
}

function safePaymentReferencePart(value) {
  return String(value || "student").replace(/[^a-zA-Z0-9.-]/g, "-").replace(/-+/g, "-").slice(0, 36) || "student";
}

function createPaymentReference(studentId) {
  const suffix = crypto.randomBytes(5).toString("hex");
  return "FAL-" + safePaymentReferencePart(studentId) + "-" + Date.now() + "-" + suffix;
}

function resolveStudentPaymentEmail(student = {}, requestedEmail = "") {
  return String(requestedEmail || student.email || student.studentEmail || "").trim().toLowerCase();
}

function resolveStudentCurrentBalance(student = {}) {
  const explicitValues = [student.balanceDue, student.balance, student.outstandingBalance, student.amountDue];
  for (const value of explicitValues) {
    if (value === null || value === undefined || String(value).trim() === "") continue;
    return roundMoney(Math.max(0, paymentNumber(value)));
  }
  const tuitionFee = paymentNumber(student.tuitionFee);
  const paid = resolveStudentCurrentPaid(student);
  return tuitionFee > 0 ? roundMoney(Math.max(0, tuitionFee - paid)) : 0;
}

function resolveStudentCurrentPaid(student = {}) {
  const values = [student.paid, student.amountPaid, student.amount_paid, student.totalPaid, student.initialPaymentAmount];
  for (const value of values) {
    if (value === null || value === undefined || String(value).trim() === "") continue;
    return roundMoney(Math.max(0, paymentNumber(value)));
  }
  return 0;
}

function paymentAdminEmailSet() {
  const paymentConfig = runtimeConfig.payments || {};
  const configuredEmails = [
    paymentConfig.admin_emails,
    process.env.PAYMENT_ADMIN_EMAILS,
  ]
    .flatMap((value) => String(value || "").split(","))
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);

  return new Set([
    "moxflex@gmail.com",
    ...teacherAllowlist,
    ...configuredEmails,
  ]);
}

async function requirePaymentAdmin(req) {
  const header = String(req.headers.authorization || "");
  const match = header.match(/^Bearer (.+)$/);
  if (!match) {
    const error = new Error("Missing Authorization Bearer token");
    error.statusCode = 401;
    throw error;
  }

  const decoded = await admin.auth().verifyIdToken(match[1]);
  const email = String(decoded.email || "").trim().toLowerCase();
  const role = String(decoded.role || decoded.user_role || "").trim().toLowerCase();
  const claimAllowed = decoded.admin === true || decoded.staff === true || role === "admin" || role === "staff";
  const emailAllowed = email && paymentAdminEmailSet().has(email);

  if (!claimAllowed && !emailAllowed) {
    console.warn("payment_admin_auth_failure", { uid: decoded.uid, email });
    const error = new Error("Admin or staff access required");
    error.statusCode = 403;
    throw error;
  }

  return decoded;
}

async function initializePaystackPayment({ email, checkoutAmount, reference, metadata }) {
  const secret = paystackSecret();
  if (!secret) {
    const error = new Error("PAYSTACK_SECRET is not configured");
    error.statusCode = 503;
    throw error;
  }

  const payload = {
    email,
    amount: String(Math.round(roundMoney(checkoutAmount) * 100)),
    currency: PAYSTACK_CURRENCY,
    reference,
    metadata: JSON.stringify(metadata),
  };
  const callbackUrl = paystackCallbackUrl();
  if (callbackUrl) payload.callback_url = callbackUrl;

  const response = await fetch(PAYSTACK_API_BASE_URL + "/transaction/initialize", {
    method: "POST",
    headers: {
      Authorization: "Bearer " + secret,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || data?.status !== true || !data?.data?.authorization_url) {
    const error = new Error(data?.message || "Paystack could not initialize this payment");
    error.statusCode = response.status || 502;
    throw error;
  }
  return data.data;
}

function webhookSignatureIsValid(req) {
  const secret = paystackSecret();
  const received = String(req.headers["x-paystack-signature"] || "").trim().toLowerCase();
  if (!secret || !received) return false;
  const candidates = [];
  if (Buffer.isBuffer(req.rawBody) && req.rawBody.length) candidates.push(req.rawBody);
  candidates.push(Buffer.from(JSON.stringify(req.body || {}), "utf8"));
  return candidates.some((payload) => crypto.createHmac("sha512", secret).update(payload).digest("hex").toLowerCase() === received);
}

async function applySuccessfulPaystackPayment(eventData = {}) {
  const reference = String(eventData.reference || "").trim();
  if (!reference) throw new Error("Paystack webhook is missing a transaction reference");

  const paymentRef = db.collection("payments").doc(reference);
  return db.runTransaction(async (transaction) => {
    const paymentSnap = await transaction.get(paymentRef);
    if (!paymentSnap.exists) throw new Error("Unknown Falowen payment reference: " + reference);
    const payment = paymentSnap.data() || {};
    if (String(payment.status || "").toLowerCase() === "paid") {
      return { duplicate: true, studentId: payment.studentId, reference };
    }

    const expectedSubunit = Math.round(paymentNumber(payment.checkoutAmount) * 100);
    const receivedSubunit = Number(eventData.amount || 0);
    const currency = String(eventData.currency || "").trim().toUpperCase();
    if (!Number.isFinite(receivedSubunit) || receivedSubunit !== expectedSubunit) {
      throw new Error("Paystack amount does not match the generated payment intent");
    }
    if (currency !== PAYSTACK_CURRENCY) throw new Error("Unexpected Paystack currency: " + currency);

    const studentId = String(payment.studentId || "").trim();
    if (!studentId) throw new Error("Payment intent is missing studentId");
    const studentRef = db.collection(STUDENTS_COLLECTION).doc(studentId);
    const studentSnap = await transaction.get(studentRef);
    if (!studentSnap.exists) throw new Error("Student record not found for payment");
    const student = studentSnap.data() || {};

    const tuitionCredit = roundMoney(payment.tuitionCredit);
    if (tuitionCredit <= 0) throw new Error("Payment intent has no tuition credit");
    const currentPaid = resolveStudentCurrentPaid(student);
    const nextPaid = roundMoney(currentPaid + tuitionCredit);
    const paymentPurpose = String(payment.purpose || "balance").trim().toLowerCase();
    const paidAtValue = eventData.paid_at || eventData.paidAt || null;
    const paidAtDate = paidAtValue ? new Date(paidAtValue) : new Date();
    const paymentTimestamp = paidAtValue ? admin.firestore.Timestamp.fromDate(paidAtDate) : admin.firestore.FieldValue.serverTimestamp();
    let nextBalance = 0;
    let paymentStatus = "Paid";
    let studentUpdate = {};

    if (paymentPurpose === "level_upgrade") {
      const upgradeStatus = String(student.upgradeStatus || "").trim().toLowerCase();
      const targetLevel = normalizeContractLevel(payment.targetLevel || student.upgradeToLevel);
      const expectedTargetLevel = normalizeContractLevel(student.upgradeToLevel);
      if (!["awaiting_payment", "pending", "expired"].includes(upgradeStatus)) throw new Error("Student has no payable level upgrade");
      if (!targetLevel || (expectedTargetLevel && targetLevel !== expectedTargetLevel)) throw new Error("Payment target level does not match the student upgrade");

      const currentUpgradeBalance = roundMoney(student.upgradeBalanceDue);
      if (currentUpgradeBalance <= 0) throw new Error("Student upgrade has no outstanding balance");
      if (tuitionCredit > currentUpgradeBalance + 0.01) throw new Error("Upgrade payment exceeds the remaining balance");

      const nextUpgradePaid = roundMoney(paymentNumber(student.upgradePaid) + tuitionCredit);
      const nextUpgradeBalance = roundMoney(Math.max(0, currentUpgradeBalance - tuitionCredit));
      const upgradeCompleted = nextUpgradeBalance <= 0;
      nextBalance = nextUpgradeBalance;
      paymentStatus = upgradeCompleted ? "Paid" : "Partially Paid";

      studentUpdate = {
        paid: nextPaid,
        upgradePaid: nextUpgradePaid,
        upgradeBalanceDue: nextUpgradeBalance,
        lastPaymentAmount: tuitionCredit,
        lastPaymentProvider: "Paystack",
        lastPaymentReference: reference,
        lastPaymentAt: paymentTimestamp,
        updated_at: admin.firestore.FieldValue.serverTimestamp(),
      };

      if (upgradeCompleted) {
        const extendedContractEnd = computeExtendedContractEnd(student.contractEnd, paidAtDate, CONTRACT_TERM_MONTHS);
        Object.assign(studentUpdate, {
          level: targetLevel,
          paidLevel: targetLevel,
          balanceDue: 0,
          balance: 0,
          paymentStatus: "Paid",
          status: "Paid",
          contractEnd: extendedContractEnd,
          contractTermMonths: String(CONTRACT_TERM_MONTHS),
          upgradeStatus: "completed",
          upgradeCompletedAt: paymentTimestamp,
          paymentReminderLevel: admin.firestore.FieldValue.delete(),
        });
        if (String(student.upgradeTargetClassName || "").trim()) studentUpdate.className = String(student.upgradeTargetClassName).trim();
      } else if (upgradeStatus === "awaiting_payment") {
        const graceEnd = computeUpgradeGraceEnd(paidAtDate);
        Object.assign(studentUpdate, {
          level: targetLevel,
          balanceDue: nextUpgradeBalance,
          balance: nextUpgradeBalance,
          paymentStatus: "Partially Paid",
          status: "Active",
          upgradeStatus: "pending",
          upgradeStartedAt: paymentTimestamp,
          upgradeGraceEnd: graceEnd ? graceEnd.toISOString().slice(0, 10) : "",
          paymentReminderLevel: targetLevel,
        });
        if (String(student.upgradeTargetClassName || "").trim()) studentUpdate.className = String(student.upgradeTargetClassName).trim();
      } else if (upgradeStatus === "pending") {
        Object.assign(studentUpdate, {
          level: targetLevel,
          balanceDue: nextUpgradeBalance,
          balance: nextUpgradeBalance,
          paymentStatus: "Partially Paid",
          status: "Active",
          paymentReminderLevel: targetLevel,
        });
        if (String(student.upgradeTargetClassName || "").trim()) studentUpdate.className = String(student.upgradeTargetClassName).trim();
      }
    } else {
      const currentBalance = resolveStudentCurrentBalance(student);
      nextBalance = roundMoney(Math.max(0, currentBalance - tuitionCredit));
      paymentStatus = nextBalance <= 0 ? "Paid" : "Partially Paid";
      const grantContract = nextBalance <= 0 && (paymentPurpose === "renewal" || !String(student.contractEnd || "").trim());
      studentUpdate = {
        paid: nextPaid,
        balanceDue: nextBalance,
        balance: nextBalance,
        paymentStatus,
        status: nextBalance <= 0 ? "Paid" : (student.status || "Active"),
        lastPaymentAmount: tuitionCredit,
        lastPaymentProvider: "Paystack",
        lastPaymentReference: reference,
        lastPaymentAt: paymentTimestamp,
        updated_at: admin.firestore.FieldValue.serverTimestamp(),
      };
      if (grantContract) {
        studentUpdate.contractEnd = computeExtendedContractEnd(student.contractEnd, paidAtDate, CONTRACT_TERM_MONTHS);
        studentUpdate.contractTermMonths = String(CONTRACT_TERM_MONTHS);
        studentUpdate.paidLevel = normalizeContractLevel(student.level || student.paidLevel) || student.paidLevel || "";
      }
    }

    transaction.set(studentRef, studentUpdate, { merge: true });

    transaction.set(paymentRef, {
      status: "paid",
      paidAt: paymentTimestamp,
      paystackTransactionId: eventData.id || null,
      channel: eventData.channel || "",
      gatewayResponse: eventData.gateway_response || eventData.gatewayResponse || "",
      verifiedCurrency: currency,
      verifiedAmountSubunit: receivedSubunit,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });

    return { duplicate: false, studentId, reference, nextPaid, nextBalance, paymentStatus, purpose: paymentPurpose };
  });
}

app.post("/payments/create-link", async (req, res) => {
  try {
    const user = await requirePaymentAdmin(req);
    const studentId = String(req.body?.studentId || "").trim();
    const tuitionCredit = roundMoney(req.body?.amount);
    const purpose = String(req.body?.purpose || "balance").trim() || "balance";
    if (!studentId) return res.status(400).json({ ok: false, error: "studentId is required" });
    if (tuitionCredit <= 0) return res.status(400).json({ ok: false, error: "amount must be greater than zero" });

    const studentRef = db.collection(STUDENTS_COLLECTION).doc(studentId);
    const studentSnap = await studentRef.get();
    if (!studentSnap.exists) return res.status(404).json({ ok: false, error: "Student not found" });
    const student = studentSnap.data() || {};
    if (purpose === "level_upgrade") {
      const upgradeStatus = String(student.upgradeStatus || "").trim().toLowerCase();
      const upgradeBalance = roundMoney(student.upgradeBalanceDue);
      if (!["awaiting_payment", "pending", "expired"].includes(upgradeStatus)) return res.status(409).json({ ok: false, error: "This student has no payable level upgrade." });
      if (upgradeBalance <= 0) return res.status(409).json({ ok: false, error: "This level upgrade is already fully paid." });
      if (tuitionCredit > upgradeBalance + 0.01) return res.status(400).json({ ok: false, error: "Upgrade payment cannot exceed the remaining upgrade balance." });
    }
    const email = resolveStudentPaymentEmail(student, req.body?.email);
    if (!email || !email.includes("@")) return res.status(400).json({ ok: false, error: "A valid student email is required by Paystack" });

    const checkoutAmount = calculateStudentCheckoutAmount(tuitionCredit);
    const processingShare = roundMoney(checkoutAmount - tuitionCredit);
    const reference = createPaymentReference(studentId);
    const metadata = {
      source: "falowen_admin_student_directory",
      studentId,
      studentCode: String(student.studentCode || student.studentcode || studentId),
      studentName: String(student.name || student.studentName || ""),
      purpose,
      tuitionCredit,
      checkoutAmount,
      upgradeId: purpose === "level_upgrade" ? String(student.upgradeId || "") : "",
      targetLevel: purpose === "level_upgrade" ? normalizeContractLevel(student.upgradeToLevel) : "",
    };

    const paystack = await initializePaystackPayment({ email, checkoutAmount, reference, metadata });
    const payment = {
      reference,
      studentId,
      studentCode: metadata.studentCode,
      studentName: metadata.studentName,
      email,
      purpose,
      upgradeId: metadata.upgradeId,
      targetLevel: metadata.targetLevel,
      currency: PAYSTACK_CURRENCY,
      tuitionCredit,
      checkoutAmount,
      processingShare,
      amountSubunit: Math.round(checkoutAmount * 100),
      provider: "Paystack",
      status: "pending",
      authorizationUrl: paystack.authorization_url,
      accessCode: paystack.access_code || "",
      createdBy: user.uid,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    await db.collection("payments").doc(reference).set(payment, { merge: true });

    return res.json({
      ok: true,
      payment: {
        ...payment,
        createdAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("student_payment_link_failed", { message: error?.message || String(error) });
    return res.status(error?.statusCode || 500).json({ ok: false, error: error?.message || "Could not generate payment link" });
  }
});

app.get("/payments/student/:studentId", async (req, res) => {
  try {
    await requirePaymentAdmin(req);
    const studentId = String(req.params.studentId || "").trim();
    if (!studentId) return res.status(400).json({ ok: false, error: "studentId is required" });

    const snapshot = await db.collection("payments").where("studentId", "==", studentId).get();
    const toIso = (value) => {
      if (!value) return null;
      if (typeof value.toDate === "function") return value.toDate().toISOString();
      const parsed = new Date(value);
      return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
    };
    const payments = snapshot.docs
      .map((docSnap) => {
        const data = docSnap.data() || {};
        return {
          id: docSnap.id,
          ...data,
          createdAt: toIso(data.createdAt),
          paidAt: toIso(data.paidAt),
          updatedAt: toIso(data.updatedAt),
        };
      })
      .sort((a, b) => new Date(b.paidAt || b.createdAt || 0).getTime() - new Date(a.paidAt || a.createdAt || 0).getTime())
      .slice(0, 50);

    return res.json({ ok: true, payments });
  } catch (error) {
    return res.status(error?.statusCode || 401).json({ ok: false, error: error?.message || "Could not load payment history" });
  }
});

app.post("/payments/paystack-webhook", async (req, res) => {
  if (!webhookSignatureIsValid(req)) {
    console.warn("paystack_webhook_rejected", { reason: "invalid_signature" });
    return res.status(401).json({ ok: false, error: "Invalid Paystack signature" });
  }

  const event = req.body || {};
  if (String(event.event || "") !== "charge.success") return res.status(200).json({ ok: true, ignored: true });
  const reference = String(event?.data?.reference || "").trim();
  if (!reference.startsWith("FAL-")) return res.status(200).json({ ok: true, ignored: true, reason: "non_falowen_reference" });

  try {
    const result = await applySuccessfulPaystackPayment(event.data || {});
    console.log("paystack_payment_applied", result);
    return res.status(200).json({ ok: true, ...result });
  } catch (error) {
    console.error("paystack_payment_apply_failed", { message: error?.message || String(error), reference: event?.data?.reference || "" });
    return res.status(500).json({ ok: false, error: error?.message || "Payment could not be applied" });
  }
});
// END STUDENT PAYMENT LINKS

// BEGIN STUDENT CONTRACT LIFECYCLE
function createUpgradeId(studentId) {
  return "UPG-" + safePaymentReferencePart(studentId) + "-" + Date.now() + "-" + crypto.randomBytes(4).toString("hex");
}

async function verifyPaystackTransaction(reference) {
  const secret = paystackSecret();
  if (!secret) throw new Error("PAYSTACK_SECRET is not configured");
  const response = await fetch(PAYSTACK_API_BASE_URL + "/transaction/verify/" + encodeURIComponent(reference), {
    method: "GET",
    headers: { Authorization: "Bearer " + secret },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok || body?.status !== true || !body?.data) {
    const error = new Error(body?.message || "Paystack could not verify this payment");
    error.statusCode = response.status || 502;
    throw error;
  }
  return body.data;
}

async function reconcilePaymentReference(reference) {
  const normalizedReference = String(reference || "").trim();
  if (!normalizedReference) return { checked: false, applied: false, reason: "missing_reference" };
  const paymentRef = db.collection("payments").doc(normalizedReference);
  const paymentSnap = await paymentRef.get();
  if (!paymentSnap.exists) return { checked: false, applied: false, reason: "unknown_reference" };
  const payment = paymentSnap.data() || {};
  if (String(payment.status || "").toLowerCase() === "paid") return { checked: true, applied: false, reason: "already_paid" };
  const verified = await verifyPaystackTransaction(normalizedReference);
  if (String(verified.status || "").toLowerCase() !== "success") return { checked: true, applied: false, reason: String(verified.status || "not_successful") };
  const result = await applySuccessfulPaystackPayment(verified);
  return { checked: true, applied: !result?.duplicate, result };
}

async function expireStudentUpgrade(studentRef, student, now = new Date()) {
  const upgradeStatus = String(student.upgradeStatus || "").trim().toLowerCase();
  if (upgradeStatus !== "pending" || !isUpgradeGraceExpired(student.upgradeGraceEnd, now) || roundMoney(student.upgradeBalanceDue) <= 0) return false;
  const previousLevel = normalizeContractLevel(student.upgradePreviousLevel || student.upgradeFromLevel || student.paidLevel);
  const previousBalance = roundMoney(student.upgradePreviousBalanceDue);
  const update = {
    level: previousLevel || student.level,
    balanceDue: previousBalance,
    balance: previousBalance,
    paymentStatus: String(student.upgradePreviousPaymentStatus || (previousBalance <= 0 ? "Paid" : "Partially Paid")),
    status: String(student.upgradePreviousStatus || (previousBalance <= 0 ? "Paid" : "Active")),
    upgradeStatus: "expired",
    upgradeExpiredAt: admin.firestore.FieldValue.serverTimestamp(),
    paymentReminderLevel: admin.firestore.FieldValue.delete(),
    updated_at: admin.firestore.FieldValue.serverTimestamp(),
  };
  if (String(student.upgradeTargetClassName || "").trim()) {
    update.className = String(student.upgradePreviousClassName || "").trim() || admin.firestore.FieldValue.delete();
  }
  await studentRef.set(update, { merge: true });
  await db.collection("auditLogs").add({
    type: "studentUpgrade.expired",
    studentId: studentRef.id,
    fromLevel: student.upgradeFromLevel || "",
    targetLevel: student.upgradeToLevel || "",
    remainingBalance: roundMoney(student.upgradeBalanceDue),
    contractEnd: student.contractEnd || "",
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });
  return true;
}

app.post("/payments/start-upgrade", async (req, res) => {
  try {
    const user = await requirePaymentAdmin(req);
    const studentId = String(req.body?.studentId || "").trim();
    const requestedTargetLevel = normalizeContractLevel(req.body?.targetLevel);
    const tuitionFee = roundMoney(req.body?.tuitionFee);
    const targetClassName = String(req.body?.targetClassName || "").trim();
    if (!studentId) return res.status(400).json({ ok: false, error: "studentId is required" });
    if (tuitionFee <= 0) return res.status(400).json({ ok: false, error: "A valid full tuition fee is required" });

    const studentRef = db.collection(STUDENTS_COLLECTION).doc(studentId);
    let responseUpdate = null;
    await db.runTransaction(async (transaction) => {
      const snap = await transaction.get(studentRef);
      if (!snap.exists) { const error = new Error("Student not found"); error.statusCode = 404; throw error; }
      const student = snap.data() || {};
      const currentLevel = normalizeContractLevel(student.paidLevel || student.level);
      const expectedTargetLevel = nextContractLevel(currentLevel);
      const targetLevel = requestedTargetLevel || expectedTargetLevel;
      if (!currentLevel || !expectedTargetLevel) { const error = new Error("This student has no next Falowen level to upgrade to"); error.statusCode = 400; throw error; }
      if (targetLevel !== expectedTargetLevel) { const error = new Error("Upgrades must move to the next level: " + expectedTargetLevel); error.statusCode = 400; throw error; }
      if (!contractIsActive(student.contractEnd, new Date())) { const error = new Error("The current paid contract has expired. Renew the current level before preparing a next-level upgrade."); error.statusCode = 409; throw error; }

      const previousBalance = resolveStudentCurrentBalance(student);
      if (previousBalance > 0.01) { const error = new Error("Complete the current level balance before preparing a next-level upgrade."); error.statusCode = 409; throw error; }

      const existingUpgradeStatus = String(student.upgradeStatus || "").trim().toLowerCase();
      if (["awaiting_payment", "pending", "expired"].includes(existingUpgradeStatus)) { const error = new Error("This student already has an unfinished level upgrade."); error.statusCode = 409; throw error; }

      const upgradeId = createUpgradeId(studentId);
      const paidLevel = normalizeContractLevel(student.paidLevel || currentLevel) || currentLevel;
      const update = {
        paidLevel,
        upgradeId,
        upgradeStatus: "awaiting_payment",
        upgradeFromLevel: currentLevel,
        upgradeToLevel: targetLevel,
        upgradeTuitionFee: tuitionFee,
        upgradePaid: 0,
        upgradeBalanceDue: tuitionFee,
        upgradePreviousLevel: currentLevel,
        upgradePreviousClassName: String(student.className || ""),
        upgradePreviousBalanceDue: previousBalance,
        upgradePreviousPaymentStatus: String(student.paymentStatus || "Paid"),
        upgradePreviousStatus: String(student.status || "Paid"),
        upgradeTargetClassName: targetClassName,
        upgradeCreatedBy: user.uid,
        upgradeCreatedAt: admin.firestore.FieldValue.serverTimestamp(),
        upgradeStartedAt: admin.firestore.FieldValue.delete(),
        upgradeGraceEnd: admin.firestore.FieldValue.delete(),
        paymentReminderLevel: admin.firestore.FieldValue.delete(),
        updated_at: admin.firestore.FieldValue.serverTimestamp(),
      };
      transaction.set(studentRef, update, { merge: true });
      responseUpdate = {
        paidLevel,
        upgradeId,
        upgradeStatus: "awaiting_payment",
        upgradeFromLevel: currentLevel,
        upgradeToLevel: targetLevel,
        upgradeTuitionFee: tuitionFee,
        upgradePaid: 0,
        upgradeBalanceDue: tuitionFee,
        upgradePreviousLevel: currentLevel,
        upgradePreviousClassName: String(student.className || ""),
        upgradePreviousBalanceDue: previousBalance,
        upgradePreviousPaymentStatus: String(student.paymentStatus || "Paid"),
        upgradePreviousStatus: String(student.status || "Paid"),
        upgradeTargetClassName: targetClassName,
      };
    });
    return res.json({ ok: true, studentUpdate: responseUpdate });
  } catch (error) {
    return res.status(error?.statusCode || 500).json({ ok: false, error: error?.message || "Could not prepare level upgrade" });
  }
});

app.post("/payments/reconcile-student/:studentId", async (req, res) => {
  try {
    await requirePaymentAdmin(req);
    const studentId = String(req.params.studentId || "").trim();
    if (!studentId) return res.status(400).json({ ok: false, error: "studentId is required" });
    const snapshot = await db.collection("payments").where("studentId", "==", studentId).limit(30).get();
    const pending = snapshot.docs
      .map((docSnap) => ({ id: docSnap.id, ...(docSnap.data() || {}) }))
      .filter((payment) => String(payment.status || "").toLowerCase() === "pending")
      .slice(0, 8);
    let checked = 0;
    let applied = 0;
    const results = [];
    for (const payment of pending) {
      try {
        const result = await reconcilePaymentReference(payment.reference || payment.id);
        if (result.checked) checked += 1;
        if (result.applied) applied += 1;
        results.push({ reference: payment.reference || payment.id, ...result });
      } catch (error) {
        results.push({ reference: payment.reference || payment.id, checked: true, applied: false, error: error?.message || String(error) });
      }
    }
    return res.json({ ok: true, checked, applied, results });
  } catch (error) {
    return res.status(error?.statusCode || 500).json({ ok: false, error: error?.message || "Could not reconcile student payments" });
  }
});

exports.maintainStudentPaymentContracts = onSchedule({
  schedule: "*/30 * * * *",
  timeZone: "Africa/Accra",
  secrets: [paystackSecretKeySecret],
}, async () => {
  const now = new Date();
  const students = await db.collection(STUDENTS_COLLECTION).where("upgradeStatus", "==", "pending").limit(100).get();
  let expiredUpgrades = 0;
  for (const docSnap of students.docs) {
    try {
      if (await expireStudentUpgrade(docSnap.ref, docSnap.data() || {}, now)) expiredUpgrades += 1;
    } catch (error) {
      console.error("student_upgrade_expiry_failed", { studentId: docSnap.id, message: error?.message || String(error) });
    }
  }

  const payments = await db.collection("payments").where("status", "==", "pending").limit(100).get();
  let checkedPayments = 0;
  let appliedPayments = 0;
  for (const docSnap of payments.docs) {
    if (checkedPayments >= 20) break;
    const payment = docSnap.data() || {};
    const createdAt = contractAsDate(payment.createdAt);
    if (!createdAt) continue;
    const ageMs = now.getTime() - createdAt.getTime();
    if (ageMs > 14 * 86400000) {
      await docSnap.ref.set({ status: "expired", expiredAt: admin.firestore.FieldValue.serverTimestamp(), updatedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
      continue;
    }
    if (ageMs < 2 * 60000) continue;
    checkedPayments += 1;
    try {
      const result = await reconcilePaymentReference(payment.reference || docSnap.id);
      if (result.applied) appliedPayments += 1;
    } catch (error) {
      console.warn("student_payment_reconcile_failed", { reference: payment.reference || docSnap.id, message: error?.message || String(error) });
    }
  }
  console.log("student_payment_contract_maintenance", { expiredUpgrades, checkedPayments, appliedPayments });
});
// END STUDENT CONTRACT LIFECYCLE

app.post("/students/delete-account", async (req, res) => {
  try {
    await requireAuth(req);
    const body = req.body || {};
    const student = body.student || {};
    const studentId = cleanIdentifier(body.studentId || student.id);
    const studentCode = cleanIdentifier(body.studentCode || student.studentCode || student.studentcode || student.uid || studentId);
    const email = normalizeLower(body.email || student.email);
    if (!studentId && !studentCode && !email) return res.status(400).json({ error: "studentId, studentCode, or email is required" });

    const studentDocIds = uniqueNonEmpty([studentId, studentCode, student.uid]);
    const codeValues = uniqueNonEmpty([studentCode, student.studentCode, student.studentcode, student.uid, studentId]);
    const emailValues = uniqueNonEmpty([email, student.email]);
    const allValues = uniqueNonEmpty([...studentDocIds, ...codeValues, ...emailValues]);
    const summary = { deleted: 0, collections: {}, attendanceSessionMapsUpdated: 0, authUsersDeleted: [] };

    for (const docId of studentDocIds) {
      const ref = db.collection(STUDENTS_COLLECTION).doc(docId);
      const snap = await ref.get();
      if (snap.exists) {
        await db.recursiveDelete(ref);
        summary.deleted += 1;
        summary.collections.students = (summary.collections.students || 0) + 1;
      }
    }

    await deleteMatchingCollectionDocs("submissions", ["studentCode", "studentcode", "studentId", "uid", "email", "studentEmail"], allValues, summary);
    await deleteMatchingCollectionDocs("scores", ["studentCode", "studentcode", "studentId", "studentEmail", "email"], allValues, summary);
    await deleteMatchingCollectionDocs("markingResults", ["studentCode", "studentcode", "studentId", "studentEmail", "email"], allValues, summary);
    await deleteMatchingCollectionDocs("markingJobs", ["studentCode", "studentcode", "studentId", "studentEmail", "email"], allValues, summary);
    await deleteMatchingCollectionDocs("aiAudits", ["studentCode", "studentcode", "studentId", "studentEmail", "email"], allValues, summary);
    await deleteMatchingCollectionDocs("studentNotifications", ["studentCode", "studentcode", "studentId", "studentEmail", "email"], allValues, summary);
    await deleteMatchingCollectionGroupDocs("notifications", ["studentCode", "studentcode", "studentId", "studentEmail", "email"], allValues, summary);
    await deleteMatchingCollectionGroupDocs("checkins", ["studentCode", "studentcode", "studentId", "uid", "email"], allValues, summary);
    await deleteKnownNestedSubmissionScopes(codeValues, summary);
    await removeStudentFromAttendanceMaps(allValues, summary);
    summary.authUsersDeleted = await deleteAuthUserIfPresent({ uid: student.uid || studentId, email });

    const sheet = await deleteStudentRowsFromSheet({ studentId, studentCode, email, student });
    if (sheet.attempted && !sheet.success) {
      return res.status(502).json({ ok: false, error: sheet.message, firestore: summary, sheet });
    }
    return res.json({ ok: true, firestore: summary, sheet });
  } catch (e) {
    return res.status(500).json({ error: e?.message || "Student account deletion failed" });
  }
});

app.post("/marking/ai", async (req, res) => {
  try {
    const payload = req.body || {};
    if (!String(payload.submissionText || "").trim()) {
      return res.status(400).json({ status: "error", message: "submissionText is required" });
    }

    const assignmentKey = String(
      payload.assignmentKey ||
      payload.referenceEntry?.assignmentKey ||
      readSubmissionAssignmentKey(payload.submission || {})
    ).trim();
    const registryEntry = payload.referenceEntry?.parts ? payload.referenceEntry : await loadAnswerKeyRegistryEntry(assignmentKey);
    if (!registryEntry?.parts) {
      const result = normalizeAiMarkingResult({
        assignmentKey,
        level: payload.level || payload.submission?.level || "UNKNOWN",
        score: 0,
        finalScore: 0,
        status: "needs_review",
        confidence: 0.25,
        detectedParts: [],
        parts: [{
          partId: "unknown",
          partType: "objective",
          result: {
            status: "needs_review",
            total: 0,
            needsReview: [{ reason: "No answer key found for this assignment" }],
            feedback: "No answer key found for this assignment",
            confidence: 0.25,
          },
        }],
        objectiveScore: null,
        objectiveCorrect: 0,
        objectiveTotal: 0,
        feedback: "No answer key found for this assignment. A tutor must review this submission before any score is sent to the student.",
        improvementSummary: "Tutor review required because the answer key is missing.",
        shouldSendAutomatically: false,
      }, payload);
      return res.json({ ok: true, result });
    }

    const result = await callOpenAiForMarking({
      ...payload,
      assignmentKey: registryEntry?.assignmentKey || assignmentKey,
      level: registryEntry?.level || payload.level,
      referenceEntry: registryEntry || payload.referenceEntry || null,
    });
    return res.json({ ok: true, result });
  } catch (error) {
    console.error("AI marking failed:", error);
    return res.status(error.statusCode || 500).json({
      status: "error",
      message: error?.message || "AI marking failed",
    });
  }
});

function readSubmissionLevel(data = {}, eventParams = {}) {
  const candidate = String(data.level || data.className || data.class || data.group || eventParams.level || "").trim().toUpperCase();
  const match = candidate.match(/\b(A1|A2|B1)\b/);
  return match ? match[1] : candidate;
}

const ASSIGNMENT_ATTENDANCE_WINDOW_HOURS = 24;
const ASSIGNMENT_ATTENDANCE_WINDOW_MS = ASSIGNMENT_ATTENDANCE_WINDOW_HOURS * 60 * 60 * 1000;

function attendanceComparable(value) {
  return String(value || "").trim().toLowerCase().replace(/\s+/g, " ");
}

function submissionDate(value, fallback = "") {
  if (value && typeof value.toDate === "function") return value.toDate();
  if (value && typeof value.toMillis === "function") return new Date(value.toMillis());
  if (value && typeof value.seconds === "number") return new Date(value.seconds * 1000);
  const parsed = new Date(value || fallback);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function assignmentAttendanceStudentAliases(submission = {}, eventParams = {}) {
  return new Set([
    submission.studentCode,
    submission.studentcode,
    submission.studentId,
    submission.student_id,
    submission.uid,
    submission.userId,
    submission.email,
    submission.studentEmail,
    eventParams.studentCode,
  ].map(attendanceComparable).filter(Boolean));
}

function assignmentAttendanceSavedAliases(code, student = {}) {
  return new Set([
    code,
    student.id,
    student.uid,
    student.studentCode,
    student.studentcode,
    student.email,
  ].map(attendanceComparable).filter(Boolean));
}

function assignmentAttendanceAliasesIntersect(left, right) {
  for (const value of left) if (right.has(value)) return true;
  return false;
}

function assignmentAttendanceClassMatches(submission = {}, session = {}, eventParams = {}) {
  const submissionClasses = [
    submission.classId,
    submission.className,
    submission.class,
    submission.group,
    submission.level,
    eventParams.level,
  ].map(attendanceComparable).filter(Boolean);
  const sessionClasses = [
    session.classId,
    session.className,
  ].map(attendanceComparable).filter(Boolean);
  if (!submissionClasses.length || !sessionClasses.length) return true;
  return submissionClasses.some((left) => sessionClasses.some((right) =>
    left === right || left.startsWith(right + " ") || right.startsWith(left + " "),
  ));
}

async function findAttendanceSessionsForAssignment(assignmentKey) {
  const found = new Map();
  const queries = [
    db.collectionGroup("sessions").where("assignmentIds", "array-contains", assignmentKey).get(),
    db.collectionGroup("sessions").where("assignment_id", "==", assignmentKey).get(),
  ];
  const results = await Promise.allSettled(queries);
  for (const result of results) {
    if (result.status !== "fulfilled") {
      console.warn("assignment_attendance_session_lookup_failed", {
        assignmentKey,
        message: result.reason?.message || String(result.reason),
      });
      continue;
    }
    result.value.docs.forEach((docSnap) => found.set(docSnap.ref.path, docSnap));
  }
  return [...found.values()];
}

async function applyAssignmentAttendance(event, submission = {}) {
  const snap = event.data;
  if (!snap) return [];
  const assignmentKey = readSubmissionAssignmentKey(submission);
  if (!assignmentKey) return [];

  const eligibility = assignmentAttendanceEligibility(submission);
  if (!eligibility.eligible) {
    await snap.ref.set({
      attendanceCredit: {
        status: "not_eligible",
        reason: eligibility.reason,
        checkedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
    }, { merge: true });
    console.info("assignment_attendance_not_eligible", {
      submissionPath: snap.ref.path,
      reason: eligibility.reason,
    });
    return [];
  }

  const studentAliases = assignmentAttendanceStudentAliases(submission, event.params || {});
  if (!studentAliases.size) return [];

  const submittedAt = submissionDate(
    submission.submittedAt || submission.resubmittedAt || submission.createdAt || submission.timestamp || submission.date,
    event.time,
  );
  if (!submittedAt) return [];

  const sessions = await findAttendanceSessionsForAssignment(assignmentKey);
  const credited = [];

  for (const sessionSnap of sessions) {
    const session = sessionSnap.data() || {};
    if (!assignmentAttendanceClassMatches(submission, session, event.params || {})) continue;

    const startsAt = submissionDate(session.startsAt || session.date);
    if (!startsAt) continue;
    const ageMs = submittedAt.getTime() - startsAt.getTime();
    if (ageMs < 0 || ageMs > ASSIGNMENT_ATTENDANCE_WINDOW_MS) continue;

    let applied = false;
    await db.runTransaction(async (transaction) => {
      const latestSnap = await transaction.get(sessionSnap.ref);
      if (!latestSnap.exists) return;
      const latest = latestSnap.data() || {};
      const students = { ...(latest.students || {}) };
      const match = Object.entries(students).find(([code, student]) =>
        assignmentAttendanceAliasesIntersect(studentAliases, assignmentAttendanceSavedAliases(code, student || {})),
      );
      if (!match) return;

      const [studentKey, currentValue] = match;
      const current = currentValue && typeof currentValue === "object" ? currentValue : { present: Boolean(currentValue) };
      const currentStatus = attendanceComparable(current.status || current.attendanceStatus);
      if (current.present === true || ["present", "late", "excused", "present_by_assignment"].includes(currentStatus)) return;

      students[studentKey] = {
        ...current,
        present: true,
        status: "present_by_assignment",
        attendanceStatus: "present_by_assignment",
        method: "Assignment",
        source: "assignment_submission",
        assignmentId: assignmentKey,
        assignmentSubmissionId: snap.id,
        assignmentSubmissionPath: snap.ref.path,
        assignmentSubmittedAt: admin.firestore.Timestamp.fromDate(submittedAt),
        automaticallyUpdated: true,
      };
      transaction.set(sessionSnap.ref, {
        students,
        assignmentAttendanceUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      }, { merge: true });
      applied = true;
    });

    if (applied) {
      const matchedStudent = Object.entries(session.students || {}).find(([code, student]) =>
        assignmentAttendanceAliasesIntersect(studentAliases, assignmentAttendanceSavedAliases(code, student || {})),
      );
      const savedStudent = matchedStudent?.[1] || {};
      credited.push({
        sessionId: String(session.classSessionId || sessionSnap.id),
        classId: String(session.classId || ""),
        className: String(session.className || ""),
        sessionLabel: String(session.title || session.sessionLabel || session.lesson || assignmentKey),
        sessionDate: session.startsAt || session.date || submittedAt.toISOString(),
        attendancePath: sessionSnap.ref.path,
        studentKey: String(matchedStudent?.[0] || ""),
        studentName: String(savedStudent.name || submission.studentName || submission.name || ""),
        studentEmail: String(savedStudent.email || submission.email || submission.studentEmail || ""),
      });
    }
  }

  if (credited.length) {
    await snap.ref.set({
      attendanceCredit: {
        status: "present_by_assignment",
        assignmentId: assignmentKey,
        sessions: credited,
        appliedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
    }, { merge: true });

    for (const credit of credited) {
      try {
        await sendAssignmentAttendanceCreditEmail({
          admin,
          db,
          runtimeConfig,
          ...credit,
          assignmentId: assignmentKey,
          submissionId: snap.id,
        });
      } catch (error) {
        console.error("assignment_attendance_email_failed", {
          submissionPath: snap.ref.path,
          sessionId: credit.sessionId,
          message: error?.message || String(error),
        });
      }
    }
  }
  return credited;
}

async function createAutomaticMarkingJob(event, collectionShape) {
  const snap = event.data;
  if (!snap) return;

  const submission = snap.data() || {};
  if (String(submission.status || submission.submissionStatus || "").trim().toLowerCase() === "draft") return;

  const submissionId = snap.id;
  const submissionPath = snap.ref.path;
  const now = admin.firestore.FieldValue.serverTimestamp();
  const payload = {
    submissionId,
    submissionPath,
    collectionShape,
    assignmentKey: readSubmissionAssignmentKey(submission),
    level: readSubmissionLevel(submission, event.params),
    status: "pending",
    createdAt: now,
    updatedAt: now,
  };

  await db.collection("markingJobs").add(payload);
  await snap.ref.set({
    markingStatus: "pending",
    markingJobCreatedAt: now,
  }, { merge: true });

  try {
    await applyAssignmentAttendance(event, submission);
  } catch (error) {
    console.error("assignment_attendance_automation_failed", {
      submissionPath,
      message: error?.message || String(error),
    });
  }
}

exports.sendStudentPaymentUpdateEmail = createStudentPaymentUpdateEmailTrigger({
  admin,
  db,
  onDocumentUpdated,
  runtimeConfig,
});

// BEGIN AUTOMATIC PAID STUDENT ORIENTATION SYNC
const automaticPaidStudentOrientationHandler = createOrientationAutoSyncHandler({
  db,
  appsScriptUrl: () => String(
    orientationAppsScriptUrlSecret.value() || process.env.ORIENTATION_APPS_SCRIPT_URL || ""
  ).trim(),
  syncSecret: () => String(
    orientationSyncSecret.value() || process.env.ORIENTATION_SYNC_SECRET || ""
  ).trim(),
});

async function automaticPaidPaymentOrientationHandler(event) {
  const beforePayment = event?.data?.before?.exists ? event.data.before.data() || {} : {};
  const afterPayment = event?.data?.after?.exists ? event.data.after.data() || {} : {};
  const beforeStatus = String(beforePayment.status || "").trim().toLowerCase();
  const afterStatus = String(afterPayment.status || "").trim().toLowerCase();

  if (afterStatus !== "paid" || beforeStatus === "paid") {
    return { skipped: true, reason: "payment_not_newly_paid" };
  }

  const studentId = String(afterPayment.studentId || "").trim();
  if (!studentId) throw new Error("Paid payment is missing studentId for orientation sync.");

  const studentRef = db.collection("students").doc(studentId);
  const studentSnapshot = await studentRef.get();
  if (!studentSnapshot.exists) {
    throw new Error("Student record not found for paid payment: " + studentId);
  }

  const currentStudent = studentSnapshot.data() || {};
  const syntheticBefore = {
    ...currentStudent,
    paymentStatus: "pending",
    payment_status: "pending",
    paid: 0,
    paidAmount: 0,
    initialPaymentAmount: 0,
  };
  const beforeStudentSnapshot = {
    exists: true,
    id: studentSnapshot.id || studentId,
    ref: studentRef,
    data: () => syntheticBefore,
  };

  return automaticPaidStudentOrientationHandler({
    ...event,
    params: {
      ...(event?.params || {}),
      studentCode: studentSnapshot.id || studentId,
    },
    data: {
      before: beforeStudentSnapshot,
      after: studentSnapshot,
    },
  });
}

exports.autoSyncPaidStudentOrientation = onDocumentUpdated(
  {
    region: "europe-west1",
    document: "payments/{reference}",
    secrets: [orientationSyncSecret, orientationAppsScriptUrlSecret],
    timeoutSeconds: 60,
  },
  automaticPaidPaymentOrientationHandler
);
// END AUTOMATIC PAID STUDENT ORIENTATION SYNC

exports.createFlatSubmissionMarkingJob = onDocumentCreated("submissions/{submissionId}", async (event) => {
  await createAutomaticMarkingJob(event, "flat");
});

exports.createNestedSubmissionMarkingJob = onDocumentCreated("submissions/{level}/{studentCode}/{submissionId}", async (event) => {
  await createAutomaticMarkingJob(event, "nested");
});

exports.createPostSubmissionMarkingJob = onDocumentCreated("submissions/{level}/posts/{submissionId}", async (event) => {
  await createAutomaticMarkingJob(event, "posts");
});

exports.sendDueHolidayNotices = onSchedule({
  schedule: "0 7 * * *",
  timeZone: "Africa/Accra",
  secrets: [holidaysAppsScriptUrlSecret, holidaysSyncSecret],
}, async () => {
  const tomorrowIso = getTomorrowIsoInAccra();
  console.log(`sendDueHolidayNotices checking ${tomorrowIso}`);

  const snapshot = await db
    .collection("holidayCalendar")
    .where("countryCode", "==", "GH")
    .where("date", "==", tomorrowIso)
    .where("schoolClosed", "==", true)
    .where("autoSendNotice", "==", true)
    .get();

  if (snapshot.empty) {
    console.log(`sendDueHolidayNotices no due holidays for ${tomorrowIso}`);
    return;
  }

  for (const docSnap of snapshot.docs) {
    const holiday = docSnap.data() || {};
    const date = String(holiday.date || tomorrowIso).trim();
    const countryCode = String(holiday.countryCode || "GH").trim().toUpperCase() || "GH";
    const logPrefix = `sendDueHolidayNotices ${docSnap.id} ${date}`;

    await docSnap.ref.set({
      noticeLastCheckedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });

    if (!String(holiday.studentMessage || "").trim()) {
      console.log(`${logPrefix} skipped: empty studentMessage`);
      continue;
    }
    if (normalizeNoticeStatus(holiday.noticeStatus) === "sent") {
      console.log(`${logPrefix} skipped: noticeStatus already sent`);
      continue;
    }
    if (holiday.noticeSentAt) {
      console.log(`${logPrefix} skipped: noticeSentAt exists`);
      continue;
    }

    const noticeConfig = resolveNoticeConfig(holiday, holiday);
    if (noticeConfig.audienceType === "class" && !noticeConfig.className) {
      console.log(`${logPrefix} skipped: missing className`);
      await docSnap.ref.set({
        noticeStatus: "failed",
        noticeLastError: "noticeClassName is required for class audience",
        noticeLastCheckedAt: admin.firestore.FieldValue.serverTimestamp(),
      }, { merge: true });
      continue;
    }

    try {
      const result = await sendHolidayNoticeForDoc({
        docRef: docSnap.ref,
        holiday,
        date,
        countryCode,
        noticeConfig,
      });
      console.log(`${logPrefix} sent: ${result.noticeRecipientCount} recipient(s)`);
    } catch (error) {
      console.error(`${logPrefix} failed: ${error?.message || error}`);
    }
  }
});


function toIcsDate(value) {
  return new Date(value).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

function stableClassUrl(klass = {}) {
  const slug = String(klass.slug || klass.classSlug || klass.name || klass.id || "").trim().toLowerCase().replace(/&/g, " and ").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  return `/classes/${slug}`;
}

function chapterTitle(levelId, chapterId) {
  return `${String(levelId || "").toUpperCase()}-${chapterId}`;
}

async function loadClassSessions(classId) {
  const snap = await db.collection("classSessions").where("classId", "==", classId).orderBy("startsAt", "asc").get();
  return snap.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
}

function nextValidSession(sessions, now = Date.now()) {
  return sessions.filter((session) => !["cancelled", "completed"].includes(String(session.status || "")) && new Date(session.startsAt).getTime() >= now).sort((a, b) => new Date(a.startsAt) - new Date(b.startsAt))[0] || null;
}

app.get("/calendar/class/:classId.ics", async (req, res) => {
  try {
    const classId = String(req.params.classId || "").trim();
    const classSnap = await db.collection("classes").doc(classId).get();
    if (!classSnap.exists) return res.status(404).send("Class not found");
    const klass = classSnap.data() || {};
    const sessions = await loadClassSessions(classId);
    const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Falowen//Live Classes//EN", "CALSCALE:GREGORIAN", "METHOD:PUBLISH"];
    for (const session of sessions) {
      const uid = session.uid || `falowen-class-${classId}-${session.id}@falowen.com`;
      lines.push("BEGIN:VEVENT", `UID:${uid}`, `SEQUENCE:${Number(session.sequence || 0)}`, `DTSTAMP:${toIcsDate(new Date())}`, `DTSTART:${toIcsDate(session.startsAt)}`, `DTEND:${toIcsDate(session.endsAt || session.startsAt)}`, `SUMMARY:${String(session.topic || klass.name || "Falowen live class").replace(/\n/g, " ")}`);
      if (session.status === "cancelled") lines.push("STATUS:CANCELLED");
      lines.push("END:VEVENT");
    }
    lines.push("END:VCALENDAR");
    res.set("Content-Type", "text/calendar; charset=utf-8");
    res.send(`${lines.join("\r\n")}\r\n`);
  } catch (e) {
    res.status(500).json({ error: e?.message || "Server error" });
  }
});

app.get("/admin/classes/:classId/next-session", async (req, res) => {
  try {
    await requireAuth(req);
    const classId = String(req.params.classId || "").trim();
    const classSnap = await db.collection("classes").doc(classId).get();
    if (!classSnap.exists) return res.status(404).json({ error: "Class not found" });
    const klass = { id: classSnap.id, ...(classSnap.data() || {}) };
    const sessions = await loadClassSessions(classId);
    const session = nextValidSession(sessions);
    if (!session) return res.json({ ok: true, classId, classUrl: stableClassUrl(klass), session: null, zoom: null, chapters: [] });
    let zoom = null;
    if (klass.zoomProfileId) {
      const zoomSnap = await db.collection("zoomProfiles").doc(String(klass.zoomProfileId)).get();
      zoom = zoomSnap.exists ? { id: zoomSnap.id, ...(zoomSnap.data() || {}) } : { id: klass.zoomProfileId };
    }
    const chapters = (session.chapterIds || []).map((chapterId) => ({ id: chapterId, dictionaryId: chapterTitle(klass.levelId, chapterId) }));
    res.json({ ok: true, classId, classUrl: stableClassUrl(klass), session, zoom, chapters });
  } catch (e) {
    res.status(401).json({ error: e?.message || "Unauthorized" });
  }
});

app.post("/admin/classes/:classId/sessions/:sessionId/cancel", async (req, res) => {
  try {
    const user = await requireAuth(req);
    const { classId, sessionId } = req.params;
    const reason = String(req.body?.reason || "").trim();
    await db.runTransaction(async (transaction) => {
      const ref = db.collection("classSessions").doc(sessionId);
      const snap = await transaction.get(ref);
      if (!snap.exists) throw new Error("Session not found");
      const session = snap.data() || {};
      transaction.update(ref, { status: "cancelled", cancellationReason: reason, cancelledBy: user.uid, cancelledAt: admin.firestore.FieldValue.serverTimestamp(), remindersSuppressed: true, sequence: Number(session.sequence || 0) + 1, updatedAt: admin.firestore.FieldValue.serverTimestamp() });
      transaction.set(db.collection("auditLogs").doc(), { type: "classSession.cancelled", classId, sessionId, actorId: user.uid, reason, createdAt: admin.firestore.FieldValue.serverTimestamp() });
      transaction.set(db.collection("studentNotifications").doc(), { type: "classSession.cancelled", classId, sessionId, title: "Live class cancelled", body: reason || "A live class was cancelled.", createdAt: admin.firestore.FieldValue.serverTimestamp() });
      transaction.set(db.collection("emailQueue").doc(), { type: "classSession.cancelled", classId, sessionId, status: "queued", createdAt: admin.firestore.FieldValue.serverTimestamp() });
      transaction.set(db.collection("calendarFeeds").doc(classId), { classId, updatedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
    });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e?.message || "Server error" });
  }
});

app.post("/attendance-confirmation-emails/retry-failed", async (req, res) => {
  try {
    await requireAuth(req);
    const classId = String(req.body?.classId || "").trim();
    if (!classId) return res.status(400).json({ ok: false, error: "Select a class before retrying failed attendance emails." });
    const result = await retryFailedAttendanceDeliveries({ admin, db, classId, runtimeConfig });
    return res.json({ ok: true, ...result });
  } catch (error) {
    const unauthorized = /Authorization|Not allowed|token/i.test(String(error?.message || ""));
    return res.status(unauthorized ? 401 : 400).json({
      ok: false,
      error: error?.message || "Could not retry failed attendance emails.",
    });
  }
});

exports.sendAttendanceConfirmationEmails = createAttendanceConfirmationEmailJob({ admin, db, onSchedule, runtimeConfig });

exports.api = onRequest({
  secrets: [
    attendancePinSaltSecret,
    orientationSyncSecret,
    orientationAppsScriptUrlSecret,
    classScheduleSyncSecret,
    classScheduleAppsScriptUrlSecret,
    holidaysAppsScriptUrlSecret,
    holidaysSyncSecret,
    openAiApiKeySecret,
    studentDeleteAppsScriptUrlSecret,
    studentDeleteSyncSecret,
    paystackSecretKeySecret,
  ],
}, app);
