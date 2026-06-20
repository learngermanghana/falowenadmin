const admin = require("firebase-admin");
const express = require("express");
const cors = require("cors");
const crypto = require("crypto");
const { onRequest } = require("firebase-functions/v2/https");
const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const { onSchedule } = require("firebase-functions/v2/scheduler");
const { setGlobalOptions } = require("firebase-functions/v2");
const { defineSecret } = require("firebase-functions/params");

setGlobalOptions({ region: "us-central1" });

admin.initializeApp();
const db = admin.firestore();

const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

const STUDENTS_COLLECTION = "students";
const attendancePinSaltSecret = defineSecret("ATTENDANCE_PIN_SALT");
const orientationSyncSecret = defineSecret("ORIENTATION_SYNC_SECRET");
const orientationAppsScriptUrlSecret = defineSecret("ORIENTATION_APPS_SCRIPT_URL");
const classScheduleSyncSecret = defineSecret("CLASS_SCHEDULE_SYNC_SECRET");
const classScheduleAppsScriptUrlSecret = defineSecret("CLASS_SCHEDULE_APPS_SCRIPT_URL");
const holidaysAppsScriptUrlSecret = defineSecret("HOLIDAYS_APPS_SCRIPT_URL");
const holidaysSyncSecret = defineSecret("HOLIDAYS_SYNC_SECRET");
const openAiApiKeySecret = defineSecret("OPENAI_API_KEY");

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

function resolveStudentClassId(student = {}) {
  return normalizeClassComparable(student.classId || student.className || student.group || student.groupId || student.groupName);
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

function sessionDocRef(classId, sessionId) {
  return db.doc(`attendance/${classId}/sessions/${sessionId}`);
}

function parseAssignmentChapter(assignmentId) {
  const normalized = String(assignmentId || "").trim();
  const parts = normalized.split("-");
  return parts.length > 1 ? String(parts.slice(1).join("-")).trim() : "";
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

    async function findStudentByEmail(candidateEmail) {
      const qs = await db.collection(STUDENTS_COLLECTION).where("email", "==", candidateEmail).limit(1).get();
      return qs.empty ? null : qs.docs[0];
    }

    async function findStudentByPhone(candidatePhone) {
      const phoneFields = ["phone", "phoneNumber", "phone_number", "contactNumber", "contactNo"];
      for (const field of phoneFields) {
        const qs = await db.collection(STUDENTS_COLLECTION).where(field, "==", candidatePhone).limit(1).get();
        if (!qs.empty) return qs.docs[0];
      }
      return null;
    }

    let studentDoc = await findStudentByEmail(rawEmail);
    if (!studentDoc && normalizedEmail !== rawEmail) {
      studentDoc = await findStudentByEmail(normalizedEmail);
    }

    if (!studentDoc) {
      for (const phoneCandidate of candidatePhoneNumbers(phoneNumber)) {
        studentDoc = await findStudentByPhone(phoneCandidate);
        if (studentDoc) break;
      }
    }

    if (!studentDoc) return res.status(404).json({ error: "Student not found" });

    const st = studentDoc.data();
    const storedPhone = normalizePhoneKey(resolveStudentPhone(st));
    if (!storedPhone) return res.status(400).json({ error: "Student phone is missing in records" });
    if (!normalizedPhone || storedPhone !== normalizedPhone) {
      return res.status(400).json({ error: "Email and phone number do not match student records" });
    }

    if (!isStudentRoleAllowed(st)) return res.status(400).json({ error: "Not a student account" });
    if (!isStudentStatusAllowed(st)) return res.status(400).json({ error: "Student not active" });

    const studentClassId = resolveStudentClassId(st);
    if (normalizeClassComparable(studentClassId) !== normalizeClassComparable(classId)) return res.status(400).json({ error: "Student not in this class" });

    const uid = st.uid || studentDoc.id;

    const checkinDocId = String(uid || st.studentCode || st.studentcode || studentDoc.id || "").trim();
    const checkinRef = sessionRef.collection("checkins").doc(checkinDocId);
    const checkinSnap = await checkinRef.get();

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
    "For writing, assess task completion, CEFR-appropriate grammar, word order, vocabulary, spelling, structure, and clarity. When writing needs work, explain a genuine strength, give two or three concrete corrections that quote the student’s exact short wording and show improved wording, briefly explain the most useful language rule, and include one task-relevant next step. When writing is perfect, do not invent corrections; praise specific strengths and give an extension goal instead. Avoid generic writing comments.",
    "Develop feedback uniquely from this assignment’s title, task, answer-key objectives, objectiveFeedbackContext, and the student’s actual response. Do not reuse a stock opening or a fixed feedback template.",
    "When a submission contains both objective and writing work, integrate both naturally in one response and match the emphasis to the result. If both sections are perfect, enthusiastically praise the student. If the objective section is strong but writing needs work, praise the objective understanding before prioritizing specific writing improvements. If the writing is strong but the objective section needs work, praise the writing before directing the student to the exact missed objectives. State the supplied objective result accurately and never invent errors or corrections.",
    `Return JSON only. The feedback field must be ${AI_FEEDBACK_MIN_WORDS} to ${AI_FEEDBACK_MAX_WORDS} words, plain text only, with no Markdown, bold markers, or asterisks. Use the available space for specific, actionable guidance rather than filler. Include score/finalScore 0-100, status marked or needs_review, confidence 0-1, detectedParts, parts, objective totals, writingScore, corrections, and improvementSummary.`,
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
  return normalizeAiMarkingResult(JSON.parse(content), payload);
}

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
}

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
  ],
}, app);
