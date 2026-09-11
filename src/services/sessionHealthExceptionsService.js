import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase.js";

function text(value) {
  return String(value ?? "").trim();
}

export function operationalClassAliases({ classId, klass = {} } = {}) {
  return [...new Set([
    classId,
    klass.id,
    klass.classId,
    klass.classRecordId,
    klass.name,
    klass.className,
    klass.slug,
  ].map(text).filter((value) => value && !value.includes("/")))];
}

function attendanceAutomationConfigUrl() {
  const base = text(import.meta.env?.VITE_API_BASE_URL).replace(/\/+$/, "");
  return base ? `${base}/attendanceAutomationConfig` : "/api/attendanceAutomationConfig";
}

async function loadAttendanceAutomationConfig() {
  try {
    const response = await fetch(attendanceAutomationConfigUrl(), {
      method: "GET",
      headers: { Accept: "application/json" },
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok || body?.ok === false) {
      throw new Error(body?.error || body?.message || `HTTP ${response.status}`);
    }
    return {
      enabled: body.autoOpenEnabled === true,
      leadMinutes: Number(body.autoOpenLeadMinutes || 0) || null,
      windowMinutes: Number(body.autoOpenWindowMinutes || 0) || null,
      source: "runtime-config",
    };
  } catch (error) {
    return {
      enabled: null,
      leadMinutes: null,
      windowMinutes: null,
      source: "unavailable",
      error: error?.message || "Could not load attendance automation configuration",
    };
  }
}

export async function loadSessionOperationalState({ classId, klass = {}, sessions = [] } = {}) {
  const safeClassId = text(classId || klass.id || klass.classRecordId);
  if (!safeClassId) {
    return {
      attendanceBySessionId: {},
      checkins: [],
      checkinLoadFailures: [],
      autoOpenRuntime: { enabled: null, leadMinutes: null, windowMinutes: null, source: "unavailable" },
    };
  }

  const aliases = operationalClassAliases({ classId: safeClassId, klass });
  const attendanceResults = await Promise.allSettled(aliases.map(async (alias) => {
    const snap = await getDocs(collection(db, "attendance", alias, "sessions"));
    return snap.docs.map((item) => ({
      id: item.id,
      attendanceParentId: alias,
      ...item.data(),
    }));
  }));

  const attendanceBySessionId = {};
  const attendanceDocumentIds = new Set();
  attendanceResults.forEach((result) => {
    if (result.status !== "fulfilled") return;
    result.value.forEach((record) => {
      const canonicalId = text(record.classSessionId || record.sessionId || record.id);
      attendanceDocumentIds.add(text(record.id));
      if (canonicalId && !attendanceBySessionId[canonicalId]) {
        attendanceBySessionId[canonicalId] = record;
      }
    });
  });

  const sessionIds = [...new Set([
    ...sessions.map((session) => text(session?.id)),
    ...Object.keys(attendanceBySessionId),
    ...attendanceDocumentIds,
  ].filter(Boolean))];

  const checkinRequests = aliases.flatMap((alias) => sessionIds.map((sessionId) => ({ alias, sessionId })));
  const results = await Promise.allSettled(checkinRequests.map(async ({ alias, sessionId }) => {
    const snap = await getDocs(collection(db, "attendance", alias, "sessions", sessionId, "checkins"));
    return snap.docs.map((item) => ({
      id: item.id,
      sessionId,
      classId: alias,
      attendanceParentId: alias,
      ...item.data(),
    }));
  }));

  const checkinMap = new Map();
  const checkinLoadFailures = [];
  results.forEach((result, index) => {
    const request = checkinRequests[index];
    if (result.status === "fulfilled") {
      result.value.forEach((checkin) => {
        const studentKey = text(checkin.studentCode || checkin.uid || checkin.email || checkin.id);
        const key = [request.sessionId, checkin.id, studentKey].join("::");
        if (!checkinMap.has(key)) checkinMap.set(key, checkin);
      });
      return;
    }
    checkinLoadFailures.push({
      classAlias: request.alias,
      sessionId: request.sessionId,
      message: result.reason?.message || String(result.reason || "Could not read check-in records"),
    });
  });

  const autoOpenRuntime = await loadAttendanceAutomationConfig();
  return {
    attendanceBySessionId,
    checkins: [...checkinMap.values()],
    checkinLoadFailures,
    autoOpenRuntime,
    attendanceAliases: aliases,
  };
}
