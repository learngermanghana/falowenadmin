// Admin-only bridge for sending check-in invitations through the existing Calender Apps Script.
// Never accept recipient lists, check-in URLs, or schedule data from the browser.
import crypto from "node:crypto";
import { verifyFirebaseAdminUser, bearerToken } from "./integration-hub.js";

const project = () => String(process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID || "").trim();
const env = (key) => String(process.env[key] || "").trim();
const base64 = (value) => Buffer.from(JSON.stringify(value)).toString("base64url");
const err = (message, status = 400) => { throw Object.assign(new Error(message), { status }); };
const decode = (v) => {
  if (!v || typeof v !== "object") return null;
  if (v.stringValue !== undefined) return v.stringValue;
  if (v.booleanValue !== undefined) return v.booleanValue;
  if (v.integerValue !== undefined) return Number(v.integerValue);
  if (v.doubleValue !== undefined) return Number(v.doubleValue);
  if (v.timestampValue !== undefined) return v.timestampValue;
  if (v.arrayValue) return (v.arrayValue.values || []).map(decode);
  if (v.mapValue) return Object.fromEntries(Object.entries(v.mapValue.fields || {}).map(([key, val]) => [key, decode(val)]));
  return null;
};
const docValue = (doc) => Object.fromEntries(Object.entries(doc?.fields || {}).map(([key, value]) => [key, decode(value)]));
const norm = (v) => String(v || "").trim().toLowerCase();
const safeId = (v) => {
  const value = String(v || "").trim();
  if (!value || value.length > 180 || value.includes("/")) err("Invalid class or session ID.");
  return value;
};
const timeMs = (v) => {
  if (!v) return NaN;
  const n = typeof v === "number" ? v : Date.parse(v);
  return Number.isFinite(n) ? (n < 100000000000 ? n * 1000 : n) : NaN;
};
async function googleAccessToken() {
  const email = env("GOOGLE_SERVICE_ACCOUNT_EMAIL") || env("GCP_CLIENT_EMAIL");
  const key = (env("GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY") || env("GCP_PRIVATE_KEY")).replace(/\\n/g, "\n");
  if (!email || !key || !project()) err("Google service account configuration is missing.", 503);
  const now = Math.floor(Date.now() / 1000);
  const header = base64({ alg: "RS256", typ: "JWT" });
  const claim = base64({ iss: email, scope: "https://www.googleapis.com/auth/cloud-platform", aud: "https://oauth2.googleapis.com/token", iat: now, exp: now + 3600 });
  const signed = `${header}.${claim}`;
  const signature = crypto.sign("RSA-SHA256", Buffer.from(signed), key).toString("base64url");
  const reply = await fetch("https://oauth2.googleapis.com/token", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: `${signed}.${signature}` }) });
  const result = await reply.json().catch(() => ({}));
  if (!reply.ok || !result.access_token) err("Google service account authentication failed.", 503);
  return result.access_token;
}
async function firestoreGet(path, token, optional = false) {
  const res = await fetch(`https://firestore.googleapis.com/v1/projects/${encodeURIComponent(project())}/databases/(default)/documents/${path}`, { headers: { Authorization: `Bearer ${token}` } });
  if (optional && res.status === 404) return null;
  if (!res.ok) err(`Could not verify Firestore data (HTTP ${res.status}).`, 502);
  return res.json();
}
async function listStudents(token) {
  let page = "", students = [];
  do {
    const suffix = page ? `?pageSize=300&pageToken=${encodeURIComponent(page)}` : "?pageSize=300";
    const data = await firestoreGet("students" + suffix, token);
    students.push(...(data.documents || []).map((d) => ({ ...docValue(d), _id: String(d.name || "").split("/").pop() })));
    if (students.length > 3000) err("Student roster is too large to send safely.", 409);
    page = data.nextPageToken || "";
  } while (page);
  return students;
}
const hasClass = (student, klass, classId) => {
  const matches = (data) => [data?.classId, data?.classRecordId, data?.assignedClassId, data?.className, data?.classname, data?.class, data?.group, data?.cohort, data?.cohortId, data?.cohortName].some(v => v && [norm(classId), norm(klass.name)].includes(norm(v)));
  const primary = matches(student);
  const program = norm(klass.program || klass.language || (norm(klass.name).includes("kiswahili") ? "swahili" : "german"));
  const secondary = student.coursePlacements?.[program];
  const secondaryActive = secondary && secondary.active !== false && !["inactive", "cancelled", "archived", "removed", "withdrawn"].includes(norm(secondary.status));
  return primary || (secondaryActive && matches(secondary));
};
const friendlyTime = (date) => new Intl.DateTimeFormat("en-GB", { timeZone: "Africa/Accra", hour: "2-digit", minute: "2-digit", hour12: false }).format(date);
const localDate = (date) => new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Accra", year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") return res.status(405).json({ ok: false, error: "POST required." });
  try {
    await verifyFirebaseAdminUser(bearerToken(req));
    const classId = safeId(req.body?.classId);
    const sessionId = safeId(req.body?.sessionId);
    const token = await googleAccessToken();
    const [klassDoc, sessionDoc, attendanceDoc] = await Promise.all([
      firestoreGet(`classes/${encodeURIComponent(classId)}`, token),
      firestoreGet(`classSessions/${encodeURIComponent(sessionId)}`, token),
      firestoreGet(`attendance/${encodeURIComponent(classId)}/sessions/${encodeURIComponent(sessionId)}`, token, true),
    ]);
    const klass = docValue(klassDoc), session = docValue(sessionDoc), attendance = docValue(attendanceDoc);
    if (String(session.classId || "") !== classId) err("Session does not belong to this class.", 403);
    if (["cancelled", "canceled", "completed", "ended", "deleted"].includes(norm(session.status))) err("This session is not active.", 409);
    const now = Date.now();
    const opened = timeMs(attendance.openFrom || attendance.openedAt || attendance.checkinOpenedAt);
    const closes = timeMs(attendance.openTo || attendance.expiresAt || attendance.activeUntil);
    if (!Number.isFinite(opened) || !Number.isFinite(closes) || opened > now || closes <= now) err("Open check-in first. Its active window could not be verified.", 409);
    const starts = new Date(timeMs(session.startsAt || attendance.startsAt));
    const ends = new Date(timeMs(session.endsAt || attendance.endsAt));
    if (Number.isNaN(starts.getTime()) || Number.isNaN(ends.getTime())) err("Session timing is missing.", 409);
    const allStudents = await listStudents(token);
    const recipients = [...new Map(allStudents
      .filter(s => hasClass(s, klass, classId) && !["inactive", "archived", "withdrawn", "removed", "cancelled", "canceled", "trial_expired"].includes(norm(s.status || s.studentStatus || s.enrollmentStatus)))
      .map(s => ({ email: norm(s.email), name: String(s.name || s.fullName || "Student").trim() }))
      .filter(s => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.email))
      .map(s => [s.email, s])).values()];
    if (!recipients.length) err("No eligible recipients with email addresses were found.", 409);
    const url = new URL("https://admin.falowen.app/checkin");
    const assignmentId = String(session.assignmentIds?.[0] || attendance.assignmentIds?.[0] || session.assignmentId || "").trim();
    const label = String(session.topic || attendance.sessionLabel || klass.name || "Live class").trim();
    Object.entries({ classId, sessionId, date: localDate(starts), sessionLabel: label, assignmentId, startTime: friendlyTime(starts), endTime: friendlyTime(ends), expectedCount: recipients.length }).forEach(([k,v]) => url.searchParams.set(k,String(v)));
    const webhook = env("CALENDAR_APPS_SCRIPT_URL");
    const secret = env("CLASS_SCHEDULE_SYNC_SECRET");
    if (!webhook || !secret) err("Calendar email integration is not configured (CALENDAR_APPS_SCRIPT_URL, CLASS_SCHEDULE_SYNC_SECRET).", 503);
    const request = { secret, action: "sendCheckinInvitations", classId, sessionId, className: klass.name || classId, sessionLabel: label, date: localDate(starts), startTime: friendlyTime(starts), endTime: friendlyTime(ends), checkinUrl: url.toString(), recipients };
    const response = await fetch(webhook, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(request), redirect: "follow" });
    const result = await response.json().catch(() => null);
    if (!response.ok || !result?.ok) err("Calendar Apps Script did not confirm delivery: " + String(result?.error || response.status), 502);
    return res.status(200).json({ ok: true, sent: Number(result.sent || 0), skipped: Number(result.skipped || 0), recipients: recipients.length });
  } catch (error) {
    return res.status(Number(error.status || error.statusCode) || 500).json({ ok: false, error: error.message || "Check-in invitation failed." });
  }
}
