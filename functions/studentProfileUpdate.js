const { courseEnrollmentPatch } = require("./courseEnrollment");
const { planEnrollmentTransfer } = require("./levelEnrollmentTransfer");
const { CONTRACT_TERM_MONTHS, addCalendarMonths, asDate, isoDate, normalizeLevel } = require("./studentContractLifecycle");
const EDITABLE_STUDENT_FIELDS = new Set([
  "name",
  "email",
  "phone",
  "emergencyContactName",
  "emergencyContactPhoneNumber",
  "emergencyContactRelationship",
  "studentCode",
  "level",
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
    if ((field === "contractStart" || field === "contractEnd") && (rawValue === null || rawValue === "")) {
      updates[field] = null;
      continue;
    }
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

function nextUniversityClass(classes, level, today) {
  return classes
    .flatMap(snapshot => {
      const data = snapshot.data();
      const target = targetClassIdentity(snapshot);
      const start = isoDate(data.startDate || data.startsAt);
      const status = cleanStudentId(data.status).toLowerCase();
      const closed = data.archived === true || data.isArchived === true || data.active === false ||
        data.registrationOpen === false || (status && !["upcoming", "active", "scheduled"].includes(status));
      return !closed && target.level === level && start && start >= today ? [{ ...target, start }] : [];
    })
    .sort((a, b) => a.start.localeCompare(b.start) || a.classRecordId.localeCompare(b.classRecordId))[0];
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

function providerIdsForAuthUser(userRecord = {}) {
  return Array.from(new Set(
    (Array.isArray(userRecord.providerData) ? userRecord.providerData : [])
      .map((entry) => cleanStudentId(entry?.providerId))
      .filter(Boolean),
  ));
}

async function resolveStudentAuthIdentity({ studentRef, admin }) {
  if (!studentRef?.get) return null;

  const snapshot = await studentRef.get();
  if (!snapshot?.exists) return null;

  const student = snapshot.data ? snapshot.data() || {} : {};
  const uid = cleanStudentId(student.uid || student.authUid || student.firebaseUid);
  let email = normalizeEmail(student.authEmail || student.loginEmail);
  let providers = [];

  if (uid && typeof admin?.auth === "function") {
    try {
      const authUser = await admin.auth().getUser(uid);
      email = normalizeEmail(authUser?.email) || email;
      providers = providerIdsForAuthUser(authUser);
    } catch (error) {
      const code = String(error?.code || "").trim().toLowerCase();
      if (!["auth/user-not-found", "user-not-found"].includes(code)) {
        throw error;
      }
    }
  }

  return {
    uid,
    email,
    providers,
  };
}


const MANUAL_TRIAL_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

function isStudentAlreadyPaid(student = {}) {
  const paymentStatus = String(student.paymentStatus || student.payment_status || "").trim().toLowerCase().replace(/[_-]+/g," ");
  if (["paid","partially paid","partial","completed","success"].includes(paymentStatus) || ["paid", "completed"].includes(String(student.status || "").trim().toLowerCase())) return true;
  return ["paid","paidAmount","amountPaid","initialPaymentAmount","tuitionPaid","totalPaid"]
    .some(field => Number(String(student[field] ?? "0").replace(/[^0-9.-]/g,"")) > 0);
}

// Changing a student's payment status cannot be used to grant access.
// Only staff can explicitly activate a limited trial on an existing unpaid account.
function makeManualTrialPatch(student = {}, now = new Date(), fieldValue = {}) {
  if (isStudentAlreadyPaid(student)) {
    const error = new Error("This student already has a payment. Manage their paid contract instead of restarting a free trial.");
    error.statusCode = 409;
    throw error;
  }
  const start = new Date(now);
  if (Number.isNaN(start.getTime())) throw new Error("Invalid trial start date");
  const end = new Date(start.getTime() + MANUAL_TRIAL_DURATION_MS);
  const patch = {
    status: "trial_active",
    trialStatus: "active",
    paymentStatus: "Pending",
    trialStartedAt: start.toISOString(),
    trialEndsAt: end.toISOString(),
    updatedAt: typeof fieldValue.serverTimestamp === "function" ? fieldValue.serverTimestamp() : start.toISOString(),
  };
  // Don't retain old expiry blockers when staff explicitly starts a new trial.
  for (const field of ["trialExpiredAt","trialPurgeAt","trialAccessBlockedAt"]) {
    if (typeof fieldValue.delete === "function") patch[field] = fieldValue.delete();
  }
  return patch;
}


function reconcileManualPaymentPatch(student, updates) {
  const patch = { ...updates };
  const fail = message => { throw Object.assign(new Error(message), { statusCode: 409 }); };
  const money = (value, field) => {
    const raw = String(value ?? "").trim().replace(/,/g, "");
    if (!/^\d+(?:\.\d{1,2})?$/.test(raw) || !Number.isSafeInteger(Math.round(Number(raw)*100))) fail("Invalid " + field);
    return Math.round(Number(raw)*100)/100;
  };
  const oldLevel = normalizeLevel(student.level || student.levelId);
  const newLevel = normalizeLevel(patch.level || oldLevel);
  if (oldLevel && newLevel && oldLevel !== newLevel && isStudentAlreadyPaid(student)) fail("Use Student Upgrade Tools to change paid course levels.");
  const hasBalance = Object.hasOwn(patch, "balanceDue");
  const hasFee = Object.hasOwn(patch, "tuitionFee");
  if (Object.hasOwn(patch, "initialPaymentAmount")) patch.initialPaymentAmount = money(patch.initialPaymentAmount, "initial payment amount");
  if (hasBalance || hasFee) {
    if (!hasBalance) fail("Confirm the current-level balance when changing tuition.");
    const balance = money(patch.balanceDue, "balance due");
    const fee = money(patch.tuitionFee ?? student.tuitionFee, "current-level tuition fee");
    if (balance > fee) fail("Balance cannot exceed current-level tuition.");
    if (["pending","awaiting_payment","expired"].includes(String(student.upgradeStatus || "").toLowerCase())) fail("Reconcile this student's upgrade through payment tools first.");
    const status = balance === 0 ? "Paid" : balance === fee ? "Unpaid" : "Partially Paid";
    if (patch.paymentStatus && String(patch.paymentStatus).toLowerCase() !== status.toLowerCase()) fail("Payment status disagrees with balance.");
    Object.assign(patch, { balanceDue: balance, balance, paymentStatus: status });
    if (hasFee) patch.tuitionFee = fee;
    if (String(patch.status || student.status).toLowerCase() === "paid" && balance > 0) patch.status = "Active";
  } else if (String(patch.paymentStatus || patch.status || "").toLowerCase() === "paid") {
    if (money(student.balanceDue ?? student.balance, "balance due") !== 0) fail("Cannot mark a student paid with outstanding balance.");
  }
  return patch;
}

function registerStudentProfileUpdateRoute({ app, db, admin, requireAuth, staffEmails = [], now = () => new Date() }) {
  if (!app?.patch || !app?.post || !app?.get || !db?.collection || !db?.batch || !admin?.firestore?.FieldValue?.serverTimestamp || typeof requireAuth !== "function") {
    throw new Error("Student profile update route dependencies are incomplete");
  }

  app.patch("/students/:studentId", async (req, res) => {
    try {
      const user = await requireAuth(req);
      assertStudentProfileEditor(user, staffEmails);

      const studentId = cleanStudentId(req.params?.studentId);
      if (!studentId) return res.status(400).json({ ok: false, error: "Student ID is required" });

      const input = req.body?.updates ?? req.body;
      let updates = sanitizeStudentProfileUpdates(input);
      if (!Object.keys(updates).length && !input?.courseEnrollment) {
        return res.status(400).json({ ok: false, error: "No supported student fields were provided" });
      }

      const studentRef = db.collection("students").doc(studentId);
      const emailWasEdited = Object.prototype.hasOwnProperty.call(updates, "email");
      const authIdentity = emailWasEdited
        ? await resolveStudentAuthIdentity({ studentRef, admin })
        : null;
      const identityPatch = authIdentity?.email
        ? { authEmail: authIdentity.email }
        : {};

      const audit = {
        ...identityPatch,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedBy: String(user?.email || user?.uid || "").trim(),
      };
      if (input?.courseEnrollment) {
        updates = await db.runTransaction(async tx => {
          const snapshot = await tx.get(studentRef);
          if (!snapshot.exists) throw Object.assign(new Error("Student not found"), { statusCode: 404 });
          const { program: ignoredProgram, ...ordinary } = updates;
          const patch = { ...ordinary, ...courseEnrollmentPatch({ ...snapshot.data(), ...ordinary }, input.courseEnrollment) };
          tx.update(studentRef, { ...patch, ...audit });
          return patch;
        });
      } else if (["level","tuitionFee","balanceDue","paymentStatus","initialPaymentAmount","contractStart","status"].some(field => Object.hasOwn(updates, field))) {
        updates = await db.runTransaction(async tx => {
          const snapshot = await tx.get(studentRef);
          if (!snapshot.exists) throw Object.assign(new Error("Student not found"), { statusCode: 404 });
          const previous = snapshot.data() || {};
          const patch = reconcileManualPaymentPatch(previous, updates);
          const keys = ["level","tuitionFee","balanceDue","balance","paymentStatus","initialPaymentAmount","contractStart","status"];
          const changed = keys.filter(key => Object.hasOwn(patch,key) && previous[key] !== patch[key]);
          tx.update(studentRef, { ...patch, ...audit });
          if (changed.length) tx.set(db.collection("auditLogs").doc(), {
            type: "student.manual_payment_edit", studentId, actor: audit.updatedBy,
            before: Object.fromEntries(changed.map(key => [key, previous[key] ?? null])),
            after: Object.fromEntries(changed.map(key => [key, patch[key] ?? null])),
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
          });
          return patch;
        });
      } else {
        await studentRef.update({ ...updates, ...audit });
      }

      return res.json({
        ok: true,
        studentId,
        updates: { ...updates, ...identityPatch },
        ...(emailWasEdited ? { authIdentity } : {}),
      });
    } catch (error) {
      return res.status(statusCodeForError(error)).json({
        ok: false,
        error: isMissingStudentError(error) ? "Student not found" : error?.message || "Student profile update failed",
      });
    }
  });

  // Staff-only approval: knowing the shared invitation URL must never grant free access.
  require("./studentLevelEnrollments").registerStudentLevelEnrollments({app,db,admin,requireAuth,isEditor:user=>isStudentProfileEditor(user,staffEmails)});

  app.post("/students/:studentId/university-approval", async (req, res) => {
    try {
      const user = await requireAuth(req);
      assertStudentProfileEditor(user, staffEmails);
      const studentId = cleanStudentId(req.params.studentId);
      if (!studentId) return res.status(400).json({ ok: false, error: "Student ID is required" });
      const decision = String(req.body?.decision || "").trim().toLowerCase();
      if (!["approve", "revoke"].includes(decision)) {
        return res.status(400).json({ ok: false, error: "Choose approve or revoke" });
      }
      const studentRef = db.collection("students").doc(studentId);
      const patch = await db.runTransaction(async (tx) => {
        const snap = await tx.get(studentRef);
        if (!snap.exists) throw Object.assign(new Error("Student not found"), { statusCode: 404 });
        const student = snap.data();
        if (student.program !== "swahili" ||
            student.registrationSource !== "university-invite" ||
            student.institutionId !== "university-hamburg" ||
            student.cohortId !== "university-hamburg-kiswahili-a1") {
          throw Object.assign(new Error("This student does not belong to the University of Hamburg Kiswahili invitation cohort"), { statusCode: 409 });
        }
        if (!student.uid) {
          throw Object.assign(new Error("Student has no connected Firebase login"), { statusCode: 409 });
        }
        const approved = decision === "approve";
        const enrollment = {};
        if (approved) {
          const approvalDate = now();
          const level = normalizeLevel(student.level || student.levelId) || "A1";
          const previousContract = asDate(student.contractStart) && asDate(student.contractEnd);
          if (!previousContract || !student.classRecordId) {
            const classes = await tx.get(db.collection("classes").where("language", "in", ["Swahili", "swahili", "Kiswahili", "kiswahili"]));
            const target = nextUniversityClass(classes.docs, level, isoDate(approvalDate));
            if (!target) {
              throw Object.assign(new Error(`No upcoming Swahili ${level} class is open for registration. Open a class and retry approval.`), { statusCode: 409 });
            }
            Object.assign(enrollment, {
              classId: target.classRecordId, classRecordId: target.classRecordId,
              assignedClassId: target.classRecordId, className: target.className,
              level, levelId: level,
            });
          }
          if (!previousContract) {
            Object.assign(enrollment, {
              contractStart: isoDate(approvalDate),
              contractEnd: isoDate(addCalendarMonths(approvalDate, CONTRACT_TERM_MONTHS)),
              contractTermMonths: CONTRACT_TERM_MONTHS,
            });
          }
        }
        const next = {
          ...enrollment,
          institutionVerification: approved ? "approved" : "pending",
          accessType: approved ? "complimentary" : "invitation_pending",
          status: approved ? "active" : "registered",
          paymentStatus: approved ? "exempt" : "exempt_pending",
          trialStatus: "not_applicable",
          tuitionFee: null, balanceDue: null, paymentIntentAmount: null,
          institutionReviewedBy: String(user?.email || user?.uid || "").trim(),
          institutionReviewedAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        };
        for (const field of ["trialStartedAt", "trialUsedAt", "trialEndsAt", "trialPurgeAt", "trialExpiredAt", "trialAccessBlockedAt"]) {
          next[field] = admin.firestore.FieldValue.delete();
        }
        tx.update(studentRef, next);
        return {
          ...enrollment,
          institutionVerification: next.institutionVerification,
          accessType: next.accessType,
          status: next.status,
          paymentStatus: next.paymentStatus,
          trialStatus: next.trialStatus,
          tuitionFee: null, balanceDue: null, paymentIntentAmount: null,
        };
      });
      return res.json({ ok: true, updates: patch, message: decision === "approve"
        ? "Complimentary University of Hamburg Kiswahili access approved."
        : "University course access returned to pending verification." });
    } catch (error) {
      return res.status(statusCodeForError(error)).json({ ok: false, error: error?.message || "Could not review university registration" });
    }
  });

  app.post("/students/:studentId/activate-trial", async (req, res) => {
    try {
      const user = await requireAuth(req);
      assertStudentProfileEditor(user, staffEmails);
      const studentId = cleanStudentId(req.params?.studentId);
      if (!studentId) return res.status(400).json({ ok: false, error: "Student ID is required" });
      const studentRef = db.collection("students").doc(studentId);
      const snapshot = await studentRef.get();
      if (!snapshot.exists) return res.status(404).json({ ok: false, error: "Student not found" });
      const student = snapshot.data() || {};
      // Do not create a second sign-in account or change the student's UID.
      const uid = cleanStudentId(student.uid || student.authUid || student.firebaseUid);
      if (!uid) {
        return res.status(409).json({ ok: false, error: "Student account has no Firebase UID. Link their existing sign-in identity before activating trial access." });
      }
      if (typeof admin.auth === "function") {
        try { await admin.auth().getUser(uid); }
        catch (error) {
          if (String(error?.code || "") === "auth/user-not-found") {
            return res.status(409).json({ ok: false, error: "Firebase login for this UID does not exist. Resolve the account sign-in first; do not create a duplicate student row." });
          }
          throw error;
        }
      }
      const patch = makeManualTrialPatch(student, new Date(), admin.firestore.FieldValue);
      patch.updatedBy = String(user?.email || user?.uid || "").trim();
      const batch = db.batch();
      batch.update(studentRef, patch);
      batch.set(db.collection("auditLogs").doc(), {
        type: "student.manual_trial_activation",
        studentId,
        studentCode: cleanStudentId(student.studentCode || student.studentcode),
        trialStartedAt: patch.trialStartedAt,
        trialEndsAt: patch.trialEndsAt,
        actor: patch.updatedBy,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      await batch.commit();
      return res.json({
        ok: true,
        studentId,
        trial: { status: patch.status, trialStatus: patch.trialStatus, paymentStatus: patch.paymentStatus,
          trialStartedAt: patch.trialStartedAt, trialEndsAt: patch.trialEndsAt },
        message: "Seven-day trial activated on the existing Firebase student record.",
      });
    } catch (error) {
      return res.status(statusCodeForError(error)).json({
        ok: false, error: isMissingStudentError(error) ? "Student not found" : error?.message || "Could not activate trial",
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
      const primary = String(student.program || "german").toLowerCase();
      const program = String(req.body?.program || primary).toLowerCase();
      const secondary = program !== primary;
      if (!["german","swahili"].includes(program) || (secondary && student.secondaryProgram !== program)) return res.status(400).json({ok:false,error:"Student is not enrolled in this language"});
      const targetData = targetSnap.data() || {};
      const language = String(targetData.language || targetData.program || "german").toLowerCase().replace("kiswahili","swahili");
      if (language !== program) return res.status(400).json({ok:false,error:"Select a class in the same language"});
      if (["archived","graduated","inactive"].includes(String(targetData.status || "").toLowerCase())) return res.status(400).json({ok:false,error:"Target class is inactive"});
      const placement = secondary ? student.coursePlacements?.[program] || {} : student;
      const previous = studentClassIdentity(placement);
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
        program,
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

      await db.runTransaction(async batch => {
      const latest=await batch.get(studentRef);
      if(!latest.exists)throw Object.assign(new Error("Student not found"),{statusCode:404});
      const latestData=latest.data();
      const latestPlacement=secondary?latestData.coursePlacements?.[program]||{}:latestData;
      const current=studentClassIdentity(latestPlacement);
      if(current.level!==previous.level||current.className!==previous.className||current.classRecordId!==previous.classRecordId)throw Object.assign(new Error("Student class changed. Refresh and try again."),{statusCode:409});
      const enrollmentCollection=studentRef.collection("levelEnrollments");
      const enrollmentSnap=await batch.get(enrollmentCollection);
      const changes=planEnrollmentTransfer({program,previous,target,rows:enrollmentSnap.docs.map(d=>({...d.data(),id:d.id})),studentId,studentCode:transferRecord.studentCode||studentId,disposition:req.body?.enrollmentDisposition});
      for(const change of changes){const ref=enrollmentCollection.doc(change.id);const stamp=admin.firestore.FieldValue.serverTimestamp();if(change.create)batch.set(ref,{...change.patch,createdAt:stamp,createdBy:user.uid});else batch.update(ref,{...change.patch,updatedAt:stamp});}
      if (secondary) {
        const nested = Object.fromEntries(Object.entries(studentPatch).filter(([key])=> !["updatedAt","updatedBy"].includes(key)).map(([key,value])=>["coursePlacements."+program+"."+key,value]));
        batch.update(studentRef,{...nested,updatedAt:studentPatch.updatedAt,updatedBy:actor});
      } else batch.update(studentRef, studentPatch);
      batch.set(transferRef, transferRecord);
      batch.set(db.collection("auditLogs").doc(), {
        type: "student.class_transferred",
        program,
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
        enrollmentDisposition:req.body?.enrollmentDisposition||"",
        enrollmentChanges:changes.map(change=>({id:change.id,status:change.patch.status||"",created:!!change.create})),
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      });

      const responsePlacement = {
          classId: target.classRecordId,
          classRecordId: target.classRecordId,
          assignedClassId: target.classRecordId,
          className: target.className,
          level: target.level || previous.level,
          levelId: target.level || previous.level,
          classTransferEffectiveDate: effectiveDate,
          previousClassId: transferSummary.fromClassId,
          previousClassName: transferSummary.fromClassName,
          classTransfers: [...(Array.isArray(placement.classTransfers) ? placement.classTransfers : []), transferSummary]
            .sort((a, b) => classTransferSortValue(a).localeCompare(classTransferSortValue(b))),
      };
      return res.json({ok:true,studentId,transfer:transferSummary,student:secondary ? {coursePlacements:{...student.coursePlacements,[program]:{...placement,...responsePlacement}}} : responsePlacement});
    } catch (error) {
      return res.status(statusCodeForError(error)).json({
        ok: false,
        error: isMissingStudentError(error) ? "Student or class not found" : error?.message || "Class transfer failed",
      });
    }
  });

  // Owner-only read of actual exam subscription records, with bounded pagination.
  app.get("/students/access-subscriptions", async (req, res) => {
    try {
      const user = await requireAuth(req);
      if (user?.email_verified !== true || normalizeEmail(user.email) !== "moxflex@gmail.com") return res.status(403).json({error:"Verified owner access required."});
      const studentId = cleanStudentId(req.query?.studentId);
      const cursor = String(req.query?.cursor || "");
      if ((studentId && (studentId.includes("/") || studentId.length > 200)) || cursor.includes("/") || cursor.length > 250) return res.status(400).json({error:"Invalid filter."});
      let query = db.collection("mockSubscriptions");
      if (studentId) {
        const student = (await db.collection("students").doc(studentId).get()).data();
        if (!student?.uid) return res.json({ok:true,subscriptions:[],nextCursor:null,identityUnavailable:true});
        query = query.where("uid","==",student.uid);
      }
      query = query.orderBy(admin.firestore.FieldPath.documentId());
      if (cursor) query = query.startAfter(cursor);
      const snap = await query.limit(51).get();
      const subscriptions = snap.docs.slice(0,50).map(doc => {
        const data = doc.data();
        return {id:doc.id,uid:data.uid,level:data.level,scope:data.scope,status:data.status,expiresAtMs:data.expiresAtMs};
      });
      res.set("Cache-Control","private, no-store");
      return res.json({ok:true,subscriptions,nextCursor:snap.docs.length>50?snap.docs[49].id:null});
    } catch (error) {
      return res.status(statusCodeForError(error)).json({ok:false,error:"Could not read subscriptions."});
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
  providerIdsForAuthUser,
  resolveStudentAuthIdentity,
  registerStudentProfileUpdateRoute,
  isStudentAlreadyPaid,
  makeManualTrialPatch,
  reconcileManualPaymentPatch,
};
