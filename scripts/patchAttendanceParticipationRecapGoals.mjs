import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const targetPath = path.join(root, "functions", "attendanceConfirmationEmails.js");
const prerequisitePatch = path.join(root, "scripts", "patchAttendanceNoParticipationEncouragement.mjs");
let source = fs.readFileSync(targetPath, "utf8");

if (!source.includes("function participationRecordCanonicalIdentity") || !source.includes("participationLookupAvailable")) {
  await import(pathToFileURL(prerequisitePatch).href);
  source = fs.readFileSync(targetPath, "utf8");
}

const MARKER = "// ATTENDANCE PARTICIPATION RECAP + STREAK GOALS";
if (source.includes(MARKER)) {
  console.log("Attendance participation recap, streak and goal enrichment already installed.");
  process.exit(0);
}

const newSummary = `function summarizeStudentParticipation({ participationRecords = [], student, sessions = [], timezone = ACCRA_TIMEZONE } = {}) {
  const matched = participationRecords.filter((record) => (
    participationRecordMatchesStudent(record, student)
    && sessions.some((session) => participationRecordMatchesSession(record, session, timezone))
  ));
  if (!matched.length) {
    return {
      noParticipation: true,
      trackedLessons: 0,
      participatedLessons: 0,
      responses: 0,
      correct: 0,
      needsReview: 0,
      skipped: 0,
      strongConcepts: [],
      reviewConcepts: [],
      reviewRecommendation: "",
      latestSessionId: "",
    };
  }

  const lessonKeys = new Set();
  const strongConcepts = new Set();
  const reviewConcepts = new Set();
  let participatedLessons = 0;
  let responses = 0;
  let correct = 0;
  let needsReview = 0;
  let skipped = 0;
  let latestSessionId = "";
  let latestSessionDate = "";

  matched.forEach((record, index) => {
    const key = normalize(record.sessionId)
      || [normalize(record.assignmentId), normalize(record.sessionDate), index].join("|");
    lessonKeys.add(key);
    const recordCorrect = Math.max(0, Number(record.correct || 0));
    const recordNeedsReview = Math.max(0, Number(record.needsReview || 0));
    const recordTurns = Math.max(0, Number(record.turns || 0), recordCorrect + recordNeedsReview);
    const recordSkipped = Math.max(0, Number(record.skipped || 0));
    if (recordTurns > 0 || recordSkipped > 0) participatedLessons += 1;
    responses += recordTurns;
    correct += recordCorrect;
    needsReview += recordNeedsReview;
    skipped += recordSkipped;

    const sessionDate = normalize(record.sessionDate);
    if (sessionDate >= latestSessionDate && normalize(record.sessionId)) {
      latestSessionDate = sessionDate;
      latestSessionId = normalize(record.sessionId);
    }

    const questionResponses = Array.isArray(record.questionResponses) ? record.questionResponses : [];
    questionResponses.forEach((response) => {
      const result = comparable(response.result || response.status);
      const concept = normalize(response.conceptLabel || response.questionContext);
      if (!concept) return;
      if (result === "correct") strongConcepts.add(concept);
      if (["needs_review", "needshelp", "needs_help", "skip", "skipped"].includes(result)) reviewConcepts.add(concept);
    });
    (Array.isArray(record.reviewConcepts) ? record.reviewConcepts : []).forEach((concept) => {
      const value = normalize(concept);
      if (value) reviewConcepts.add(value);
    });
  });

  reviewConcepts.forEach((concept) => strongConcepts.delete(concept));
  const reviewList = [...reviewConcepts].slice(0, 3);
  return {
    noParticipation: false,
    trackedLessons: lessonKeys.size,
    participatedLessons,
    responses,
    correct,
    needsReview,
    skipped,
    strongConcepts: [...strongConcepts].slice(0, 3),
    reviewConcepts: reviewList,
    reviewRecommendation: reviewList.length ? \`Review next: \${reviewList.join(" · ")}\` : "",
    latestSessionId,
  };
}
`;

const summaryPattern = /function summarizeStudentParticipation\([\s\S]*?\n}\n\n(?=function buildParticipationText)/;
if (!summaryPattern.test(source)) throw new Error("Could not locate participation summary helper.");
source = source.replace(summaryPattern, `${newSummary}\n`);

