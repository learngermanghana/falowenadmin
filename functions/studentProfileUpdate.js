const EDITABLE_STUDENT_FIELDS = new Set([
  "name",
  "email",
  "phone",
  "studentCode",
  "level",
  "className",
  "program",
  "location",
  "status",
  "tuitionFee",
  "initialPaymentAmount",
  "paymentIntentAmount",
  "balanceDue",
  "paymentStatus",
  "contractStart",
  "contractEnd",
  "contractTermMonths",
]);

const DEFAULT_STUDENT_PROFILE_EDITOR_EMAILS = new Set([
  "moxflex@gmail.com",
  "staff@falowen.app",
]);

function cleanStudentId(value) {
  return String(value || "").trim();
}

function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

function normalizeEditableValue(value) {
  if (value === null) return "";
  if (["string", "number", "boolean"].includes(typeof value)) return value;
  return undefined;
}

function sanitizeStudentProfileUpdates(input = {}) {
  const source = input && typeof input === "object" && !Array.isArray(input) ? input : {};
  const updates = {};

  for (const [field, rawValue] of Object.entries(source)) {
    if (!EDITABLE_STUDENT_FIELDS.has(field)) continue;
    const value = normalizeEditableValue(rawValue);
    if (value === undefined) continue;
    updates[field] = typeof value === "string" ? value.trim() : value;
  }

  return updates;
}

function isStudentProfileEditor(user = {}, additionalEmails = []) {
  if (user?.admin === true || user?.staff === true) return true;

  const role = String(user?.role || user?.userRole || "").trim().toLowerCase();
  if (["admin", "staff"].includes(role)) return true;

  const allowedEmails = new Set(DEFAULT_STUDENT_PROFILE_EDITOR_EMAILS);
  for (const value of additionalEmails || []) {
    const email = normalizeEmail(value);
    if (email) allowedEmails.add(email);
  }

  const email = normalizeEmail(user?.email);
  return Boolean(email && allowedEmails.has(email));
}

function assertStudentProfileEditor(user = {}, additionalEmails = []) {
  if (isStudentProfileEditor(user, additionalEmails)) return user;
  const error = new Error("Staff authorization required");
  error.statusCode = 403;
  throw error;
}

function isMissingStudentError(error) {
  const code = String(error?.code || "").trim().toLowerCase();
  return code === "5" || code === "not-found" || code === "firestore/not-found";
}

function statusCodeForError(error) {
  const explicit = Number(error?.statusCode || error?.status);
  if (Number.isFinite(explicit) && explicit >= 400 && explicit < 600) return explicit;
  if (isMissingStudentError(error)) return 404;
  const message = String(error?.message || "").toLowerCase();
  if (/authorization|unauthorized|not allowed|token/.test(message)) return 401;
  return 500;
}

function validIsoDate(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(value || "").trim());
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function normalizeClassTransferRequest(body = {}) {
  const targetClassRecordId = cleanStudentId(
    body.targetClassRecordId || body.toClassRecordId || body.targetClassId || body.toClassId,
  );
  const effectiveDate = cleanStudentId(body.effectiveDate || body.transferDate || todayIso());
  const reason = cleanStudentId(body.reason || body.note || "Class switch");
  if (!targetClassRecordId) {
    const error = new Error("Select the class the student is moving to");
    error.statusCode = 400;
    throw error;
  }
  if (!validIsoDate(effectiveDate)) {
    const error = new Error("Effective date must be YYYY-MM-DD");
    error.statusCode = 400;
    throw error;
  }
  if (effectiveDate > todayIso()) {
    const error = new Error("Future-dated class transfers are not supported yet");
    error.statusCode = 400;
    throw error;
  }
  return { targetClassRecordId, effectiveDate, reason };
}

function studentClassIdentity(student = {}) {
  return {
    classRecordId: cleanStudentId(student.classRecordId || student.classId || student.assignedClassId),
    classId: cleanStudentId(student.classId || student.classRecordId || student.assignedClassId),
    className: cleanStudentId(student.className || student.class || student.groupName || student.cohortName),
    level: cleanStudentId(student.level || student.levelId),
  };
}

