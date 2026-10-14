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

function answerChoice(value = "") {
  const match = normalizedAnswer(value).match(/^([A-D])(?:\s*[).:-]\s*(.*))?$/i);
  return match ? { letter: match[1].toUpperCase(), description: normalizedAnswer(match[2] || "").toLocaleLowerCase("de") } : null;
}

function answersEquivalent(current, incoming) {
  const a = normalizedAnswer(current);
  const b = normalizedAnswer(incoming);
  if (a.toLocaleLowerCase("de") === b.toLocaleLowerCase("de")) return true;
  const choiceA = answerChoice(a);
  const choiceB = answerChoice(b);
  // "B" and "B) Tierärztin" encode the same selected option. Do not ignore
  // conflicting descriptions when both versions explicitly provide one.
  return Boolean(choiceA && choiceB && choiceA.letter === choiceB.letter
    && (!choiceA.description || !choiceB.description || choiceA.description === choiceB.description));
}

export function comparePublishedAnswerKeys(current = {}, incoming = {}) {
  const existing = flattenAnswers(current);
  const next = flattenAnswers(incoming);
  if (!next.size) return { safe: false, reason: "Published answer key is empty." };
  if (!existing.size) return { safe: true, reason: "No older answer key exists." };
  const differences = [...new Set([...existing.keys(), ...next.keys()])]
    .filter((key) => !existing.has(key) || !next.has(key) || !answersEquivalent(existing.get(key), next.get(key)));
  if (differences.length) {
    const examples = differences.slice(0, 3).map((key) =>
      key + " (Admin: " + (existing.get(key) ?? "missing") + "; coursebook: " + (next.get(key) ?? "missing") + ")");
    const remaining = differences.length > 3 ? " (+" + (differences.length - 3) + " more)" : "";
    return {
      safe: false,
      differences,
      reason: "Coursebook answer keys differ from the current Admin key at " + examples.join("; ") + remaining
        + "; tutor review is required before replacing them.",
    };
  }
  return { safe: true, reason: "", differences: [] };
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

