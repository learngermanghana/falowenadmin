export const A2_B1_ADMIN_LESSON_PROFILE_VERSION = 2;

const A2_WRITING_DAYS = new Set([1, 3, 4, 6, 7, 9, 10, 12, 13, 15, 16, 18, 20, 21, 22, 24, 26, 28]);
const B1_WRITING_DAYS = new Set([1, 3, 4, 6, 8, 9, 12, 13, 14, 16, 18, 20, 21, 23, 24, 26, 27, 28]);

const A2_CHAPTERS = Object.freeze({
  1: "1.1", 2: "1.2", 3: "1.3", 4: "2.4", 5: "2.5", 6: "3.6", 7: "3.7",
  8: "3.8", 9: "4.9", 10: "4.10", 11: "4.11", 12: "5.12", 13: "5.13",
  14: "5.14", 15: "6.15", 16: "6.16", 17: "6.17", 18: "7.18", 19: "7.19",
  20: "7.20", 21: "8.21", 22: "8.22", 23: "9.23", 24: "9.24", 25: "9.25",
  26: "10.26", 27: "10.27", 28: "10.28",
});

const B1_ASSIGNMENT_KEYS = Object.freeze({
  1: "B1-1.1", 2: "B1-1.2", 3: "B1-1.3", 4: "B1-2.4", 5: "B1-2.5",
  6: "B1-2.6", 7: "B1-3.7", 8: "B1-3.8", 9: "B1-3.9", 10: "B1-4.10",
  11: "B1-4.11", 12: "B1-4.12", 13: "B1-4.13", 14: "B1-5.14", 15: "B1-5.15",
  16: "B1-5.16", 17: "B1-5.17", 18: "B1-6.18", 19: "B1-6.19", 20: "B1-6.20",
  21: "B1-7.21", 22: "B1-7.22", 23: "B1-7.23", 24: "B1-8.24", 25: "B1-8.25",
  26: "B1-9.26", 27: "B1-10.27", 28: "B1-10.28",
});

const A2_NO_PART4 = new Set([14, 25]);
const A2_SELF_CHECK_PART4 = new Set([21, 22, 23]);

const B1_NO_PART4 = new Set([21, 23]);
const B1_READING_FALLBACK_PART4 = new Set([19, 22]);
const B1_SELF_CHECK_PART4 = new Set([9, 10, 20, 24, 25, 26, 27, 28]);

const normalizeLevel = (value = "") => String(value || "").trim().toUpperCase();
const normalizeAssignment = (value = "") => String(value || "").trim().toUpperCase();

const assignmentKeyFor = (level, day) => {
  if (level === "A2") return A2_CHAPTERS[day] ? `A2-${A2_CHAPTERS[day]}` : "";
  if (level === "B1") return B1_ASSIGNMENT_KEYS[day] || "";
  return "";
};

const dayFromAssignment = (level, assignmentId) => {
  const target = normalizeAssignment(assignmentId);
  if (!target) return 0;
  for (let day = 1; day <= 28; day += 1) {
    if (assignmentKeyFor(level, day) === target) return day;
  }
  return 0;
};

const writingRequired = (level, day) =>
  level === "A2" ? A2_WRITING_DAYS.has(day) : B1_WRITING_DAYS.has(day);

const part4For = (level, day) => {
  if (level === "A2") {
    if (A2_NO_PART4.has(day)) {
      return Object.freeze({ visible: false, mode: "none", contentType: null, submitRequired: false, label: null });
    }
    if (A2_SELF_CHECK_PART4.has(day)) {
      return Object.freeze({ visible: true, mode: "self-check", contentType: "listening", submitRequired: false, label: "Hören" });
    }
    return Object.freeze({ visible: true, mode: "graded", contentType: "listening", submitRequired: true, label: "Hören" });
  }

  if (B1_NO_PART4.has(day)) {
    return Object.freeze({ visible: false, mode: "none", contentType: null, submitRequired: false, label: null });
  }
  if (B1_READING_FALLBACK_PART4.has(day)) {
    return Object.freeze({ visible: true, mode: "graded", contentType: "reading", submitRequired: true, label: "Lesen" });
  }
  if (B1_SELF_CHECK_PART4.has(day)) {
    return Object.freeze({ visible: true, mode: "self-check", contentType: "listening", submitRequired: false, label: "Hören" });
  }
  return Object.freeze({ visible: true, mode: "graded", contentType: "listening", submitRequired: true, label: "Hören" });
};

const buildRequiredParts = ({ writing, part4 }) => {
  const parts = [];
  if (writing) parts.push(Object.freeze({ number: 2, label: "Schreiben", partId: "teil2" }));
  parts.push(Object.freeze({ number: 3, label: "Lesen", partId: "teil3" }));
  if (part4.visible && part4.submitRequired) {
    parts.push(Object.freeze({ number: 4, label: part4.label, partId: "teil4" }));
  }
  return Object.freeze(parts);
};

const formatRequiredParts = (parts) =>
  parts.map((part) => `Teil ${part.number} · ${part.label}`).join(" + ");