const helperBlock = `
${MARKER}
const PARTICIPATION_ENGAGEMENT_COLLECTION = "studentParticipationEngagement";

function attendanceCountsForParticipation(records = []) {
  return records.reduce((counts, record) => {
    const status = comparable(record?.status);
    if (status === "present" || status === "late") counts.attended += 1;
    else if (status === "absent") counts.absent += 1;
    else if (status === "excused") counts.excused += 1;
    return counts;
  }, { attended: 0, absent: 0, excused: 0 });
}

function participationDetailsUrl(participation = null) {
  const sessionId = normalize(participation?.latestSessionId);
  return sessionId
    ? PARTICIPATION_DETAILS_URL + "&sessionId=" + encodeURIComponent(sessionId)
    : PARTICIPATION_DETAILS_URL;
}

function sessionEventKey(record = {}, timezone = ACCRA_TIMEZONE) {
  const session = record.session || {};
  return normalize(session.id || session.sessionId)
    || [isoDateInTimezone(sessionStart(session), timezone), ...sessionAssignmentValues(session)].filter(Boolean).join("|");
}

function deriveParticipationEngagementState({
  previousState = {},
  records = [],
  participationRecords = [],
  student,
  timezone = ACCRA_TIMEZONE,
} = {}) {
  let consecutiveNoParticipation = Math.max(0, Number(previousState.consecutiveNoParticipation || 0));
  const processed = new Set(Array.isArray(previousState.processedSessionKeys) ? previousState.processedSessionKeys.map(normalize).filter(Boolean) : []);
  let changed = false;

  const ordered = [...records].sort((left, right) => {
    const leftDate = asDate(sessionStart(left?.session))?.getTime() || 0;
    const rightDate = asDate(sessionStart(right?.session))?.getTime() || 0;
    return leftDate - rightDate;
  });

  ordered.forEach((record) => {
    const eventKey = sessionEventKey(record, timezone);
    if (!eventKey || processed.has(eventKey)) return;
    processed.add(eventKey);
    changed = true;
    const status = comparable(record?.status);
    if (status !== "present" && status !== "late") {
      consecutiveNoParticipation = 0;
      return;
    }
    const sessionParticipation = summarizeStudentParticipation({
      participationRecords,
      student,
      sessions: record?.session ? [record.session] : [],
      timezone,
    });
    consecutiveNoParticipation = sessionParticipation?.noParticipation
      ? consecutiveNoParticipation + 1
      : 0;
  });

  return {
    consecutiveNoParticipation,
    processedSessionKeys: [...processed].slice(-24),
    changed,
  };
}

function participationEngagementDocumentId(klass = {}, student = {}) {
  const classKey = comparable(klass.id || klass.classId || klass.name || klass.className);
  const studentKey = comparable(student.uid || student.studentCode || student.email || student.id || student.name);
  return crypto.createHash("sha256").update(classKey + "|" + studentKey).digest("hex").slice(0, 48);
}

async function updateParticipationEngagementState(db, { klass, student, records, participationRecords, timezone }) {
  const ref = db.collection(PARTICIPATION_ENGAGEMENT_COLLECTION).doc(participationEngagementDocumentId(klass, student));
  const snap = await ref.get();
  const previousState = snap.exists ? snap.data() : {};
  const nextState = deriveParticipationEngagementState({ previousState, records, participationRecords, student, timezone });
  if (nextState.changed) {
    await ref.set({
      classId: normalize(klass.id || klass.classId),
      className: normalize(klass.name || klass.className),
      studentUid: normalize(student.uid),
      studentCode: normalize(student.studentCode),
      studentEmail: comparable(student.email),
      consecutiveNoParticipation: nextState.consecutiveNoParticipation,
      processedSessionKeys: nextState.processedSessionKeys,
      updatedAt: new Date(),
    }, { merge: true });
  }
  return nextState.consecutiveNoParticipation;
}

function participationGoalText({ participation, attendanceRecords = [], streak = 0 } = {}) {
  const attendance = attendanceCountsForParticipation(attendanceRecords);
  if (!attendance.attended) {
    return " Next class goal: attend and check in on time, then contribute at least once when you are in class.";
  }
  if (participation?.noParticipation) {
    if (streak >= 3) return " Next class goal: break the no-participation streak by answering at least one question or attempting one class activity.";
    if (streak >= 2) return " Next class goal: answer at least one question or attempt one class activity so your tutor can see your progress.";
    return " Next class goal: answer at least one question or attempt one class activity.";
  }
  const reviewConcept = normalize(participation?.reviewConcepts?.[0]);
  if (reviewConcept) return " Next class goal: contribute at least once, especially when " + reviewConcept + " comes up.";
  return " Next class goal: contribute at least once again in the next class.";
}
`;

if (!source.includes(helperBlock.trim())) {
  const endMarker = "// END ATTENDANCE PARTICIPATION SUMMARY";
  if (!source.includes(endMarker)) throw new Error("Participation summary end marker is missing.");
  source = source.replace(endMarker, `${helperBlock}\n${endMarker}`);
}