function targetClassIdentity(classDoc = {}, classRecordId = "") {
  const data = classDoc?.data ? classDoc.data() || {} : classDoc || {};
  const id = cleanStudentId(classDoc?.id || classRecordId);
  return {
    classRecordId: id,
    classId: id,
    className: cleanStudentId(data.name || data.className || data.classId || id),
    level: cleanStudentId(data.levelId || data.level || data.courseLevel || data.languageLevel).toUpperCase(),
  };
}

function buildStudentClassTransferPatch({ target = {}, previous = {}, effectiveDate = "", transferSummary = {}, admin }) {
  const timestamp = admin.firestore.FieldValue.serverTimestamp();
  const arrayUnion = admin.firestore.FieldValue.arrayUnion;
  const targetName = cleanStudentId(target.className || target.classId || target.classRecordId);
  const targetId = cleanStudentId(target.classRecordId || target.classId);
  const patch = {
    classId: targetId,
    classRecordId: targetId,
    assignedClassId: targetId,
    className: targetName,
    class: targetName,
    group: targetName,
    groupId: targetId,
    groupName: targetName,
    cohort: targetName,
    cohortId: targetId,
    cohortName: targetName,
    previousClassId: cleanStudentId(previous.classRecordId || previous.classId),
    previousClassName: cleanStudentId(previous.className),
    classTransferEffectiveDate: effectiveDate,
    lastClassTransferAt: timestamp,
    updatedAt: timestamp,
  };
  if (target.level) {
    patch.level = target.level;
    patch.levelId = target.level;
  }
  if (typeof arrayUnion === "function") {
    patch.classTransfers = arrayUnion(transferSummary);
  }
  return patch;
}

function classTransferSortValue(item = {}) {
  return [
    cleanStudentId(item.effectiveDate),
    cleanStudentId(item.createdAtIso),
    cleanStudentId(item.id),
  ].join("|");
}

