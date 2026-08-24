const VALID_MATCHING_MODES = new Set(["", "strict_grammar", "subject_verb"]);

export function normalizeIntegrityPartId(value = "") {
  const raw = String(value || "")
    .toLocaleLowerCase("de")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/ß/g, "ss")
    .replace(/\s+/g, "")
    .trim();
  if (!raw || raw === "main") return "main";
  const numbered = raw.match(/(?:teil|tiel|part)([1-4])/);
  if (numbered) return `teil${numbered[1]}`;
  if (/schreiben|writing/.test(raw)) return "teil2";
  if (/lesen|reading/.test(raw)) return "teil3";
  if (/horen|hoeren|listening|audio/.test(raw)) return "teil4";
  return raw;
}

function unique(values = []) {
  return [...new Set(values)];
}

function normalizedParts(values = []) {
  return Array.isArray(values) ? values.map(normalizeIntegrityPartId).filter(Boolean) : [];
}

function answerNumberFromKey(key = "") {
  const match = String(key || "").match(/(?:answer|antwort|frage|question|q)\s*(\d{1,3})\b/i)
    || String(key || "").match(/(?:^|\D)(\d{1,3})(?:\D|$)/);
  return match ? Number(match[1]) : null;
}

function collectAnswerNumbers(value, path = []) {
  if (value === null || value === undefined) return [];
  if (typeof value !== "object" || Array.isArray(value)) {
    const number = answerNumberFromKey(path.at(-1));
    return Number.isFinite(number) ? [number] : [];
  }
  return Object.entries(value).flatMap(([key, nested]) => collectAnswerNumbers(nested, [...path, key]));
}

function answerSections(entry = {}) {
  const answers = entry.answers || entry.rawAnswers || entry.answerKeys || entry.answer_key || entry.key;
  if (!answers || typeof answers !== "object" || Array.isArray(answers)) return new Map();
  const entries = Object.entries(answers);
  const hasPartKeys = entries.some(([key, value]) => {
    if (!value || typeof value !== "object" || Array.isArray(value)) return false;
    return normalizeIntegrityPartId(key) !== String(key).toLocaleLowerCase("de").replace(/\s+/g, "");
  }) || entries.some(([key]) => /(?:teil|tiel|part)\s*[1-4]|lesen|h[oö]ren|hoeren|schreiben|writing|reading|listening/i.test(key));

  if (!hasPartKeys) return new Map([["main", answers]]);
  return new Map(entries.map(([part, value]) => [normalizeIntegrityPartId(part), value]));
}

function pushIssue(target, code, assignment, message, extra = {}) {
  target.push({ code, assignment, message, ...extra });
}

