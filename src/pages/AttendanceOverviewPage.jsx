import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  listClassCompletionStatuses,
  listClasses,
  setClassCompletedStatus,
} from "../services/classesService";
import { getClassSchedule } from "../data/classSchedules";

const MONTH_INDEX = {
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

function parseClassDate(value) {
  const text = String(value || "").trim();
  if (!text) return null;

  const isoMatch = text.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) {
    const [, year, month, day] = isoMatch;
    const date = new Date(Number(year), Number(month) - 1, Number(day));
    return Number.isNaN(date.getTime()) ? null : date;
  }

  const longMatch = text.match(/^(?:\w+),\s+(\d{1,2})\s+(\w+)\s+(\d{4})$/);
  if (!longMatch) return null;

  const [, day, monthName, year] = longMatch;
  const monthIndex = MONTH_INDEX[monthName.toLowerCase()];
  if (typeof monthIndex !== "number") return null;

  const date = new Date(Number(year), monthIndex, Number(day));
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatDate(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function resolveScheduleMeta(klass) {
  const schedule = getClassSchedule(klass?.classId || klass?.name || "");
  const parsedDates = schedule
    .map((item) => parseClassDate(item?.date))
    .filter(Boolean)
    .sort((a, b) => a.getTime() - b.getTime());

  if (!parsedDates.length) {
    return {
      schedule,
      startDate: null,
      endDate: null,
    };
  }

  return {
    schedule,
    startDate: parsedDates[0],
    endDate: parsedDates[parsedDates.length - 1],
  };
}

function classifyClass(klass, completionStatusMap) {
  const scheduleMeta = resolveScheduleMeta(klass);
  const completionStatus = completionStatusMap[klass.classId] || {};
  const completed = Boolean(completionStatus.completed);

  return {
    ...klass,
    completed,
    completionStatus,
    scheduleMeta,
  };
}

function ClassCard({ klass, completed = false, busy = false, onToggleCompleted }) {
  const { startDate, endDate, schedule } = klass.scheduleMeta || {};
  const dateText = startDate && endDate ? `${formatDate(startDate)} → ${formatDate(endDate)}` : "No schedule dates";

  return (
    <div
      key={klass.classId}
      style={{
        border: "1px solid #ddd",
        borderRadius: 8,
        padding: 12,
        background: completed ? "#f8fafc" : "#fff",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
        <div style={{ fontWeight: 700 }}>{klass.name}</div>
        <span
          style={{
            border: "1px solid #d1d5db",
            borderRadius: 999,
            padding: "2px 8px",
            fontSize: 12,
            background: completed ? "#e5e7eb" : "#dcfce7",
            color: completed ? "#374151" : "#166534",
            fontWeight: 700,
          }}
        >
          {completed ? "Completed" : "Ongoing"}
        </span>
      </div>
      <div style={{ fontSize: 12, opacity: 0.75 }}>classId: {klass.classId}</div>
      <div style={{ fontSize: 12, opacity: 0.75 }}>Schedule: {dateText}</div>
      {schedule?.length ? <div style={{ fontSize: 12, opacity: 0.75 }}>Sessions: {schedule.length}</div> : null}
      <div style={{ marginTop: 10, display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
        <Link to={`/attendance/${encodeURIComponent(klass.classId)}`}>
          {completed ? "View attendance" : "Mark attendance"}
        </Link>
        <button
          type="button"
          disabled={busy}
          onClick={() => onToggleCompleted(klass.classId, !completed)}
          style={{
            border: "1px solid #cbd5e1",
            borderRadius: 8,
            padding: "6px 10px",
            background: completed ? "#fff" : "#f8fafc",
            fontWeight: 700,
          }}
        >
          {busy ? "Saving..." : completed ? "Move back to ongoing" : "Mark completed"}
        </button>
      </div>
    </div>
  );
}

export default function AttendanceOverviewPage() {
  const [classes, setClasses] = useState([]);
  const [completionStatusMap, setCompletionStatusMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [savingClassId, setSavingClassId] = useState("");
  const [error, setError] = useState("");
  const [showCompleted, setShowCompleted] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError("");
      try {
        const [classData, completionData] = await Promise.all([
          listClasses(),
          listClassCompletionStatuses(),
        ]);
        setClasses(classData);
        setCompletionStatusMap(completionData);
      } catch (err) {
        setError(err?.message || "Failed to load classes");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const classifiedClasses = useMemo(
    () => classes.map((klass) => classifyClass(klass, completionStatusMap)),
    [classes, completionStatusMap],
  );
  const activeClasses = useMemo(
    () => classifiedClasses.filter((klass) => !klass.completed),
    [classifiedClasses],
  );
  const completedClasses = useMemo(
    () => classifiedClasses.filter((klass) => klass.completed),
    [classifiedClasses],
  );

  const onToggleCompleted = async (classId, completed) => {
    setSavingClassId(classId);
    setError("");

    try {
      await setClassCompletedStatus(classId, completed);
      setCompletionStatusMap((current) => ({
        ...current,
        [classId]: {
          ...(current[classId] || {}),
          completed,
        },
      }));
    } catch (err) {
      setError(err?.message || "Failed to update class completion status");
    } finally {
      setSavingClassId("");
    }
  };

  return (
    <div style={{ padding: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <div>
          <h2 style={{ margin: 0 }}>Attendance</h2>
          <p style={{ margin: "6px 0 0", fontSize: 13, opacity: 0.8 }}>
            Classes stay ongoing until you manually mark them completed. This protects classes with cancelled or postponed sessions.
          </p>
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <Link to="/">View dashboard</Link>
          <Link to="/marking">Open marking console</Link>
        </div>
      </div>

      {loading && <p>Loading classes...</p>}
      {error && <p style={{ color: "#a00000" }}>❌ {error}</p>}

      {!loading && !error && activeClasses.length === 0 && (
        <p>No ongoing classes found. Use completed classes below to move one back to ongoing if needed.</p>
      )}

      <div style={{ display: "grid", gap: 10, maxWidth: 620, marginTop: 14 }}>
        {activeClasses.map((klass) => (
          <ClassCard
            key={klass.classId}
            klass={klass}
            busy={savingClassId === klass.classId}
            onToggleCompleted={onToggleCompleted}
          />
        ))}
      </div>

      {!loading && !error && completedClasses.length > 0 && (
        <section style={{ marginTop: 22, maxWidth: 620 }}>
          <button
            type="button"
            onClick={() => setShowCompleted((value) => !value)}
            style={{
              border: "1px solid #cbd5e1",
              borderRadius: 8,
              padding: "8px 12px",
              background: "#f8fafc",
              fontWeight: 700,
            }}
          >
            {showCompleted ? "Hide" : "Show"} completed classes ({completedClasses.length})
          </button>

          {showCompleted && (
            <div style={{ display: "grid", gap: 10, marginTop: 10 }}>
              {completedClasses.map((klass) => (
                <ClassCard
                  key={klass.classId}
                  klass={klass}
                  completed
                  busy={savingClassId === klass.classId}
                  onToggleCompleted={onToggleCompleted}
                />
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
