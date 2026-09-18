import { useCallback, useEffect, useMemo, useState } from "react";
import {
  generateCompletionPackPdf,
  loadCompletionDeliveryStatus,
  loadCompletionPackReport,
  releaseCompletionPackPdf,
  resendCompletionPack,
} from "../services/completionPackService.js";

function value(...items) {
  return items.map((item) => String(item ?? "").trim()).find(Boolean) || "";
}

function dateLabel(raw) {
  if (!raw) return "—";
  if (typeof raw?.toDate === "function") return raw.toDate().toLocaleString("en-GB");
  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime())
    ? String(raw)
    : parsed.toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" });
}

function statusLabel(row) {
  if (!row) return "Not sent from this panel yet";
  const status = value(row.deliveryStatus, row.status);
  if (status) return status.replace(/_/g, " ");
  return row.email ? "Accepted" : "Unknown";
}

function Metric({ label, children }) {
  return (
    <div style={{ border: "1px solid #dbe3ef", borderRadius: 12, padding: "10px 12px", background: "#fff" }}>
      <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: ".06em", color: "#64748b", fontWeight: 800 }}>
        {label}
      </div>
      <div style={{ marginTop: 4, fontSize: 18, fontWeight: 800, color: "#0f172a" }}>{children}</div>
    </div>
  );
}

