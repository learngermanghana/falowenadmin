function normalize(value) {
  return String(value || "").trim();
}

export function classReminderSendId(classId, sessionId, reminderType) {
  return `${normalize(classId)}_${normalize(sessionId)}_${normalize(reminderType)}`.replace(/[^A-Za-z0-9_-]/g, "_");
}

export function classReminderKey(classId, sessionId, reminderType) {
  return `${normalize(classId)}:${normalize(sessionId)}:${normalize(reminderType)}`;
}

export function officialReminderSessionId(session = {}) {
  return normalize(session.officialSessionId)
    || normalize(session.classSessionId)
    || normalize(session.canonicalSessionId)
    || normalize(session.id);
}

export function reminderAlreadySent(session = {}, reminderType = "") {
  const type = normalize(reminderType);
  if (!type) return false;
  return session.remindersSent?.[type] === true
    || Boolean(session.reminderSentAt?.[type])
    || (Array.isArray(session.sentReminderTypes) && session.sentReminderTypes.includes(type));
}

export function findDueClassReminderSessions({ sessions = [], now = new Date(), reminderType = "10min", targetMinutes = 10, toleranceMinutes = 1 } = {}) {
  const nowMs = new Date(now).getTime();
  const lowerMs = (targetMinutes - toleranceMinutes) * 60000;
  const upperMs = (targetMinutes + toleranceMinutes) * 60000;
  const claimedOfficialIds = new Set();
  const due = [];

  [...sessions]
    .sort((left, right) => new Date(left.startsAt || 0) - new Date(right.startsAt || 0))
    .forEach((session) => {
      const status = normalize(session.status || "scheduled").toLowerCase();
      if (["cancelled", "completed"].includes(status) || session.remindersSuppressed === true) return;
      if (reminderAlreadySent(session, reminderType)) return;

      const startsAtMs = new Date(session.startsAt || 0).getTime();
      if (!Number.isFinite(startsAtMs)) return;
      const diff = startsAtMs - nowMs;
      if (diff < lowerMs || diff > upperMs) return;

      const officialId = officialReminderSessionId(session);
      if (!officialId || claimedOfficialIds.has(officialId)) return;
      claimedOfficialIds.add(officialId);
      due.push(session);
    });

  return due;
}

export async function claimClassReminderSend({ db, classId, sessionId, reminderType, transaction = null, serverTimestamp = null } = {}) {
  if (!db) throw new Error("db is required");
  const normalizedClassId = normalize(classId);
  const normalizedSessionId = normalize(sessionId);
  const normalizedType = normalize(reminderType);
  const sendId = classReminderSendId(normalizedClassId, normalizedSessionId, normalizedType);
  const sendRef = db.collection("classReminderSends").doc(sendId);
  const payload = {
    classId: normalizedClassId,
    sessionId: normalizedSessionId,
    reminderType: normalizedType,
    reminderKey: classReminderKey(normalizedClassId, normalizedSessionId, normalizedType),
    createdAt: serverTimestamp || new Date().toISOString(),
  };

  const claim = async (tx) => {
    const snap = await tx.get(sendRef);
    if (snap.exists) return { claimed: false, id: sendId, reminderKey: payload.reminderKey };
    tx.create(sendRef, payload);
    return { claimed: true, id: sendId, reminderKey: payload.reminderKey };
  };

  if (transaction) return claim(transaction);
  if (typeof db.runTransaction === "function") return db.runTransaction(claim);
  const snap = await sendRef.get();
  if (snap.exists) return { claimed: false, id: sendId, reminderKey: payload.reminderKey };
  await sendRef.create(payload);
  return { claimed: true, id: sendId, reminderKey: payload.reminderKey };
}
