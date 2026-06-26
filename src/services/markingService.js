import * as base from "./markingServiceBase.js";

export * from "./markingServiceBase.js";

function normalizeStudentCode(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function hasUsableStudentCode(row = {}) {
  const code = normalizeStudentCode(row.studentCode || row.studentcode || row.code);
  if (!code) return false;

  return !new Set([
    "nocode",
    "unknown",
    "unknownstudent",
    "undefined",
    "null",
    "missing",
  ]).has(code);
}

export async function loadSubmissions(options = {}) {
  const rows = await base.loadSubmissions(options);
  return rows.filter(hasUsableStudentCode);
}
