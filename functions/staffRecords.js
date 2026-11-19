const PAGE_SIZE = 30;
const languages = ["german", "swahili"];
const deny = (message, status = 403) => Object.assign(new Error(message), { status });
const version = snapshot => snapshot.updateTime.toDate().toISOString() + "/" + snapshot.updateTime.nanoseconds;
const validId = id => typeof id === "string" && id.length > 0 && id.length <= 1500 && !id.includes("/") && ![".", ".."].includes(id);

function allowed(user, staff, page, language) {
  return ["students", "results"].includes(page) && languages.includes(language)
    && (user.staff === true || ["staff", "tutor"].includes(user.role))
    && staff?.active === true && [user.staffPages, staff.pages].every(p => Array.isArray(p) && p.includes(page))
    && [user.staffLanguages, staff.languages].every(l => Array.isArray(l) && l.includes(language));
}

function recordLanguage(record) {
  return record.program || (/^swahili[- ]/i.test(record.assignmentId || record.assignment_id || record.assignment || "")
    || record.source === "swahili_tutor" ? "swahili" : "german");
}

function project(snapshot, page, language) {
  const d = snapshot.data();
  if (page === "students") {
    const primary = d.program || "german";
    if (primary !== language && d.secondaryProgram !== language) return null;
    const placement = primary === language ? d : d.coursePlacements?.[language] || {};
    return { id: snapshot.id, name: d.name || d.studentName || "", code: d.studentCode || d.studentcode || snapshot.id,
      level: placement.level || "", className: placement.className || placement.classname || "" };
  }
  if (recordLanguage(d) !== language) return null;
  return { id: snapshot.id, version: version(snapshot), name: d.name || d.studentName || d.studentCode || d.studentcode || "",
    assignment: d.assignment || d.assignmentId || d.assignment_id || "", score: d.score ?? d.finalScore ?? "",
    comments: d.comments || d.feedback || "" };
}

async function listRecords(admin, db, page, language, cursor) {
  const collection = db.collection(page === "students" ? "students" : "scores");
  let query = collection;
  // German records predate the program field. Page through those on the server.
  if (language === "swahili") {
    const { Filter } = require("firebase-admin/firestore");
    query = page === "students" ? query.where(Filter.or(Filter.where("program", "==", language),
      Filter.where("secondaryProgram", "==", language))) : query.where("program", "==", language);
  }
  query = query.orderBy(admin.firestore.FieldPath.documentId());
  if (cursor != null) {
    if (!validId(cursor)) throw deny("Invalid page cursor.", 400);
  }
  const rows = [];
  let after = cursor;
  while (rows.length <= PAGE_SIZE) {
    const batch = await (after ? query.startAfter(after) : query).limit(PAGE_SIZE + 1).get();
    for (const snapshot of batch.docs) {
      const row = project(snapshot, page, language);
      if (row) rows.push(row);
      if (rows.length > PAGE_SIZE) return { rows: rows.slice(0, PAGE_SIZE), cursor: rows[PAGE_SIZE - 1].id };
    }
    if (batch.size <= PAGE_SIZE) break;
    after = batch.docs.at(-1).id;
  }
  return { rows, cursor: null };
}

async function editResult(db, user, staffRef, input) {
  const { id, language, score, comments } = input;
  if (!validId(id) || !Number.isInteger(score) || score < 0 || score > 100 ||
    typeof comments !== "string" || comments.length > 3000 || typeof input.version !== "string") {
    throw deny("Enter a whole-number score from 0 to 100 and up to 3,000 characters of feedback.", 400);
  }
  const ref = db.collection("scores").doc(id);
  const job = db.collection("automaticScoreSync").doc();
  await db.runTransaction(async tx => {
    const [staff, current] = await Promise.all([tx.get(staffRef), tx.get(ref)]);
    if (!allowed(user, staff.data(), "results", language) || !current.exists || recordLanguage(current.data()) !== language) {
      throw deny("Result access denied.");
    }
    if (version(current) !== input.version) throw deny("The result changed. Refresh before editing again.", 409);
    const row = current.data();
    // Keep the tutor's saved feedback aligned with the published Swahili result.
    if (row.source === "swahili_tutor" && validId(row.studentId)) {
      const lesson = row.assignmentId || row.assignment_id;
      const day = /^swahili-day-([1-9]|1[0-9]|20)$/.exec(lesson)?.[1];
      if (day) {
        const reviewRef = db.collection("swahiliTeacherReviews").doc(day === "1" ? row.studentId : row.studentId + "_day-" + day);
        const review = (await tx.get(reviewRef)).data();
        if (review && review.studentId === row.studentId && review.lessonId === lesson) {
          if (review.reviewedAt?.toDate().toISOString() !== row.date) throw deny("A newer review is being published. Refresh and try again.", 409);
          tx.update(reviewRef, { score, feedback: comments.trim() });
        }
      }
    }
    const now = new Date().toISOString();
    const passed = score >= (row.passMark ?? 60);
    const outcome = passed ? "passed" : "failed";
    tx.update(ref, { score, finalScore: score, comments: comments.trim(), feedback: comments.trim(),
      passed, failed: !passed, status: outcome, result: outcome, outcome, manuallyEdited: true,
      manualScoreOverride: true, scoreOverrideAuthoritative: true, manuallyEditedAt: now, updatedAt: now, sheetSaved: false });
    tx.create(job, { scorePath: ref.path, source: "staff_result_correction", status: "pending", attempts: 0 });
  });
}

function registerStaffRecords(app, { admin, db, verifyUser }) {
  app.post("/staff-records", async (req, res) => {
    res.set("Cache-Control", "private, no-store");
    let user;
    try { user = await verifyUser(req); } catch { return res.status(401).json({ error: "Sign in again." }); }
    try {
      const input = req.body || {};
      const staffRef = db.collection("falowenStaffAccess").doc(user.uid);
      if (!allowed(user, (await staffRef.get()).data(), input.page, input.language)) throw deny("Staff access denied.");
      if (input.action === "list") return res.json(await listRecords(admin, db, input.page, input.language, input.cursor));
      if (input.action !== "edit" || input.page !== "results") throw deny("This action is unavailable.");
      await editResult(db, user, staffRef, input);
      const saved = await db.collection("scores").doc(input.id).get();
      const row = saved.exists && project(saved, "results", input.language);
      if (!row) throw deny("Result access changed. Refresh to continue.", 409);
      return res.json({ row });
    } catch (err) {
      return res.status(err.status || 500).json({ error: err.status ? err.message : "Could not load or save staff records." });
    }
  });
}
module.exports = { allowed, project, editResult, registerStaffRecords };
