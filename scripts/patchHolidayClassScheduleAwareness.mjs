import { readFileSync, writeFileSync } from "node:fs";

const path = "functions/index.js";
let source = readFileSync(path, "utf8");

const helperMarker = "async function sendHolidayNoticeForDoc({ docRef, holiday, date, countryCode, noticeConfig }) {";
const helperBlock = `
function nextIsoDate(dateIso = "") {
  const [year, month, day] = String(dateIso || "").split("-").map(Number);
  if (!year || !month || !day) return "";
  return new Date(Date.UTC(year, month - 1, day + 1)).toISOString().slice(0, 10);
}

async function classNameForSession(session = {}) {
  const direct = String(session.className || session.class || "").trim();
  if (direct) return direct;

  const classId = String(session.classId || session.classRecordId || "").trim();
  if (!classId) return "";
  const snap = await db.collection("classes").doc(classId).get();
  if (!snap.exists) return classId;
  const klass = snap.data() || {};
  return String(klass.name || klass.className || klass.classId || classId).trim();
}

async function loadHolidayAffectedClassNames(date) {
  const start = `${date}T00:00:00.000Z`;
  const end = `${nextIsoDate(date)}T00:00:00.000Z`;
  const snapshot = await db
    .collection("classSessions")
    .where("startsAt", ">=", start)
    .where("startsAt", "<", end)
    .get();

  const classNames = new Set();
  for (const docSnap of snapshot.docs) {
    const session = docSnap.data() || {};
    const status = String(session.status || "scheduled").toLowerCase();
    if (["cancelled", "canceled"].includes(status)) continue;
    const className = await classNameForSession(session);
    if (className) classNames.add(className);
  }

  return [...classNames].sort();
}

async function buildHolidayNoticeTargets({ date, noticeConfig }) {
  if (noticeConfig.audienceType === "class") {
    return noticeConfig.className ? [{ ...noticeConfig, audienceType: "class" }] : [];
  }

  const affectedClassNames = await loadHolidayAffectedClassNames(date);
  if (!affectedClassNames.length) {
    return [{ ...noticeConfig, audienceType: "all_active", className: "" }];
  }

  return affectedClassNames.map((className) => ({
    ...noticeConfig,
    audienceType: "class",
    className,
  }));
}

async function sendHolidayNoticeWithClassSchedule({ docRef, holiday, date, countryCode, noticeConfig }) {
  const syncSecret = String(holidaysSyncSecret.value() || process.env.HOLIDAYS_SYNC_SECRET || "").trim();
  if (!syncSecret) throw new Error("Missing required env var: HOLIDAYS_SYNC_SECRET");

  const targets = await buildHolidayNoticeTargets({ date, noticeConfig });
  if (!targets.length) throw new Error("No holiday notice audience could be resolved.");

  const results = [];
  let sent = 0;
  let skipped = 0;
  let failed = 0;
  const errors = [];

  for (const target of targets) {
    const payload = buildHolidayNoticePayload({ holiday, date, countryCode, noticeConfig: target, syncSecret });
    try {
      const upstream = await callHolidayNoticeAppsScript(payload);
      const targetSent = Number(upstream?.sent || 0);
      const targetSkipped = Number(upstream?.skipped || 0);
      const targetFailed = Number(upstream?.failed || 0);
      sent += targetSent;
      skipped += targetSkipped;
      failed += targetFailed;
      results.push({ className: target.className || "all_active", audienceType: target.audienceType, sent: targetSent, skipped: targetSkipped, failed: targetFailed });
    } catch (error) {
      failed += 1;
      const message = error?.message || "Holiday notice send failed";
      errors.push(`${target.className || target.audienceType}: ${message}`);
      results.push({ className: target.className || "all_active", audienceType: target.audienceType, sent: 0, skipped: 0, failed: 1, error: message });
    }
  }

  const status = sent > 0 ? "sent" : "failed";
  const lastError = status === "failed" ? (errors.join("; ") || `Failed: ${failed}; skipped: ${skipped}`) : (errors.length ? errors.join("; ") : "");

  await docRef.set({
    noticeStatus: status,
    noticeSentAt: status === "sent" ? admin.firestore.FieldValue.serverTimestamp() : null,
    noticeRecipientCount: sent,
    noticeSkippedCount: skipped,
    noticeFailedCount: failed,
    noticeTargetClasses: results.map((item) => item.className).filter(Boolean),
    noticeTargetResults: results,
    noticeLastError: lastError,
    noticeLastCheckedAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  }, { merge: true });

  return {
    ok: status === "sent",
    noticeStatus: status,
    noticeRecipientCount: sent,
    noticeSentAt: new Date().toISOString(),
    noticeLastError: lastError,
    upstream: { sent, skipped, failed, targets: results },
  };
}
`;

if (!source.includes("sendHolidayNoticeWithClassSchedule")) {
  const index = source.indexOf(helperMarker);
  if (index === -1) throw new Error(`Could not find marker: ${helperMarker}`);
  source = `${source.slice(0, index)}${helperBlock}\n${source.slice(index)}`;
}

source = source.replaceAll("sendHolidayNoticeForDoc({", "sendHolidayNoticeWithClassSchedule({");
source = source.replace("async function sendHolidayNoticeWithClassSchedule({ docRef, holiday, date, countryCode, noticeConfig }) {\n  const syncSecret", "async function sendHolidayNoticeForDoc({ docRef, holiday, date, countryCode, noticeConfig }) {\n  const syncSecret");

writeFileSync(path, source);
console.log("Holiday notices now derive all-active recipients from live class sessions on the holiday date.");
