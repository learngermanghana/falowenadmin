import {
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { db } from "../firebase.js";
import { formatAccraDateTime } from "../utils/liveClassCancellationEmail.js";
import { buildRescheduleAnnouncement } from "../utils/liveClassRescheduleEmail.js";
import { saveAnnouncementRow } from "./communicationService.js";

function normalize(value) {
  return String(value || "").trim();
}

function inactiveSession(session = {}) {
  const status = normalize(session.status || session.sessionStatus).toLowerCase();
  return ["cancelled", "completed", "superseded", "deleted"].includes(status)
    || session.superseded === true
    || session.isSuperseded === true
    || Boolean(normalize(session.supersededBySessionId));
}

function curriculumPosition(session = {}) {
  const candidates = [session.curriculumIndex, session.curriculumDay, session.sequenceIndex];
  for (const candidate of candidates) {
    const value = Number(candidate);
    if (Number.isInteger(value) && value >= 0) return value;
  }
  return Number.POSITIVE_INFINITY;
}

function byCurriculumOrder(left = {}, right = {}) {
  const curriculumDifference = curriculumPosition(left) - curriculumPosition(right);
  if (Number.isFinite(curriculumDifference) && curriculumDifference !== 0) return curriculumDifference;
  return new Date(left.startsAt || 0).getTime() - new Date(right.startsAt || 0).getTime();
}

async function queryClassSessions(field, classId) {
  const snap = await getDocs(
    query(collection(db, "classSessions"), where(field, "==", classId)),
  );
  return snap.docs.map((item) => ({ id: item.id, ...item.data() }));
}

async function loadAffectedSessions(classId, primarySessionId, affectedCount) {
  const found = new Map();
  const results = await Promise.allSettled([
    queryClassSessions("classId", classId),
    queryClassSessions("classRecordId", classId),
  ]);
  results.forEach((result) => {
    if (result.status !== "fulfilled") return;
    result.value.forEach((session) => found.set(normalize(session.id), session));
  });

  const ordered = [...found.values()]
    .filter((session) => !inactiveSession(session))
    .sort(byCurriculumOrder);
  const primaryIndex = ordered.findIndex((session) => normalize(session.id) === normalize(primarySessionId));
  if (primaryIndex < 0) return [];
  return ordered.slice(primaryIndex, primaryIndex + Math.max(1, Number(affectedCount || 1)));
}

function confirmedDelivery(receipt = {}) {
  return Boolean(
    (receipt.sheet?.attempted && receipt.sheet?.success)
      || (receipt.firestore?.attempted && receipt.firestore?.success),
  );
}

function deliveryMessage(receipt = {}) {
  if (receipt.sheet?.attempted) return normalize(receipt.sheet.message);
  if (receipt.firestore?.attempted) return normalize(receipt.firestore.message);
  return "Communication delivery is not configured. Add the announcement webhook in Communication settings.";
}

export async function submitRescheduleCommunication({
  klass = {},
  primarySession = {},
  affectedCount = 1,
  startsAt = "",
} = {}) {
  const classId = normalize(klass.id || klass.classId || primarySession.classId || primarySession.classRecordId);
  const affectedSessions = classId
    ? await loadAffectedSessions(classId, primarySession.id, affectedCount).catch(() => [])
    : [];
  const lastAffectedSession = affectedSessions[affectedSessions.length - 1] || null;
  const normalizedAffectedCount = Math.max(1, Number(affectedCount || affectedSessions.length || 1));

  const emailPayload = buildRescheduleAnnouncement({
    klass,
    session: primarySession,
    previousTime: formatAccraDateTime(primarySession.startsAt),
    newTime: formatAccraDateTime(startsAt),
    affectedCount: normalizedAffectedCount,
    lastAffectedSession,
    lastAffectedTime: formatAccraDateTime(lastAffectedSession?.startsAt),
  });

  try {
    const receipt = await saveAnnouncementRow({
      announcement: emailPayload.announcement,
      className: emailPayload.className,
      date: String(startsAt || new Date().toISOString()).slice(0, 10),
      deliveryMode: "auto",
      link: "",
      topic: emailPayload.topic,
    });
    const emailSubmitted = confirmedDelivery(receipt);
    return {
      emailSubmitted,
      emailMessage: deliveryMessage(receipt),
      communicationTopic: emailPayload.topic,
      communicationAffectedCount: emailPayload.affectedCount,
      communicationFollowingCount: emailPayload.followingCount,
      communicationLastAffectedLesson: emailPayload.lastAffectedLesson,
    };
  } catch (error) {
    return {
      emailSubmitted: false,
      emailMessage: error?.message || "Could not queue the reschedule announcement.",
      communicationTopic: emailPayload.topic,
      communicationAffectedCount: emailPayload.affectedCount,
      communicationFollowingCount: emailPayload.followingCount,
      communicationLastAffectedLesson: emailPayload.lastAffectedLesson,
    };
  }
}
