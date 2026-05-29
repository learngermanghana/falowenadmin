/* global process */
import { Buffer } from "node:buffer";
import socialMetricsHandler from "./social-metrics.js";

async function ensureJsonBody(req) {
  if (req.body !== undefined) return req.body;

  if (req.method === "GET" || req.method === "HEAD") {
    req.body = undefined;
    return req.body;
  }

  const chunks = [];

  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  const rawBody = Buffer.concat(chunks).toString("utf8");
  if (!rawBody) {
    req.body = {};
    return req.body;
  }

  const contentType = String(req.headers["content-type"] || "").toLowerCase();
  if (contentType.includes("application/json")) {
    req.body = JSON.parse(rawBody);
    return req.body;
  }

  req.body = rawBody;
  return req.body;
}

const FALOWEN_FUNCTION_BASE_URL =
  process.env.FALOWEN_FUNCTION_BASE_URL ||
  "https://us-central1-falowen-examiner-trainer.cloudfunctions.net/api";

const ANSWER_KEY_MANIFEST_URL =
  process.env.FALOWEN_ANSWER_KEY_MANIFEST_URL ||
  "https://raw.githubusercontent.com/learngermanghana/falowenexamtrainer/main/functions/data/answerKeyManifest.json";

let answerKeyManifestCache = null;
let answerKeyManifestCacheTime = 0;
const ANSWER_KEY_MANIFEST_CACHE_MS = 5 * 60 * 1000;

function safeRegistryId(value) {
  return String(value || "")
    .trim()
    .replace(/[/#?[\]]+/g, "_")
    .replace(/_{2,}/g, "_");
}

function inferLevelFromAssignment(value = "") {
  const match = String(value || "").match(/\b(A1|A2|B1)\b/i);
  return match ? match[1].toUpperCase() : "";
}

function inferPartId(value = "") {
  const normalized = String(value || "").toLowerCase().replace(/ö/g, "o");
  if (/teil\s*2|part\s*2|schreiben|writing/.test(normalized)) return "teil2";
  if (/teil\s*3|part\s*3|lesen|reading/.test(normalized)) return "teil3";
  if (/teil\s*4|part\s*4|horen|hoeren|listening/.test(normalized)) return "teil4";
  if (/teil\s*1|part\s*1/.test(normalized)) return "teil1";
  return "unknown";
}

function inferQuestionNumber(key = "", fallbackIndex = 0, value = "") {
  const fromValue = String(value || "").match(/(?:frage|answer|antwort|nr\.?|q)\s*(\d{1,3})\b/i);
  if (fromValue?.[1]) return fromValue[1];
  const fromKey = String(key || "").match(/(\d{1,3})/);
  if (fromKey?.[1]) return fromKey[1];
  return String(fallbackIndex + 1);
}

function stripLeadingQuestionLabel(value = "") {
  return String(value || "")
    .replace(/^\s*(?:frage|answer|antwort|nr\.?|q)\s*\d{1,3}\s*[).:-]?\s*/i, "")
    .replace(/^\s*anzeige\s*:\s*/i, "Anzeige ")
    .trim();
}

function parseLetterAndText(value = "") {
  const cleaned = stripLeadingQuestionLabel(value);
  const optionMatch = cleaned.match(/^([A-Z])\s*[).:-]?\s+(.+)$/i) || cleaned.match(/^([A-Z])\s*[).:-]?$/i);
  if (optionMatch) {
    return {
      correctLetter: optionMatch[1].toUpperCase(),
      correctText: String(optionMatch[2] || "").trim(),
    };
  }

  const AnzeigeMatch = cleaned.match(/^Anzeige\s+([A-Z])$/i);
  if (AnzeigeMatch) {
    return { correctLetter: AnzeigeMatch[1].toUpperCase(), correctText: `Anzeige ${AnzeigeMatch[1].toUpperCase()}` };
  }

  const booleanMap = {
    true: "Richtig",
    false: "Falsch",
    richtig: "Richtig",
    falsch: "Falsch",
    wahr: "Wahr",
  };
  const booleanKey = cleaned.toLowerCase();
  if (booleanMap[booleanKey]) {
    return { correctLetter: booleanKey === "false" || booleanKey === "falsch" ? "F" : "R", correctText: booleanMap[booleanKey] };
  }

  return { correctLetter: "", correctText: cleaned };
}

function uniq(values = []) {
  return [...new Set(values.map((value) => String(value || "").trim()).filter(Boolean))];
}

