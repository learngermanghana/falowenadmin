import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const reminderPath = path.join(root, "functions", "classSessionReminderEmails.js");
const autoCompletePath = path.join(root, "functions", "autoCompleteClassSessions.js");

function patchOnce(source, marker, anchor, replacement, label) {
  if (source.includes(marker)) return source;
  if (!source.includes(anchor)) {
    throw new Error(`Could not find ${label} anchor.`);
  }
  return source.replace(anchor, replacement);
}

let reminderSource = fs.readFileSync(reminderPath, "utf8");

const reminderRunAnchor = `async function runClassSessionReminderEmailJob({
  admin, db, runtimeConfig = {}, now = new Date(), fetchImpl = fetch,
} = {}) {
  const [classSnap, sessionSnap, studentSnap] = await Promise.all([
    db.collection("classes").get(),
    db.collection("classSessions").get(),
    db.collection("students").get(),
  ]);
  const classes = classSnap.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
  const sessions = sessionSnap.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
  const students = studentSnap.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
  const nowDate = asDate(now) || new Date();`;

const reminderHelpersAndRun = `function addSnapshotDocs(target, snapshot) {
  for (const docSnap of snapshot?.docs || []) {
    target.set(docSnap.id, { id: docSnap.id, ...docSnap.data() });
  }
}

async function runBoundedRangeQuery({ db, collectionName, field, start, end, target, label }) {
  const ranges = [
    [start, end],
    [start.toISOString(), end.toISOString()],
  ];
  for (const [lower, upper] of ranges) {
    try {
      const snapshot = await db.collection(collectionName)
        .where(field, ">=", lower)
        .where(field, "<=", upper)
        .get();
      addSnapshotDocs(target, snapshot);
    } catch (error) {
      console.warn("bounded_firestore_query_failed", {
        label,
        collection: collectionName,
        field,
        valueType: typeof lower === "string" ? "iso_string" : "timestamp",
        message: error?.message || String(error),
      });
    }
  }
}

async function loadReminderSessionWindow({ db, now, graceMinutes = DEFAULT_GRACE_MIN }) {
  const nowDate = asDate(now) || new Date();
  // Reminder leads and automatic attendance opening are both capped at 240 minutes.
  const end = new Date(nowDate.getTime() + (240 + Math.max(0, Number(graceMinutes) || 0) + 5) * 60000);
  const sessions = new Map();
  for (const field of ["startsAt", "startAt", "startDateTime"]) {
    await runBoundedRangeQuery({
      db,
      collectionName: "classSessions",
      field,
      start: nowDate,
      end,
      target: sessions,
      label: "class_reminder_window",
    });
  }
  return [...sessions.values()];
}

async function loadClassesForSessions(db, sessions = []) {
  const classes = new Map();
  const ids = new Set();
  const aliases = new Set();
  for (const session of sessions) {
    [session.classRecordId, session.classId, session.classDocumentId].map(text).filter(Boolean).forEach((value) => ids.add(value));
    [session.className, session.class, session.group].map(text).filter(Boolean).forEach((value) => aliases.add(value));
  }

  await Promise.all([...ids].map(async (id) => {
    try {
      const snap = await db.collection("classes").doc(id).get();
      if (snap.exists) classes.set(snap.id, { id: snap.id, ...snap.data() });
    } catch (error) {
      console.warn("class_reminder_class_lookup_failed", { id, message: error?.message || String(error) });
    }
  }));

  const values = [...new Set([...ids, ...aliases])];
  for (const value of values) {
    for (const field of ["classId", "classRecordId", "name", "className", "group", "slug"]) {
      try {
        addSnapshotDocs(classes, await db.collection("classes").where(field, "==", value).get());
      } catch (error) {
        console.warn("class_reminder_class_alias_lookup_failed", { field, value, message: error?.message || String(error) });
      }
    }
  }
  return [...classes.values()];
}

async function loadStudentsForDueClasses(db, classes = []) {
  if (!classes.length) return [];
  const students = new Map();
  const plans = [];

  for (const klass of classes) {
    const ids = [...new Set([klass.id, klass.classId, klass.classRecordId].map(text).filter(Boolean))];
    const names = [...new Set([klass.name, klass.className, klass.group, klass.slug].map(text).filter(Boolean))];
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
  }

  for (const [field, value] of plans) {
    try {
      addSnapshotDocs(students, await db.collection("students").where(field, "==", value).get());
    } catch (error) {
      console.warn("class_reminder_roster_lookup_failed", { field, value, message: error?.message || String(error) });
    }
  }

  if (!students.size) {
    // Compatibility fallback for old student records that have no canonical class fields.
    // This only runs when a reminder is actually due, never on every five-minute scheduler tick.
    const snapshot = await db.collection("students").get();
    for (const docSnap of snapshot.docs || []) {
      const student = { id: docSnap.id, ...docSnap.data() };
      if (classes.some((klass) => studentBelongsToClass(student, klass))) {
        students.set(docSnap.id, student);
      }
    }
  }

  return [...students.values()];
}

async function runClassSessionReminderEmailJob({
  admin, db, runtimeConfig = {}, now = new Date(), fetchImpl = fetch,
} = {}) {
  const nowDate = asDate(now) || new Date();
  const communication = runtimeConfig.communication || {};
  const graceMinutes = communication.class_reminder_grace_minutes
    || process.env.CLASS_REMINDER_GRACE_MINUTES
    || DEFAULT_GRACE_MIN;
  const sessions = await loadReminderSessionWindow({ db, now: nowDate, graceMinutes });
  if (!sessions.length) {
    const emptyAutoOpen = { due: 0, opened: 0, refreshed: 0, results: [] };
    console.log("class_session_reminder_job_complete", {
      candidateSessions: 0,
      candidateClasses: 0,
      rosterDocs: 0,
      due: 0,
      sent: 0,
      autoOpened: 0,
    });
    return { due: 0, sent: 0, autoOpen: emptyAutoOpen, results: [] };
  }
  const classes = await loadClassesForSessions(db, sessions);`;

