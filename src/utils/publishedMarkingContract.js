// Pure source-validation logic; answer keys are received only from a staff-only API.
const normalizeId = value => String(value || "").trim().toUpperCase();
const normalizedAnswer = value => String(value ?? "").trim().replace(/\s+/g, " ");
const flattenAnswers = answers => {
  const flat = new Map();
  if (!answers || typeof answers !== "object") return flat;
  for (const [key, value] of Object.entries(answers)) {
    if (value && typeof value === "object" && !Array.isArray(value)) {
      for (const [question, answer] of Object.entries(value)) {
        flat.set(`${key.toLowerCase()}.${question.toLowerCase()}`, normalizedAnswer(answer));
      }
    } else {
      flat.set(`main.${key.toLowerCase()}`, normalizedAnswer(value));
    }
  }
  return flat;
};

export function comparePublishedAnswerKeys(current = {}, incoming = {}) {
  const existing = flattenAnswers(current);
  const next = flattenAnswers(incoming);
  if (!next.size) return { safe: false, reason: "Published answer key is empty." };
  if (!existing.size) return { safe: true, reason: "No older answer key exists." };
  if (existing.size !== next.size || [...existing].some(([key, value]) => next.get(key) !== value)) {
    return { safe: false, reason: "Coursebook answer keys differ from the current Admin key; tutor review is required before replacing them." };
  }
  return { safe: true, reason: "" };
}

export function mergePublishedMarkingContract(referenceEntry = {}, contract = {}) {
  const requested = normalizeId(referenceEntry.assignmentKey || referenceEntry.assignmentId || referenceEntry.assignment_id);
  if (!requested || contract.schemaVersion !== 1 || normalizeId(contract.assignmentId) !== requested) {
    return { referenceEntry, warning: "Invalid or mismatched published assignment contract.", sourceVersion: "" };
  }
  const published = contract.answerKey?.answers;
  const previous = referenceEntry.rawAnswers || referenceEntry.answers || {};
  const comparison = published ? comparePublishedAnswerKeys(previous, published) : { safe: true };
  const safeAnswerKey = Boolean(published && comparison.safe);
  const writing = contract.writingTask && normalizeId(contract.writingTask.assignmentKey) === requested
    ? contract.writingTask : null;
  const merged = {
    ...referenceEntry,
    ...(safeAnswerKey ? { rawAnswers: published, answers: published } : {}),
    ...(writing ? {
      questionAwareWritingTask: {
        assignmentKey: requested,
        level: requested.split("-")[0],
        ...writing,
        source: "learner-coursebook",
        sourceVersion: contract.sourceVersion,
      },
    } : {}),
  };
  return {
    referenceEntry: merged,
    warning: comparison.safe ? "" : comparison.reason,
    sourceVersion: contract.sourceVersion || "",
    writingUpdated: Boolean(writing),
    answersUpdated: safeAnswerKey,
  };
}

