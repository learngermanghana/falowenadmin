import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import { db } from "../firebase.js";
import { buildClassUrl, normalizeScheduleRules } from "../utils/liveClassScheduling.js";
import { generateClassSessions } from "./liveClassService.js";

const TUITION = { A1: 2800, A2: 3000, B1: 3000, B2: 3000, C1: 3000 };
const DAY = { sun: "Sun", mon: "Mon", tue: "Tue", wed: "Wed", thu: "Thu", fri: "Fri", sat: "Sat" };

function toMillis(value) {
  if (!value) return 0;
  if (typeof value?.toMillis === "function") return value.toMillis();
  if (typeof value?.toDate === "function") return value.toDate().getTime();
  const parsed = new Date(value).getTime();
  return Number.isFinite(parsed) ? parsed : 0;
}

function canonicalRules(rules = []) {
  return normalizeScheduleRules(rules).map((rule) => ({
    day: DAY[rule.day] || rule.day,
    startTime: rule.startTime,
    durationMinutes: Number(rule.durationMinutes || 60),
  }));
}

function cityFromName(name) {
  return String(name || "")
    .replace(/^\s*(A1|A2|B1|B2|C1|C2)\s+/i, "")
    .replace(/\s+Klasse\s*$/i, "")
    .trim();
}

function sameRules(left, right) {
  return JSON.stringify(canonicalRules(left)) === JSON.stringify(canonicalRules(right));
}

export async function updateClassCohort(classId, payload) {
  const classRef = doc(db, "classes", String(classId));
  const classSnap = await getDoc(classRef);
  if (!classSnap.exists()) throw new Error("Class not found");

  const current = { id: classSnap.id, ...classSnap.data() };
  const name = String(payload.name || current.name || "").trim();
  const levelId = String(payload.levelId || current.levelId || "").trim().toUpperCase();
  const startDate = String(payload.startDate || current.startDate || "").trim();
  const endDate = String(payload.endDate || current.endDate || "").trim();
  const scheduleRules = canonicalRules(payload.scheduleRules || current.scheduleRules || []);

  if (!name) throw new Error("Class name is required");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate) || !/^\d{4}-\d{2}-\d{2}$/.test(endDate)) {
    throw new Error("Valid start and end dates are required");
  }
  if (endDate < startDate) throw new Error("End date must be on or after the start date");
  if (!scheduleRules.length) throw new Error("At least one weekly schedule rule is required");

  const sessionsSnap = await getDocs(query(collection(db, "classSessions"), where("classId", "==", classId)));
  const sessions = sessionsSnap.docs.map((item) => ({ id: item.id, ...item.data() }));
  const nowMs = Date.now();
  const hasStarted = sessions.some((session) =>
    ["completed", "live"].includes(String(session.status || "").toLowerCase()) ||
    (toMillis(session.startsAt) > 0 && toMillis(session.startsAt) < nowMs),
  );
  const scheduleChanged = startDate !== current.startDate || levelId !== current.levelId || !sameRules(scheduleRules, current.scheduleRules);
  if (hasStarted && scheduleChanged) {
    throw new Error("This class has already started. Keep its class dates and use Reschedule on individual future sessions instead.");
  }

  const tuitionGhs = Number(payload.tuitionGhs ?? current.tuitionGhs ?? TUITION[levelId] ?? 3000);
  const nextRecord = {
    name,
    levelId,
    startDate,
    endDate,
    scheduleRules,
    timezone: String(payload.timezone || current.timezone || "Africa/Accra").trim(),
    tutorId: String(payload.tutorId ?? current.tutorId ?? "").trim(),
    zoomProfileId: String(payload.zoomProfileId ?? current.zoomProfileId ?? "").trim(),
    status: String(payload.status || current.status || "upcoming").toLowerCase(),
    city: String(payload.city ?? current.city ?? cityFromName(name)).trim(),
    orientationDate: String(payload.orientationDate ?? current.orientationDate ?? "").trim(),
    tuitionGhs: Number.isFinite(tuitionGhs) && tuitionGhs > 0 ? tuitionGhs : TUITION[levelId] || 3000,
    publicVisible: payload.publicVisible ?? current.publicVisible ?? true,
    registrationOpen: payload.registrationOpen ?? current.registrationOpen ?? true,
    scheduleUrl: String(payload.scheduleUrl ?? current.scheduleUrl ?? "").trim(),
    classUrl: buildClassUrl(current),
    generationStatus: "pending",
    generationError: "",
    updatedAt: serverTimestamp(),
  };

  await updateDoc(classRef, nextRecord);

  const batch = writeBatch(db);
  let removed = 0;
  sessions.forEach((session) => {
    const status = String(session.status || "scheduled").toLowerCase();
    if (["completed", "cancelled", "live"].includes(status) || toMillis(session.startsAt) < nowMs) return;
    batch.delete(doc(db, "classSessions", session.id));
    batch.delete(doc(db, "attendance", String(classId), "sessions", session.id));
    removed += 1;
  });
  if (removed) await batch.commit();

  try {
    const generation = await generateClassSessions(classId, { ...current, ...nextRecord, id: classId });
    await updateDoc(classRef, {
      generationStatus: "complete",
      generationError: "",
      generatedSessionCount: generation.total,
      curriculumMappedSessionCount: generation.mapped,
      publicDataVersion: 1,
      updatedAt: serverTimestamp(),
    });
    return { classId, removed, ...generation };
  } catch (error) {
    await updateDoc(classRef, {
      generationStatus: "failed",
      generationError: error?.message || "Session generation failed",
      updatedAt: serverTimestamp(),
    });
    throw new Error(`Class details were updated, but future sessions could not be rebuilt: ${error?.message || "Unknown error"}`);
  }
}

export function defaultTuitionForLevel(levelId) {
  return TUITION[String(levelId || "").toUpperCase()] || 3000;
}
