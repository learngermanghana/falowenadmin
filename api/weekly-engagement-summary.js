// One Sunday scan, delivering through the existing Calendar Apps Script.
import { env, googleAccessToken, firestoreGet, docValue, listStudents, hasClass, norm, timeMs, err } from "./checkin-invitations.js";
const dateOf = (value) => {
  if (!value) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(String(value))) return String(value);
  const t = timeMs(value);
  return Number.isFinite(t) ? new Date(t).toISOString().slice(0,10) : "";
};
const stamp = (t) => new Date(t).toISOString().slice(0,10);
async function collection(path, token, limit = 3000) {
  let page = "", rows = [];
  do {
    const query = "?pageSize=300" + (page ? "&pageToken=" + encodeURIComponent(page) : "");
    const result = await firestoreGet(path + query, token, true);
    rows.push(...(result?.documents || []).map(d => ({ ...docValue(d), _id: d.name.split("/").pop() })));
    if (rows.length > limit) err("Weekly report exceeded its bounded scan limit.", 409);
    page = result?.nextPageToken || "";
  } while (page);
  return rows;
}
const active = (row) => !["inactive","archived","cancelled","canceled","withdrawn","removed"].includes(norm(row.status || row.enrollmentStatus));
const present = (value) => value === true || value?.present === true || value?.attended === true || ["present","late"].includes(norm(value?.status || value?.attendance));
const presentFor = (session, student) => {
  const ids = [student.studentCode, student.studentcode, student.uid, student._id, student.email].map(norm).filter(Boolean);
  for (const source of [session.attendance || {}, session.students || {}]) {
    for (const [key,val] of Object.entries(source)) {
      if ((ids.includes(norm(key)) || ids.includes(norm(val?.email || val?.studentCode || val?.uid))) && present(val)) return true;
    }
  }
  return (session.records || []).some(r => ids.includes(norm(r.studentCode || r.studentId || r.email)) && present(r));
};
const held = (s) => {
  const status = norm(s.sessionStatus || s.status);
  if (["cancelled","canceled","deleted","postponed"].includes(status)) return false;
  return s.opened === true || s.active === true || ["completed","finished","ended","open","active"].includes(status)
    || Object.keys(s.attendance || {}).length > 0 || Object.values(s.students || {}).some(present);
};
const participationFor = (rows, student, classId, start, end) => {
  const ids = [student.studentCode,student.studentcode,student.uid,student._id,student.email].map(norm).filter(Boolean);
  const sessions = new Set();
  let turns = 0, correct = 0, needsReview = 0;
  for (const row of rows) {
    const date = dateOf(row.sessionDate || row.markedDate || row.updatedAt);
    if (date < start || date > end || norm(row.classId) !== norm(classId)) continue;
    if (![row.studentEmailNormalized,row.studentEmail,row.studentCode,row.studentUid].map(norm).some(k => ids.includes(k))) continue;
    sessions.add(String(row.classSessionId || row.sessionId || row._id));
    turns += Math.max(0, Number(row.turns || 0));
    correct += Math.max(0, Number(row.correct || 0));
    needsReview += Math.max(0, Number(row.needsReview || 0));
  }
  return { participatedSessions: sessions.size, turns, correct, needsReview };
};
export default async function handler(req, res) {
  res.setHeader("Cache-Control","no-store");
  if (req.method !== "GET") return res.status(405).json({ok:false,error:"GET required"});
  const secret = env("CRON_SECRET");
  if (!secret) return res.status(503).json({ok:false,error:"Cron is not configured"});
  if (req.headers.authorization !== "Bearer " + secret) return res.status(401).json({ok:false,error:"Unauthorized"});
  if (env("WEEKLY_ENGAGEMENT_ENABLED") !== "true") return res.status(200).json({ok:true,disabled:true,reason:"Enable after the legacy weekly attendance email job has been retired."});
  try {
    const webhook = env("CALENDAR_APPS_SCRIPT_URL"), dispatchSecret = env("CLASS_SCHEDULE_SYNC_SECRET");
    if (!webhook || !dispatchSecret) err("Calendar Apps Script integration is not configured",503);
    const now = new Date(), midnight = Date.UTC(now.getUTCFullYear(),now.getUTCMonth(),now.getUTCDate());
    const start = stamp(midnight - ((now.getUTCDay() + 6) % 7) * 86400000), end = stamp(midnight);
    const token = await googleAccessToken();
    const [classes, students, records] = await Promise.all([
      collection("classes",token,300),listStudents(token),collection("classParticipationRecords",token,20000)
    ]);
    const validClasses = classes.filter(active);
    const attendance = await Promise.all(validClasses.map(c => collection("attendance/"+encodeURIComponent(c._id)+"/sessions",token,2000)));
    let rows = [];
    for (let i = 0; i < validClasses.length; i++) {
      const klass = validClasses[i], classId = klass._id;
      const sessions = attendance[i].filter(s => {
        const day = dateOf(s.date || s.sessionDate || s.startsAt || s.openFrom);
        return day >= start && day <= end && held(s);
      });
      if (!sessions.length) continue;
      const emails = new Set();
      for (const student of students) {
        if (!active(student) || !hasClass(student,klass,classId)) continue;
        const email = norm(student.email);
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || emails.has(email)) continue;
        emails.add(email);
        rows.push({classId,className:String(klass.name || classId),email,
          name:String(student.name || student.fullName || "Student"),lessonsHeld:sessions.length,
          attended:sessions.filter(s => presentFor(s,student)).length,
          ...participationFor(records,student,classId,start,end)});
      }
    }
    let sent = 0, skipped = 0;
    for (let offset = 0; offset < rows.length; offset += 100) {
      const response = await fetch(webhook,{method:"POST",headers:{"Content-Type":"text/plain;charset=utf-8"},
        body:JSON.stringify({action:"sendWeeklyEngagementSummaries",secret:dispatchSecret,
          weekStart:start,weekEnd:end,recipients:rows.slice(offset,offset+100)}),redirect:"follow"});
      const result = await response.json().catch(() => null);
      if (!response.ok || !result?.ok) err("Weekly Apps Script did not confirm delivery",502);
      sent += Number(result.sent || 0);
      skipped += Number(result.skipped || 0);
    }
    return res.status(200).json({ok:true,sent,skipped,weekStart:start,weekEnd:end,classes:validClasses.length});
  } catch (error) {
    console.error("weekly-engagement-summary", error.message);
    return res.status(error.status || error.statusCode || 500).json({ok:false,error:error.message || "Weekly report failed"});
  }
}

export { dateOf, presentFor, held, participationFor };
