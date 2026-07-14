import { getCourseSessionGroups } from "../data/courseSessionGroups.js";
import { resolveOfficialSessionNumber } from "./liveClassLessonOrder.js";

function normalize(value) {
  return String(value || "").trim();
}

function toDate(value) {
  if (!value) return null;
  if (typeof value?.toDate === "function") return value.toDate();
  if (typeof value?.toMillis === "function") return new Date(value.toMillis());
  if (typeof value === "object" && Number.isFinite(value.seconds)) {
    return new Date((Number(value.seconds) * 1000) + Math.round(Number(value.nanoseconds || 0) / 1000000));
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function levelIdForClass(klass = {}) {
  return normalize(klass.levelId || klass.level || klass.name)
    .match(/\b(A1|A2|B1|B2|C1|C2)\b/i)?.[1]?.toUpperCase() || "";
}

function superseded(session = {}) {
  return session.superseded === true || normalize(session.status).toLowerCase() === "superseded";
}

function collisionEligible(session = {}, plannedStatus = null) {
  const status = normalize(plannedStatus || session.status || "scheduled").toLowerCase();
  return !superseded(session) && status !== "cancelled";
}

function sessionLabel(session = {}) {
  return normalize(session.topic || session.title || session.id) || "another lesson";
}

function codedError(code, message, details = {}) {
  const error = new Error(message);
  error.code = code;
  Object.assign(error, details);
  return error;
}

function validInterval(startsAt, endsAt, label = "Session") {
  const start = toDate(startsAt);
  const end = toDate(endsAt);
  if (!start || !end || end.getTime() <= start.getTime()) {
    throw codedError("live-class/invalid-time", `${label} must have a valid start and end time.`);
  }
  return { start, end };
}

export function intervalsOverlap(leftStartsAt, leftEndsAt, rightStartsAt, rightEndsAt) {
  const left = validInterval(leftStartsAt, leftEndsAt, "New session time");
  const right = validInterval(rightStartsAt, rightEndsAt, "Existing session time");
  return left.start.getTime() < right.end.getTime()
    && left.end.getTime() > right.start.getTime();
}

export function findRescheduleOverlap({
  sessions = [],
  sessionId = "",
  startsAt,
  endsAt,
  ignoredSessionIds = [],
  plannedStatus = "scheduled",
} = {}) {
  const target = validInterval(startsAt, endsAt, "New session time");
  const ignored = new Set([sessionId, ...ignoredSessionIds].map(normalize).filter(Boolean));

  return sessions.find((candidate) => {
    if (ignored.has(normalize(candidate.id))) return false;
    if (!collisionEligible(candidate, candidate.status)) return false;
    const candidateStart = toDate(candidate.startsAt);
    const candidateEnd = toDate(candidate.endsAt);
    if (!candidateStart || !candidateEnd || candidateEnd.getTime() <= candidateStart.getTime()) return false;
    if (!collisionEligible({ status: plannedStatus })) return false;
    return target.start.getTime() < candidateEnd.getTime()
      && target.end.getTime() > candidateStart.getTime();
  }) || null;
}

function canonicalOrderedSessions(klass = {}, sessions = []) {
  const levelId = levelIdForClass(klass);
  const groups = getCourseSessionGroups(levelId);
  const canonical = sessions.filter((session) => !superseded(session));

  if (!groups.length) {
    return {
      levelId,
      groups,
      ordered: canonical
        .map((session, index) => ({ session, number: index + 1, startsAt: toDate(session.startsAt) }))
        .sort((left, right) => (left.startsAt?.getTime() || 0) - (right.startsAt?.getTime() || 0)),
    };
  }

  const ordered = canonical.map((session) => {
    const number = resolveOfficialSessionNumber(session, groups, levelId);
    if (!number) {
      throw codedError(
        "live-class/missing-curriculum-position",
        `${sessionLabel(session)} cannot be matched to an official ${levelId} curriculum position. Run Official class timetable repair first.`,
        { sessionId: normalize(session.id) },
      );
    }
    return { session, number, startsAt: toDate(session.startsAt) };
  }).sort((left, right) => left.number - right.number);

  return { levelId, groups, ordered };
}

function assertCurriculumBoundary({ ordered, selectedIndex, targetStart, mode }) {
  const previous = selectedIndex > 0 ? ordered[selectedIndex - 1] : null;
  const next = selectedIndex < ordered.length - 1 ? ordered[selectedIndex + 1] : null;
  const previousStart = toDate(previous?.session?.startsAt);
  const nextStart = toDate(next?.session?.startsAt);

  if (previousStart && targetStart.getTime() <= previousStart.getTime()) {
    throw codedError(
      "live-class/curriculum-order",
      `${sessionLabel(ordered[selectedIndex].session)} must remain after ${sessionLabel(previous.session)}. Choose a later time or shift from an earlier lesson.`,
      { previousSessionId: normalize(previous.session.id) },
    );
  }

  if (mode === "single" && nextStart && targetStart.getTime() >= nextStart.getTime()) {
    throw codedError(
      "live-class/curriculum-order",
      `${sessionLabel(ordered[selectedIndex].session)} must remain before ${sessionLabel(next.session)}. Choose an earlier time or use “Move this and all following sessions”.`,
      { nextSessionId: normalize(next.session.id) },
    );
  }
}

function recoveryBaseline({ klass = {}, selectedSession = {}, selectedCurrent, target, mode }) {
  if (mode !== "following" || target.start.getTime() !== selectedCurrent.start.getTime()) {
    return selectedCurrent;
  }

  const latestSessionId = normalize(klass.lastRescheduledSessionId || klass.lastChangedSessionId);
  const selectedId = normalize(selectedSession.id);
  const previousStartsAt = selectedSession.previousStartsAt
    || (latestSessionId === selectedId ? klass.lastSessionChangePreviousStartsAt : "");
  const previousEndsAt = selectedSession.previousEndsAt
    || (latestSessionId === selectedId ? klass.lastSessionChangePreviousEndsAt : "");
  const previousStart = toDate(previousStartsAt);
  if (!previousStart || previousStart.getTime() >= target.start.getTime()) return selectedCurrent;

  const previousEnd = toDate(previousEndsAt);
  const currentDuration = selectedCurrent.end.getTime() - selectedCurrent.start.getTime();
  const baselineEnd = previousEnd && previousEnd.getTime() > previousStart.getTime()
    ? previousEnd
    : new Date(previousStart.getTime() + currentDuration);

  return { start: previousStart, end: baselineEnd };
}

export function buildSessionReschedulePlan({
  klass = {},
  sessions = [],
  sessionId = "",
  targetStartsAt,
  targetEndsAt,
  mode = "single",
} = {}) {
  const normalizedMode = normalize(mode).toLowerCase() === "following" ? "following" : "single";
  const target = validInterval(targetStartsAt, targetEndsAt, "New session time");
  const { levelId, ordered } = canonicalOrderedSessions(klass, sessions);
  const selectedIndex = ordered.findIndex(({ session }) => normalize(session.id) === normalize(sessionId));
  if (selectedIndex < 0) throw codedError("live-class/session-not-found", "Session not found in this class timetable.");

  const selected = ordered[selectedIndex];
  const selectedCurrent = validInterval(selected.session.startsAt, selected.session.endsAt, sessionLabel(selected.session));
  const selectedBaseline = recoveryBaseline({
    klass,
    selectedSession: selected.session,
    selectedCurrent,
    target,
    mode: normalizedMode,
  });
  assertCurriculumBoundary({ ordered, selectedIndex, targetStart: target.start, mode: normalizedMode });

  const affected = normalizedMode === "following" ? ordered.slice(selectedIndex) : [selected];
  const locked = affected.find(({ session }) => ["completed", "live"].includes(normalize(session.status).toLowerCase()));
  if (locked) {
    throw codedError(
      "live-class/locked-following-session",
      `${sessionLabel(locked.session)} is ${normalize(locked.session.status).toLowerCase()} and cannot be shifted. Choose “Move only this session”.`,
      { sessionId: normalize(locked.session.id) },
    );
  }

  const deltaMs = normalizedMode === "following"
    ? target.start.getTime() - selectedBaseline.start.getTime()
    : 0;

  const changes = affected.map(({ session, number }, index) => {
    const current = validInterval(session.startsAt, session.endsAt, sessionLabel(session));
    const startsAt = normalizedMode === "following"
      ? (index === 0 ? target.start : new Date(current.start.getTime() + deltaMs))
      : target.start;
    const endsAt = normalizedMode === "following"
      ? (index === 0 ? target.end : new Date(current.end.getTime() + deltaMs))
      : target.end;
    const plannedStatus = index === 0 ? "scheduled" : normalize(session.status || "scheduled").toLowerCase();
    return {
      session,
      sessionNumber: number,
      startsAt: startsAt.toISOString(),
      endsAt: endsAt.toISOString(),
      plannedStatus,
    };
  });

  const ignoredSessionIds = changes.map((change) => normalize(change.session.id));
  changes.forEach((change) => {
    if (!collisionEligible(change.session, change.plannedStatus)) return;
    const conflict = findRescheduleOverlap({
      sessions,
      sessionId: change.session.id,
      startsAt: change.startsAt,
      endsAt: change.endsAt,
      ignoredSessionIds,
      plannedStatus: change.plannedStatus,
    });
    if (!conflict) return;
    throw codedError(
      "live-class/time-overlap",
      `${sessionLabel(change.session)} would overlap ${sessionLabel(conflict)}. Choose a time after the other lesson ends.`,
      {
        sessionId: normalize(change.session.id),
        conflictingSessionId: normalize(conflict.id),
      },
    );
  });

  return {
    mode: normalizedMode,
    levelId,
    selectedSessionNumber: selected.number,
    deltaMs,
    recoveredFromPreviousStart: selectedBaseline.start.getTime() !== selectedCurrent.start.getTime(),
    affectedCount: changes.length,
    changes,
  };
}
