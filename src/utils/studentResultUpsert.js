function clean(value = "") {
  return String(value ?? "").trim();
}

export function normalizeStudentCode(value = "") {
  return clean(value).toUpperCase().replace(/[^A-Z0-9]/g, "");
}

export function canonicalAssignmentId(row = {}) {
  const candidates = [
    row.assignmentId,
    row.assignment_id,
    row.assignmentKey,
    row.assignmentkey,
    row.canonicalAssignmentKey,
    row.assignment,
  ];

  for (const candidate of candidates) {
    const match = clean(candidate).match(/([A-Z]\d+)\s*[-_.]\s*(\d+(?:[._]\d+)*)/i);
    if (match) return `${match[1].toUpperCase()}-${match[2].replace(/_/g, ".")}`;
  }

  return clean(candidates.find(Boolean)).toUpperCase().replace(/\s+/g, " ");
}

export function isInvalidAssignmentTitle(value) {
  if (typeof value === "boolean" || value === null || value === undefined) return true;
  const normalized = clean(value).toLowerCase();
  return !normalized || normalized === "true" || normalized === "false" || normalized === "null" || normalized === "undefined";
}

export function safeAssignmentTitle(row = {}, preferredTitle = "") {
  if (!isInvalidAssignmentTitle(preferredTitle)) return clean(preferredTitle);
  if (!isInvalidAssignmentTitle(row.assignment)) return clean(row.assignment);
  return canonicalAssignmentId(row);
}

export function studentResultKey(row = {}) {
  const studentCode = normalizeStudentCode(row.studentCode || row.studentcode || row.student_code || row.uid);
  const assignmentId = canonicalAssignmentId(row);
  if (!studentCode || !assignmentId) return "";
  return `${studentCode}__${assignmentId}`;
}

export function resultTimestamp(row = {}) {
  const candidates = [
    row.updatedAt,
    row.markedAt,
    row.scoredAt,
    row.resubmittedAt,
    row.date,
    row.createdAt,
  ];

  for (const value of candidates) {
    if (!value) continue;
    if (typeof value?.toDate === "function") {
      const time = value.toDate().getTime();
      if (Number.isFinite(time)) return time;
    }
    if (typeof value?.seconds === "number") return value.seconds * 1000;
    const parsed = new Date(value).getTime();
    if (Number.isFinite(parsed)) return parsed;
  }
  return 0;
}

export function collapseStudentResultRows(rows = []) {
  const byKey = new Map();
  const withoutKey = [];

  rows.forEach((row, index) => {
    const key = studentResultKey(row);
    const candidate = { row, index, timestamp: resultTimestamp(row) };
    if (!key) {
      withoutKey.push(candidate);
      return;
    }

    const current = byKey.get(key);
    if (!current) {
      byKey.set(key, { ...candidate, key, duplicates: [] });
      return;
    }

    const candidateIsNewer = candidate.timestamp > current.timestamp
      || (candidate.timestamp === current.timestamp && candidate.index > current.index);

    if (candidateIsNewer) {
      byKey.set(key, {
        ...candidate,
        key,
        duplicates: [...current.duplicates, current.row],
      });
    } else {
      current.duplicates.push(candidate.row);
    }
  });

  const keyedRows = [...byKey.values()].map((entry) => ({
    ...entry.row,
    id: entry.row.id || entry.row.dedupe_id || entry.row.dedupeId || entry.key,
    dedupe_id: entry.row.dedupe_id || entry.row.dedupeId || entry.key,
    canonicalResultKey: entry.key,
    duplicateCount: entry.duplicates.length,
    duplicateSheetRowNumbers: entry.duplicates
      .map((row) => Number(row.sheetRowNumber))
      .filter((value) => Number.isInteger(value) && value >= 2),
  }));

  const unkeyedRows = withoutKey.map(({ row, index }) => ({
    ...row,
    id: row.id || row.dedupe_id || row.dedupeId || `unkeyed-result-${index}`,
    duplicateCount: 0,
    duplicateSheetRowNumbers: [],
  }));

  const collapsed = [...keyedRows, ...unkeyedRows].sort((left, right) => resultTimestamp(right) - resultTimestamp(left));
  return {
    rows: collapsed,
    rawCount: rows.length,
    duplicateCount: Math.max(0, rows.length - collapsed.length),
  };
}

