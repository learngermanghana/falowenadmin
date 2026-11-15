const {
  isActiveStudent,
  loadStudentsForDueClasses,
  sendManualClassReminder,
  studentBelongsToClass,
} = require("./classSessionReminderEmails");
const { isAppAssessment } = require("./appAssessment");

function canAdministerAttendance(user) {
  return user.admin === true || user.role === "admin"
    || (user.email_verified === true && String(user.email).toLowerCase() === "moxflex@gmail.com");
}

async function loadTeachingStaff(db, user) {
  if (!(user.staff === true || ["staff", "tutor"].includes(user.role))
    || !(Array.isArray(user.staffPages) ? user.staffPages.includes("attendance") : user.staffRole === "teacher")) return null;
  const staff = (await db.collection("falowenStaffAccess").doc(user.uid).get()).data();
  const hasAttendance = Array.isArray(staff?.pages) ? staff.pages.includes("attendance") : staff?.staffRole === "teacher";
  return staff?.active && hasAttendance ? staff : null;
}

function allowsClass(user, staff, klass) {
  const language = klass.language === "Swahili" ? "swahili" : "german";
  return klass.tutorId === user.uid && staff?.languages?.includes(language)
    && user.staffLanguages?.includes(language);
}

async function authorizeAssignedTutor(db, user, classId, sessionId) {
  if ([classId, sessionId].some((value) => !value || value.includes("/"))) return null;
  const [staff, classDoc, sessionDoc] = await Promise.all([
    loadTeachingStaff(db, user),
    db.collection("classes").doc(classId).get(),
    db.collection("classSessions").doc(sessionId).get(),
  ]);
  const klass = classDoc.data();
  const session = sessionDoc.data();
  if (!klass || !session || !allowsClass(user, staff, klass)
    || (session.classRecordId || session.classId) !== classId) return null;
  return { klass: { ...klass, id: classId }, session: { ...session, id: sessionId } };
}

function registerAssignedTutorAttendance(app, { admin, db, runtimeConfig, verifyUser }) {
  app.post("/class-reminder", async (req, res) => {
    try {
      const user = await verifyUser(req);
      if (!canAdministerAttendance(user)) return res.status(403).json({ error: "Administrator access required." });
      const { classId, sessionId } = req.body || {};
      if ([classId, sessionId].some((id) => typeof id !== "string" || !id || id.includes("/"))) {
        return res.status(400).json({ error: "Select a valid class and session." });
      }
      const result = await sendManualClassReminder({ admin, db, classId, sessionId, runtimeConfig });
      return res.json({ ok: true, ...result });
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  });

  app.post("/assigned-tutor-attendance", async (req, res) => {
    try {
      const user = await verifyUser(req);
      const staff = await loadTeachingStaff(db, user);
      if (!staff) return res.status(403).json({ error: "Active teaching access required." });
      const { action, classId, sessionId, marks } = req.body || {};
      if (action === "list") {
        const docs = await db.collection("classes").where("tutorId", "==", user.uid).get();
        const classes = docs.docs.map(doc => ({ ...doc.data(), id: doc.id })).filter(klass => allowsClass(user, staff, klass));
        return res.json({ ok: true, classes: classes.map(({ id, name, language }) => ({ id, name, language })) });
      }

      if (typeof classId !== "string" || !classId || classId.includes("/")) {
        return res.status(400).json({ error: "Select a class." });
      }
      const klass = { ...(await db.collection("classes").doc(classId).get()).data(), id: classId };
      if (!allowsClass(user, staff, klass)) return res.status(403).json({ error: "This class is not assigned to you." });
      const roster = async () => (await loadStudentsForDueClasses(db, [klass]))
        .filter(student => isActiveStudent(student) && studentBelongsToClass(student, klass))
        .map(student => ({ id: student.id, studentCode: student.studentCode || student.studentcode || student.uid || student.id, name: student.name || student.displayName || "" }));
      const attendance = db.collection("attendance").doc(classId).collection("sessions");
      if (action === "load") {
        const [sessionDocs, attendanceDocs, students] = await Promise.all([
          db.collection("classSessions").where("classId", "==", classId).get(), attendance.get(), roster(),
        ]);
        const sessions = sessionDocs.docs.map(doc => {
          const row = doc.data();
          return {
            id: doc.id, status: row.status, topic: row.topic, assignmentIds: row.assignmentIds || row.chapterIds || [],
            startsAt: row.startsAt?.toDate?.().toISOString() || row.startsAt,
            endsAt: row.endsAt?.toDate?.().toISOString() || row.endsAt,
          };
        }).sort((a, b) => String(a.startsAt).localeCompare(String(b.startsAt)));
        const saved = Object.fromEntries(attendanceDocs.docs.map(doc => {
          const students = Object.fromEntries(Object.entries(doc.data().students || {}).map(([code, entry]) => [code, { present: entry === true || entry?.present === true }]));
          return [doc.id, { students }];
        }));
        return res.json({ ok: true, klass: { id: classId, name: klass.name, language: klass.language, timezone: klass.timezone }, sessions, saved, students });
      }

      const authorized = typeof sessionId === "string" && await authorizeAssignedTutor(db, user, classId, sessionId);
      if (!authorized) return res.status(403).json({ error: "This session is not assigned to you." });
      if (action === "checkins") {
        const docs = await attendance.doc(sessionId).collection("checkins").get();
        return res.json({ ok: true, checkins: docs.docs.map(doc => ({ id: doc.id, studentCode: doc.data().studentCode, uid: doc.data().uid })) });
      }
      if (action === "save") {
        const { session } = authorized;
        if (isAppAssessment(session) || ["cancelled", "canceled", "deleted", "superseded"].includes(session.status)) {
          return res.status(409).json({ error: "Attendance cannot be saved for this session." });
        }
        const students = Object.fromEntries((await roster()).filter(s => typeof marks?.[s.studentCode] === "boolean")
          .map(s => [s.studentCode, { name: s.name, present: marks[s.studentCode] }]));
        await attendance.doc(sessionId).set({
          classId, className: klass.name, classSessionId: sessionId, students, markedBy: user.uid,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });
        return res.json({ ok: true });
      }
      return res.status(400).json({ error: "Unknown attendance action." });
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  });
}

module.exports = { authorizeAssignedTutor, canAdministerAttendance, registerAssignedTutorAttendance };
