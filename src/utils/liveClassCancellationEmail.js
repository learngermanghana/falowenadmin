const BLOCKED_STATUSES = new Set(["inactive", "suspended", "blocked", "deleted", "archived"]);

function normalize(value) {
  return String(value || "").trim();
}

function normalizeEmail(value) {
  return normalize(value).toLowerCase();
}

export function isEligibleCancellationRecipient(student = {}) {
  const email = normalizeEmail(student.email || student.contactEmail);
  if (!email) return false;

  const role = normalize(student.role).toLowerCase();
  if (role && role !== "student") return false;

  const status = normalize(student.status).toLowerCase();
  return !BLOCKED_STATUSES.has(status);
}

export function getCancellationRecipients(students = []) {
  const recipientsByEmail = new Map();

  students.forEach((student) => {
    if (!isEligibleCancellationRecipient(student)) return;
    const email = normalizeEmail(student.email || student.contactEmail);
    if (!recipientsByEmail.has(email)) {
      recipientsByEmail.set(email, {
        ...student,
        email,
        name: normalize(student.name || student.fullName),
      });
    }
  });

  return [...recipientsByEmail.values()];
}

export function findNextScheduledSession(sessions = [], cancelledSession = {}) {
  const cancelledStart = new Date(cancelledSession.startsAt || 0).getTime();

  return sessions
    .filter((session) => session.id !== cancelledSession.id)
    .filter((session) => !["cancelled", "completed"].includes(String(session.status || "").toLowerCase()))
    .filter((session) => {
      const startsAt = new Date(session.startsAt || 0).getTime();
      return Number.isFinite(startsAt) && startsAt > cancelledStart;
    })
    .sort((left, right) => new Date(left.startsAt) - new Date(right.startsAt))[0] || null;
}

export function formatAccraDateTime(value) {
  if (!value) return "the scheduled time";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return String(value);

  return parsed.toLocaleString("en-GB", {
    timeZone: "Africa/Accra",
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export function buildCancellationAnnouncement({ klass = {}, session = {}, reason = "", nextSession = null } = {}) {
  const className = normalize(klass.name || session.className || "Falowen class");
  const scheduledDateTime = formatAccraDateTime(session.startsAt);
  const cancellationReason = normalize(reason) || "The class cannot take place as scheduled.";
  const nextClassMessage = nextSession?.startsAt
    ? `The next scheduled class is ${formatAccraDateTime(nextSession.startsAt)}.`
    : "Replacement or next-class details will be shared when available.";
  const classUrl = normalize(klass.classUrl || (klass.slug ? `/classes/${klass.slug}` : ""));
  const date = String(session.startsAt || "").slice(0, 10) || new Date().toISOString().slice(0, 10);
  const subject = `Class Cancelled: ${className} – ${scheduledDateTime}`;
  const announcement = [
    `Hello everyone, the ${className} live class scheduled for ${scheduledDateTime} has been cancelled.`,
    `Reason: ${cancellationReason}`,
    nextClassMessage,
    classUrl ? `Class page: ${classUrl}` : "",
    "Please check Falowen for further updates.",
  ].filter(Boolean).join("\n\n");

  return {
    announcement,
    className,
    date,
    link: classUrl,
    topic: subject,
    subject,
    scheduledDateTime,
  };
}
