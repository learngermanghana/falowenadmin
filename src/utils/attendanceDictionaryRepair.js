function normalizeScheduleDate(raw) {
  const text = String(raw || "").trim();
  if (!text) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;

  const match = text.match(/^(?:\w+),\s+(\d{1,2})\s+(\w+)\s+(\d{4})$/);
  if (!match) return text;

  const [, day, monthName, year] = match;
  const months = {
    january: 0,
    february: 1,
    march: 2,
    april: 3,
    may: 4,
    june: 5,
    july: 6,
    august: 7,
    september: 8,
    october: 9,
    november: 10,
    december: 11,
  };
  const monthIndex = months[String(monthName || "").toLowerCase()];
  if (typeof monthIndex !== "number") return text;
  const date = new Date(Date.UTC(Number(year), monthIndex, Number(day)));
  if (Number.isNaN(date.getTime())) return text;
  const pad = (value) => String(value).padStart(2, "0");
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
}

function matchSessionId(storedId, storedSession, scheduleMap) {
  const byDate = {};
  Object.entries(scheduleMap || {}).forEach(([sessionId, session]) => {
    const date = normalizeScheduleDate(session?.date);
    if (!date) return;
    if (!byDate[date]) byDate[date] = [];
    byDate[date].push(sessionId);
  });

  const storedDate = normalizeScheduleDate(storedSession?.date);
  if (storedDate && byDate[storedDate]?.length === 1) return byDate[storedDate][0];

  const numeric = Number.parseInt(String(storedId || ""), 10);
  const legacyOffset = Number.isInteger(numeric) && numeric >= 0 ? String(numeric + 1) : "";
  if (legacyOffset && scheduleMap?.[legacyOffset]) return legacyOffset;
  return String(storedId || "");
}

export function rebuildAttendanceSessionsFromDictionary(scheduleMap = {}, currentMap = {}) {
  const rebuilt = { ...scheduleMap };

  Object.entries(currentMap || {}).forEach(([storedId, storedSession]) => {
    const targetSessionId = matchSessionId(storedId, storedSession, scheduleMap);
    const scheduleSession = scheduleMap[targetSessionId] || {};
    const existingSession = rebuilt[targetSessionId] || {};

    rebuilt[targetSessionId] = {
      ...storedSession,
      ...existingSession,
      ...scheduleSession,
      title: scheduleSession.title || existingSession.title || storedSession?.title || `Session ${targetSessionId}`,
      date: normalizeScheduleDate(scheduleSession.date || existingSession.date || storedSession?.date),
      dateLabel: scheduleSession.dateLabel || existingSession.dateLabel || storedSession?.dateLabel || "",
      weekday: scheduleSession.weekday || existingSession.weekday || storedSession?.weekday || "",
      assignmentId: scheduleSession.assignmentId || existingSession.assignmentId || storedSession?.assignmentId || storedSession?.assignment_id || "",
      startTime: String(storedSession?.startTime || existingSession.startTime || "").trim(),
      endTime: String(storedSession?.endTime || existingSession.endTime || "").trim(),
      students: {
        ...(scheduleSession.students || {}),
        ...(existingSession.students || {}),
        ...(storedSession?.students || {}),
      },
    };
  });

  return rebuilt;
}