export function getA2B1AdminLessonProfile(levelValue, dayValue, assignmentId = "") {
  const level = normalizeLevel(levelValue);
  if (!["A2", "B1"].includes(level)) return null;

  const directDay = Number(dayValue);
  const day = Number.isInteger(directDay) && directDay >= 1 && directDay <= 28
    ? directDay
    : dayFromAssignment(level, assignmentId);
  if (!day) return null;

  const writing = writingRequired(level, day);
  const part4 = part4For(level, day);
  const requiredSubmissionParts = buildRequiredParts({ writing, part4 });

  return Object.freeze({
    version: A2_B1_ADMIN_LESSON_PROFILE_VERSION,
    level,
    day,
    assignmentKey: assignmentKeyFor(level, day),
    sections: Object.freeze({
      grammar: Object.freeze({ visible: true, mode: "study", submitRequired: false }),
      speaking: Object.freeze({ visible: true, mode: "practice", submitRequired: false, label: "Sprechen" }),
      writing: Object.freeze({ visible: writing, mode: writing ? "graded" : "none", submitRequired: writing, label: "Schreiben" }),
      reading: Object.freeze({ visible: true, mode: "graded", submitRequired: true, label: "Lesen" }),
      part4,
    }),
    requiredSubmissionParts,
    teacherContract: Object.freeze({
      submission: formatRequiredParts(requiredSubmissionParts),
      speaking: "Teil 1 · Sprechen: class practice, not submitted",
      writing: writing ? "Teil 2 · Schreiben: submitted" : "Teil 2 · Schreiben: not required",
      part4: !part4.visible
        ? "Teil 4: not available"
        : part4.submitRequired
          ? `Teil 4 · ${part4.label}: submitted`
          : `Teil 4 · ${part4.label}: self-check, not submitted`,
    }),
  });
}

export function getA2B1AdminLessonProfileForSlide(slide = {}) {
  const level = normalizeLevel(slide.course || slide.level);
  const explicitDay = Number(slide.dayNumber || slide.day || 0);
  const parsedDay = Number(String(slide.day || "").match(/\d+/)?.[0] || 0);
  return getA2B1AdminLessonProfile(
    level,
    explicitDay || parsedDay,
    slide.assignmentId || slide.assignmentKey || "",
  );
}


const canonicalPart4Detail = (part4) => {
  if (!part4?.visible) return "";
  if (part4.submitRequired) {
    return part4.contentType === "reading"
      ? "Canonical workbook contract: Teil 4 is a graded reading section. Students complete it and submit it as Teil 4."
      : "Canonical workbook contract: Teil 4 · Hören is graded. Students complete the live Falowen listening task and submit their answers as Teil 4.";
  }
  return "Canonical workbook contract: Teil 4 · Hören is self-check practice only. Students complete it independently and do not submit Teil 4.";
};

export function applyA2B1AdminLessonProfileToSlide(slide = {}) {
  const profile = getA2B1AdminLessonProfileForSlide(slide);
  if (!profile) return slide;

  const connection = slide.workbookConnection || null;
  const part4 = profile.sections.part4;
  const sourceParts = Array.isArray(connection?.parts) ? connection.parts : [];
  const parts = sourceParts
    .filter((part) => {
      const label = String(part?.label || "");
      if (/Teil\s*2/i.test(label) && !profile.sections.writing.visible) return false;
      if (/Teil\s*4/i.test(label) && !part4.visible) return false;
      return true;
    })
    .map((part) => {
      const label = String(part?.label || "");
      if (!/Teil\s*4/i.test(label) || !part4.visible) return part;
      return {
        ...part,
        label: `Teil 4 · ${part4.label}`,
        detailEn: canonicalPart4Detail(part4),
      };
    });

  const submitted = profile.teacherContract.submission || "no written submission";
  const subtitle = [
    `Canonical workbook contract: submit ${submitted}.`,
    profile.sections.writing.visible ? null : "Teil 2 · Schreiben is not required.",
    !part4.visible
      ? "There is no Teil 4."
      : part4.submitRequired
        ? `Teil 4 · ${part4.label} is submitted.`
        : `Teil 4 · ${part4.label} is self-check only and is not submitted.`,
  ].filter(Boolean).join(" ");

  const statusNote = `Canonical workbook contract (v${profile.version}): ${profile.teacherContract.writing}; ${profile.teacherContract.part4}. This contract overrides older section-status notes.`;
  const teacherNotesEn = [
    statusNote,
    ...(Array.isArray(slide.teacherNotesEn) ? slide.teacherNotesEn : []).filter((note) => {
      const value = String(note || "");
      if (!profile.sections.writing.visible && /Teil\s*2|Schreiben|writing|email|letter/i.test(value)) return false;
      if (/Teil\s*4|Hören|listening|scor|contract|self-check|no live/i.test(value)) return false;
      return true;
    }),
  ];

  return {
    ...slide,
    adminLessonProfileVersion: profile.version,
    requiredSubmissionParts: profile.requiredSubmissionParts.map((part) => part.partId),
    teacherNotesEn,
    workbookConnection: connection
      ? {
          ...connection,
          subtitle,
          parts,
        }
      : connection,
  };
}
