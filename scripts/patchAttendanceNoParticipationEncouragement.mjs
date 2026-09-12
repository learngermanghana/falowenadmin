import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const targetPath = path.join(root, "functions", "attendanceConfirmationEmails.js");
const basePatch = path.join(root, "scripts", "patchAttendanceParticipationSummaryEmail.mjs");
const canonicalPatch = path.join(root, "scripts", "patchAttendanceParticipationCanonicalIdentity.mjs");
let source = fs.readFileSync(targetPath, "utf8");

if (source.includes("// ATTENDANCE PARTICIPATION RECAP + STREAK GOALS")) {
  console.log("No-participation encouragement is already included in the richer participation recap worker.");
  process.exit(0);
}

if (!source.includes("// BEGIN ATTENDANCE PARTICIPATION SUMMARY")) {
  await import(new URL(`file://${basePatch}`));
  source = fs.readFileSync(targetPath, "utf8");
}

if (!source.includes("function participationRecordCanonicalIdentity")) {
  await import(new URL(`file://${canonicalPatch}`));
  source = fs.readFileSync(targetPath, "utf8");
}

function replaceOrConfirm(oldValue, newValue, label) {
  if (source.includes(newValue)) return;
  if (!source.includes(oldValue)) throw new Error(`Could not patch ${label}.`);
  source = source.replace(oldValue, newValue);
}

replaceOrConfirm(
  "  if (!matched.length) return null;",
  `  if (!matched.length) {
    return {
      noParticipation: true,
      trackedLessons: 0,
      participatedLessons: 0,
      responses: 0,
      correct: 0,
      needsReview: 0,
      skipped: 0,
    };
  }`,
  "no-participation summary",
);

replaceOrConfirm(
  `  const weekly = mode === MODE_WEEKLY;
  const lead = weekly`,
  `  const weekly = mode === MODE_WEEKLY;
  if (participation.noParticipation) {
    const lead = weekly
      ? " Class participation this week: no class participation was recorded for you in the lessons covered by this summary."
      : " Class participation: no class participation was recorded for you in this lesson.";
    const encouragement = weekly
      ? " Try to take part in the next class by answering questions, attempting activities, or responding when called on. Regular participation helps your tutor see what you understand and where you need support."
      : " Try to take part in the next class by answering a question, attempting the activity, or responding when called on. Regular participation helps your tutor see what you understand and where you need support.";
    return lead
      + encouragement
      + " This participation note is learning-support feedback only; it is not a grade and it does not change your attendance status."
      + " View your detailed participation in Falowen: "
      + PARTICIPATION_DETAILS_URL;
  }
  const lead = weekly`,
  "no-participation encouragement text",
);

replaceOrConfirm(
  `    } catch (error) {
      console.warn("attendance_participation_lookup_failed", {
        classId: normalize(klass.id || klass.classId || klass.name),
        date,
        message: error?.message || String(error),
      });
    }
  }
  return [...records.values()];`,
  `    } catch (error) {
      console.warn("attendance_participation_lookup_failed", {
        classId: normalize(klass.id || klass.classId || klass.name),
        date,
        message: error?.message || String(error),
      });
      throw error;
    }
  }
  return [...records.values()];`,
  "participation lookup failure propagation",
);

replaceOrConfirm(
  `    let participationRecords = [];
    try {`,
  `    let participationRecords = [];
    let participationLookupAvailable = true;
    try {`,
  "participation lookup availability flag",
);

replaceOrConfirm(
  `    } catch (error) {
      console.warn("attendance_participation_summary_unavailable", {`,
  `    } catch (error) {
      participationLookupAvailable = false;
      console.warn("attendance_participation_summary_unavailable", {`,
  "participation lookup failure flag",
);

replaceOrConfirm(
  `      const participation = summarizeStudentParticipation({
        participationRecords,
        student,
        sessions: group.sessions,
        timezone,
      });`,
  `      const participation = participationLookupAvailable
        ? summarizeStudentParticipation({
          participationRecords,
          student,
          sessions: group.sessions,
          timezone,
        })
        : null;`,
  "student participation fallback on lookup failure",
);

fs.writeFileSync(targetPath, source, "utf8");
console.log("Attendance emails now encourage students when no class participation was recorded, without reporting non-participation when the lookup failed.");
