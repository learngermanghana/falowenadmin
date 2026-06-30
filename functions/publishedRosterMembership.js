const { normalizeClassMatchKey } = require("./checkinClassMembership.js");

const DEFAULT_PUBLISHED_SHEET_CSV_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vTDD46qAiCuuza-u4jTzwgiuMR5HwtBhQdvElQw5SIQOHCEJ7RCNLx7Zlarf7HvhYOCXkiVcwTCyXp6/pub?output=csv";
const CACHE_MS = 60 * 1000;

let cachedRows = null;
let cachedAt = 0;
let pendingRequest = null;

function normalizeHeader(value) {
  return String(value || "").trim().toLowerCase().replace(/\s+/g, "");
}

function parseCsvLine(line) {
  const cells = [];
  let current = "";
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (char === '"') {
      if (inQuotes && line[index + 1] === '"') {
        current += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (char === "," && !inQuotes) {
      cells.push(current);
      current = "";
      continue;
    }
    current += char;
  }

  cells.push(current);
  return cells;
}

function parseCsv(text) {
  const lines = [];
  let current = "";
  let inQuotes = false;

  for (let index = 0; index < String(text || "").length; index += 1) {
    const char = text[index];
    if (char === '"') {
      if (inQuotes && text[index + 1] === '"') {
        current += '""';
        index += 1;
      } else {
        inQuotes = !inQuotes;
        current += char;
      }
      continue;
    }
    if (!inQuotes && (char === "\n" || char === "\r")) {
      if (char === "\r" && text[index + 1] === "\n") index += 1;
      if (current.trim()) lines.push(parseCsvLine(current));
      current = "";
      continue;
    }
    current += char;
  }
  if (current.trim()) lines.push(parseCsvLine(current));
  if (!lines.length) return [];

  const [rawHeaders, ...dataRows] = lines;
  const headers = rawHeaders.map(normalizeHeader);
  return dataRows.map((row) => {
    const entry = {};
    headers.forEach((header, index) => {
      entry[header] = String(row[index] || "").trim();
    });
    return entry;
  });
}

function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

function isActiveRosterRow(row = {}) {
  const status = String(row.status || row.studentstatus || row.enrollmentstatus || "").trim().toLowerCase();
  if (!status) return true;
  return !["inactive", "archived", "withdrawn", "removed", "cancelled", "canceled", "blocked", "deleted"].includes(status);
}

function rowEmail(row = {}) {
  return normalizeEmail(row.email || row["e-mail"] || row.emailaddress);
}

function rowClassValues(row = {}) {
  return [
    row.classname,
    row.class,
    row.group,
    row.groupname,
    row.cohort,
    row.cohortname,
  ].map(normalizeClassMatchKey).filter(Boolean);
}

function publishedRosterContainsStudent(rows = [], email, canonicalKeys = new Set()) {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail || !(canonicalKeys instanceof Set) || canonicalKeys.size === 0) return false;

  return rows.some((row) =>
    isActiveRosterRow(row)
    && rowEmail(row) === normalizedEmail
    && rowClassValues(row).some((value) => canonicalKeys.has(value))
  );
}

async function loadPublishedRosterRows({ fetchImpl = globalThis.fetch, url = process.env.STUDENTS_SHEET_CSV_URL || DEFAULT_PUBLISHED_SHEET_CSV_URL } = {}) {
  const now = Date.now();
  if (cachedRows && now - cachedAt < CACHE_MS) return cachedRows;
  if (pendingRequest) return pendingRequest;
  if (typeof fetchImpl !== "function") throw new Error("Published roster fetch is unavailable");

  pendingRequest = Promise.resolve(fetchImpl(url, { headers: { accept: "text/csv" } }))
    .then(async (response) => {
      if (!response?.ok) throw new Error(`Published roster request failed (${response?.status || "unknown"})`);
      return parseCsv(await response.text());
    })
    .then((rows) => {
      cachedRows = rows;
      cachedAt = Date.now();
      return rows;
    })
    .finally(() => {
      pendingRequest = null;
    });

  return pendingRequest;
}

async function isStudentOnPublishedRoster(email, canonicalKeys, options = {}) {
  const rows = await loadPublishedRosterRows(options);
  return publishedRosterContainsStudent(rows, email, canonicalKeys);
}

module.exports = {
  DEFAULT_PUBLISHED_SHEET_CSV_URL,
  parseCsv,
  publishedRosterContainsStudent,
  loadPublishedRosterRows,
  isStudentOnPublishedRoster,
};
