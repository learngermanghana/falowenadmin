import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { getCompatibleClassDashboard } from "../services/liveClassCompatibilityService.js";
import { listClassCohorts, rescheduleSession } from "../services/liveClassService.js";
import { buildLessonDateRepairPlan } from "../utils/liveClassLessonOrder.js";

function formatDateTime(value) {
  const parsed = new Date(value || 0);
  if (Number.isNaN(parsed.getTime())) return "Unknown date";
  return parsed.toLocaleString("en-GB", {
    timeZone: "Africa/Accra",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function mismatchLabel(item) {
  return `Lesson ${item.lessonNumber}: ${formatDateTime(item.session.startsAt)} → ${formatDateTime(item.targetStartsAt)}`;
}

export default function LiveClassLessonDateRepair() {
  const { user } = useAuth();
  const toast = useToast();
  const [classes, setClasses] = useState([]);
  const [classId, setClassId] = useState("");
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;
    listClassCohorts()
      .then((rows) => {
        if (!active) return;
        setClasses(rows);
        const remembered = window.localStorage.getItem("falowen-live-class-repair-class-id") || "";
        const nextClassId = rows.some((item) => item.id === remembered) ? remembered : rows[0]?.id || "";
        setClassId(nextClassId);
      })
      .catch((error) => {
        if (active) setMessage(error?.message || "Could not load classes for lesson repair.");
      });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;
    if (!classId) {
      setDashboard(null);
      return () => { active = false; };
    }

    window.localStorage.setItem("falowen-live-class-repair-class-id", classId);
    setLoading(true);
    setMessage("");
    getCompatibleClassDashboard(classId)
      .then((next) => {
        if (active) setDashboard(next);
      })
      .catch((error) => {
        if (active) setMessage(error?.message || "Could not load lesson dates.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => { active = false; };
  }, [classId]);

  const plan = useMemo(() => buildLessonDateRepairPlan(dashboard?.sessions || []), [dashboard?.sessions]);
  const mismatches = useMemo(() => plan.filter((item) => item.changed), [plan]);

  async function refresh() {
    if (!classId) return null;
    const next = await getCompatibleClassDashboard(classId);
    setDashboard(next);
    return next;
  }

  async function repairLessonDates() {
    if (!mismatches.length || busy) return;
    const preview = mismatches.slice(0, 6).map(mismatchLabel).join("\n");
    const extra = mismatches.length > 6 ? `\n…and ${mismatches.length - 6} more change(s).` : "";
    const confirmed = window.confirm(
      `Repair ${mismatches.length} lesson date assignment(s)?\n\n${preview}${extra}\n\nThis keeps the existing chronological class slots but assigns them to Lesson 1, Lesson 2, Lesson 3, and so on.`,
    );
    if (!confirmed) return;

    setBusy(true);
    setMessage("");
    try {
      const adminId = user?.uid || user?.email || "admin";
      const timezone = dashboard?.klass?.timezone || "Africa/Accra";
      const className = dashboard?.klass?.name || dashboard?.klass?.className || "";
      const warnings = [];

      for (const item of mismatches) {
        const result = await rescheduleSession(item.session.id, {
          startsAt: item.targetStartsAt,
          durationMinutes: item.durationMinutes,
          reason: "Lesson order corrected so the teaching topics follow the official curriculum sequence.",
          adminId,
          classId,
          className,
          timezone,
        });
        if (Array.isArray(result?.syncWarnings)) warnings.push(...result.syncWarnings);
      }

      await refresh();
      const successMessage = `${mismatches.length} lesson date assignment(s) repaired. Lessons now follow the correct curriculum order.`;
      setMessage(warnings.length ? `${successMessage} Optional sync warning: ${[...new Set(warnings)].join(", ")}.` : successMessage);
      toast.success(successMessage, { durationMs: 8000 });
    } catch (error) {
      const errorMessage = `${error?.code ? `${error.code}: ` : ""}${error?.message || "Lesson date repair failed"}`;
      setMessage(errorMessage);
      toast.error(errorMessage, { durationMs: 9000 });
    } finally {
      setBusy(false);
    }
  }

  return (
    <article className="card" style={{ display: "grid", gap: 12, marginBottom: 16, border: "2px solid #f59e0b", background: "#fffbeb" }}>
      <div>
        <h2 style={{ marginBottom: 6 }}>Lesson date repair</h2>
        <p style={{ margin: 0 }}>Use this when a later topic appears before an earlier lesson or the normal Change session button is not working.</p>
      </div>

      <label style={{ display: "grid", gap: 6 }}>
        <strong>Class to inspect</strong>
        <select value={classId} onChange={(event) => setClassId(event.target.value)} disabled={busy}>
          <option value="">Select a class</option>
          {classes.map((klass) => (
            <option key={klass.id} value={klass.id}>{klass.name || klass.className || klass.id}</option>
          ))}
        </select>
      </label>

      {loading ? <p>Checking lesson order…</p> : null}
      {!loading && dashboard ? (
        <div style={{ display: "grid", gap: 10 }}>
          <p style={{ margin: 0 }}>
            Class: <strong>{dashboard.klass?.name || dashboard.klass?.className || classId}</strong> · Sessions checked: <strong>{plan.length}</strong> · Wrong date assignments: <strong>{mismatches.length}</strong>
          </p>

          {mismatches.length ? (
            <div style={{ display: "grid", gap: 6, padding: 12, borderRadius: 10, background: "#fff", border: "1px solid #fcd34d" }}>
              {mismatches.slice(0, 8).map((item) => (
                <div key={item.session.id}>{mismatchLabel(item)}</div>
              ))}
              {mismatches.length > 8 ? <small>Plus {mismatches.length - 8} more change(s).</small> : null}
            </div>
          ) : (
            <div style={{ padding: 12, borderRadius: 10, background: "#ecfdf5", border: "1px solid #a7f3d0" }}>
              Lesson dates already follow the curriculum order.
            </div>
          )}

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button type="button" onClick={repairLessonDates} disabled={busy || !mismatches.length}>
              {busy ? "Repairing lesson dates…" : `Repair ${mismatches.length || ""} lesson date${mismatches.length === 1 ? "" : "s"}`}
            </button>
            <button type="button" onClick={refresh} disabled={busy}>Check again</button>
          </div>
        </div>
      ) : null}

      {message ? <div style={{ padding: 10, borderRadius: 8, background: "#fff", border: "1px solid #fcd34d" }}>{message}</div> : null}
    </article>
  );
}