function value(source, ...keys) {
  for (const key of keys) {
    if (source[key] !== undefined && source[key] !== null) return source[key];
  }
  return "";
}

export function buildScoreUpsertRow(score = {}, now = new Date()) {
  const assignmentId = canonicalAssignmentId(score);
  const studentCode = normalizeStudentCode(score.studentCode || score.studentcode || score.student_code || score.uid);
  const dedupeId = studentResultKey({ ...score, studentCode, assignmentId });
  const numericScore = Number(score.score ?? score.finalScore);

  return {
    studentcode: studentCode,
    studentCode,
    name: clean(score.name || score.studentName),
    assignment: safeAssignmentTitle(score),
    assignment_id: assignmentId,
    assignmentId,
    score: Number.isFinite(numericScore) ? Math.max(0, Math.min(100, Math.round(numericScore))) : value(score, "score", "finalScore"),
    comments: clean(score.comments || score.feedback || score.improvement_summary || score.improvementSummary || "Synced from Firestore score mirror."),
    date: now.toString(),
    level: clean(score.level),
    link: clean(score.link),
    source: "firestore_sheet_override",
    dedupe_id: dedupeId,
    objective_score: value(score, "objective_score", "objectiveScore"),
    objective_correct: value(score, "objective_correct", "objectiveCorrect"),
    objective_total: value(score, "objective_total", "objectiveTotal"),
    objective_details: value(score, "objective_details", "objectiveDetails"),
    wrong_answers: value(score, "wrong_answers", "wrongAnswers"),
    writing_score: value(score, "writing_score", "writingScore"),
    writing_score_percent: value(score, "writing_score_percent", "writingScorePercent"),
    max_writing_score: value(score, "max_writing_score", "maxWritingScore"),
    score_breakdown: value(score, "score_breakdown", "scoreBreakdown"),
    corrections: value(score, "corrections"),
    improvement_summary: value(score, "improvement_summary", "improvementSummary"),
    marking_reason: value(score, "marking_reason", "markingReason"),
    attempt: value(score, "attempt"),
    status: value(score, "status"),
    is_resubmission: value(score, "is_resubmission", "isResubmission"),
    previous_score: value(score, "previous_score", "previousScore"),
    previous_result: value(score, "previous_result", "previousResult"),
    resubmitted_at: value(score, "resubmitted_at", "resubmittedAt"),
  };
}

export function buildScoreUpsertPayload(scores = [], options = {}) {
  const rowsByKey = new Map();
  scores.forEach((score) => {
    const row = buildScoreUpsertRow(score, options.now || new Date());
    if (!row.dedupe_id) throw new Error("A student code and canonical assignment ID are required before syncing a result.");
    rowsByKey.set(row.dedupe_id, row);
  });

  return {
    ...(options.token ? { token: options.token } : {}),
    ...(options.sheetName ? { sheet_name: options.sheetName } : {}),
    ...(options.sheetGid ? { sheet_gid: options.sheetGid } : {}),
    action: "upsertScoreRows",
    mode: "upsert",
    dedupe_columns: ["studentcode", "assignment_id"],
    remove_duplicate_rows: true,
    create_missing_columns: true,
    rows: [...rowsByKey.values()],
  };
}

export function assertScoreUpsertReceipt(body = {}) {
  if (body?.ok === false) throw new Error(body.error || "The score-sheet upsert failed.");
  const acknowledged = body?.action === "upsertScoreRows"
    || body?.mode === "upsert"
    || body?.upsert === true;
  if (!acknowledged) {
    throw new Error("The score-sheet webhook is still append-only. Upgrade and redeploy the Apps Script before using Override sheet.");
  }
  return body;
}
