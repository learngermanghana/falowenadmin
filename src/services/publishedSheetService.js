const DEFAULT_PUBLISHED_SHEET_CSV_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vTDD46qAiCuuza-u4jTzwgiuMR5HwtBhQdvElQw5SIQOHCEJ7RCNLx7Zlarf7HvhYOCXkiVcwTCyXp6/pub?output=csv";

const PUBLISHED_SHEET_CSV_URL =
  import.meta?.env?.VITE_STUDENTS_SHEET_CSV_URL || DEFAULT_PUBLISHED_SHEET_CSV_URL;
const SHEET_TIMEOUT_MS = 7000;
const SHEET_CACHE_MS = 60000;
let cachedRows = null;
let cachedAt = 0;
let pendingRowsRequest = null;

function normalizeHeader(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "");
}

function parseCsvLine(line) {
  const cells = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
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
  const rows = [];
  let currentLine = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];

    if (char === '"') {
      if (inQuotes && text[i + 1] === '"') {
        currentLine += '""';
        i += 1;
      } else {
        inQuotes = !inQuotes;
        currentLine += char;
      }
      continue;
    }

    if (!inQuotes && (char === "\n" || char === "\r")) {
      if (char === "\r" && text[i + 1] === "\n") {
        i += 1;
      }

      if (currentLine.trim().length > 0) {
        rows.push(parseCsvLine(currentLine));
      }
      currentLine = "";
      continue;
    }

    currentLine += char;
  }

  if (currentLine.trim().length > 0) {
    rows.push(parseCsvLine(currentLine));
  }

  return rows;
}

async function fetchPublishedStudentRows() {
  const controller = new AbortController();
  const timeoutId = globalThis.setTimeout(() => controller.abort(), SHEET_TIMEOUT_MS);

  try {
    const res = await fetch(PUBLISHED_SHEET_CSV_URL, {
      signal: controller.signal,
      cache: "no-store",
    });
    if (!res.ok) {
      throw new Error("Failed to load published student sheet");
    }

    const csv = await res.text();
    const rows = parseCsv(csv);
    if (rows.length === 0) return [];

    const [rawHeaders, ...dataRows] = rows;
    const headers = rawHeaders.map(normalizeHeader);

    return dataRows.map((row) => {
      const entry = {};
      headers.forEach((header, index) => {
        entry[header] = String(row[index] || "").trim();
      });
      return entry;
    });
  } catch (error) {
    if (error?.name === "AbortError") {
      throw new Error("Published student sheet timed out");
    }
    throw error;
  } finally {
    globalThis.clearTimeout(timeoutId);
  }
}

export async function loadPublishedStudentRows() {
  const now = Date.now();
  if (cachedRows && now - cachedAt < SHEET_CACHE_MS) return cachedRows;
  if (pendingRowsRequest) return pendingRowsRequest;

  pendingRowsRequest = fetchPublishedStudentRows()
    .then((rows) => {
      cachedRows = rows;
      cachedAt = Date.now();
      return rows;
    })
    .finally(() => {
      pendingRowsRequest = null;
    });

  return pendingRowsRequest;
}

export function readPublishedStudentName(row) {
  return row.name || "";
}

export function readPublishedClassName(row) {
  return row.classname || "";
}

export function readPublishedLevel(row) {
  return row.level || "";
}

export function readPublishedStatus(row) {
  return row.status || "";
}

export function readPublishedStudentCode(row) {
  return row.studentcode || row.uid || "";
}

export function readPublishedStudentEmail(row) {
  return row.email || row["e-mail"] || row.emailaddress || "";
}
