import { useMemo, useState } from "react";

function text(value) {
  return String(value ?? "").trim();
}

function uniqueStudentEmails(rows = []) {
  return [...new Set(
    rows
      .map((row) => text(row?.email).toLowerCase())
      .filter((email) => email && email.includes("@")),
  )];
}

function formatClassDate(value) {
  const clean = text(value);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(clean)) return clean || "Date to be confirmed";
  const parsed = new Date(`${clean}T12:00:00.000Z`);
  if (Number.isNaN(parsed.getTime())) return clean;
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Africa/Accra",
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(parsed);
}

function buildMailto(emails, subject, body) {
  if (!emails.length) return "";
  return `mailto:?bcc=${encodeURIComponent(emails.join(","))}&subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

async function copyText(value) {
  const content = text(value);
  if (!content) return false;

  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(content);
    return true;
  }

  const textarea = document.createElement("textarea");
  textarea.value = content;
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  const copied = document.execCommand("copy");
  document.body.removeChild(textarea);
  return copied;
}

export default function AttendanceBccEmailPanel({
  rows = [],
  klass = {},
  session = {},
  selectedDate = "",
  startTime = "",
  endTime = "",
  sessionLabel = "",
}) {
  const [notice, setNotice] = useState("");

  const emails = useMemo(() => uniqueStudentEmails(rows), [rows]);
  const className = text(klass?.name || klass?.className || "German class");
  const topic = text(sessionLabel || session?.topic || "Lesson details to be confirmed");
  const dateLabel = formatClassDate(selectedDate || session?.startsAt);
  const timeLabel = [text(startTime), text(endTime)].filter(Boolean).join("–") || "Time to be confirmed";
  const cancellationReason = text(session?.cancellationReason);

  const startingSoonSubject = `Class starting soon: ${className}`;
  const startingSoonBody = [
    "Hello students,",
    "",
    "This is a reminder that your class is starting soon.",
    "",
    `Class: ${className}`,
    `Date: ${dateLabel}`,
    `Time: ${timeLabel}`,
    `Topic: ${topic}`,
    "",
    "Please join using your usual class link and be ready a few minutes before the lesson begins.",
    "",
    "Regards,",
    "Learn Language Education Academy / Falowen",
  ].join("\n");

  const cancelledSubject = `Class cancelled: ${className} — ${dateLabel}`;
  const cancelledBody = [
    "Hello students,",
    "",
    "We are sorry to inform you that the class below has been cancelled.",
    "",
    `Class: ${className}`,
    `Date: ${dateLabel}`,
    `Time: ${timeLabel}`,
    `Topic: ${topic}`,
    cancellationReason ? `Reason: ${cancellationReason}` : "Reason: An important update affected today's lesson.",
    "",
    "Please do not use the attendance or check-in link for this session. Information about a replacement lesson or the next class will be shared separately.",
    "",
    "We apologise for the inconvenience.",
    "",
    "Regards,",
    "Learn Language Education Academy / Falowen",
  ].join("\n");

  const startingSoonMailto = buildMailto(emails, startingSoonSubject, startingSoonBody);
  const cancelledMailto = buildMailto(emails, cancelledSubject, cancelledBody);

  async function handleCopy(value, successMessage) {
    try {
      const copied = await copyText(value);
      setNotice(copied ? successMessage : "Could not copy. Please select the text manually.");
    } catch {
      setNotice("Could not copy. Please select the text manually.");
    }
    window.setTimeout(() => setNotice(""), 2500);
  }

  return (
    <article className="card" style={{ display: "grid", gap: 12 }}>
      <div>
        <strong>BCC class email backup</strong>
        <p style={{ margin: "6px 0 0", color: "#475569" }}>
          Use this when the Communication service reaches its daily limit. Student addresses are placed in BCC so recipients cannot see one another's email addresses.
        </p>
      </div>

      <div style={{ padding: 10, borderRadius: 8, border: "1px solid #bfdbfe", background: "#eff6ff" }}>
        BCC recipients available: <strong>{emails.length}</strong> of <strong>{rows.length}</strong> student(s).
      </div>

      {!emails.length ? (
        <div role="alert" style={{ padding: 10, borderRadius: 8, border: "1px solid #fde68a", background: "#fffbeb", color: "#92400e" }}>
          No student email addresses are available for this class roster.
        </div>
      ) : null}

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {startingSoonMailto ? (
          <a href={startingSoonMailto} role="button">Open “class starting soon” BCC draft</a>
        ) : (
          <button type="button" disabled>Open “class starting soon” BCC draft</button>
        )}
        {cancelledMailto ? (
          <a href={cancelledMailto} role="button">Open “class cancelled” BCC draft</a>
        ) : (
          <button type="button" disabled>Open “class cancelled” BCC draft</button>
        )}
        <button type="button" disabled={!emails.length} onClick={() => handleCopy(emails.join(", "), "BCC email list copied.")}>Copy BCC email list</button>
        <button type="button" onClick={() => handleCopy(startingSoonBody, "Starting-soon message copied.")}>Copy starting-soon message</button>
        <button type="button" onClick={() => handleCopy(cancelledBody, "Cancellation message copied.")}>Copy cancellation message</button>
      </div>

      {notice ? (
        <div role="status" style={{ width: "fit-content", padding: "8px 10px", borderRadius: 8, background: "#ecfdf5", color: "#166534" }}>
          {notice}
        </div>
      ) : null}

      <small style={{ color: "#64748b" }}>
        Review the subject, date, time, cancellation reason and recipient list in your email client before sending.
      </small>
    </article>
  );
}
