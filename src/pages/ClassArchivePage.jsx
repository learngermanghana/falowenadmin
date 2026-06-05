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

  return {
    schedule,
    startDate: parsedDates[0] || null,
    endDate: parsedDates[parsedDates.length - 1] || null,
  };
}

function classifyClass(klass) {
  const archived = klass?.archived === true || klass?.isArchived === true;

  return {
    ...klass,
    archived,
    scheduleMeta: resolveScheduleMeta(klass),
  };
}

function ClassArchiveCard({ klass, saving = false, onUnarchive }) {
  const { startDate, endDate, schedule } = klass.scheduleMeta || {};
  const dateText = startDate && endDate ? `${formatDate(startDate)} → ${formatDate(endDate)}` : "No schedule dates";

  return (
    <article
      style={{
        border: "1px solid #dbe3ef",
        borderRadius: 12,
        padding: 16,
        background: "#fff",
        boxShadow: "0 4px 16px rgba(15, 23, 42, 0.06)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 18 }}>{klass.name || klass.classId}</h2>
          <p style={{ margin: "4px 0 0", fontSize: 12, color: "#64748b" }}>classId: {klass.classId}</p>
        </div>
        <span
          style={{
            alignSelf: "flex-start",
            border: "1px solid #cbd5e1",
            borderRadius: 999,
            padding: "4px 10px",
            fontSize: 12,
            background: "#e5e7eb",
            color: "#374151",
            fontWeight: 700,
          }}
        >
          Archived
        </span>
      </div>

      <dl style={{ display: "grid", gap: 6, margin: "14px 0", fontSize: 13 }}>
        <div>
          <dt style={{ fontWeight: 700, color: "#475569" }}>Schedule</dt>
          <dd style={{ margin: 0 }}>{dateText}</dd>
        </div>
        <div>
          <dt style={{ fontWeight: 700, color: "#475569" }}>Sessions</dt>
          <dd style={{ margin: 0 }}>{schedule?.length || "No saved schedule"}</dd>
        </div>
      </dl>

      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
        <Link to={`/attendance/${encodeURIComponent(klass.classId)}`}>View archived attendance</Link>
        <button
          type="button"
          disabled={saving}
          onClick={() => onUnarchive?.(klass)}
          style={{
            border: "1px solid #16a34a",
            borderRadius: 8,
            padding: "8px 12px",
            background: "#fff",
            color: "#166534",
            fontWeight: 700,
            cursor: saving ? "default" : "pointer",
          }}
        >
          {saving ? "Saving..." : "Unarchive class"}
        </button>
      </div>
    </article>
  );
}

export default function ClassArchivePage() {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [savingClassId, setSavingClassId] = useState("");

  useEffect(() => {
    let active = true;

    async function loadArchive() {
      setLoading(true);
      setError("");
      try {
        const data = await listClasses();
        if (active) setClasses(data || []);
      } catch (err) {
        if (active) setError(err?.message || "Failed to load class archive.");
      } finally {
        if (active) setLoading(false);
      }
    }

    loadArchive();

    return () => {
      active = false;
    };
  }, []);

  const classifiedClasses = useMemo(() => classes.map(classifyClass), [classes]);
  const archivedClasses = useMemo(
    () => classifiedClasses.filter((klass) => klass.archived),
    [classifiedClasses],
  );
  const activeCount = classifiedClasses.length - archivedClasses.length;

  async function handleUnarchive(klass) {
    const classId = klass?.classId;
    if (!classId || savingClassId) return;

    const previousClasses = classes;
    setSavingClassId(classId);
    setError("");
    setClasses((current) =>
      current.map((item) =>
        item.classId === classId
          ? { ...item, archived: false, isArchived: false, active: true, status: "ongoing" }
          : item,
      ),
    );

    try {
      await setClassArchived(classId, false);
    } catch (err) {
      setClasses(previousClasses);
      setError(err?.message || "Failed to unarchive class.");
    } finally {
      setSavingClassId("");
    }
  }

  return (
    <div className="page-container">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
        <div>
          <h1>Class Archive</h1>
          <p>Review completed classes that were archived from attendance and class operations.</p>
        </div>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <Link to="/class-operations">Class Operations</Link>
          <Link to="/attendance">Manage Attendance</Link>
        </div>
      </div>

      <section
        style={{
          display: "grid",
          gap: 12,
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          margin: "18px 0",
        }}
      >
        <div style={{ border: "1px solid #dbe3ef", borderRadius: 12, padding: 14, background: "#f8fafc" }}>
          <strong style={{ display: "block", fontSize: 24 }}>{archivedClasses.length}</strong>
          <span>Archived classes</span>
        </div>
        <div style={{ border: "1px solid #dbe3ef", borderRadius: 12, padding: 14, background: "#f8fafc" }}>
          <strong style={{ display: "block", fontSize: 24 }}>{activeCount}</strong>
          <span>Ongoing classes</span>
        </div>
      </section>

      {loading && <p>Loading class archive...</p>}
      {error && <p style={{ color: "#a00000" }}>❌ {error}</p>}

      {!loading && !error && archivedClasses.length === 0 && (
        <p>No archived classes found yet. Archive a completed class from Attendance to make it appear here.</p>
      )}

      <div style={{ display: "grid", gap: 12, maxWidth: 760 }}>
        {archivedClasses.map((klass) => (
          <ClassArchiveCard
            key={klass.classId}
            klass={klass}
            saving={savingClassId === klass.classId}
            onUnarchive={handleUnarchive}
          />
        ))}
      </div>
    </div>
  );
}
