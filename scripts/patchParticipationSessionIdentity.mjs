import fs from "node:fs";

const apiPath = new URL("../functions/classParticipationApi.js", import.meta.url);
const servicePath = new URL("../src/services/classParticipationService.js", import.meta.url);
const presenterPath = new URL("../src/components/PresenterStudentPicker.jsx", import.meta.url);
const MARKER = "// PARTICIPATION CANONICAL CLASS SESSION IDENTITY";

function replaceOrConfirm(source, oldValue, newValue, label) {
  if (source.includes(newValue)) return source;
  if (!source.includes(oldValue)) throw new Error(`Could not patch ${label}.`);
  return source.replace(oldValue, newValue);
}

let api = fs.readFileSync(apiPath, "utf8");
if (!api.includes(MARKER)) {
  const oldLessonSessionId = `function lessonSessionId(payload = {}) {
  return stableId(payload.classId, payload.assignmentId || payload.lessonId, payload.sessionDate);
}`;

  const newLessonSessionBlock = `${MARKER}
const LIVE_SESSION_COLLECTION = "classSessions";

function lessonSessionId(payload = {}) {
  const canonicalClassSessionId = clean(payload.classSessionId);
  if (canonicalClassSessionId) {
    return stableId("class-session", canonicalClassSessionId);
  }
  return stableId(
    payload.classRecordId || payload.classId,
    payload.assignmentId || payload.lessonId,
    payload.sessionDate,
  );
}

async function resolveParticipationSessionStorageId(db, payload = {}) {
  const preferredSessionId = lessonSessionId(payload);
  const canonicalClassSessionId = clean(payload.classSessionId);
  if (!canonicalClassSessionId) return preferredSessionId;

  try {
    const preferredSnap = await db.collection(SESSION_COLLECTION).doc(preferredSessionId).get();
    if (preferredSnap.exists) return preferredSessionId;
  } catch {
    // Continue with compatibility lookups.
  }

  try {
    const snap = await db.collection(SESSION_COLLECTION)
      .where("classSessionId", "==", canonicalClassSessionId)
      .limit(4)
      .get();
    const existing = snap.docs.find((docSnap) => clean(docSnap.id) === preferredSessionId) || snap.docs[0];
    if (existing) return clean(existing.id);
  } catch {
    // Fall through to deterministic legacy keys.
  }

  const fallbackIds = [
    stableId(
      payload.classRecordId || payload.classId,
      canonicalClassSessionId,
      payload.sessionDate,
    ),
    stableId(
      payload.classId,
      payload.assignmentId || payload.lessonId,
      payload.requestedSessionDate || payload.sessionDate,
    ),
  ];

  const seen = new Set([preferredSessionId]);
  for (const candidate of fallbackIds) {
    if (!candidate || seen.has(candidate)) continue;
    seen.add(candidate);
    try {
      const snap = await db.collection(SESSION_COLLECTION).doc(candidate).get();
      if (snap.exists) return candidate;
    } catch {
      // Keep trying the remaining compatibility keys.
    }
  }

  return preferredSessionId;
}

function liveSessionDate(value) {
  if (!value) return "";
  const date = typeof value?.toDate === "function" ? value.toDate() : new Date(value);
  if (!Number.isNaN(date?.getTime?.())) return date.toISOString().slice(0, 10);
  return clean(value).slice(0, 10);
}

function liveSessionAssignmentValues(session = {}) {
  return [
    ...(Array.isArray(session.assignmentIds) ? session.assignmentIds : []),
    ...(Array.isArray(session.chapterIds) ? session.chapterIds : []),
    ...(Array.isArray(session.curriculumIds) ? session.curriculumIds : []),
    session.assignmentId,
    session.assignment_id,
    session.lessonId,
  ].map(lower).filter(Boolean);
}

function isActiveLiveSession(session = {}) {
  const status = lower(session.status || session.sessionStatus);
  return !["cancelled", "canceled", "superseded", "deleted"].includes(status)
    && session.superseded !== true
    && session.isSuperseded !== true;
}

async function resolveCanonicalClassSession(db, {
  classRecordId = "",
  classId = "",
  classSessionId = "",
  assignmentId = "",
  requestedSessionDate = "",
} = {}) {
  let canonicalClassRecordId = clean(classRecordId);
  const logicalClassId = clean(classId);
  const assignment = lower(assignmentId);
  const requestedDate = clean(requestedSessionDate);

  if (!canonicalClassRecordId && logicalClassId) {
    try {
      const classSnap = await db.collection("classes").where("name", "==", logicalClassId).limit(2).get();
      if (classSnap.docs.length === 1) canonicalClassRecordId = clean(classSnap.docs[0].id);
    } catch {
      // Keep the legacy logical class id if class lookup is unavailable.
    }
  }

  const candidateMatches = (row = {}) => {
    if (!isActiveLiveSession(row)) return false;
    if (assignment && !liveSessionAssignmentValues(row).includes(assignment)) return false;
    if (canonicalClassRecordId && clean(row.classId) && clean(row.classId) !== canonicalClassRecordId) return false;
    return true;
  };

  const requestedClassSessionId = clean(classSessionId);
  if (requestedClassSessionId) {
    try {
      const snap = await db.collection(LIVE_SESSION_COLLECTION).doc(requestedClassSessionId).get();
      if (snap.exists) {
        const row = { id: snap.id, ...snap.data() };
        if (candidateMatches(row)) {
          return {
            classRecordId: canonicalClassRecordId || clean(row.classId),
            classSessionId: clean(row.id),
            sessionDate: liveSessionDate(row.startsAt || row.startAt || row.date) || requestedDate,
          };
        }
      }
    } catch {
      // Fall through to class + lesson resolution.
    }
  }

  if (!canonicalClassRecordId) {
    return { classRecordId: "", classSessionId: "", sessionDate: requestedDate };
  }

  try {
    const snap = await db.collection(LIVE_SESSION_COLLECTION)
      .where("classId", "==", canonicalClassRecordId)
      .limit(160)
      .get();
    const candidates = snap.docs
      .map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }))
      .filter(candidateMatches)
      .map((row) => ({
        row,
        sessionDate: liveSessionDate(row.startsAt || row.startAt || row.date),
      }))
      .filter((entry) => entry.sessionDate)
      .filter((entry) => !requestedDate || entry.sessionDate <= requestedDate)
      .sort((a, b) => b.sessionDate.localeCompare(a.sessionDate));

    const selected = candidates[0];
    if (selected) {
      return {
        classRecordId: canonicalClassRecordId,
        classSessionId: clean(selected.row.id),
        sessionDate: selected.sessionDate,
      };
    }
  } catch {
    // Preserve legacy behavior rather than blocking the class when timetable lookup fails.
  }

  return { classRecordId: canonicalClassRecordId, classSessionId: "", sessionDate: requestedDate };
}`;

  api = replaceOrConfirm(api, oldLessonSessionId, newLessonSessionBlock, "canonical participation session helpers");

  api = replaceOrConfirm(
    api,
    `      const classId = clean(payload.classId);
      const assignmentId = clean(payload.assignmentId || payload.lessonId);
      const sessionDate = clean(payload.sessionDate);
      const students = Array.isArray(payload.students) ? payload.students : [];

      if (!classId) return res.status(400).json({ ok: false, error: "classId is required" });
      if (!assignmentId) return res.status(400).json({ ok: false, error: "assignmentId is required" });
      assertDate(sessionDate);
      if (students.length > 150) return res.status(400).json({ ok: false, error: "Too many students in one participation session" });

      const normalizedStudents = students.map(normalizeStudent);
      const sessionId = lessonSessionId({ classId, assignmentId, sessionDate });`,
    `      const classId = clean(payload.classId);
      const classRecordId = clean(payload.classRecordId);
      const requestedClassSessionId = clean(payload.classSessionId);
      const assignmentId = clean(payload.assignmentId || payload.lessonId);
      const requestedSessionDate = clean(payload.sessionDate);
      const students = Array.isArray(payload.students) ? payload.students : [];

      if (!classId) return res.status(400).json({ ok: false, error: "classId is required" });
      if (!assignmentId) return res.status(400).json({ ok: false, error: "assignmentId is required" });
      assertDate(requestedSessionDate);
      if (students.length > 150) return res.status(400).json({ ok: false, error: "Too many students in one participation session" });

      const resolvedClassSession = await resolveCanonicalClassSession(db, {
        classRecordId,
        classId,
        classSessionId: requestedClassSessionId,
        assignmentId,
        requestedSessionDate,
      });
      const resolvedClassRecordId = clean(resolvedClassSession.classRecordId || classRecordId);
      const classSessionId = clean(resolvedClassSession.classSessionId);
      const sessionDate = clean(resolvedClassSession.sessionDate || requestedSessionDate);
      const normalizedStudents = students.map(normalizeStudent);
      const sessionId = await resolveParticipationSessionStorageId(db, {
        classId,
        classRecordId: resolvedClassRecordId,
        classSessionId,
        assignmentId,
        sessionDate,
        requestedSessionDate,
      });`,
    "participation save session resolution",
  );

  api = replaceOrConfirm(
    api,
    `      await sessionRef.set({
        classId,
        className: clean(payload.className) || classId,`,
    `      await sessionRef.set({
        classId,
        classRecordId: resolvedClassRecordId,
        classSessionId,
        className: clean(payload.className) || classId,`,
    "participation session canonical ids",
  );
  api = replaceOrConfirm(
    api,
    `        sessionDate,
        source: "teaching-slides-presenter",`,
    `        sessionDate,
        markedDate: requestedSessionDate,
        source: "teaching-slides-presenter",`,
    "participation marked date",
  );
  api = replaceOrConfirm(
    api,
    `          sessionId,
          classId,
          className: clean(payload.className) || classId,`,
    `          sessionId,
          classId,
          classRecordId: resolvedClassRecordId,
          classSessionId,
          className: clean(payload.className) || classId,`,
    "participation record canonical ids",
  );
  api = replaceOrConfirm(
    api,
    `          sessionDate,
          studentUid: student.studentUid,`,
    `          sessionDate,
          markedDate: requestedSessionDate,
          studentUid: student.studentUid,`,
    "participation record marked date",
  );
  api = replaceOrConfirm(
    api,
    `      return res.json({ ok: true, sessionId, revision: nextRevision, ...totals, rosterCount: normalizedStudents.length });`,
    `      return res.json({
        ok: true,
        sessionId,
        classRecordId: resolvedClassRecordId,
        classSessionId,
        sessionDate,
        markedDate: requestedSessionDate,
        revision: nextRevision,
        ...totals,
        rosterCount: normalizedStudents.length,
      });`,
    "participation save response identity",
  );

  api = replaceOrConfirm(
    api,
    `      const classId = clean(req.query?.classId);
      const assignmentId = clean(req.query?.assignmentId || req.query?.lessonId);
      const sessionDate = clean(req.query?.sessionDate);
      if (!classId) return res.status(400).json({ ok: false, error: "classId is required" });
      if (!assignmentId) return res.status(400).json({ ok: false, error: "assignmentId is required" });
      assertDate(sessionDate);
      const sessionId = lessonSessionId({ classId, assignmentId, sessionDate });
      const current = await loadSessionPayload(db, sessionId);
      return res.json({ ok: true, sessionId, ...current });`,
    `      const classId = clean(req.query?.classId);
      const classRecordId = clean(req.query?.classRecordId);
      const requestedClassSessionId = clean(req.query?.classSessionId);
      const assignmentId = clean(req.query?.assignmentId || req.query?.lessonId);
      const requestedSessionDate = clean(req.query?.sessionDate);
      if (!classId) return res.status(400).json({ ok: false, error: "classId is required" });
      if (!assignmentId) return res.status(400).json({ ok: false, error: "assignmentId is required" });
      assertDate(requestedSessionDate);
      const resolvedClassSession = await resolveCanonicalClassSession(db, {
        classRecordId,
        classId,
        classSessionId: requestedClassSessionId,
        assignmentId,
        requestedSessionDate,
      });
      const resolvedClassRecordId = clean(resolvedClassSession.classRecordId || classRecordId);
      const classSessionId = clean(resolvedClassSession.classSessionId);
      const sessionDate = clean(resolvedClassSession.sessionDate || requestedSessionDate);
      let sessionId = await resolveParticipationSessionStorageId(db, {
        classId,
        classRecordId: resolvedClassRecordId,
        classSessionId,
        assignmentId,
        sessionDate,
        requestedSessionDate,
      });
      let current = await loadSessionPayload(db, sessionId);
      if (!current.session) {
        const legacySessionId = stableId(classId, assignmentId, requestedSessionDate);
        const legacy = await loadSessionPayload(db, legacySessionId);
        if (legacy.session) {
          sessionId = legacySessionId;
          current = legacy;
        }
      }
      return res.json({
        ok: true,
        sessionId,
        classRecordId: resolvedClassRecordId,
        classSessionId,
        sessionDate,
        markedDate: requestedSessionDate,
        ...current,
      });`,
    "current participation canonical resolution",
  );

  api = replaceOrConfirm(
    api,
    `  RECORD_COLLECTION,
  lessonSessionId,`,
    `  RECORD_COLLECTION,
  lessonSessionId,
  resolveParticipationSessionStorageId,
  resolveCanonicalClassSession,`,
    "canonical resolver test export",
  );

  fs.writeFileSync(apiPath, api, "utf8");
}