const newBuildParticipationText = `function buildParticipationText(participation, mode, { attendanceRecords = [], streak = 0 } = {}) {
  const attendance = attendanceCountsForParticipation(attendanceRecords);
  const weekly = mode === MODE_WEEKLY;
  if (!attendance.attended) {
    return participationGoalText({ participation, attendanceRecords, streak });
  }
  if (!participation) return "";
  if (participation.noParticipation) {
    const lead = weekly
      ? " Class participation this week: no class participation was recorded for you in the lessons you attended in this summary."
      : " Class participation: no class participation was recorded for you in this lesson.";
    const streakText = streak >= 2
      ? " You have now had no recorded participation in " + streak + " consecutive attended classes."
      : "";
    return lead
      + streakText
      + " Regular participation helps your tutor see what you understand and where you need support."
      + participationGoalText({ participation, attendanceRecords, streak })
      + " This participation note is learning-support feedback only; it is not a grade and it does not change your attendance status."
      + " View your detailed participation in Falowen: "
      + participationDetailsUrl(participation);
  }

  const tracked = Math.max(0, Number(participation.trackedLessons || 0));
  const responses = Math.max(0, Number(participation.responses || 0));
  const correct = Math.max(0, Number(participation.correct || 0));
  const needsReview = Math.max(0, Number(participation.needsReview || 0));
  const skipped = Math.max(0, Number(participation.skipped || 0));
  const lead = weekly
    ? " Class participation this week: participation was tracked in " + tracked + " lesson" + (tracked === 1 ? "" : "s") + "."
    : " Class participation:";
  const activity = " Responses: " + responses + "; Correct: " + correct + "; Needs review: " + needsReview + "; Skipped: " + skipped + ".";
  const strong = Array.isArray(participation.strongConcepts) && participation.strongConcepts.length
    ? " Strong topics: " + participation.strongConcepts.join(" · ") + "."
    : "";
  const review = normalize(participation.reviewRecommendation)
    ? " " + normalize(participation.reviewRecommendation) + "."
    : "";
  return lead
    + activity
    + strong
    + review
    + participationGoalText({ participation, attendanceRecords, streak })
    + " This participation summary is learning-support feedback only; it is not a grade and it does not change your attendance status."
    + " View your detailed participation in Falowen: "
    + participationDetailsUrl(participation);
}
`;

const buildPattern = /function buildParticipationText\([\s\S]*?\n}\n(?=\n(?:\/\/ ATTENDANCE PARTICIPATION RECAP \+ STREAK GOALS|\/\/ END ATTENDANCE PARTICIPATION SUMMARY))/;
if (!buildPattern.test(source)) throw new Error("Could not locate participation text builder.");
source = source.replace(buildPattern, newBuildParticipationText);

source = source.replace(
  'function buildEachClassMessage({ student, klass, record, participation = null, replyNote = "", timezone = ACCRA_TIMEZONE }) {',
  'function buildEachClassMessage({ student, klass, record, participation = null, participationStreak = 0, replyNote = "", timezone = ACCRA_TIMEZONE }) {',
);
source = source.replace(
  '  const participationText = buildParticipationText(participation, MODE_EACH_CLASS);',
  '  const participationText = buildParticipationText(participation, MODE_EACH_CLASS, { attendanceRecords: [record], streak: participationStreak });',
);
source = source.replace(
  'function buildWeeklyMessage({ student, klass, records, participation = null, replyNote = "", timezone = ACCRA_TIMEZONE }) {',
  'function buildWeeklyMessage({ student, klass, records, participation = null, participationStreak = 0, replyNote = "", timezone = ACCRA_TIMEZONE }) {',
);
source = source.replace(
  '  const participationText = buildParticipationText(participation, MODE_WEEKLY);',
  '  const participationText = buildParticipationText(participation, MODE_WEEKLY, { attendanceRecords: records, streak: participationStreak });',
);

const oldDeliveryBlock = `      const participation = participationLookupAvailable
        ? summarizeStudentParticipation({
          participationRecords,
          student,
          sessions: group.sessions,
          timezone,
        })
        : null;
      const message = mode === MODE_WEEKLY
        ? buildWeeklyMessage({ student, klass, records, participation, replyNote, timezone })
        : buildEachClassMessage({ student, klass, record: records[0], participation, replyNote, timezone });`;

const newDeliveryBlock = `      const participation = participationLookupAvailable
        ? summarizeStudentParticipation({
          participationRecords,
          student,
          sessions: group.sessions,
          timezone,
        })
        : null;
      let participationStreak = 0;
      if (participationLookupAvailable) {
        try {
          participationStreak = await updateParticipationEngagementState(db, {
            klass,
            student,
            records,
            participationRecords,
            timezone,
          });
        } catch (error) {
          console.warn("attendance_participation_streak_update_failed", {
            classId: normalize(klass.id || klass.classId || klass.name),
            studentId: normalize(student.uid || student.studentCode || student.id),
            message: error?.message || String(error),
          });
        }
      }
      const message = mode === MODE_WEEKLY
        ? buildWeeklyMessage({ student, klass, records, participation, participationStreak, replyNote, timezone })
        : buildEachClassMessage({ student, klass, record: records[0], participation, participationStreak, replyNote, timezone });`;

if (!source.includes(newDeliveryBlock)) {
  if (!source.includes(oldDeliveryBlock)) throw new Error("Could not locate student participation delivery block.");
  source = source.replace(oldDeliveryBlock, newDeliveryBlock);
}

if (!source.includes("deriveParticipationEngagementState,")) {
  source = source.replace(
    "    participationRecordMatchesStudent,",
    "    participationRecordMatchesStudent,\n    deriveParticipationEngagementState,\n    participationGoalText,",
  );
}

fs.writeFileSync(targetPath, source, "utf8");
console.log("Attendance emails now distinguish absence, include post-class recap/review guidance, track no-participation streaks, and set a next-class goal.");
