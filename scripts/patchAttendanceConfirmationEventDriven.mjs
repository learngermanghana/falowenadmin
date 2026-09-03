import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const indexPath = path.join(root, "functions", "index.js");
const workerPath = path.join(root, "functions", "attendanceConfirmationEmails.js");

let worker = fs.readFileSync(workerPath, "utf8");
let index = fs.readFileSync(indexPath, "utf8");

const marker = "async function queueAttendanceConfirmationEvent";
if (!worker.includes(marker)) {
  const runStart = worker.indexOf("async function runAttendanceConfirmationEmailJob({");
  const moduleStart = worker.indexOf("module.exports = {");
  if (runStart < 0 || moduleStart < 0 || moduleStart <= runStart) {
    throw new Error("Could not locate attendance confirmation scheduler block.");
  }

  const replacement = `const ATTENDANCE_EMAIL_QUEUE = "attendanceEmailQueue";
const ATTENDANCE_QUEUE_BATCH_SIZE = 25;
const ATTENDANCE_QUEUE_RETRY_MINUTES = 60;

function queueDocumentId(classId, sessionId) {
  return crypto.createHash("sha256")
    .update([normalize(classId), normalize(sessionId)].join("::"))
    .digest("hex");
}

async function resolveClassForQueue(db, value) {
  const identifier = normalize(value);
  if (!identifier) return null;
  const direct = await db.collection("classes").doc(identifier).get();
  if (direct.exists) return { id: direct.id, ...direct.data() };

  for (const field of ["classId", "classRecordId", "name", "className", "group"]) {
    const snap = await db.collection("classes").where(field, "==", identifier).limit(1).get();
    if (!snap.empty) return { id: snap.docs[0].id, ...snap.docs[0].data() };
  }
  return null;
}

async function resolveSessionForQueue(db, klass, sessionId) {
  const id = normalize(sessionId);
  if (!id) return null;
  const direct = await db.collection("classSessions").doc(id).get();
  if (direct.exists) {
    const session = { id: direct.id, ...direct.data() };
    if (acceptClassNameSessionMatch(session, klass)) return session;
  }
  const sessions = await loadSessionsForClass(db, klass);
  return sessions.find((session) => normalize(session.id) === id) || null;
}

async function loadAttendanceDocumentForQueue(db, klass, sessionId, preferredParentId = "") {
  const parentIds = [...new Set([
    preferredParentId,
    klass.id,
    klass.classId,
    klass.classRecordId,
    klass.name,
    klass.className,
  ].map(normalize).filter(Boolean))];

  for (const parentId of parentIds) {
    const snap = await db.collection("attendance").doc(parentId).collection("sessions").doc(sessionId).get();
    if (snap.exists) return snap.data() || {};
  }
  return {};
}

async function queueAttendanceConfirmationEvent({
  admin,
  db,
  classId,
  sessionId,
  preferredAttendanceParentId = "",
  reason = "attendance_event",
  now = new Date(),
} = {}) {
  const klass = await resolveClassForQueue(db, classId);
  if (!klass) return { queued: false, skipped: "class_not_found" };
  if (modeForClass(klass) === MODE_OFF) return { queued: false, skipped: "disabled" };

  const session = await resolveSessionForQueue(db, klass, sessionId);
  if (!session || !isActiveSession(session)) return { queued: false, skipped: "session_not_found_or_inactive" };

  const attendance = await loadAttendanceDocumentForQueue(
    db,
    klass,
    session.id,
    preferredAttendanceParentId,
  );
  const delayMinutes = clampNumber(
    klass.attendanceConfirmationEmailDelayMinutes,
    DEFAULT_DELAY_MINUTES,
    0,
    360,
  );
  const nowDate = asDate(now) || new Date();
  const calculatedDueAt = dueAfter({ session, attendance, delayMinutes }) || nowDate;
  const nextRunDate = calculatedDueAt > nowDate ? calculatedDueAt : nowDate;
  const ref = db.collection(ATTENDANCE_EMAIL_QUEUE).doc(queueDocumentId(klass.id, session.id));
  const timestamp = admin.firestore.FieldValue.serverTimestamp();

  await ref.set({
    classId: klass.id,
    className: normalize(klass.name || klass.className || klass.classId),
    sessionId: session.id,
    sessionStartsAt: sessionStart(session)?.toISOString() || "",
    sessionEndsAt: sessionEnd(session)?.toISOString() || "",
    reason,
    nextRunAt: admin.firestore.Timestamp.fromDate(nextRunDate),
    calculatedDueAt: calculatedDueAt.toISOString(),
    updatedAt: timestamp,
    createdAt: timestamp,
  }, { merge: true });

  console.log("attendance_confirmation_queued", {
    classId: klass.id,
    sessionId: session.id,
    reason,
    nextRunAt: nextRunDate.toISOString(),
  });
  return { queued: true, classId: klass.id, sessionId: session.id, nextRunAt: nextRunDate.toISOString() };
}

async function loadStudentsForQueuedClass(db, klass) {
  const students = new Map();
  const ids = [...new Set([klass.id, klass.classId, klass.classRecordId].map(normalize).filter(Boolean))];
  const names = [...new Set([klass.name, klass.className, klass.group, klass.slug].map(normalize).filter(Boolean))];
  const plans = [];

  for (const value of ids) {
    for (const field of ["classId", "classRecordId", "assignedClassId", "groupId", "cohortId"]) {
      plans.push([field, value]);
    }
  }
  for (const value of names) {
    for (const field of ["className", "class", "group", "groupName", "cohort", "cohortName"]) {
      plans.push([field, value]);
    }
  }

  for (const [field, value] of plans) {
    try {
      const snap = await db.collection("students").where(field, "==", value).get();
      for (const docSnap of snap.docs) {
        const student = { id: docSnap.id, ...docSnap.data() };
        if (isActiveStudent(student) && studentBelongsToClass(student, klass) && normalize(student.email)) {
          students.set(docSnap.id, student);
        }
      }
    } catch (error) {
      console.warn("attendance_queue_roster_query_failed", { field, value, message: error?.message || String(error) });
    }
  }

  if (!students.size) {
    // Compatibility fallback for older records. Unlike the former scheduler,
    // this broad read only happens when one specific class actually has a due event.
    const snap = await db.collection("students").get();
    for (const docSnap of snap.docs) {
      const student = { id: docSnap.id, ...docSnap.data() };
      if (isActiveStudent(student) && studentBelongsToClass(student, klass) && normalize(student.email)) {
        students.set(docSnap.id, student);
      }
    }
  }
  return [...students.values()];
}

async function handleAttendanceSessionEvent({ admin, db, event } = {}) {
  const data = event?.data?.after?.exists
    ? event.data.after.data() || {}
    : event?.data?.before?.exists
      ? event.data.before.data() || {}
      : {};
  const classId = normalize(event?.params?.classId || data.classId);
  const sessionId = normalize(event?.params?.sessionId || data.sessionId || data.classSessionId);
  if (!classId || !sessionId) return { queued: false, skipped: "missing_identity" };
  return queueAttendanceConfirmationEvent({
    admin,
    db,
    classId,
    sessionId,
    preferredAttendanceParentId: event?.params?.classId || classId,
    reason: "attendance_session_changed",
  });
}

async function handleAttendanceCheckinEvent({ admin, db, event } = {}) {
  const classId = normalize(event?.params?.classId);
  const sessionId = normalize(event?.params?.sessionId);
  if (!classId || !sessionId) return { queued: false, skipped: "missing_identity" };
  return queueAttendanceConfirmationEvent({
    admin,
    db,
    classId,
    sessionId,
    preferredAttendanceParentId: classId,
    reason: "checkin_changed",
  });
}

async function handleClassSessionCompletionEvent({ admin, db, event } = {}) {
  if (!event?.data?.after?.exists) return { queued: false, skipped: "deleted" };
  const before = event?.data?.before?.exists ? event.data.before.data() || {} : {};
  const after = event.data.after.data() || {};
  const beforeStatus = comparable(before.status || before.sessionStatus);
  const afterStatus = comparable(after.status || after.sessionStatus);
  if (afterStatus !== "completed" || beforeStatus === "completed") {
    return { queued: false, skipped: "not_newly_completed" };
  }
  const classId = normalize(after.classId || after.classRecordId || after.className || after.class);
  const sessionId = normalize(event?.params?.sessionId || event.data.after.id);
  if (!classId || !sessionId) return { queued: false, skipped: "missing_identity" };
  return queueAttendanceConfirmationEvent({
    admin,
    db,
    classId,
    sessionId,
    reason: "class_session_completed",
  });
}

async function runAttendanceConfirmationEmailJob({ admin, db, runtimeConfig = {}, now = new Date(), fetchImpl = fetch }) {
  const nowDate = asDate(now) || new Date();
  const dueSnap = await db.collection(ATTENDANCE_EMAIL_QUEUE)
    .where("nextRunAt", "<=", admin.firestore.Timestamp.fromDate(nowDate))
    .limit(ATTENDANCE_QUEUE_BATCH_SIZE)
    .get();

  if (dueSnap.empty) {
    console.log("attendance_confirmation_queue_empty");
    return { queued: 0, classes: 0, sent: 0, results: [] };
  }

  const dueByClass = new Map();
  for (const docSnap of dueSnap.docs) {
    const item = { id: docSnap.id, ref: docSnap.ref, ...docSnap.data() };
    const classId = normalize(item.classId);
    if (!classId) {
      await docSnap.ref.delete();
      continue;
    }
    if (!dueByClass.has(classId)) dueByClass.set(classId, []);
    dueByClass.get(classId).push(item);
  }

  const fallbackConfig = resolveWebhookConfig(runtimeConfig);
  const results = [];
  let sent = 0;

  for (const [classId, queueItems] of dueByClass.entries()) {
    try {
      const klass = await resolveClassForQueue(db, classId);
      if (!klass || modeForClass(klass) === MODE_OFF) {
        await Promise.all(queueItems.map((item) => item.ref.delete()));
        results.push({ classId, ok: true, sent: 0, skipped: !klass ? "class_not_found" : "disabled" });
        continue;
      }

      const classConfig = resolveClassWebhookConfig(klass, fallbackConfig);
      if (!classConfig.url) {
        throw new Error("Save this class under Communication → Attendance confirmation emails, or set communication.announcement_webhook_url in FALOWEN_ADMIN_CLOUD_RUNTIME_CONFIG.");
      }
      const students = await loadStudentsForQueuedClass(db, klass);
      const result = await processClass({
        admin,
        db,
        klass,
        allStudents: students,
        config: classConfig,
        now: nowDate,
        fetchImpl,
      });
      sent += Number(result.sent || 0);
      await Promise.all(queueItems.map((item) => item.ref.delete()));
      results.push({ classId, ok: true, queuedEvents: queueItems.length, ...result });
    } catch (error) {
      const retryAt = admin.firestore.Timestamp.fromDate(
        new Date(nowDate.getTime() + ATTENDANCE_QUEUE_RETRY_MINUTES * 60000),
      );
      await Promise.all(queueItems.map((item) => item.ref.set({
        nextRunAt: retryAt,
        lastError: error?.message || "Attendance confirmation queue processing failed",
        attemptCount: admin.firestore.FieldValue.increment(1),
        lastAttemptAt: admin.firestore.FieldValue.serverTimestamp(),
      }, { merge: true })));
      console.error("attendance_confirmation_queue_failed", { classId, message: error?.message || String(error) });
      results.push({ classId, ok: false, queuedEvents: queueItems.length, error: error?.message || String(error) });
    }
  }

  console.log("attendance_confirmation_queue_complete", {
    queued: dueSnap.size,
    classes: dueByClass.size,
    sent,
  });
  return { queued: dueSnap.size, classes: dueByClass.size, sent, results };
}

function createAttendanceConfirmationEmailJob({ admin, db, onSchedule, runtimeConfig = {} }) {
  // The scheduler is now only a tiny due-queue dispatcher. Attendance/session
  // Firestore events create the queue records, so this no longer scans every
  // class and every student every 15 minutes.
  return onSchedule({
    schedule: "*/15 * * * *",
    timeZone: ACCRA_TIMEZONE,
    retryCount: 1,
  }, async () => runAttendanceConfirmationEmailJob({ admin, db, runtimeConfig }));
}

`;

  worker = worker.slice(0, runStart) + replacement + worker.slice(moduleStart);
  worker = worker.replace(
    `  createAttendanceConfirmationEmailJob,\n  runAttendanceConfirmationEmailJob,\n  sendAssignmentAttendanceCreditEmail,`,
    `  createAttendanceConfirmationEmailJob,\n  runAttendanceConfirmationEmailJob,\n  sendAssignmentAttendanceCreditEmail,\n  handleAttendanceSessionEvent,\n  handleAttendanceCheckinEvent,\n  handleClassSessionCompletionEvent,\n  queueAttendanceConfirmationEvent,`,
  );
  fs.writeFileSync(workerPath, worker, "utf8");
}

