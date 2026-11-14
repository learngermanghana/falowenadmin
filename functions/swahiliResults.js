const { createHash } = require("node:crypto");
const { resolveAnnouncementConfig, postAnnouncementRow } = require("./finalMockResultEmails");

const PASS_MARK = 60;
const lessonTitles = { "swahili-day-1": "Alfabeti, sauti na matamshi", "swahili-day-6": "Mgahawani" };

function createSwahiliResultWorker({ db, auth, runtimeConfig, postAnnouncement = postAnnouncementRow }) {
  return async (event) => {
    const snapshot = event.data?.after;
    const review = snapshot?.data();
    if (!review || review.program !== "swahili" || !Object.hasOwn(lessonTitles, review.lessonId)
      || !["reviewed", "needs_revision"].includes(review.status)
      || !Number.isInteger(review.score) || review.score < 0 || review.score > 100
      || typeof review.studentId !== "string" || !review.studentId || review.studentId.includes("/")) return;

    const passed = review.score >= PASS_MARK;
    const day = review.lessonId.split("-").at(-1);
    const uid = review.studentId;
    if (snapshot.id !== (day === "1" ? uid : `${uid}_day-6`) || !review.submissionVersion) return;

    const profiles = await db.collection("students").where("uid", "==", uid).get();
    const profile = profiles.docs.find((entry) => entry.data().program === "swahili");
    if (!profile) return;
    const student = profile.data();
    const studentCode = student.studentCode || student.studentcode || profile.id;
    const submissionRef = db.doc(`users/${uid}/swahiliLessons/day-${day}`);
    const resultId = createHash("sha256").update(`swahili:${uid}:${day}`).digest("hex");
    const publicationId = createHash("sha256").update(`${resultId}:${review.submissionVersion}`).digest("hex");
    const reviewVersion = `${review.reviewedAt?.seconds}:${review.reviewedAt?.nanoseconds}`;
    const syncId = createHash("sha256").update(`${publicationId}:${reviewVersion}`).digest("hex");
    const deliveryRef = db.collection("automaticScoreSync").doc(syncId);
    const scoreRef = db.collection("scores").doc(resultId);
    const assignment = `Swahili A1 Day ${day} · ${lessonTitles[review.lessonId]}`;
    const result = await db.runTransaction(async (tx) => {
      const [latest, submission, delivery] = await Promise.all([
        tx.get(snapshot.ref), tx.get(submissionRef), tx.get(deliveryRef),
      ]);
      const submittedAt = submission.data()?.submittedAt;
      const version = submittedAt && `${submittedAt.seconds}:${submittedAt.nanoseconds}`;
      if (!latest.data()?.reviewedAt?.isEqual(review.reviewedAt) || version !== review.submissionVersion) return null;
      if (delivery.exists) return delivery.data();
      tx.set(scoreRef, {
        program: "swahili", studentId: uid, studentCode, studentcode: studentCode,
        name: student.name || "", assignment, assignmentId: review.lessonId,
        assignment_id: review.lessonId, level: "A1", score: review.score,
        comments: review.feedback, resultStatus: review.status, passed,
        passMark: PASS_MARK, outcome: passed ? "passed" : "failed", source: "swahili_tutor",
        date: review.reviewedAt.toDate().toISOString(), sheetSaved: false,
      });
      const job = { scorePath: scoreRef.path, status: "pending", attempts: 0, source: "swahili_tutor" };
      tx.create(deliveryRef, job);
      return job;
    });
    if (!result || result.emailSent) return;

    const account = await auth.getUser(uid);
    if (!account.email) return;
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
      link: "https://www.falowen.app/campus/results",
      button_label: "Open Falowen Results",
      class: "Swahili A1",
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
    await deliveryRef.set({ emailSent: true }, { merge: true });
  };
}

module.exports = { createSwahiliResultWorker };
