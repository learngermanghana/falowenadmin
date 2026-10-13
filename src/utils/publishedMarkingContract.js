// Pure source-validation logic; answer keys are received only from a staff-only API.
// Compare the *marked question and correct answer*, not JSON spacing or object order.
// Never reduce comparison to option letters alone: an option can be rearranged.
import { normalizeAnswerKeyEntry } from "./answerKeyNormalizer.js";

const normalizeId = value => String(value || "").trim().toUpperCase();
const clean = value => String(value ?? "")
  .normalize("NFKC")
  .replace(/[\u00a0\u202f]/g, " ")
  .replace(/[‘’]/g, "'")
  .replace(/[“”]/g, '"')
  .replace(/\s+/g, " ")
  .trim();

const questionId = value => {
  const key = clean(value).toLowerCase().replace(/[\s_.-]+/g, "");
  const match = key.match(/^(?:answer|antwort|frage|question|aufgabe|task|q|nr)?0*(\d{1,3})$/);
  return match ? `q${Number(match[1])}` : key;
};

const partId = value => {
  const key = clean(value).toLowerCase().replace(/[\s_.-]+/g, "");
  const match = key.match(/^(?:teil|part)([1-4])$/);
  if (match) return `teil${match[1]}`;
  if (key === "lesen" || key === "reading") return "teil3";
  if (["hören", "horen", "hoeren", "listening"].includes(key)) return "teil4";
  return key || "main";
};

const answerValue = value => {
  if (value !== null && !["string", "number", "boolean"].includes(typeof value)) return null;
  const raw = clean(value);
  if (!raw) return null;
  const option = raw.match(/^([A-F])\s*[).:-]\s*(.*)$/i) || raw.match(/^([A-F])$/i);
  const letter = option?.[1]?.toUpperCase() || "";
  const text = clean(option ? option[2] || "" : raw)
    .toLocaleLowerCase("de")
    .replace(/\b(\d+)\s*€/g, "$1 euro")
    .replace(/\s*[.!?]+$/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return { letter, text };
};

const flattenAnswers = answers => {
  const flat = new Map();
  const invalid = new Set();
  if (!answers || typeof answers !== "object" || Array.isArray(answers)) return { flat, invalid };
  for (const [section, value] of Object.entries(answers)) {
    const sectionName = partId(section);
    const entries = value && typeof value === "object" && !Array.isArray(value)
      ? Object.entries(value).map(([key, answer]) => [`${sectionName}.${questionId(key)}`, answer])
      : [[`main.${questionId(section)}`, value]];
    for (const [key, answer] of entries) {
      const parsed = answerValue(answer);
      if (!parsed || flat.has(key)) invalid.add(key);
      else flat.set(key, parsed);
    }
  }
  return { flat, invalid };
};

const answersEqual = (a, b) => Boolean(a && b
  && a.letter === b.letter
  && a.text === b.text);

// Compatible formatting is safe. A changed option letter, missing question,
// or uncertain/missing answer text is NOT silently treated as equivalent.
export function comparePublishedAnswerKeys(current = {}, incoming = {}) {
  const existing = flattenAnswers(current);
  const next = flattenAnswers(incoming);
  if (!next.flat.size || next.invalid.size) {
    return { safe: false, reason: "The learner answer key is empty or contains an unreadable answer; check the source before marking.", differences: [] };
  }
  if (!existing.flat.size && !existing.invalid.size) {
    return { safe: true, reason: "", differences: [], noExistingKey: true };
  }

  const identifiers = [...new Set([...existing.flat.keys(), ...next.flat.keys(), ...existing.invalid, ...next.invalid])].sort();
  const differences = identifiers.filter(key => existing.invalid.has(key)
    || next.invalid.has(key)
    || !answersEqual(existing.flat.get(key), next.flat.get(key)));
  if (!differences.length) return { safe: true, reason: "", differences: [] };

  const labels = differences.slice(0, 5).map(key => {
    const [section, question] = key.split(".");
    return `${section === "main" ? "Objective" : section.replace("teil", "Teil ")} ${(question || "").replace(/^q(\d+)$/, "Q$1")}`;
  });
  const remainder = differences.length > labels.length ? ` and ${differences.length - labels.length} more` : "";
  return {
    safe: false,
    differences,
    reason: `Answer-key conflict in ${labels.join(", ")}${remainder}. The saved Admin key and live learner key cannot be verified as equivalent. Confirm these exact questions before saving; no answer key was automatically replaced.`,
  };
}

export function mergePublishedMarkingContract(referenceEntry = {}, contract = {}, options = {}) {
  const requested = normalizeId(referenceEntry.assignmentKey || referenceEntry.assignmentId || referenceEntry.assignment_id);
  if (!requested || contract.schemaVersion !== 1 || normalizeId(contract.assignmentId) !== requested) {
    return { referenceEntry, warning: "Invalid or mismatched published assignment contract.", sourceVersion: "" };
  }

  const published = contract.answerKey?.answers;
  const previous = referenceEntry.rawAnswers || referenceEntry.answers || {};
  const official = options.authoritativeReferenceEntry?.answers || options.authoritativeReferenceEntry?.rawAnswers;
  const stored = published ? comparePublishedAnswerKeys(previous, published) : { safe: true };
  const canonical = published && official ? comparePublishedAnswerKeys(official, published) : null;
  // A Firestore registry snapshot may lag behind the versioned Admin dictionary.
  // Only resolve that disagreement if the independently bundled Admin key
  // exactly verifies the live learner key; otherwise keep the existing protection.
  const verifiedWithAdmin = Boolean(canonical?.safe && (stored.safe === false || stored.noExistingKey));
  const comparison = published && stored.noExistingKey && canonical && !canonical.safe
    ? canonical
    : verifiedWithAdmin
      ? canonical
      : stored;
  const safeAnswerKey = Boolean(published && comparison.safe);
  const writing = contract.writingTask && normalizeId(contract.writingTask.assignmentKey) === requested
    ? contract.writingTask : null;
  const normalizedParts = safeAnswerKey
    ? normalizeAnswerKeyEntry(requested, { ...referenceEntry, assignment_id: requested, answers: published }).parts
    : null;
  const merged = {
    ...referenceEntry,
    ...(safeAnswerKey ? { rawAnswers: published, answers: published, parts: normalizedParts } : {}),
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
    keyStatus: !published ? "no_published_key" : !comparison.safe
      ? "conflict" : verifiedWithAdmin ? "verified_admin_dictionary"
        : stored.noExistingKey ? "no_existing_key" : "matched",
    keyDifferences: comparison.safe ? [] : (comparison.differences || []),
    sourceVersion: contract.sourceVersion || "",
    writingUpdated: Boolean(writing),
    answersUpdated: safeAnswerKey,
  };
}