export function validateAnswerEntry(assignmentName, entry = {}) {
  const errors = [];
  const warnings = [];
  const stableAssignmentId = String(entry.assignment_id || entry.assignmentId || "").trim();
  const assignment = stableAssignmentId || String(assignmentName || "").trim();
  const expected = normalizedParts(entry.expectedParts || entry.expected_parts || []);
  const reference = normalizedParts(entry.referenceAnswerParts || entry.reference_answer_parts || []);
  const writing = normalizedParts(entry.writingParts || entry.writing_parts || []);
  const aiGraded = normalizedParts(entry.aiGradedParts || entry.ai_graded_parts || []);
  const excluded = normalizedParts(entry.excludedParts || entry.excluded_parts || []);
  const sections = answerSections(entry);

  if (!stableAssignmentId) pushIssue(errors, "missing-assignment-id", assignment || assignmentName, "Assignment has no stable assignment_id or assignmentId.");

  for (const [label, values] of [["expectedParts", expected], ["referenceAnswerParts", reference], ["writingParts", writing], ["aiGradedParts", aiGraded], ["excludedParts", excluded]]) {
    if (values.length !== unique(values).length) {
      pushIssue(errors, "duplicate-part", assignment, `${label} contains a duplicate normalized part.`, { field: label });
    }
  }

  const expectedSet = new Set(expected);
  for (const [label, values] of [["referenceAnswerParts", reference], ["writingParts", writing], ["aiGradedParts", aiGraded]]) {
    if (!expected.length) continue;
    values.filter((part) => !expectedSet.has(part)).forEach((part) => {
      pushIssue(errors, "part-outside-expected", assignment, `${label} contains ${part}, but it is not listed in expectedParts.`, { field: label, part });
    });
  }

  excluded.filter((part) => expectedSet.has(part)).forEach((part) => {
    pushIssue(warnings, "excluded-part-is-expected", assignment, `${part} appears in both expectedParts and excludedParts.`, { part });
  });

  const writingSet = new Set([...writing, ...aiGraded]);
  reference.filter((part) => writingSet.has(part)).forEach((part) => {
    pushIssue(errors, "objective-writing-overlap", assignment, `${part} is registered as both reference-answer and writing/AI-graded content.`, { part });
  });

  const matchingMode = String(entry.answerMatchingMode || entry.textMatchingMode || "").trim().toLowerCase();
  if (!VALID_MATCHING_MODES.has(matchingMode)) {
    pushIssue(errors, "unknown-matching-mode", assignment, `Unknown answer matching mode: ${matchingMode}.`, { matchingMode });
  }

  for (const part of reference) {
    const section = sections.get(part);
    if (!section || typeof section !== "object" || Array.isArray(section) || !Object.keys(section).length) {
      pushIssue(errors, "missing-reference-answers", assignment, `${part} is listed in referenceAnswerParts but has no answer-key entries.`, { part });
      continue;
    }
    const numbers = collectAnswerNumbers(section).filter(Number.isFinite);
    if (!numbers.length) {
      pushIssue(warnings, "un-numbered-reference-answers", assignment, `${part} has reference answers but no detectable Answer numbers.`, { part });
      continue;
    }
    const sorted = [...numbers].sort((a, b) => a - b);
    const duplicates = sorted.filter((value, index) => index > 0 && value === sorted[index - 1]);
    if (duplicates.length) {
      pushIssue(errors, "duplicate-answer-number", assignment, `${part} contains duplicate answer number(s): ${unique(duplicates).join(", ")}.`, { part, numbers: unique(duplicates) });
    }
    const max = sorted.at(-1);
    const present = new Set(sorted);
    const missing = Array.from({ length: max }, (_, index) => index + 1).filter((number) => !present.has(number));
    if (missing.length) {
      pushIssue(warnings, "missing-answer-number", assignment, `${part} is missing answer number(s): ${missing.join(", ")}.`, { part, numbers: missing });
    }
  }

  if (expected.length) {
    for (const part of sections.keys()) {
      if (part === "main" && expectedSet.has("main")) continue;
      if (!expectedSet.has(part) && !excluded.includes(part)) {
        pushIssue(warnings, "answer-section-outside-expected", assignment, `Answer key contains ${part}, which is neither expected nor excluded.`, { part });
      }
    }
  }

  const layout = String(entry.answerLayout || "").trim().toLowerCase();
  if (layout === "flat" && sections.size > 1) {
    pushIssue(warnings, "flat-layout-with-parts", assignment, "answerLayout is flat but the answer key contains multiple parts.");
  }
  if (layout === "multipart" && sections.size === 1 && sections.has("main") && expected.length > 1) {
    pushIssue(warnings, "multipart-layout-with-flat-answers", assignment, "answerLayout is multipart but the answer key is stored as one flat section.");
  }

  return { assignment, errors, warnings };
}

export function validateAnswerDictionary(dictionary = {}) {
  const errors = [];
  const warnings = [];
  const assignmentIds = new Map();

  for (const [assignmentName, entry] of Object.entries(dictionary || {})) {
    const result = validateAnswerEntry(assignmentName, entry || {});
    errors.push(...result.errors);
    warnings.push(...result.warnings);
    const id = String(entry?.assignment_id || entry?.assignmentId || "").trim().toUpperCase();
    if (!id) continue;
    if (assignmentIds.has(id)) {
      pushIssue(errors, "duplicate-assignment-id", id, `assignment_id ${id} is used by both “${assignmentIds.get(id)}” and “${assignmentName}”.`);
    } else {
      assignmentIds.set(id, assignmentName);
    }
  }

  return {
    ok: errors.length === 0,
    assignmentCount: Object.keys(dictionary || {}).length,
    errors,
    warnings,
  };
}