function normalizeSingleAnswer(key, value, index = 0) {
  const rawCorrectAnswer = String(value ?? "").trim();
  const questionKey = String(key || `Answer${index + 1}`);
  const questionNumber = inferQuestionNumber(questionKey, index, rawCorrectAnswer);
  const { correctLetter, correctText } = parseLetterAndText(rawCorrectAnswer);
  const acceptedAnswers = uniq([
    correctLetter,
    correctText,
    correctLetter && correctText ? `${correctLetter} ${correctText}` : "",
    rawCorrectAnswer.replace(/[)_:.-]+/g, " ").replace(/\s+/g, " "),
  ]);

  return {
    questionKey,
    questionNumber,
    rawCorrectAnswer,
    raw: rawCorrectAnswer,
    correctLetter,
    correctText,
    acceptedAnswers,
  };
}

function flattenPlainAnswers(value, prefix = []) {
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return [{ key: prefix.join("."), value: String(value) }];
  }
  if (!value || typeof value !== "object") return [];
  return Object.entries(value).flatMap(([key, nested]) => flattenPlainAnswers(nested, [...prefix, key]));
}

function normalizePart(partId, answers = {}) {
  const entries = flattenPlainAnswers(answers).map((entry, index) => normalizeSingleAnswer(entry.key, entry.value, index));
  return {
    partId,
    answers: entries,
    answerCount: entries.length,
  };
}

function splitAnswersIntoParts(answers = {}) {
  if (!answers || typeof answers !== "object") return {};

  const entries = Object.entries(answers || {});
  const answerKeyPattern = /^(?:answer|antwort|frage|question|q|nr\.?)?[\s_-]*\d{1,3}$/i;
  const partIdPattern = /teil\s*[1-4]|part\s*[1-4]|lesen|h[oö]ren|hoeren|schreiben|writing|reading|listening/i;
  const looksFlat = !entries.length || entries.every(([key, nested]) => answerKeyPattern.test(key) && (["string", "number", "boolean"].includes(typeof nested) || nested == null));

  if (looksFlat) {
    return { main: normalizePart("main", answers) };
  }

  const explicitPartKeys = Object.keys(answers).filter((key) => partIdPattern.test(key));
  if (explicitPartKeys.length) {
    return explicitPartKeys.reduce((parts, key) => {
      const partId = inferPartId(key);
      parts[partId] = normalizePart(partId, answers[key]);
      return parts;
    }, {});
  }

  return { main: normalizePart("main", answers) };
}

function countPartAnswers(parts = {}) {
  return Object.values(parts).reduce((sum, part) => sum + Number(part?.answerCount || part?.answers?.length || 0), 0);
}

function normalizeManifestEntry(sourceKey, sourceEntry = {}) {
  const assignmentKey = String(sourceEntry.assignment_id || sourceEntry.assignmentId || sourceEntry.assignmentKey || "").trim();
  const title = String(sourceEntry.title || sourceEntry.assignment || sourceKey || assignmentKey).trim();
  const level = inferLevelFromAssignment(assignmentKey);
  const format = String(sourceEntry.format || "objective").toLowerCase();
  const rawAnswers = sourceEntry.answers || {};
  const parts = splitAnswersIntoParts(rawAnswers);
  const totalAnswers = countPartAnswers(parts);

  return {
    assignmentKey,
    title,
    level,
    format,
    answerUrl: sourceEntry.answerUrl || sourceEntry.answer_url || "",
    sheetUrl: sourceEntry.sheetUrl || sourceEntry.sheet_url || "",
    rawAnswers,
    parts,
    totalAnswers,
    source: "github-answer-manifest",
  };
}

function readPayloadAssignmentKey(payload = {}) {
  const submission = payload.submission || {};
  return String(
    payload.assignmentKey ||
      payload.referenceEntry?.assignmentKey ||
      payload.referenceEntry?.assignment_id ||
      submission.assignmentKey ||
      submission.assignment_key ||
      submission.assignmentId ||
      submission.assignment_id ||
      submission.canonicalAssignmentKey ||
      submission.assignment ||
      "",
  ).trim();
}

async function loadAnswerKeyManifest() {
  const now = Date.now();
  if (answerKeyManifestCache && now - answerKeyManifestCacheTime < ANSWER_KEY_MANIFEST_CACHE_MS) {
    return answerKeyManifestCache;
  }

  const response = await fetch(ANSWER_KEY_MANIFEST_URL, { headers: { accept: "application/json" } });
  if (!response.ok) {
    throw new Error(`Failed to load answer key manifest (${response.status})`);
  }

  const manifest = await response.json();
  answerKeyManifestCache = manifest;
  answerKeyManifestCacheTime = now;
  return manifest;
}

