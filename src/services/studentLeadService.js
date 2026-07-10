export const STUDENT_LEADS_PUBLISHED_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTDD46qAiCuuza-u4jTzwgiuMR5HwtBhQdvElQw5SIQOHCEJ7RCNLx7Zlarf7HvhYOCXkiVcwTCyXp6/pubhtml";

function normalizeHeader(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\u00a0/g, " ")
    .replace(/[()]/g, "")
    .replace(/_/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function normalizeLeadEmail(value) {
  return String(value || "").trim().toLowerCase();
}

export function normalizeLeadPhone(value) {
  const digits = String(value || "").replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("233")) return digits;
  if (digits.startsWith("0")) return `233${digits.slice(1)}`;
  if (digits.length === 9) return `233${digits}`;
  return digits;
}

function normalizeLeadName(value) {
  return String(value || "").trim().toLowerCase().replace(/\s+/g, " ");
}

function firstValue(row = {}, names = []) {
  for (const name of names) {
    const key = normalizeHeader(name);
    const value = row[key];
    if (String(value || "").trim()) return String(value).trim();
  }
  return "";
}

export function publishedSheetToCsvUrl(url = STUDENT_LEADS_PUBLISHED_URL) {
  const source = String(url || "").trim();
  const match = source.match(/\/spreadsheets\/d\/e\/([^/]+)/);
  if (match) return `https://docs.google.com/spreadsheets/d/e/${match[1]}/pub?output=csv`;
  if (/output=csv/i.test(source)) return source;
  if (/pubhtml/i.test(source)) return source.replace(/pubhtml.*$/i, "pub?output=csv");
  return source;
}

export function parseCsv(text = "") {
  const rows = [];
  let row = [];
  let cell = "";
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        cell += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      row.push(cell);
      cell = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") index += 1;
      row.push(cell);
      if (row.some((value) => String(value || "").trim())) rows.push(row);
      row = [];
      cell = "";
      continue;
    }

    cell += char;
  }

  row.push(cell);
  if (row.some((value) => String(value || "").trim())) rows.push(row);
  return rows;
}

export function csvToObjects(csvText = "") {
  const rows = parseCsv(csvText);
  if (!rows.length) return [];
  const headers = rows[0].map(normalizeHeader);
  return rows.slice(1).map((row) => headers.reduce((record, header, index) => {
    if (header) record[header] = row[index] || "";
    return record;
  }, {}));
}

export function normalizeStudentLead(row = {}, index = 0) {
  const name = firstValue(row, ["name", "full name", "student name"]);
  const email = firstValue(row, ["email", "email address"]);
  const number = firstValue(row, ["phone", "number", "phone number", "whatsapp", "mobile", "contact"]);
  const level = firstValue(row, ["level", "language level", "class level"]);

  return {
    id: `${normalizeLeadEmail(email) || normalizeLeadPhone(number) || `${normalizeLeadName(name)}-${String(level).toUpperCase()}` || index}`,
    name,
    email,
    number,
    level: String(level || "").trim().toUpperCase(),
  };
}

export function leadDedupeKey(lead = {}) {
  const email = normalizeLeadEmail(lead.email);
  if (email) return `email:${email}`;
  const phone = normalizeLeadPhone(lead.number || lead.phone);
  if (phone) return `phone:${phone}`;
  const name = normalizeLeadName(lead.name);
  const level = String(lead.level || "").trim().toUpperCase();
  if (name || level) return `name-level:${name}|${level}`;
  return "";
}

export function dedupeStudentLeads(leads = []) {
  const seen = new Set();
  const unique = [];
  let duplicateCount = 0;

  leads.forEach((lead) => {
    const key = leadDedupeKey(lead);
    if (key && seen.has(key)) {
      duplicateCount += 1;
      return;
    }
    if (key) seen.add(key);
    unique.push(lead);
  });

  return { leads: unique, duplicateCount, total: leads.length };
}

export function normalizeStudentLeadRows(rows = []) {
  return dedupeStudentLeads(
    rows
      .map((row, index) => normalizeStudentLead(row, index))
      .filter((lead) => lead.name || lead.email || lead.number || lead.level),
  );
}

export async function fetchStudentLeads(url = STUDENT_LEADS_PUBLISHED_URL) {
  const response = await fetch(publishedSheetToCsvUrl(url), { cache: "no-store" });
  if (!response.ok) throw new Error(`Student leads sheet could not be loaded (${response.status}).`);
  const csvText = await response.text();
  return normalizeStudentLeadRows(csvToObjects(csvText));
}