const originalRequire = 'const { createAttendanceConfirmationEmailJob, sendAssignmentAttendanceCreditEmail } = require("./attendanceConfirmationEmails.js");';
const eventRequire = 'const { createAttendanceConfirmationEmailJob, sendAssignmentAttendanceCreditEmail, handleAttendanceSessionEvent, handleAttendanceCheckinEvent, handleClassSessionCompletionEvent } = require("./attendanceConfirmationEmails.js");';
if (index.includes(originalRequire)) index = index.replace(originalRequire, eventRequire);
if (!index.includes(eventRequire)) throw new Error("Could not register event-driven attendance worker imports.");

const firestoreImport = 'const { onDocumentCreated } = require("firebase-functions/v2/firestore");';
const firestoreEventImport = 'const { onDocumentCreated, onDocumentWritten } = require("firebase-functions/v2/firestore");';
if (index.includes(firestoreImport)) index = index.replace(firestoreImport, firestoreEventImport);
if (!index.includes(firestoreEventImport)) throw new Error("Could not register onDocumentWritten Firestore trigger.");

const schedulerExport = 'exports.sendAttendanceConfirmationEmails = createAttendanceConfirmationEmailJob({ admin, db, onSchedule, runtimeConfig });';
const eventExports = `exports.queueAttendanceConfirmationFromSession = onDocumentWritten(
  "attendance/{classId}/sessions/{sessionId}",
  async (event) => handleAttendanceSessionEvent({ admin, db, event }),
);
exports.queueAttendanceConfirmationFromCheckin = onDocumentWritten(
  "attendance/{classId}/sessions/{sessionId}/checkins/{checkinId}",
  async (event) => handleAttendanceCheckinEvent({ admin, db, event }),
);
exports.queueAttendanceConfirmationFromClassSession = onDocumentWritten(
  "classSessions/{sessionId}",
  async (event) => handleClassSessionCompletionEvent({ admin, db, event }),
);

${schedulerExport}`;
if (!index.includes("exports.queueAttendanceConfirmationFromSession")) {
  if (!index.includes(schedulerExport)) throw new Error("Could not find attendance scheduler export anchor.");
  index = index.replace(schedulerExport, eventExports);
}
fs.writeFileSync(indexPath, index, "utf8");