reminderSource = patchOnce(
  reminderSource,
  "async function loadReminderSessionWindow",
  reminderRunAnchor,
  reminderHelpersAndRun,
  "class reminder broad-read",
);

const reminderCommunicationAnchor = `  const communication = runtimeConfig.communication || {};
  const due = findDueSessionReminders({`;
const reminderCommunicationReplacement = `  const due = findDueSessionReminders({`;
if (reminderSource.includes(reminderCommunicationAnchor)) {
  reminderSource = reminderSource.replace(reminderCommunicationAnchor, reminderCommunicationReplacement);
}

const reminderDueAnchor = `  const config = resolveWebhookConfig(runtimeConfig);
  const results = [];`;
const reminderDueReplacement = `  const dueClasses = [...new Map(due.map((item) => {
    const klass = resolveClassForSession(item.session, classes);
    return klass ? [klass.id, klass] : null;
  }).filter(Boolean)).values()];
  const students = due.length ? await loadStudentsForDueClasses(db, dueClasses) : [];
  const config = resolveWebhookConfig(runtimeConfig);
  const results = [];`;
reminderSource = patchOnce(
  reminderSource,
  "const students = due.length ? await loadStudentsForDueClasses",
  reminderDueAnchor,
  reminderDueReplacement,
  "class reminder due-roster",
);

const reminderLogAnchor = `  console.log("class_session_reminder_job_complete", { due: due.length, sent, autoOpened: autoOpen.opened });`;
const reminderLogReplacement = `  console.log("class_session_reminder_job_complete", {
    candidateSessions: sessions.length,
    candidateClasses: classes.length,
    rosterDocs: students.length,
    due: due.length,
    sent,
    autoOpened: autoOpen.opened,
  });`;
if (reminderSource.includes(reminderLogAnchor)) {
  reminderSource = reminderSource.replace(reminderLogAnchor, reminderLogReplacement);
}

fs.writeFileSync(reminderPath, reminderSource, "utf8");

