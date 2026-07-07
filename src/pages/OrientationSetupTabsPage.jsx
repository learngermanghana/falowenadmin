import { useEffect, useMemo, useState } from "react";
import PublishedSheetManager from "../components/PublishedSheetManager.jsx";
import { listAllStudents } from "../services/studentsService";
import { listClassCohorts } from "../services/liveClassService";
import { removeOrientationSheetRow, syncOrientationStudent } from "../services/orientationService";

const SHEET_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQXmCTdzTL7prCroqlRqbR83uXtG_ya-LDrGjIRvs93pd0UK8urTyJjBb1pcpqmseTfF54c7eHSgAHy/pubhtml";

const LEVEL_LINKS = {
  A1: "https://www.falowen.app/campus/course/a1-day-0-orientation-and-knowledge-test-workbook",
  A2: "https://www.falowen.app/campus/course/a2-day-0-orientation-and-knowledge-test-workbook",
  B1: "https://www.falowen.app/campus/course/b1-day-0-orientation-and-knowledge-test-workbook",
};

function clean(value) {
  return String(value || "").trim();
}

function comparable(value) {
  return clean(value).toLowerCase().replace(/\s+/g, " ");
}

function toDateInputValue(value) {
  if (!value) return "";
  if (typeof value === "string") return value.includes("T") ? value.slice(0, 10) : value.slice(0, 10);
  const date = typeof value?.toDate === "function" ? value.toDate() : value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

function normalizeStudent(student = {}) {
  return {
    id: clean(student.id || student.studentCode || student.email || student.name),
    name: clean(student.name),
    email: clean(student.email),
    className: clean(student.className || student.class || student.level),
    studentCode: clean(student.studentCode || student.studentcode),
  };
}

function normalizeClassCohort(klass = {}) {
  return {
    id: clean(klass.id),
    name: clean(klass.name || klass.className),
    slug: clean(klass.slug),
    levelId: clean(klass.levelId || klass.level).toUpperCase(),
    startDate: toDateInputValue(klass.startDate),
  };
}

function findClassForStudent(student, classCohorts) {
  const classKey = comparable(student?.className);
  if (!classKey) return null;
  return classCohorts.find((klass) => [klass.name, klass.id, klass.slug].map(comparable).filter(Boolean).includes(classKey)) || null;
}

const tabButtonStyle = (active) => ({
  border: "1px solid #d0d7de",
  borderRadius: 999,
  padding: "8px 14px",
  fontWeight: active ? 800 : 600,
  background: active ? "#eff6ff" : "#fff",
  color: active ? "#1d4ed8" : "#111827",
  cursor: "pointer",
});

export default function OrientationSetupTabsPage() {
  const [activeTab, setActiveTab] = useState("setup");
  const [students, setStudents] = useState([]);
  const [classCohorts, setClassCohorts] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [form, setForm] = useState({ name: "", email: "", level: "A1", startDate: "", studentCode: "" });
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  useEffect(() => {
    let active = true;
    setLoading(true);
    Promise.all([listAllStudents(), listClassCohorts()])
      .then(([studentRows, classRows]) => {
        if (!active) return;
        setStudents((studentRows || []).map(normalizeStudent).filter((row) => row.id));
        setClassCohorts((classRows || []).map(normalizeClassCohort).filter((row) => row.id || row.name));
      })
      .catch((err) => {
        if (!active) return;
        setMessage({ type: "error", text: err?.message || "Failed to load students." });
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const filteredStudents = useMemo(() => {
    const key = search.trim().toLowerCase();
    if (!key) return students;
    return students.filter((student) => [student.name, student.email, student.studentCode, student.className].join(" ").toLowerCase().includes(key));
  }, [students, search]);

  const selectedStudent = useMemo(() => students.find((student) => student.id === selectedId), [students, selectedId]);
  const selectedClass = useMemo(() => findClassForStudent(selectedStudent, classCohorts), [selectedStudent, classCohorts]);

  useEffect(() => {
    if (!selectedStudent) return;
    setForm((prev) => ({
      ...prev,
      name: selectedStudent.name,
      email: selectedStudent.email,
      studentCode: selectedStudent.studentCode,
      level: LEVEL_LINKS[selectedClass?.levelId] ? selectedClass.levelId : "A1",
      startDate: selectedClass?.startDate || "",
    }));
  }, [selectedStudent, selectedClass]);

  async function onSubmit(event) {
    event.preventDefault();
    setMessage({ type: "", text: "" });
    setSyncing(true);
    try {
      await syncOrientationStudent(form);
      setMessage({ type: "success", text: "Student synced to orientation sheet. Due emails will be sent automatically." });
      setActiveTab("sheet");
    } catch (error) {
      setMessage({ type: "error", text: error?.message || "Failed to sync orientation student." });
    } finally {
      setSyncing(false);
    }
  }

  return (
    <section style={{ maxWidth: 940, margin: "0 auto", background: "#fff", borderRadius: 12, padding: 24, boxShadow: "0 8px 24px rgba(0,0,0,0.08)" }}>
      <h1 style={{ marginTop: 0 }}>Orientation Setup</h1>
      <p>Select a student, choose level and start date, sync to the orientation sheet, or view the existing sheet rows.</p>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 18 }}>
        <button type="button" onClick={() => setActiveTab("setup")} style={tabButtonStyle(activeTab === "setup")}>Create orientation row</button>
        <button type="button" onClick={() => setActiveTab("sheet")} style={tabButtonStyle(activeTab === "sheet")}>View sheet / manage rows</button>
      </div>

      {activeTab === "setup" ? (
        <>
          <label style={{ display: "block", marginBottom: 8, fontWeight: 600 }}>Search students</label>
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Type name, email, student code, class..." style={{ width: "100%", padding: 10, marginBottom: 12 }} />

          <label style={{ display: "block", marginBottom: 8, fontWeight: 600 }}>Student</label>
          <select value={selectedId} onChange={(event) => setSelectedId(event.target.value)} style={{ width: "100%", padding: 10, marginBottom: 16 }}>
            <option value="">Select a student</option>
            {filteredStudents.map((student) => (
              <option key={student.id} value={student.id}>{student.name} ({student.email || "No email"})</option>
            ))}
          </select>

          {loading && <p>Loading students and live classes...</p>}

          <form onSubmit={onSubmit}>
            <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
              <input value={form.name} onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))} placeholder="Name" required />
              <input type="email" value={form.email} onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))} placeholder="Email" required />
              <input value={selectedStudent?.className || ""} placeholder="Current class/level" readOnly />
              <input value={form.studentCode} onChange={(event) => setForm((prev) => ({ ...prev, studentCode: event.target.value }))} placeholder="Student code" />
              <select value={form.level} onChange={(event) => setForm((prev) => ({ ...prev, level: event.target.value }))} required>
                <option value="A1">A1</option>
                <option value="A2">A2</option>
                <option value="B1">B1</option>
              </select>
              <input type="date" value={form.startDate} onChange={(event) => setForm((prev) => ({ ...prev, startDate: event.target.value }))} required />
            </div>

            <div style={{ marginTop: 12, padding: 12, background: "#f7f9fb", borderRadius: 8 }}>
              <strong>Orientation link preview:</strong>{" "}
              <a href={LEVEL_LINKS[form.level]} target="_blank" rel="noreferrer">{LEVEL_LINKS[form.level]}</a>
            </div>

            <button type="submit" disabled={syncing} style={{ marginTop: 16, padding: "10px 16px" }}>
              {syncing ? "Syncing..." : "Sync to orientation sheet"}
            </button>
          </form>

          {message.text ? (
            <p style={{ marginTop: 14, color: message.type === "error" ? "#b42318" : "#067647" }}>{message.text}</p>
          ) : null}
        </>
      ) : (
        <PublishedSheetManager
          title="Orientation sheet"
          description="View the published orientation setup sheet and remove old setup rows when necessary."
          publishedUrl={SHEET_URL}
          onRemoveRow={removeOrientationSheetRow}
        />
      )}
    </section>
  );
}