let service = fs.readFileSync(servicePath, "utf8");
service = replaceOrConfirm(
  service,
  `export async function getCurrentClassParticipationSession({ classId = "", assignmentId = "", sessionDate = "" } = {}) {
  const query = new URLSearchParams({ classId, assignmentId, sessionDate }).toString();`,
  `export async function getCurrentClassParticipationSession({ classId = "", classRecordId = "", classSessionId = "", assignmentId = "", sessionDate = "" } = {}) {
  const query = new URLSearchParams({ classId, classRecordId, classSessionId, assignmentId, sessionDate }).toString();`,
  "participation service canonical current query",
);
fs.writeFileSync(servicePath, service, "utf8");

let presenter = fs.readFileSync(presenterPath, "utf8");
presenter = replaceOrConfirm(
  presenter,
  `  const roster = useMemo(() => rosterEntries(students), [students]);
  const sessionIdentity = \`${"${selectedClassId}|${assignmentId}|${sessionDate}"}\`;`,
  `  const roster = useMemo(() => rosterEntries(students), [students]);
  const classRecordId = normalize(selectedClass?.id);
  const sessionIdentity = \`${"${selectedClassId}|${assignmentId}|${sessionDate}"}\`;`,
  "presenter canonical class record id",
);
presenter = presenter.replaceAll(
  `getCurrentClassParticipationSession({ classId: selectedClassId, assignmentId, sessionDate })`,
  `getCurrentClassParticipationSession({ classId: selectedClassId, classRecordId, assignmentId, sessionDate })`,
);
presenter = replaceOrConfirm(
  presenter,
  `        const result = await saveClassParticipationSession({
          classId: selectedClassId,
          className: selectedClass?.name || selectedClassId,`,
  `        const result = await saveClassParticipationSession({
          classId: selectedClassId,
          classRecordId,
          className: selectedClass?.name || selectedClassId,`,
  "presenter save canonical class record id",
);
presenter = replaceOrConfirm(
  presenter,
  `  }, [selectedClassId, selectedClass?.name, assignmentId, sessionDate, sessionIdentity, slide, onQuestionChange]);`,
  `  }, [selectedClassId, selectedClass?.name, classRecordId, assignmentId, sessionDate, sessionIdentity, slide, onQuestionChange]);`,
  "presenter restore dependencies",
);
presenter = replaceOrConfirm(
  presenter,
  `  }, [selectedClassId, assignmentId, sessionDate, students, sessionIdentity]);`,
  `  }, [selectedClassId, classRecordId, assignmentId, sessionDate, students, sessionIdentity]);`,
  "presenter refresh dependencies",
);
fs.writeFileSync(presenterPath, presenter, "utf8");

console.log("Participation now binds late marking to the canonical scheduled class session.");
