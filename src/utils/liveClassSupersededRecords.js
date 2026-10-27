function normalize(value) {
  return String(value || "").trim();
}

export function isSupersededRecord(session = {}) {
  const status = normalize(session.status).toLowerCase();
  return status === "superseded"
    || session.superseded === true
    || Boolean(normalize(session.supersededBySessionId));
}

export function needsSupersededStatusNormalization(session = {}) {
  return isSupersededRecord(session)
    && normalize(session.status || "scheduled").toLowerCase() !== "superseded";
}

export function buildSupersededStatusRepairs(sessions = []) {
  const found = new Map();

  sessions.forEach((session) => {
    const sessionId = normalize(session?.id);
    if (!sessionId || !needsSupersededStatusNormalization(session)) return;
    found.set(sessionId, {
      session,
      sessionId,
      patch: {
        startsAt: session.startsAt || "",
        endsAt: session.endsAt || "",
        status: "superseded",
        originalStatus: normalize(session.originalStatus || session.status || "scheduled"),
        superseded: true,
        remindersSuppressed: true,
        cancellationReason: "",
        sequence: Number(session.sequence || 0) + 1,
      },
    });
  });

  return [...found.values()];
}
