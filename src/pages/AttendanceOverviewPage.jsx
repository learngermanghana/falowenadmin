import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { listClasses, setClassArchived } from "../services/classesService";
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

  const startDate = parsedDates[0];
  const endDate = parsedDates[parsedDates.length - 1];

  return {
    schedule,
    startDate,
    endDate,
  };
}

function classifyClass(klass) {
  const scheduleMeta = resolveScheduleMeta(klass);
  const archived = klass?.archived === true || klass?.isArchived === true;

  return {
    ...klass,
    archived,
    scheduleMeta,
  };
}

function ClassCard({ klass, archived = false, saving = false, onToggleArchived }) {
  const { startDate, endDate, schedule } = klass.scheduleMeta || {};
  const dateText = startDate && endDate ? `${formatDate(startDate)} → ${formatDate(endDate)}` : "No schedule dates";

  return (
    <div
      key={klass.classId}
      style={{
        border: "1px solid #ddd",
        borderRadius: 8,
        padding: 12,
        background: archived ? "#f8fafc" : "#fff",
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
            background: archived ? "#e5e7eb" : "#dcfce7",
            color: archived ? "#374151" : "#166534",
            fontWeight: 700,
          }}
        >
          {archived ? "Archived" : "Ongoing"}
        </span>
      </div>
      <div style={{ fontSize: 12, opacity: 0.75 }}>classId: {klass.classId}</div>
      <div style={{ fontSize: 12, opacity: 0.75 }}>Schedule: {dateText}</div>
      {schedule?.length ? <div style={{ fontSize: 12, opacity: 0.75 }}>Sessions: {schedule.length}</div> : null}
      <div style={{ marginTop: 8, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
        <button
          type="button"
          disabled={saving}
          onClick={() => onToggleArchived?.(klass, !archived)}
          style={{
            background: "#ffffff",
            color: "#0f172a",
            border: `1px solid ${archived ? "#16a34a" : "#dc2626"}`,
            fontWeight: 700,
            padding: "8px 12px",
            borderRadius: 8,
            cursor: saving ? "default" : "pointer",
            ...(archived
              ? { color: "#166534", background: "#ffffff" }
              : { color: "#991b1b", background: "#ffffff" }),
          }}
        >
          {saving ? "Saving..." : archived ? "Unarchive class" : "Archive class"}
        </button>
      </div>
      <div style={{ marginTop: 8 }}>
        <Link to={`/attendance/${encodeURIComponent(klass.classId)}`}>
          {archived ? "View archived attendance" : "Mark attendance"}
        </Link>
      </div>
    </div>
  );
}

export default function AttendanceOverviewPage() {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [savingClassId, setSavingClassId] = useState("");

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError("");
      try {
        const data = await listClasses();
        setClasses(data);
      } catch (err) {
        setError(err?.message || "Failed to load classes");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function handleToggleArchived(klass, archived) {
    const classId = klass?.classId;
    if (!classId || savingClassId) return;

    const previousClasses = classes;
    setSavingClassId(classId);
    setError("");
    setClasses((current) =>
      current.map((item) =>
        item.classId === classId
          ? { ...item, archived, isArchived: archived, active: !archived, status: archived ? "archived" : "ongoing" }
          : item,
      ),
    );

    try {
      await setClassArchived(classId, archived);
    } catch (err) {
      setClasses(previousClasses);
      setError(err?.message || "Failed to update class archive status");
    } finally {
      setSavingClassId("");
    }
  }

  const classifiedClasses = useMemo(() => classes.map(classifyClass), [classes]);
  const activeClasses = useMemo(
    () => classifiedClasses.filter((klass) => !klass.archived),
    [classifiedClasses],
  );
  const archivedClasses = useMemo(
    () => classifiedClasses.filter((klass) => klass.archived),
    [classifiedClasses],
  );

  return (
    <div style={{ padding: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <div>
          <h2 style={{ margin: 0 }}>Attendance</h2>
          <p style={{ margin: "6px 0 0", fontSize: 13, opacity: 0.8 }}>
            Showing ongoing classes only. Completed classes are kept in the archive below.
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
        <p>No ongoing classes found. Completed classes may be in the archive below.</p>
      )}

      <div style={{ display: "grid", gap: 10, maxWidth: 620, marginTop: 14 }}>
        {activeClasses.map((klass) => (
          <ClassCard
            key={klass.classId}
            klass={klass}
            saving={savingClassId === klass.classId}
            onToggleArchived={handleToggleArchived}
          />
        ))}
      </div>

      {!loading && !error && archivedClasses.length > 0 && (
        <section style={{ marginTop: 22, maxWidth: 620 }}>
          <button
            type="button"
            onClick={() => setShowArchived((value) => !value)}
            style={{
              border: "1px solid #cbd5e1",
              borderRadius: 8,
              padding: "8px 12px",
              background: "#f8fafc",
              fontWeight: 700,
            }}
          >
            {showArchived ? "Hide" : "Show"} archived completed classes ({archivedClasses.length})
          </button>

          {showArchived && (
            <div style={{ display: "grid", gap: 10, marginTop: 10 }}>
              {archivedClasses.map((klass) => (
                <ClassCard
                  key={klass.classId}
                  klass={klass}
                  archived
                  saving={savingClassId === klass.classId}
                  onToggleArchived={handleToggleArchived}
                />
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
