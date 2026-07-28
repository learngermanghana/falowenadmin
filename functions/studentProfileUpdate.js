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

function registerStudentProfileUpdateRoute({ app, db, admin, requireAuth, staffEmails = [] }) {
  if (!app?.patch || !db?.collection || !admin?.firestore?.FieldValue?.serverTimestamp || typeof requireAuth !== "function") {
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
}

module.exports = {
  EDITABLE_STUDENT_FIELDS,
  DEFAULT_STUDENT_PROFILE_EDITOR_EMAILS,
  cleanStudentId,
  sanitizeStudentProfileUpdates,
  isStudentProfileEditor,
  assertStudentProfileEditor,
  isMissingStudentError,
  registerStudentProfileUpdateRoute,
};
