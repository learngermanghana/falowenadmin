import {
  extractWritingTaskPoints,
  inferExpectedWritingTextType,
  inferWritingRegister,
  WRITING_TEXT_TYPES,
} from "./writingTaskSchema.js";

const clean = (value = "") => String(value || "").replace(/\s+/g, " ").trim();

const TASK_POINT_OVERRIDES = Object.freeze({
  "B1-1.2": [
    "Explain how you and the friend met",
    "Explain why this specific friendship is special",
    "Make a concrete suggestion for a meeting",
  ],
});

export const ASSIGNMENT_REGISTRY_SCHEMA_VERSION = 1;

export function normalizeAssignmentId(value = "") {
  return clean(value).toUpperCase();
}

export function findWritingPart(slide = {}) {
  const parts = Array.isArray(slide.workbookConnection?.parts) ? slide.workbookConnection.parts : [];
  return parts.find((part) => /(?:teil\s*2.*schreiben|schreiben|writing)/i.test(`${part?.label || ""} ${part?.detailEn || ""} ${part?.detailDe || ""}`)) || null;
}

function taskPointObjects(points = []) {
  return points.map((requirement, index) => ({
    id: `point_${index + 1}`,
    requirement: clean(requirement),
  })).filter((point) => point.requirement);
}

export function buildAssignmentRegistryDraftFromSlide(slide = {}) {
  const assignmentId = normalizeAssignmentId(slide.assignmentId);
  const level = clean(slide.course).toUpperCase();
  if (!assignmentId || !["A2", "B1"].includes(level)) return null;

  const writingPart = findWritingPart(slide);
  const sourceSummary = clean(writingPart?.detailDe || writingPart?.detailEn || "");
  if (!sourceSummary) return null;

  const register = inferWritingRegister(sourceSummary, slide);
  const textType = inferExpectedWritingTextType(sourceSummary, slide, register);
  const requirements = TASK_POINT_OVERRIDES[assignmentId] || extractWritingTaskPoints(sourceSummary);

  return {
    schemaVersion: ASSIGNMENT_REGISTRY_SCHEMA_VERSION,
    assignmentId,
    level,
    title: clean(slide.title || slide.topic || assignmentId),
    source: {
      kind: "admin_workbook_slide",
      slideId: clean(slide.id),
      summary: sourceSummary,
      workbookUrl: clean(slide.workbookConnection?.workbookUrl || ""),
    },
    publicTask: {
      prompt: sourceSummary,
      promptVerified: false,
      taskPoints: requirements,
    },
    markingSpec: {
      textType,
      register,
      recipient: register === "informal" ? "friend_or_personal_contact" : register === "formal" ? "formal_recipient" : "unspecified",
      taskPoints: taskPointObjects(requirements),
    },
  };
}

export function buildAssignmentRegistryDrafts(slides = []) {
  return slides
    .map(buildAssignmentRegistryDraftFromSlide)
    .filter(Boolean)
    .sort((a, b) => a.assignmentId.localeCompare(b.assignmentId, undefined, { numeric: true }));
}

export function validateAssignmentRegistryDraft(draft = {}) {
  const errors = [];
  if (!normalizeAssignmentId(draft.assignmentId)) errors.push("Assignment ID is required.");
  if (!clean(draft.publicTask?.prompt)) errors.push("Student-facing prompt is required.");
  if (!draft.publicTask?.promptVerified) errors.push("Verify the student-facing prompt before publishing.");
  if (!clean(draft.markingSpec?.textType) || draft.markingSpec?.textType === WRITING_TEXT_TYPES.WRITING) {
    errors.push("Choose a specific writing text type before publishing.");
  }
  if (!clean(draft.markingSpec?.register) || draft.markingSpec?.register === "unspecified") {
    errors.push("Choose the expected register before publishing.");
  }
  const points = Array.isArray(draft.markingSpec?.taskPoints) ? draft.markingSpec.taskPoints.filter((point) => clean(point?.requirement)) : [];
  if (!points.length) errors.push("At least one marking task point is required.");
  return errors;
}

export function assignmentVersionId(assignmentId, version) {
  return `${normalizeAssignmentId(assignmentId).replace(/[^A-Z0-9._-]+/g, "_")}__v${Number(version || 0)}`;
}

export function toPublicAssignmentRecord(record = {}) {
  return {
    schemaVersion: ASSIGNMENT_REGISTRY_SCHEMA_VERSION,
    assignmentId: normalizeAssignmentId(record.assignmentId),
    level: clean(record.level).toUpperCase(),
    title: clean(record.title),
    version: Number(record.version || 0),
    status: record.status || "published",
    publicTask: {
      prompt: clean(record.publicTask?.prompt),
      taskPoints: Array.isArray(record.publicTask?.taskPoints) ? record.publicTask.taskPoints.map(clean).filter(Boolean) : [],
    },
    publishedAt: record.publishedAt || null,
  };
}

export function toQuestionAwareWritingTask(record = {}) {
  const assignmentKey = normalizeAssignmentId(record.assignmentId);
  const points = Array.isArray(record.markingSpec?.taskPoints)
    ? record.markingSpec.taskPoints.map((point) => clean(point?.requirement)).filter(Boolean)
    : [];
  if (!assignmentKey || !record.markingSpec || !points.length) return null;

  const taskText = clean(record.publicTask?.prompt || record.source?.summary || "");
  const level = clean(record.level).toUpperCase();
  return {
    assignmentKey,
    assignmentVersion: Number(record.version || 0) || null,
    level,
    title: clean(record.title || assignmentKey),
    taskText,
    textType: clean(record.markingSpec.textType || WRITING_TEXT_TYPES.WRITING),
    register: clean(record.markingSpec.register || "unspecified"),
    recipient: clean(record.markingSpec.recipient || "unspecified"),
    taskPoints: points,
    source: "assignmentRegistry",
    gradingInstruction: [
      `Grade the ${level} writing against this exact published assignment task, not merely against the general topic: ${taskText}`,
      "Check every required communicative point separately and return taskCompletion plus missingTaskPoints.",
      `Expected text type: ${clean(record.markingSpec.textType)}. Expected register: ${clean(record.markingSpec.register)}.`,
      "A greeting and closing alone do not make an essay-style body a correct email or letter.",
      "Topic relevance, fluent grammar, connectors, length, or vocabulary cannot compensate for missing required task points.",
      "Never award 100% writing when a required task point is missing or the requested text type/register is materially wrong.",
    ].join(" "),
  };
}