async function findManifestEntryForAssignment(assignmentKey = "") {
  const safeKey = safeRegistryId(assignmentKey);
  if (!safeKey) return null;

  const manifest = await loadAnswerKeyManifest();
  for (const [sourceKey, sourceEntry] of Object.entries(manifest || {})) {
    const normalized = normalizeManifestEntry(sourceKey, sourceEntry);
    if (safeRegistryId(normalized.assignmentKey) === safeKey && normalized.totalAnswers > 0) {
      return normalized;
    }
  }

  return null;
}

async function hydrateMarkingPayloadWithManifest(req, path) {
  if (req.method !== "POST" || path !== "marking/ai") return;
  const payload = req.body && typeof req.body === "object" ? req.body : {};

  if (payload.referenceEntry?.parts && Object.keys(payload.referenceEntry.parts || {}).length) {
    return;
  }

  const assignmentKey = readPayloadAssignmentKey(payload);
  if (!assignmentKey) return;

  try {
    const manifestEntry = await findManifestEntryForAssignment(assignmentKey);
    if (!manifestEntry) return;

    req.body = {
      ...payload,
      assignmentKey: manifestEntry.assignmentKey,
      level: payload.level || manifestEntry.level,
      referenceEntry: manifestEntry,
    };
  } catch (error) {
    console.error("Answer key manifest fallback failed:", error);
  }
}

async function proxyToFalowenFunction(req, res, path, url) {
  try {
    const target = new URL(`${FALOWEN_FUNCTION_BASE_URL.replace(/\/+$/, "")}/${path}`);

    for (const [key, value] of url.searchParams.entries()) {
      if (key === "path" || key === "route") continue;
      target.searchParams.append(key, value);
    }

    const headers = {
      "content-type": req.headers["content-type"] || "application/json",
      accept: req.headers.accept || "application/json",
    };

    if (req.headers.authorization) {
      headers.authorization = req.headers.authorization;
    }

    await ensureJsonBody(req);
    await hydrateMarkingPayloadWithManifest(req, path);

    const response = await fetch(target.toString(), {
      method: req.method,
      headers,
      body:
        req.method === "GET" || req.method === "HEAD"
          ? undefined
          : JSON.stringify(req.body || {}),
    });

    const text = await response.text();
    res.status(response.status);

    try {
      return res.json(JSON.parse(text));
    } catch {
      return res.send(text);
    }
  } catch (error) {
    console.error("Falowen function proxy failed:", error);
    return res.status(502).json({
      status: "error",
      message: "Falowen function proxy failed",
    });
  }
}

function normalizePath(value) {
  return String(value || "")
    .replace(/^\/+/, "")
    .replace(/^api\//, "")
    .replace(/^router\/?/, "");
}

function getRequestUrl(req) {
  const host = req.headers.host || "localhost";
  return new URL(req.url || "/", `https://${host}`);
}

function getRouterPath(req, url) {
  const queryPath = url.searchParams.get("path") || url.searchParams.get("route");
  if (queryPath) return normalizePath(queryPath);

  return normalizePath(url.pathname);
}

function methodAllowed(req, res, allowedMethods) {
  if (allowedMethods.includes(req.method)) return true;

  res.setHeader("Allow", allowedMethods.join(", "));
  res.status(405).json({ status: "error", message: "Method Not Allowed" });
  return false;
}

const FALOWEN_PROXY_ROUTES = new Set([
  "checkin",
  "checkin-token",
  "checkinStatus",
  "credits",
  "health",
  "member-invite",
  "messages",
  "migrateSessionIds",
  "openSession",
  "self-checkin-token",
  "transaction",
  "transactions",
  "verify-checkin",
]);

export default async function handler(req, res) {
  const url = getRequestUrl(req);
  const path = getRouterPath(req, url);
  const firstSegment = path.split("/")[0];

  if (!path || path === "health") {
    return res.status(200).json({ ok: true, status: "ok", service: "falowenadmin-api-router" });
  }

  if (path === "social-metrics") {
    return socialMetricsHandler(req, res);
  }

  if (FALOWEN_PROXY_ROUTES.has(path) || FALOWEN_PROXY_ROUTES.has(firstSegment)) {
    return proxyToFalowenFunction(req, res, path, url);
  }

  if (
    path.startsWith("holidays/") ||
    path.startsWith("orientation/") ||
    path.startsWith("class-schedule/") ||
    path.startsWith("marking/")
  ) {
    return proxyToFalowenFunction(req, res, path, url);
  }

  if (!methodAllowed(req, res, ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD"])) return undefined;

  return res.status(404).json({ status: "error", message: "API route not found" });
}

export { proxyToFalowenFunction };
