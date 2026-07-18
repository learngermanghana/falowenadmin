import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { getCompatibleClassDashboard } from "../services/liveClassCompatibilityService.js";
import { repairClassToOfficialLessonSchedule } from "../services/liveClassLessonDateRepairService.js";
import {
  listClassCohorts,
  recoverLegacyRescheduleCollision,
} from "../services/liveClassService.js";
import { buildOfficialLessonSchedulePlan } from "../utils/liveClassLessonOrder.js";
import { partitionRepairPlanItems } from "../utils/liveClassRepairManualOverrides.js";

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

function formatDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value || ""))) return value || "Not set";
  return new Date(`${value}T12:00:00.000Z`).toLocaleDateString("en-GB", {
    timeZone: "Africa/Accra",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
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
  const recoveryStarted = useRef(false);

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
        if (active) setMessage(error?.message || "Could not load classes for timetable repair.");
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
        if (active) setMessage(error?.message || "Could not load the class timetable.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => { active = false; };
  }, [classId]);

  useEffect(() => {
    if (!classes.length || recoveryStarted.current) return undefined;
    recoveryStarted.current = true;
    let active = true;

    (async () => {
      const repaired = [];
      for (const klass of classes) {
        try {
          const result = await recoverLegacyRescheduleCollision(klass.id, {
            adminId: user?.uid || user?.email || "schedule-recovery",
          });
          if (result.repaired) repaired.push(result);
        } catch (error) {
          console.warn(`Could not inspect legacy reschedule for ${klass.id}`, error);
        }
      }

      if (!active || !repaired.length) return;
      const moved = repaired.reduce((total, result) => total + Number(result.movedSessions || 0), 0);
      const successMessage = `${repaired.length} legacy reschedule collision(s) repaired. ${moved} session(s) were shifted to restore curriculum order.`;
      setMessage(successMessage);
      toast.success(successMessage, { durationMs: 10000 });

      if (classId) {
        const next = await getCompatibleClassDashboard(classId).catch(() => null);
        if (active && next) setDashboard(next);
      }
    })();

    return () => { active = false; };
  }, [classes, classId, toast, user?.email, user?.uid]);

  const preview = useMemo(() => {
    if (!dashboard || !classId) return { plan: null, error: "" };
    try {
      return {
        plan: buildOfficialLessonSchedulePlan({
          classId,
          klass: dashboard.klass,
          sessions: dashboard.sessions,
          excludedDates: dashboard.klass?.holidayDatesExcluded || [],
        }),
        error: "",
      };
    } catch (error) {
      return { plan: null, error: error?.message || "Could not prepare the official class timetable." };
    }
  }, [classId, dashboard]);

  const plan = preview.plan;
  const repairItems = useMemo(() => partitionRepairPlanItems(plan?.items || []), [plan]);
  const changedItems = repairItems.automaticItems;
  const preservedItems = repairItems.preservedItems;
  const repairBlockedByManualMoves = preservedItems.length > 0;
  const needsRepair = Boolean(
    plan && !repairBlockedByManualMoves && (
      changedItems.length
      || plan.currentSessions < plan.expectedLessons
      || String(dashboard?.klass?.endDate || "") !== plan.endDate
    )
  );

  async function refresh() {
    if (!classId) return null;
    const next = await getCompatibleClassDashboard(classId);
    setDashboard(next);
    return next;
  }

  async function repairOfficialTimetable() {
    if (!plan || !needsRepair || busy || repairBlockedByManualMoves) return;
    const finalItem = plan.items.at(-1);
    const confirmed = window.confirm(
      `Repair this ${plan.levelId} class to the official ${plan.expectedLessons} ${plan.countLabel}?\n\n`
      + `Start date: ${dashboard.klass?.startDate || "Not set"}\n`
      + `Corrected end date: ${plan.endDate}\n`
      + `Missing ${plan.countLabel} to create: ${plan.missingLessons}\n`
      + `Final ${plan.itemLabel.toLowerCase()} target: ${finalItem ? formatDateTime(finalItem.targetStartsAt) : "Not available"}\n\n`
      + "All dates and curriculum identities are written in one atomic update, so topics cannot rotate between sessions.",
    );
    if (!confirmed) return;

    setBusy(true);
    setMessage("");
    try {
      const result = await repairClassToOfficialLessonSchedule({
        classId,
        klass: dashboard.klass,
        sessions: dashboard.sessions,
        adminId: user?.uid || user?.email || "admin",
      });
      await refresh();
      const successMessage = `${result.levelId} timetable repaired: ${result.expectedLessons} ${result.countLabel}, ${result.created} missing session(s) created, ${result.moved} date(s) corrected, end date ${formatDate(result.endDate)}.`;
      setMessage(successMessage);
      toast.success(successMessage, { durationMs: 10000 });
    } catch (error) {
      const errorMessage = `${error?.code ? `${error.code}: ` : ""}${error?.message || "Official timetable repair failed"}`;
      setMessage(errorMessage);
      toast.error(errorMessage, { durationMs: 10000 });
    } finally {
      setBusy(false);
    }
  }

  return (
    <article className="card" style={{ display: "grid", gap: 12, marginBottom: 16, border: "2px solid #f59e0b", background: "#fffbeb" }}>
      <div>
        <h2 style={{ marginBottom: 6 }}>Official class timetable repair</h2>
        <p style={{ margin: 0 }}>Supports A1, A2 and B1. A1 uses 25 grouped attendance sessions; A2 and B1 use 28 lessons. The repair is atomic and does not move topics one-by-one.</p>
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

      {loading ? <p>Checking the official class timetable…</p> : null}
      {!loading && dashboard && plan ? (
        <div style={{ display: "grid", gap: 10 }}>
          <div style={{ display: "grid", gap: 5, padding: 12, borderRadius: 10, background: "#fff", border: "1px solid #fcd34d" }}>
            <div>Class: <strong>{dashboard.klass?.name || dashboard.klass?.className || classId}</strong></div>
            <div>Level: <strong>{plan.levelId}</strong></div>
            <div>Official requirement: <strong>{plan.expectedLessons} {plan.countLabel}</strong></div>
            <div>Start date: <strong>{formatDate(dashboard.klass?.startDate)}</strong></div>
            <div>Current end date: <strong>{formatDate(dashboard.klass?.endDate)}</strong></div>
            <div>Calculated official end date: <strong>{formatDate(plan.endDate)}</strong></div>
            <div>Visible sessions: <strong>{plan.currentSessions}</strong> of <strong>{plan.expectedLessons}</strong></div>
            <div>Missing sessions: <strong>{plan.missingLessons}</strong> · Automatic date corrections: <strong>{changedItems.length}</strong> · Preserved manual moves: <strong>{preservedItems.length}</strong></div>
          </div>

          {preservedItems.length ? (
            <div style={{ display: "grid", gap: 6, padding: 12, borderRadius: 10, background: "#ecfdf5", border: "1px solid #86efac", color: "#166534" }}>
              <strong>{preservedItems.length} deliberately moved session(s) will be preserved.</strong>
              <div>Official repair is disabled for this class so it cannot move those sessions back to the original weekday pattern. Continue managing these dates through Change session.</div>
              {preservedItems.slice(0, 10).map((item) => (
                <div key={item.lessonNumber}>{item.group.topic}: <strong>{formatDateTime(item.session?.startsAt)}</strong></div>
              ))}
              {preservedItems.length > 10 ? <small>Plus {preservedItems.length - 10} more preserved move(s).</small> : null}
            </div>
          ) : null}

          {changedItems.length ? (
            <div style={{ display: "grid", gap: 6, padding: 12, borderRadius: 10, background: "#fff", border: "1px solid #fcd34d" }}>
              {changedItems.slice(0, 10).map((item) => (
                <div key={item.lessonNumber}>
                  {item.group.topic}: {item.session ? formatDateTime(item.session.startsAt) : "Missing"} → <strong>{formatDateTime(item.targetStartsAt)}</strong>
                </div>
              ))}
              {changedItems.length > 10 ? <small>Plus {changedItems.length - 10} more correction(s).</small> : null}
            </div>
          ) : null}

          {!needsRepair && !repairBlockedByManualMoves ? (
            <div style={{ padding: 12, borderRadius: 10, background: "#ecfdf5", border: "1px solid #a7f3d0" }}>
              This class already has the complete official timetable.
            </div>
          ) : null}

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button type="button" onClick={repairOfficialTimetable} disabled={busy || !needsRepair || repairBlockedByManualMoves}>
              {busy ? "Repairing all sessions atomically…" : repairBlockedByManualMoves ? "Manual moves preserved" : `Repair to ${plan.expectedLessons} ${plan.countLabel}`}
            </button>
            <button type="button" onClick={refresh} disabled={busy}>Check again</button>
          </div>
        </div>
      ) : null}

      {!loading && preview.error ? <div style={{ padding: 10, borderRadius: 8, background: "#fff", border: "1px solid #fca5a5", color: "#991b1b" }}>{preview.error}</div> : null}
      {message ? <div style={{ padding: 10, borderRadius: 8, background: "#fff", border: "1px solid #fcd34d" }}>{message}</div> : null}
    </article>
  );
}
