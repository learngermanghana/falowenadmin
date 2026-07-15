export const STUDENT_LEADS_PUBLISHED_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTDD46qAiCuuza-u4jTzwgiuMR5HwtBhQdvElQw5SIQOHCEJ7RCNLx7Zlarf7HvhYOCXkiVcwTCyXp6/pubhtml";
export const STUDENT_LEADS_SHEET_NAME = "Leads";

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

function extractPublishedSheetId(url = STUDENT_LEADS_PUBLISHED_URL) {
  const source = String(url || "").trim();
  return source.match(/\/spreadsheets\/d\/e\/([^/]+)/)?.[1] || "";
}

function basePublishedUrl(url = STUDENT_LEADS_PUBLISHED_URL) {
  const publishedId = extractPublishedSheetId(url);
  return publishedId ? `https://docs.google.com/spreadsheets/d/e/${publishedId}` : "";
}

function unique(values = []) {
  return [...new Set(values.filter(Boolean))];
}

function decodeHtmlEntities(value = "") {
  return String(value || "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">");
}

function stripHtml(value = "") {
  return decodeHtmlEntities(String(value || "")
    .replace(/<br\s*\/?\s*>/gi, " ")
    .replace(/<[^>]*>/g, " "))
    .replace(/\s+/g, " ")
    .trim();
}

export function extractSheetGidFromPublishedHtml(html = "", sheetName = STUDENT_LEADS_SHEET_NAME) {
  const wanted = normalizeHeader(sheetName);
  const source = String(html || "");
  const tabPattern = /<a\b[^>]*href=["'][^"']*gid=(\d+)[^"']*["'][^>]*>([\s\S]*?)<\/a>/gi;
  let match;
  while ((match = tabPattern.exec(source))) {
    const label = normalizeHeader(stripHtml(match[2]));
    if (label === wanted) return match[1];
  }

  const aroundGidPattern = /gid=(\d+)[\s\S]{0,900}?>([^<>]+)</gi;
  while ((match = aroundGidPattern.exec(source))) {
    const label = normalizeHeader(decodeHtmlEntities(match[2]));
    if (label === wanted) return match[1];
  }

  const labelFirstPattern = new RegExp(`${sheetName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}[\\s\\S]{0,900}?gid=(\\d+)`, "i");
  return source.match(labelFirstPattern)?.[1] || "";
}

export function publishedSheetToCsvUrl(url = STUDENT_LEADS_PUBLISHED_URL, sheetName = STUDENT_LEADS_SHEET_NAME) {
  const source = String(url || "").trim();
  if (/output=csv/i.test(source) || /tqx=out:csv/i.test(source)) return source;

  const base = basePublishedUrl(source);
  if (!base) return source;
  const sheet = encodeURIComponent(sheetName || STUDENT_LEADS_SHEET_NAME);
  return `${base}/pub?output=csv&sheet=${sheet}`;
}

export function publishedSheetCsvCandidates(url = STUDENT_LEADS_PUBLISHED_URL, sheetName = STUDENT_LEADS_SHEET_NAME, gid = "") {
  const source = String(url || "").trim();
  const base = basePublishedUrl(source);
  if (!base) return [source].filter(Boolean);
  const sheet = encodeURIComponent(sheetName || STUDENT_LEADS_SHEET_NAME);
  return unique([
    gid ? `${base}/pub?gid=${encodeURIComponent(gid)}&single=true&output=csv` : "",
    `${base}/pub?output=csv&sheet=${sheet}`,
    `${base}/gviz/tq?tqx=out:csv&sheet=${sheet}`,
    `${base}/pub?output=csv`,
  ]);
}

export function publishedSheetHtmlCandidates(url = STUDENT_LEADS_PUBLISHED_URL, sheetName = STUDENT_LEADS_SHEET_NAME, gid = "") {
  const source = String(url || "").trim();
  const base = basePublishedUrl(source);
  if (!base) return [source].filter(Boolean);
  const sheet = encodeURIComponent(sheetName || STUDENT_LEADS_SHEET_NAME);
  return unique([
    gid ? `${base}/pubhtml?gid=${encodeURIComponent(gid)}&single=true` : "",
    `${base}/pubhtml?sheet=${sheet}&single=true`,
    `${base}/pubhtml`,
  ]);
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

function csvHeaders(csvText = "") {
  return (parseCsv(csvText)[0] || []).map(normalizeHeader).filter(Boolean);
}

function headersLookLikeLeadSheet(headers = []) {
  const normalizedHeaders = new Set(
    headers.map(normalizeHeader).filter(Boolean)
  );

  return (
    normalizedHeaders.has("lead id") &&
    normalizedHeaders.has("name") &&
    (
      normalizedHeaders.has("email") ||
      normalizedHeaders.has("phone")
    )
  );
}

function looksLikeLeadSheet(csvText = "") {
  return headersLookLikeLeadSheet(csvHeaders(csvText));
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

export function publishedHtmlTablesToObjects(html = "") {
  const source = String(html || "");
  const tableMatches = [...source.matchAll(/<table\b[\s\S]*?<\/table>/gi)];
  return tableMatches.map((tableMatch) => {
    const rowMatches = [...tableMatch[0].matchAll(/<tr\b[\s\S]*?<\/tr>/gi)];
    const rows = rowMatches.map((rowMatch) => {
      const cellMatches = [...rowMatch[0].matchAll(/<t[dh]\b[^>]*>([\s\S]*?)<\/t[dh]>/gi)];
      return cellMatches.map((cellMatch) => stripHtml(cellMatch[1]));
    }).filter((row) => row.some((cell) => String(cell || "").trim()));

    if (!rows.length) return [];
    const headers = rows[0].map(normalizeHeader);
    return rows.slice(1).map((row) => headers.reduce((record, header, index) => {
      if (header) record[header] = row[index] || "";
      return record;
    }, {}));
  }).filter((rows) => rows.length);
}

export function normalizeStudentLead(row = {}, index = 0) {
  const leadId = firstValue(row, ["lead id", "lead_id", "id"]);
  const name = firstValue(row, ["name", "full name", "student name"]);
  const email = firstValue(row, ["email", "email address"]);
  const number = firstValue(row, ["phone", "number", "phone number", "whatsapp", "mobile", "contact"]);
  const level = firstValue(row, ["level", "language level", "class level"]);
  const className = firstValue(row, ["class name", "class_name", "class"]);
  const registrationDate = firstValue(row, ["created at", "created_at", "registration date", "registration_date", "registered at", "registered_at"]);
  const status = firstValue(row, ["status", "lead status", "lead_status"]);
  const paymentStatus = firstValue(row, ["payment status", "payment_status"]);
  const amountPaid = firstValue(row, ["student paid", "student_paid", "amount paid", "amount_paid", "paid"]);
  const balance = firstValue(row, ["student balance", "student_balance", "balance", "balance due", "balance_due"]);
  const studentCode = firstValue(row, ["student code", "student_code"]);
  const nextFollowUpAt = firstValue(row, ["next follow up at", "next_follow_up_at", "next followup", "next_followup"]);
  const lastFollowUpAt = firstValue(row, ["last follow up at", "last_follow_up_at", "last followup", "last_followup"]);
  const source = firstValue(row, ["source", "lead source", "lead_source"]);
  const startDate = firstValue(row, ["start date", "start_date", "class start", "class_start"]);
  const endDate = firstValue(row, ["end date", "end_date", "class end", "class_end"]);
  const normalizedLevel = String(level || "").trim().toUpperCase();
  const fallbackId = normalizeLeadEmail(email)
    || normalizeLeadPhone(number)
    || [normalizeLeadName(name), normalizedLevel].filter(Boolean).join("|")
    || String(index);

  return {
    id: leadId || fallbackId,
    leadId,
    name,
    email,
    number,
    level: normalizedLevel,
    className,
    registrationDate,
    status,
    paymentStatus,
    amountPaid,
    balance,
    studentCode,
    nextFollowUpAt,
    lastFollowUpAt,
    source,
    startDate,
    endDate,
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
  const uniqueLeads = [];
  let duplicateCount = 0;

  leads.forEach((lead) => {
    const key = leadDedupeKey(lead);
    if (key && seen.has(key)) {
      duplicateCount += 1;
      return;
    }
    if (key) seen.add(key);
    uniqueLeads.push(lead);
  });

  return { leads: uniqueLeads, duplicateCount, total: leads.length };
}

export function normalizeStudentLeadRows(rows = []) {
  return dedupeStudentLeads(
    rows
      .map((row, index) => normalizeStudentLead(row, index))
      .filter((lead) => lead.name || lead.email || lead.number || lead.level),
  );
}

async function fetchText(url) {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) throw new Error(`${response.status}`);
  return response.text();
}

async function discoverLeadSheetGid(url = STUDENT_LEADS_PUBLISHED_URL) {
  try {
    const html = await fetchText(url);
    return extractSheetGidFromPublishedHtml(html, STUDENT_LEADS_SHEET_NAME);
  } catch {
    return "";
  }
}

export async function fetchStudentLeads(url = STUDENT_LEADS_PUBLISHED_URL) {
  const gid = await discoverLeadSheetGid(url);
  const candidates = publishedSheetCsvCandidates(url, STUDENT_LEADS_SHEET_NAME, gid);
  const errors = [];

  for (const candidate of candidates) {
    try {
      const csvText = await fetchText(candidate);
      if (/^\s*</.test(csvText)) {
        errors.push(`${candidate} returned HTML, not CSV`);
        continue;
      }
      if (!looksLikeLeadSheet(csvText)) {
        errors.push(`${candidate} did not contain valid Leads headers`);
        continue;
      }
      const result = normalizeStudentLeadRows(csvToObjects(csvText));
      if (result.total > 0) return { ...result, sourceUrl: candidate, sheetName: STUDENT_LEADS_SHEET_NAME };
      errors.push(`${candidate} returned no lead rows`);
    } catch (error) {
      errors.push(`${candidate} failed (${error?.message || "error"})`);
    }
  }

  for (const candidate of publishedSheetHtmlCandidates(url, STUDENT_LEADS_SHEET_NAME, gid)) {
    try {
      const html = await fetchText(candidate);
      const tables = publishedHtmlTablesToObjects(html);
      for (const rows of tables) {
        if (
          !rows.length ||
          !headersLookLikeLeadSheet(Object.keys(rows[0] || {}))
        ) {
          continue;
        }
        const result = normalizeStudentLeadRows(rows);
        if (result.total > 0) return { ...result, sourceUrl: candidate, sheetName: STUDENT_LEADS_SHEET_NAME };
      }
      errors.push(`${candidate} returned no Leads table`);
    } catch (error) {
      errors.push(`${candidate} failed (${error?.message || "error"})`);
    }
  }

  throw new Error(`Student leads sheet could not be loaded. Tried the Leads tab but Google did not return a valid CSV or readable published table. ${errors.slice(0, 4).join("; ")}`);
}
