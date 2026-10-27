import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { getCompatibleClassDashboard } from "../services/liveClassCompatibilityService.js";
import { listClassCohorts } from "../services/liveClassService.js";
import {
  buildClassScheduleHealth,
  validateAndSaveClassScheduleHealth,
} from "../services/liveClassScheduleHealthService.js";
import ScheduleHealthPanel from "./ScheduleHealthPanel.jsx";

export default function ScheduleHealthDashboard() {
  const { user } = useAuth();
  const toast = useToast();
  const [classes, setClasses] = useState([]);
  const [classId, setClassId] = useState("");
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function refresh(nextClassId = classId) {
    if (!nextClassId) {
      setDashboard(null);
      return null;
    }
    setLoading(true);
    try {
      const next = await getCompatibleClassDashboard(nextClassId);
      setDashboard(next);
      return next;
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let active = true;
    listClassCohorts()
      .then((rows) => {
        if (!active) return;
        setClasses(rows);
        const remembered = window.localStorage.getItem("falowen-schedule-health-class-id") || "";
        const nextClassId = rows.some((item) => item.id === remembered) ? remembered : rows[0]?.id || "";
        setClassId(nextClassId);
      })
      .catch((error) => {
        if (active) setMessage(error?.message || "Could not load classes for schedule health.");
      });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;
    if (!classId) {
      setDashboard(null);
      return () => { active = false; };
    }
    window.localStorage.setItem("falowen-schedule-health-class-id", classId);
    setLoading(true);
    getCompatibleClassDashboard(classId)
      .then((next) => {
        if (active) setDashboard(next);
      })
      .catch((error) => {
        if (active) setMessage(error?.message || "Could not inspect this timetable.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [classId]);

  const health = useMemo(() => {
    if (!dashboard) return null;
    return buildClassScheduleHealth({
      klass: dashboard.klass,
      sessions: dashboard.sessions,
    });
  }, [dashboard]);

  async function validateHealth() {
    if (!dashboard || !classId || busy) return;
    setBusy(true);
    setMessage("");
    try {
      const saved = await validateAndSaveClassScheduleHealth({
        classId,
        klass: dashboard.klass,
        sessions: dashboard.sessions,
        adminId: user?.uid || user?.email || "admin",
      });
      await refresh(classId);
      const successMessage = saved.status === "broken"
        ? `Schedule health saved as Broken. ${saved.blockingIssues.length} blocking issue(s) found and future reminders were paused.`
        : saved.status === "warning"
          ? `Schedule health saved as Warning. ${saved.advisoryIssues.length} warning(s) found; reminders remain active.`
          : "Schedule health saved as Healthy. Future reminders remain active.";
      setMessage(successMessage);
      toast.success(successMessage, { durationMs: 8000 });
    } catch (error) {
      const errorMessage = error?.message || "Schedule health validation failed.";
      setMessage(errorMessage);
      toast.error(errorMessage, { durationMs: 7000 });
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="page-container" style={{ paddingBottom: 0 }}>
      <article className="card" style={{ display: "grid", gap: 12, border: "2px solid #94a3b8" }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "end" }}>
          <div>
            <h1 style={{ marginBottom: 5 }}>Schedule Health</h1>
            <p style={{ margin: 0 }}>Check every class for missing lessons, duplicate or overlapping times, curriculum-order problems and incorrect class end dates.</p>
          </div>
          <label style={{ display: "grid", gap: 5, minWidth: 260 }}>
            <strong>Class to inspect</strong>
            <select value={classId} onChange={(event) => { setClassId(event.target.value); setMessage(""); }} disabled={busy}>
              <option value="">Select a class</option>
              {classes.map((klass) => (
                <option key={klass.id} value={klass.id}>{klass.name || klass.className || klass.id}</option>
              ))}
            </select>
          </label>
        </div>

        {message ? <div style={{ padding: 10, borderRadius: 8, background: "#eff6ff", border: "1px solid #bfdbfe" }}>{message}</div> : null}
        {loading ? <p>Inspecting the selected timetable…</p> : null}
        {!loading && dashboard && health ? (
          <ScheduleHealthPanel
            health={health}
            klass={dashboard.klass}
            busy={busy}
            onValidate={validateHealth}
          />
        ) : null}
      </article>
    </section>
  );
}
