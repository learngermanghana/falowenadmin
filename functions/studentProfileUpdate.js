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

function cleanStudentId(value) {
  return String(value || "").trim();
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

function statusCodeForError(error) {
  const explicit = Number(error?.statusCode || error?.status);
  if (Number.isFinite(explicit) && explicit >= 400 && explicit < 600) return explicit;
  const message = String(error?.message || "").toLowerCase();
  if (/authorization|unauthorized|not allowed|token/.test(message)) return 401;
  return 500;
}

function registerStudentProfileUpdateRoute({ app, db, admin, requireAuth }) {
  if (!app?.patch || !db?.collection || !admin?.firestore?.FieldValue?.serverTimestamp || typeof requireAuth !== "function") {
    throw new Error("Student profile update route dependencies are incomplete");
  }

  app.patch("/students/:studentId", async (req, res) => {
    try {
      const user = await requireAuth(req);
      const studentId = cleanStudentId(req.params?.studentId);
      if (!studentId) return res.status(400).json({ ok: false, error: "Student ID is required" });

      const updates = sanitizeStudentProfileUpdates(req.body?.updates ?? req.body);
      if (!Object.keys(updates).length) {
        return res.status(400).json({ ok: false, error: "No supported student fields were provided" });
      }

      const studentRef = db.collection("students").doc(studentId);
      const snapshot = await studentRef.get();
      if (!snapshot.exists) return res.status(404).json({ ok: false, error: "Student not found" });

      await studentRef.set({
        ...updates,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedBy: String(user?.email || user?.uid || "").trim(),
      }, { merge: true });

      return res.json({ ok: true, studentId, updates });
    } catch (error) {
      return res.status(statusCodeForError(error)).json({
        ok: false,
        error: error?.message || "Student profile update failed",
      });
    }
  });
}

module.exports = {
  EDITABLE_STUDENT_FIELDS,
  cleanStudentId,
  sanitizeStudentProfileUpdates,
  registerStudentProfileUpdateRoute,
};