function registerStudentProfileUpdateRoute({ app, db, admin, requireAuth, staffEmails = [] }) {
  if (!app?.patch || !app?.post || !app?.get || !db?.collection || !db?.batch || !admin?.firestore?.FieldValue?.serverTimestamp || typeof requireAuth !== "function") {
    throw new Error("Student profile update route dependencies are incomplete");
  }

  app.patch("/students/:studentId", async (req, res) => {
    try {
      const user = await requireAuth(req);
      assertStudentProfileEditor(user, staffEmails);

      const studentId = cleanStudentId(req.params?.studentId);
      if (!studentId) return res.status(400).json({ ok: false, error: "Student ID is required" });

      const updates = sanitizeStudentProfileUpdates(req.body?.updates ?? req.body);
      if (!Object.keys(updates).length) {
        return res.status(400).json({ ok: false, error: "No supported student fields were provided" });
      }

      const studentRef = db.collection("students").doc(studentId);
      await studentRef.update({
        ...updates,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedBy: String(user?.email || user?.uid || "").trim(),
      });

      return res.json({ ok: true, studentId, updates });
    } catch (error) {
      return res.status(statusCodeForError(error)).json({
        ok: false,
        error: isMissingStudentError(error) ? "Student not found" : error?.message || "Student profile update failed",
      });
    }
  });

  app.post("/students/:studentId/transfer-class", async (req, res) => {
    try {
      const user = await requireAuth(req);
      assertStudentProfileEditor(user, staffEmails);

      const studentId = cleanStudentId(req.params?.studentId);
      if (!studentId) return res.status(400).json({ ok: false, error: "Student ID is required" });

      const { targetClassRecordId, effectiveDate, reason } = normalizeClassTransferRequest(req.body || {});
      const studentRef = db.collection("students").doc(studentId);
      const targetRef = db.collection("classes").doc(targetClassRecordId);
      const [studentSnap, targetSnap] = await Promise.all([studentRef.get(), targetRef.get()]);
      if (!studentSnap.exists) return res.status(404).json({ ok: false, error: "Student not found" });
      if (!targetSnap.exists) return res.status(404).json({ ok: false, error: "Target class not found" });

      const student = { id: studentSnap.id, ...studentSnap.data() };
      const previous = studentClassIdentity(student);
      const target = targetClassIdentity(targetSnap, targetClassRecordId);
      if (
        (previous.classRecordId && previous.classRecordId === target.classRecordId)
        || (!previous.classRecordId && previous.className && previous.className === target.className)
      ) {
        return res.status(400).json({ ok: false, error: "Student is already in that class" });
      }

      const actor = cleanStudentId(user?.email || user?.uid || "staff");
      const createdAtIso = new Date().toISOString();
      const transferRef = db.collection("studentClassTransfers").doc();
      const transferSummary = {
        id: transferRef.id,
        effectiveDate,
        fromClassId: previous.classRecordId || previous.classId,
        fromClassName: previous.className,
        fromLevel: previous.level,
        toClassId: target.classRecordId,
        toClassName: target.className,
        toLevel: target.level,
        reason,
        createdAtIso,
      };
      const transferRecord = {
        ...transferSummary,
        studentId,
        studentCode: cleanStudentId(student.studentCode || student.studentcode),
        studentName: cleanStudentId(student.name || student.displayName),
        studentEmail: normalizeEmail(student.email),
        actor,
        historicalAttendancePreserved: true,
        historicalParticipationPreserved: true,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      };
      const studentPatch = buildStudentClassTransferPatch({
        target,
        previous,
        effectiveDate,
        transferSummary,
        admin,
      });
      studentPatch.updatedBy = actor;

      const batch = db.batch();
      batch.update(studentRef, studentPatch);
      batch.set(transferRef, transferRecord);
      batch.set(db.collection("auditLogs").doc(), {
        type: "student.class_transferred",
        studentId,
        studentCode: transferRecord.studentCode,
        fromClassId: transferSummary.fromClassId,
        fromClassName: transferSummary.fromClassName,
        toClassId: transferSummary.toClassId,
        toClassName: transferSummary.toClassName,
        effectiveDate,
        reason,
        actorId: actor,
        historicalAttendancePreserved: true,
        historicalParticipationPreserved: true,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      await batch.commit();

      return res.json({
        ok: true,
        studentId,
        transfer: transferSummary,
        student: {
          classId: target.classRecordId,
          classRecordId: target.classRecordId,
          assignedClassId: target.classRecordId,
          className: target.className,
          level: target.level || previous.level,
          levelId: target.level || previous.level,
          classTransferEffectiveDate: effectiveDate,
          previousClassId: transferSummary.fromClassId,
          previousClassName: transferSummary.fromClassName,
          classTransfers: [...(Array.isArray(student.classTransfers) ? student.classTransfers : []), transferSummary]
            .sort((a, b) => classTransferSortValue(a).localeCompare(classTransferSortValue(b))),
        },
      });
    } catch (error) {
      return res.status(statusCodeForError(error)).json({
        ok: false,
        error: isMissingStudentError(error) ? "Student or class not found" : error?.message || "Class transfer failed",
      });
    }
  });

  app.get("/students/:studentId/class-transfers", async (req, res) => {
    try {
      const user = await requireAuth(req);
      assertStudentProfileEditor(user, staffEmails);
      const studentId = cleanStudentId(req.params?.studentId);
      if (!studentId) return res.status(400).json({ ok: false, error: "Student ID is required" });

      const snap = await db.collection("studentClassTransfers").where("studentId", "==", studentId).limit(100).get();
      const transfers = snap.docs
        .map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }))
        .sort((a, b) => classTransferSortValue(b).localeCompare(classTransferSortValue(a)));
      return res.json({ ok: true, studentId, transfers });
    } catch (error) {
      return res.status(statusCodeForError(error)).json({
        ok: false,
        error: error?.message || "Could not load class transfer history",
      });
    }
  });
}

module.exports = {
  EDITABLE_STUDENT_FIELDS,
  DEFAULT_STUDENT_PROFILE_EDITOR_EMAILS,
  cleanStudentId,
  sanitizeStudentProfileUpdates,
  isStudentProfileEditor,
  assertStudentProfileEditor,
  isMissingStudentError,
  validIsoDate,
  normalizeClassTransferRequest,
  studentClassIdentity,
  targetClassIdentity,
  buildStudentClassTransferPatch,
  registerStudentProfileUpdateRoute,
};