export default function CompletionPackPanel({ student, draft = {}, pushToast }) {
  const [report, setReport] = useState(null);
  const [delivery, setDelivery] = useState(null);
  const [loading, setLoading] = useState(false);
  const [busyAction, setBusyAction] = useState("");
  const [error, setError] = useState("");

  const notify = useCallback((type, message) => {
    if (typeof pushToast === "function") pushToast({ type, message });
  }, [pushToast]);

  const draftKey = [
    draft.email,
    draft.name,
    draft.studentCode,
    draft.level,
    draft.className,
    student?.email,
    student?.studentCode,
    student?.level,
    student?.className,
  ].map((item) => String(item ?? "").trim()).join("|");

  const refresh = useCallback(async ({ quiet = false } = {}) => {
    if (!student?.id) return;
    if (!quiet) setLoading(true);
    setError("");
    try {
      const [nextReport, nextDelivery] = await Promise.all([
        loadCompletionPackReport(student, draft),
        loadCompletionDeliveryStatus(student, draft),
      ]);
      setReport(nextReport);
      setDelivery(nextDelivery);
    } catch (err) {
      setError(err?.message || "Could not load completion pack.");
    } finally {
      if (!quiet) setLoading(false);
    }
  // getDraft() may return a new object on each parent render, so depend on
  // the student's id and primitive draft values rather than object identity.
  }, [student?.id, draftKey]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const runAction = async (key, handler) => {
    setBusyAction(key);
    try {
      await handler();
    } catch (err) {
      notify("error", err?.message || "Completion pack action failed.");
    } finally {
      setBusyAction("");
    }
  };

  const previewPdf = () => runAction("preview", async () => {
    const popup = window.open("about:blank", "_blank");
    if (popup) popup.opener = null;
    const result = await generateCompletionPackPdf(student, draft, { download: false });
    if (popup) {
      popup.location.replace(result.url);
    } else {
      window.open(result.url, "_blank", "noopener,noreferrer");
    }
    window.setTimeout(() => releaseCompletionPackPdf(result), 60_000);
  });

  const regeneratePdf = () => runAction("regenerate", async () => {
    const result = await generateCompletionPackPdf(student, draft, { download: true });
    const anchor = document.createElement("a");
    anchor.href = result.url;
    anchor.download = result.filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => releaseCompletionPackPdf(result), 10_000);
    notify("success", "Fresh Attendance & Class Participation PDF generated.");
    await refresh({ quiet: true });
  });

  const resend = () => runAction("resend", async () => {
    const email = value(draft.email, student?.email);
    const name = value(draft.name, student?.name, email, "this student");
    const confirmed = window.confirm(
      `Resend the full completion pack to ${email || "this student's email"}? This rebuilds the certificate, score transcript, and Attendance & Class Participation record for ${name}.`,
    );
    if (!confirmed) return;
    await resendCompletionPack(student, draft);
    notify("success", `Completion pack accepted for delivery to ${email}.`);
    await refresh({ quiet: true });
  });

  const attendance = report?.attendance || {};
  const participation = report?.participation || {};
  const participationLabel = participation.dataAvailable === false || !participation.trackedLessons
    ? "Not sufficiently recorded"
    : `${participation.participationRate || 0}%`;
  const courseDates = useMemo(() => {
    if (!report?.course) return "—";
    const start = report.course.startDate ? dateLabel(report.course.startDate).split(",")[0] : "";
    const end = report.course.endDate ? dateLabel(report.course.endDate).split(",")[0] : "";
    return [start, end].filter(Boolean).join(" – ") || "—";
  }, [report]);

  return (
    <section
      style={{
        marginTop: 18,
        border: "1px solid #d6c18a",
        borderRadius: 14,
        padding: 14,
        background: "linear-gradient(135deg, #fffdf7, #ffffff)",
        display: "grid",
        gap: 12,
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div>
          <h3 style={{ margin: "0 0 4px", color: "#0f172a" }}>Completion Pack</h3>
          <p style={{ margin: 0, color: "#64748b", maxWidth: 760 }}>
            Preview or regenerate the Attendance & Class Participation record, resend the complete certificate package, and check the latest completion delivery status.
          </p>
        </div>
        <button type="button" onClick={() => refresh()} disabled={loading || Boolean(busyAction)}>
          {loading ? "Refreshing..." : "Refresh status"}
        </button>
      </div>

      {error && (
        <div style={{ border: "1px solid #fecaca", background: "#fef2f2", color: "#991b1b", borderRadius: 10, padding: 10 }}>
          {error}
        </div>
      )}

      {report && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 8 }}>
            <Metric label="Attendance">{attendance.attendanceRate ?? 0}%</Metric>
            <Metric label="Attended">{attendance.attended ?? 0}/{attendance.scheduled ?? 0}</Metric>
            <Metric label="Participation">{participationLabel}</Metric>
            <Metric label="Document ID">{report.documentId || "—"}</Metric>
          </div>

          <div style={{ border: "1px solid #e2e8f0", borderRadius: 12, padding: 12, background: "#fff", display: "grid", gap: 6 }}>
            <strong>{report.student?.name || value(student?.name, "Student")}</strong>
            <span style={{ color: "#475569", fontSize: 13 }}>
              {report.course?.level || value(draft.level, student?.level, "—")} · {report.course?.className || value(draft.className, student?.className, "—")}
            </span>
            <span style={{ color: "#64748b", fontSize: 13 }}>Course dates: {courseDates}</span>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 4 }}>
              <span style={{ padding: "5px 8px", borderRadius: 999, background: "#eff6ff", color: "#1d4ed8", fontSize: 12, fontWeight: 700 }}>
                Certificate · rebuilt on resend
              </span>
              <span style={{ padding: "5px 8px", borderRadius: 999, background: "#f1f5f9", color: "#334155", fontSize: 12, fontWeight: 700 }}>
                Score Transcript · rebuilt on resend
              </span>
              <span style={{ padding: "5px 8px", borderRadius: 999, background: "#fef9c3", color: "#854d0e", fontSize: 12, fontWeight: 700 }}>
                Attendance & Participation · ready
              </span>
            </div>
          </div>
        </>
      )}

      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        <button type="button" onClick={previewPdf} disabled={!report || Boolean(busyAction)}>
          {busyAction === "preview" ? "Opening..." : "Preview attendance record"}
        </button>
        <button type="button" onClick={regeneratePdf} disabled={!report || Boolean(busyAction)}>
          {busyAction === "regenerate" ? "Generating..." : "Regenerate PDF"}
        </button>
        <button type="button" onClick={resend} disabled={!report || Boolean(busyAction)}>
          {busyAction === "resend" ? "Sending..." : "Resend full completion pack"}
        </button>
      </div>

      <div style={{ borderTop: "1px solid #e2e8f0", paddingTop: 10, color: "#475569", fontSize: 13 }}>
        <strong style={{ color: "#0f172a" }}>Latest delivery:</strong>{" "}
        {delivery ? (
          <>
            <span style={{ textTransform: "capitalize" }}>{statusLabel(delivery)}</span>
            {" · "}
            {dateLabel(delivery.createdAt)}
            {delivery.email ? ` · ${delivery.email}` : ""}
          </>
        ) : (
          "No completion delivery found in communication history."
        )}
      </div>
    </section>
  );
}