const finalWorker = fs.readFileSync(workerPath, "utf8");
const finalIndex = fs.readFileSync(indexPath, "utf8");
const checks = [
  [finalWorker.includes("async function queueAttendanceConfirmationEvent"), "Attendance event queue helper is missing."],
  [finalWorker.includes('const ATTENDANCE_EMAIL_QUEUE = "attendanceEmailQueue"'), "Attendance queue collection is missing."],
  [finalWorker.includes('.where("nextRunAt", "<=",'), "Attendance due-queue query is missing."],
  [finalWorker.includes("loadStudentsForQueuedClass"), "Targeted attendance roster loading is missing."],
  [!finalWorker.includes('const classSnap = await db.collection("classes").get();'), "Legacy all-class attendance scan is still present."],
  [!finalWorker.includes('const studentSnap = await db.collection("students").get();'), "Legacy all-student attendance scan is still present."],
  [finalIndex.includes("exports.queueAttendanceConfirmationFromSession = onDocumentWritten"), "Attendance session event trigger is missing."],
  [finalIndex.includes("exports.queueAttendanceConfirmationFromCheckin = onDocumentWritten"), "Attendance check-in event trigger is missing."],
  [finalIndex.includes("exports.queueAttendanceConfirmationFromClassSession = onDocumentWritten"), "Class-session completion event trigger is missing."],
  [finalWorker.includes('schedule: "*/15 * * * *"'), "Attendance due-queue dispatcher schedule is missing."],
];
for (const [passed, message] of checks) {
  if (!passed) throw new Error(message);
}

console.log("Event-driven attendance confirmation queue and targeted due dispatcher verified.");
