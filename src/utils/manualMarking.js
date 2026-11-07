import { getCourseSessionGroups } from "../data/courseSessionGroups.js";
import { canonicalCourseReference } from "./canonicalCourseReference.js";
import { stripMarkingEmojis } from "./markingFeedbackText.js";

export function manualMarkingLessons(level) {
  return getCourseSessionGroups(level).flatMap((group) => group.entries.map((entry) => {
    const assignmentId = entry.assignment_id;
    const reference = canonicalCourseReference(assignmentId);
    return { assignmentId, day: group.day, level, reference,
      title: entry.de || entry.en || assignmentId,
      label: `Day ${group.day} · ${assignmentId} · ${entry.de || entry.en || ""}` };
  })).filter((lesson) => lesson.day > 0 && lesson.reference);
}

export function manualScorePayload({ student, lesson, score, feedback }) {
  if (!student?.studentCode || !student?.name) throw new Error("Select a registered student with a student code.");
  const canonicalLesson = manualMarkingLessons(lesson?.level).find((row) => row.assignmentId === lesson?.assignmentId);
  if (!canonicalLesson) throw new Error("Select a lesson with an available marking reference.");
  const numericScore = Number(score);
  if (String(score).trim() === "" || !Number.isInteger(numericScore) || numericScore < 1 || numericScore > 100) {
    throw new Error("Enter a whole-number score from 1 to 100.");
  }
  const comments = stripMarkingEmojis(String(feedback || "")).trim();
  if (!comments) throw new Error("Enter your feedback before saving.");
  return {
    studentCode: student.studentCode, studentId: student.uid || student.studentId || "",
    studentEmail: student.email || "", name: student.name,
    assignment: `${canonicalLesson.level} • Day ${canonicalLesson.day}: ${canonicalLesson.title}`,
    assignmentId: canonicalLesson.assignmentId, level: canonicalLesson.level,
    score: numericScore, comments, source: "manual-external-work",
    link: canonicalLesson.reference.answerUrl || canonicalLesson.reference.answer_url || "",
    blockAnyDuplicate: true, forceSheetDedupeId: true, requireAllTargets: true,
    markingDetails: { finalScore: numericScore, manualOverride: true,
      markingReason: "Tutor assessed externally received work against the selected lesson reference.",
      source: "manual-external-work", coursebookRevision: canonicalLesson.reference.coursebookRevision || "" },
  };
}

export function matchingManualSubmissions(rows, assignmentId) {
  const target = String(assignmentId || "").toUpperCase();
  return rows.filter((row) => [row.assignmentId, row.assignmentKey, row.raw?.assignmentId, row.raw?.assignmentKey,
    String(row.assignment || "").match(/\b[A-C][12]-\d+(?:\.\d+)?\b/i)?.[0]]
    .some((value) => value && String(value).toUpperCase() === target));
}
