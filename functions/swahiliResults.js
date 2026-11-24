const { updateSwahiliDeliveryStatus } = require("./swahiliDeliveryStatus");
const answerKeys = require("./swahili-answers.json");
const { createHash } = require("node:crypto");
const { resolveAnnouncementConfig, postAnnouncementRow } = require("./finalMockResultEmails");

function resolveDayFourAnswerReference(lessonId, readingVersion) {
  const reference = answerKeys[lessonId];
  if (!reference || lessonId !== "swahili-day-4") return reference;
  const { legacyReading, listening, ...base } = reference;
  // Older Day 4 students completed three short-answer questions without Hören.
  // They must not be marked against the revised five-question assessment.
  if (Number(readingVersion || 1) < 2) {
    return { ...base, version: 1, reading: legacyReading };
  }
  return { ...base, listening };
}

const PASS_MARK = 60;
const lessonTitles = { ...Object.fromEntries(Object.entries(answerKeys).filter(([, key]) => key.title).map(([id, key]) => [id, key.title])), "swahili-day-11": "Dukani", "swahili-b1-day-28": "Kutunza Mazingira katika Maisha ya Kila Siku", "swahili-day-1": "Alfabeti, sauti na matamshi", "swahili-day-6": "Mgahawani" };

function createSwahiliResultWorker({ db, auth, runtimeConfig, postAnnouncement = postAnnouncementRow }) {
  return async (event) => {
    const snapshot = event.data?.after;
    const review = snapshot?.data();
    if (!review || review.program !== "swahili" || !Object.hasOwn(lessonTitles, review.lessonId)
      || !["reviewed", "needs_revision"].includes(review.status)
      || !Number.isInteger(review.score) || review.score < 0 || review.score > 100
      || typeof review.studentId !== "string" || !review.studentId || review.studentId.includes("/")) return;

    const passed = review.score >= PASS_MARK;
    if (event.data?.before?.data()?.reviewedAt?.isEqual?.(review.reviewedAt)) return;
    const day = review.lessonId.split("-").at(-1);
    const b1 = ["swahili-b1-day-26", "swahili-b1-day-27", "swahili-b1-day-28"].includes(review.lessonId);
    const lessonDoc = b1 ? `b1-day-${day}` : `day-${day}`;
    const level = b1 ? "B1" : "A1";
    const uid = review.studentId;
    if (snapshot.id !== (day === "1" ? uid : `${uid}_${lessonDoc}`) || !review.submissionVersion) return;

    const updateStatus = fields => updateSwahiliDeliveryStatus(db, snapshot.ref, review.reviewedAt, fields);
    let published = false;
    try {
      const profiles = await db.collection("students").where("uid", "==", uid).get();
      const profile = profiles.docs.find((entry) => entry.data().program === "swahili" || entry.data().secondaryProgram === "swahili");
      if (!profile) {
        await updateStatus({ sheetDelivery: "no_profile", emailDelivery: "no_profile" });
        return;
      }
      const student = profile.data();
      const studentCode = student.studentCode || student.studentcode || profile.id;
      const dedupeId = `${studentCode}__${review.lessonId}`;
      const submissionRef = db.doc(`users/${uid}/swahiliLessons/${lessonDoc}`);
      const resultId = createHash("sha256").update(`swahili:${uid}:${day}`).digest("hex");
      const publicationId = createHash("sha256").update(`${resultId}:${review.submissionVersion}`).digest("hex");
      const reviewVersion = `${review.reviewedAt?.seconds}:${review.reviewedAt?.nanoseconds}`;
      const syncId = createHash("sha256").update(`${publicationId}:${reviewVersion}`).digest("hex");
      const deliveryRef = db.collection("automaticScoreSync").doc(syncId);
      const scoreRef = db.collection("scores").doc(resultId);
      const assignment = `Swahili ${level} Day ${day} · ${lessonTitles[review.lessonId]}`;
      const result = await db.runTransaction(async (tx) => {
        const [latest, submission, delivery] = await Promise.all([
          tx.get(snapshot.ref), tx.get(submissionRef), tx.get(deliveryRef),
        ]);
        const submittedAt = submission.data()?.submittedAt;
        const version = submittedAt && `${submittedAt.seconds}:${submittedAt.nanoseconds}`;
        if (!latest.data()?.reviewedAt?.isEqual(review.reviewedAt)) return null;
        if (version !== review.submissionVersion) {
          tx.set(snapshot.ref, { sheetDelivery: "outdated", emailDelivery: "outdated" }, { merge: true });
          return null;
        }
        if (delivery.exists) return delivery.data();
        tx.set(snapshot.ref, { ...(review.lessonId === "swahili-b1-day-28" ? {} : { answerReference: resolveDayFourAnswerReference(review.lessonId, submission.data()?.readingVersion) }), sheetDelivery: "pending", emailDelivery: "pending" }, { merge: true });
        tx.set(scoreRef, {
          program: "swahili", language: "swahili", studentId: uid, studentCode, studentcode: studentCode,
          name: student.name || "", assignment, assignmentId: review.lessonId,
          assignment_id: review.lessonId, dedupe_id: dedupeId, level, score: review.score,
          comments: review.feedback, resultStatus: review.status, passed,
          passMark: PASS_MARK, outcome: passed ? "passed" : "failed", source: "swahili_tutor",
          date: review.reviewedAt.toDate().toISOString(), sheetSaved: false,
        });
        const job = { scorePath: scoreRef.path, status: "pending", attempts: 0, source: "swahili_tutor", reviewPath: snapshot.ref.path, reviewedAt: review.reviewedAt };
        tx.create(deliveryRef, job);
        return job;
      });
      if (!result) return;
      published = true;
      if (result.emailSent) {
        await updateStatus({ emailDelivery: "sent", emailBccRequested: Boolean(result.emailBccRequested) });
        return;
      }

      const account = await auth.getUser(uid);
      if (!account.email) {
        await updateStatus({ emailDelivery: "no_email" });
        return;
      }
      const teacherBcc = String(process.env.SWAHILI_RESULT_BCC || runtimeConfig?.communication?.swahili_result_bcc || "").trim();
      if (teacherBcc && !/^[^\s@,;]+@[^\s@,;]+\.[^\s@,;]+$/.test(teacherBcc)) {
        throw new Error("Configure one valid Swahili result BCC email address.");
      }
      await postAnnouncement(resolveAnnouncementConfig(runtimeConfig), {
        email: account.email,
        ...(teacherBcc ? { bcc: teacherBcc } : {}),
        announcement: review.status === "needs_revision"
          ? "Your tutor reviewed your Swahili workbook and requested a revision. Open Campus Results for feedback."
          : "Your Swahili workbook result is available. Open Campus Results to read your tutor’s feedback.",
        topic: `${assignment} result`,
        link: `https://www.falowen.app/campus/results#${review.lessonId}`,
        link_label: b1 ? "Open score and feedback" : "Open score, feedback and reference answers",
        button_label: "Open Falowen Results",
        class: `Swahili ${level}`,
        delivery_mode: "individual",
        allow_bcc_fallback: "FALSE",
        attach_certificate: "FALSE",
        show_progress: "FALSE",
        show_review: "FALSE",
        show_app_button: "TRUE",
        email_type: "swahili_workbook_result",
        event_id: publicationId,
        idempotency_key: publicationId,
      });
      await deliveryRef.set({ emailSent: true, emailBccRequested: Boolean(teacherBcc) }, { merge: true });
      await updateStatus({ emailDelivery: "sent", emailBccRequested: Boolean(teacherBcc) });
    } catch (error) {
      await updateStatus(published
        ? { emailDelivery: "failed" }
        : { sheetDelivery: "publication_failed", emailDelivery: "publication_failed" });
      throw error;
    }
  };
}

module.exports = { createSwahiliResultWorker, resolveDayFourAnswerReference };