let autoCompleteSource = fs.readFileSync(autoCompletePath, "utf8");
const autoCompleteAnchor = `async function runAutoCompleteClassSessionsJob({
  admin,
  db,
  now = new Date(),
  delayMinutes = Number(process.env.CLASS_AUTO_COMPLETE_DELAY_MINUTES || DEFAULT_DELAY_MINUTES),
  lookbackDays = Number(process.env.CLASS_AUTO_COMPLETE_LOOKBACK_DAYS || DEFAULT_LOOKBACK_DAYS),
} = {}) {
  const snapshot = await db.collection("classSessions").get();
  const sessions = snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));`;

const autoCompleteReplacement = `async function loadRecentCompletionCandidates({ db, now = new Date(), lookbackDays = DEFAULT_LOOKBACK_DAYS } = {}) {
  const nowDate = asDate(now) || new Date();
  const oldestAllowed = new Date(nowDate.getTime() - Math.max(1, Number(lookbackDays) || DEFAULT_LOOKBACK_DAYS) * 86400000);
  const candidates = new Map();
  const ranges = [
    [oldestAllowed, nowDate],
    [oldestAllowed.toISOString(), nowDate.toISOString()],
  ];

  for (const field of ["startsAt", "startAt", "startDateTime"]) {
    for (const [lower, upper] of ranges) {
      try {
        const snapshot = await db.collection("classSessions")
          .where(field, ">=", lower)
          .where(field, "<=", upper)
          .get();
        for (const docSnap of snapshot.docs || []) {
          candidates.set(docSnap.id, { id: docSnap.id, ...docSnap.data() });
        }
      } catch (error) {
        console.warn("auto_complete_candidate_query_failed", {
          field,
          valueType: typeof lower === "string" ? "iso_string" : "timestamp",
          message: error?.message || String(error),
        });
      }
    }
  }
  return [...candidates.values()];
}

async function runAutoCompleteClassSessionsJob({
  admin,
  db,
  now = new Date(),
  delayMinutes = Number(process.env.CLASS_AUTO_COMPLETE_DELAY_MINUTES || DEFAULT_DELAY_MINUTES),
  lookbackDays = Number(process.env.CLASS_AUTO_COMPLETE_LOOKBACK_DAYS || DEFAULT_LOOKBACK_DAYS),
} = {}) {
  const sessions = await loadRecentCompletionCandidates({ db, now, lookbackDays });`;

autoCompleteSource = patchOnce(
  autoCompleteSource,
  "async function loadRecentCompletionCandidates",
  autoCompleteAnchor,
  autoCompleteReplacement,
  "auto-complete broad-read",
);

const autoCompleteLogAnchor = `  console.log("auto_complete_class_sessions_job_complete", { due: due.length, completed });`;
const autoCompleteLogReplacement = `  console.log("auto_complete_class_sessions_job_complete", {
    candidateSessions: sessions.length,
    due: due.length,
    completed,
  });`;
if (autoCompleteSource.includes(autoCompleteLogAnchor)) {
  autoCompleteSource = autoCompleteSource.replace(autoCompleteLogAnchor, autoCompleteLogReplacement);
}

fs.writeFileSync(autoCompletePath, autoCompleteSource, "utf8");

const finalReminder = fs.readFileSync(reminderPath, "utf8");
const finalAutoComplete = fs.readFileSync(autoCompletePath, "utf8");
const checks = [
  [finalReminder.includes("async function loadReminderSessionWindow"), "Bounded reminder session query is missing."],
  [finalReminder.includes("async function loadStudentsForDueClasses"), "Due-only reminder roster lookup is missing."],
  [!finalReminder.includes('db.collection("classSessions").get(),\n    db.collection("students").get()'), "Reminder worker still performs broad scheduled reads."],
  [finalAutoComplete.includes("async function loadRecentCompletionCandidates"), "Bounded auto-complete candidate query is missing."],
  [!finalAutoComplete.includes('const snapshot = await db.collection("classSessions").get();'), "Auto-complete worker still reads all class sessions."],
];
for (const [passed, message] of checks) {
  if (!passed) throw new Error(message);
}

console.log("Cloud cost optimizations verified: bounded session windows, due-only rosters, and bounded auto-complete candidates.");
