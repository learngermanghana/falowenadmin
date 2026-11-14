// Dedicated staff attendance API. No direct class/roster Firestore access is granted by this endpoint.
// The owner continues using the existing full attendance editor.
import { STAFF_LANGUAGES, staffCan } from "../src/utils/staffAccess.js";
import { tokenForGoogle, PROJECT, KEY, fieldsToObject } from "./staff-management.js";

const base = () => `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(PROJECT)}/databases/(default)/documents`;
const authBase = "https://identitytoolkit.googleapis.com/v1";
const safeId = value => typeof value === "string" && /^[A-Za-z0-9_ -]{1,128}$/.test(value);
const fail = (message, status = 400) => { throw Object.assign(new Error(message), { status }); };
const str = value => String(value || "").trim();

function decode(field = {}) {
  if (Object.hasOwn(field, "stringValue")) return field.stringValue;
  if (Object.hasOwn(field, "booleanValue")) return field.booleanValue;
  if (Object.hasOwn(field, "integerValue")) return Number(field.integerValue);
  if (Object.hasOwn(field, "doubleValue")) return Number(field.doubleValue);
  if (field.mapValue) return Object.fromEntries(Object.entries(field.mapValue.fields || {}).map(([k,v]) => [k, decode(v)]));
  if (field.arrayValue) return (field.arrayValue.values || []).map(decode);
  if (field.timestampValue) return field.timestampValue;
  return null;
}
const unpack = doc => Object.fromEntries(Object.entries(doc?.fields || {}).map(([key, value]) => [key, decode(value)]));
const classLanguage = item => str(item.language || item.program).toLowerCase() === "swahili" ? "swahili" : "german";
async function request(url, bearer, method = "GET", body) {
  const result = await fetch(url, {
    method, headers: { Authorization: `Bearer ${bearer}`, ...(body ? { "Content-Type": "application/json" } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  if (result.status === 404) return null;
  const response = await result.json().catch(() => ({}));
  if (!result.ok) fail("Staff attendance data could not be loaded or saved.", 503);
  return response;
}
async function document(path, bearer) {
  if (!path.split("/").every(safeId)) fail("Invalid attendance document.", 400);
  return request(base() + "/" + path.split("/").map(encodeURIComponent).join("/"), bearer);
}
async function listDocuments(collection, bearer, pageSize = 500) {
  const records = [];
  let cursor = "";
  for (let page = 0; page < 4; page += 1) {
    const params = new URLSearchParams({ pageSize: String(pageSize) });
    if (cursor) params.set("pageToken", cursor);
    const response = await request(base() + "/" + collection + "?" + params, bearer);
    records.push(...(response?.documents || []));
    cursor = response?.nextPageToken || "";
    if (!cursor) return records;
  }
  fail("Too many student records. Use the full Admin attendance workspace.", 503);
}
async function classSessions(classId, bearer) {
  const response = await request(base() + ":runQuery", bearer, "POST", { structuredQuery: {
    from: [{ collectionId: "classSessions" }],
    where: { fieldFilter: { field: { fieldPath: "classId" }, op: "EQUAL", value: { stringValue: classId } } },
    limit: 100,
  } });
  return (response || []).filter(row => row.document).map(row => {
    const data = unpack(row.document);
    return { id: str(row.document.name).split("/").pop(), title: data.topic || data.title || "Class session", startsAt: data.startsAt || "",
      status: data.status || "scheduled", classId: data.classId };
  }).sort((a,b) => str(a.startsAt).localeCompare(str(b.startsAt)));
}
function studentInClass(student, classId, className, language) {
  const primary = str(student.program || "german").toLowerCase();
  const matches = placement => [placement?.classId, placement?.classRecordId, placement?.assignedClassId,
    placement?.className, placement?.classname, placement?.class, placement?.group,
    placement?.groupId, placement?.groupName, placement?.cohort, placement?.cohortId, placement?.cohortName]
    .some(value => [str(classId).toLowerCase(), str(className).toLowerCase()].includes(str(value).toLowerCase()) && str(value));
  if (primary === language && matches(student)) return true;
  const secondary = str(student.secondaryProgram).toLowerCase();
  const placement = student.coursePlacements?.[language];
  if (secondary !== language || secondary === primary || !placement || placement.active === false
    || ["inactive", "cancelled", "canceled", "removed", "archived", "completed"].includes(str(placement.status).toLowerCase())) return false;
  return matches(placement);
}
async function rosterForClass(classId, className, language, bearer) {
  // The secondary placement is nested; only this explicitly opened, authorized class
  // triggers a bounded roster scan. Client never receives unrelated student documents.
  const documents = await listDocuments("students", bearer);
  return documents.map(item => {
    const student = unpack(item);
    const id = str(item.name).split("/").pop();
    return { id, student };
  }).filter(item => studentInClass(item.student, classId, className, language))
    .map(({ id, student }) => ({ id, code: str(student.studentCode || student.studentcode || student.uid || id),
      name: str(student.name || student.fullName || student.studentName || "Learner") }))
    .sort((a,b) => a.name.localeCompare(b.name));
}
async function authenticate(req, bearer) {
  const match = str(req.headers.authorization).match(/^Bearer\\s+(.+)$/i);
  if (!match || !KEY || !PROJECT) fail("Staff sign-in is required.", 401);
  const lookup = await fetch(`${authBase}/accounts:lookup?key=${encodeURIComponent(KEY)}`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ idToken: match[1] }),
  });
  const result = await lookup.json().catch(() => ({}));
  const user = result.users?.[0];
  if (!lookup.ok || !user?.localId) fail("Staff session expired.", 401);
  const record = await document("falowenStaffAccess/" + user.localId, bearer);
  const staff = fieldsToObject(record?.fields);
  if (!staff.active || staff.uid !== user.localId || str(staff.email).toLowerCase() !== str(user.email).toLowerCase())
    fail("Active staff access has not been assigned.", 403);
  return { uid: user.localId, staff };
}
async function authorizedClass(staff, classId, language, bearer) {
  if (!safeId(classId) || !STAFF_LANGUAGES.includes(language)) fail("Choose a valid assigned class and language.");
  if (!staffCan(staff.access, staff.languages, language, "attendance", staff.staffRole)
    || !(staff.assignedClasses?.[language] || []).includes(classId)) fail("You cannot open this class.", 403);
  const source = await document("classes/" + classId, bearer);
  if (!source || classLanguage(unpack(source)) !== language) fail("This class is not assigned in the selected language.", 403);
  return { id: classId, ...unpack(source) };
}
export default async function staffAttendanceHandler(req, res) {
  res.setHeader("Cache-Control", "private, no-store");
  if (!["GET","POST"].includes(req.method)) return res.status(405).json({ ok: false, error: "Method not allowed." });
  try {
    const bearer = await tokenForGoogle();
    const { uid, staff } = await authenticate(req, bearer);
    const input = req.method === "POST" ? (typeof req.body === "string" ? JSON.parse(req.body) : req.body || {}) : req.query || {};
    const language = str(input.language || "german").toLowerCase();
    if (!STAFF_LANGUAGES.includes(language)) fail("Choose German or Swahili.");
    if (req.method === "GET" && !input.classId) {
      if (!staffCan(staff.access, staff.languages, language, "attendance", staff.staffRole)) fail("Attendance access is not assigned.", 403);
      const choices = (staff.assignedClasses?.[language] || []).slice(0, 40);
      const entries = await Promise.all(choices.map(async classId => {
        const source = await document("classes/" + classId, bearer);
        const item = source && unpack(source);
        return item && classLanguage(item) === language ? { id: classId, name: item.name || item.className || classId, language } : null;
      }));
      return res.status(200).json({ ok: true, classes: entries.filter(Boolean) });
    }
    const classId = str(input.classId);
    const klass = await authorizedClass(staff, classId, language, bearer);
    const sessions = await classSessions(classId, bearer);
    if (req.method === "GET") {
      const roster = await rosterForClass(classId, klass.name || klass.className, language, bearer);
      const attendance = await Promise.all(sessions.map(async session => {
        const entry = await document(`attendance/${classId}/sessions/${session.id}`, bearer);
        return [session.id, unpack(entry).students || {}];
      }));
      return res.status(200).json({ ok: true, className: klass.name || klass.className || classId, language, roster, sessions,
        marked: Object.fromEntries(attendance) });
    }
    if (input.action !== "save" || !safeId(input.sessionId) || !Array.isArray(input.records) || input.records.length > 500)
      fail("Invalid attendance submission.");
    const session = sessions.find(item => item.id === input.sessionId);
    if (!session || ["cancelled", "canceled"].includes(str(session.status).toLowerCase())) fail("Select an active session.", 409);
    const roster = await rosterForClass(classId, klass.name || klass.className, language, bearer);
    const validIds = new Set(roster.map(item => item.id));
    const provided = new Map();
    for (const entry of input.records) {
      if (!validIds.has(entry.id) || typeof entry.present !== "boolean" || provided.has(entry.id)) fail("Invalid roster entry.", 400);
      provided.set(entry.id, entry.present);
    }
    if (provided.size !== roster.length) fail("The roster changed. Reload before saving.", 409);
    const path = `attendance/${classId}/sessions/${session.id}`;
    const old = await document(path, bearer);
    const existing = unpack(old).students || {};
    const newMap = {};
    for (const student of roster) {
      const oldRecord = existing[student.code] || {};
      newMap[student.code] = { ...oldRecord, name: student.name, present: provided.get(student.id),
        status: provided.get(student.id) ? "present" : "absent" };
    }
    const encodeStudent = value => ({ mapValue: { fields: {
      name: { stringValue: value.name }, present: { booleanValue: value.present }, status: { stringValue: value.status },
    } } });
    const fields = {
      classId: { stringValue: classId }, classSessionId: { stringValue: session.id },
      className: { stringValue: klass.name || klass.className || classId },
      title: { stringValue: session.title }, startsAt: { stringValue: str(session.startsAt) },
      markedBy: { stringValue: uid }, updatedAt: { timestampValue: new Date().toISOString() },
      students: { mapValue: { fields: Object.fromEntries(Object.entries(newMap).map(([key,value]) => [key, encodeStudent(value)])) } },
    };
    const url = base() + "/" + path.split("/").map(encodeURIComponent).join("/") + "?" + new URLSearchParams({
      ...Object.fromEntries(Object.keys(fields).map((key,index) => ["updateMask.fieldPaths" + index, key])),
    });
    // Repeated updateMask.fieldPaths are required by Firestore REST; preserve unrelated fields.
    const mask = new URLSearchParams();
    for (const name of Object.keys(fields)) mask.append("updateMask.fieldPaths", name);
    if (old?.updateTime) mask.set("currentDocument.updateTime", old.updateTime);
    else mask.set("currentDocument.exists", "false");
    await request(base() + "/" + path.split("/").map(encodeURIComponent).join("/") + "?" + mask, bearer, "PATCH", { fields });
    return res.status(200).json({ ok: true, saved: roster.length });
  } catch (error) {
    const status = error.status || 500;
    console.error("staff_attendance_failed", { status });
    return res.status(status).json({ ok: false, error: status >= 500 ? "Staff attendance is temporarily unavailable." : error.message });
  }
}
