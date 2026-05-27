import { useEffect, useMemo, useState } from "react";
import { listAllStudents } from "../services/studentsService";
import { syncOrientationStudent } from "../services/orientationService";

const LEVEL_LINKS = {
  A1: "https://www.falowen.app/campus/course/a1-day-0-orientation-and-knowledge-test-workbook",
  A2: "https://www.falowen.app/campus/course/a2-day-0-orientation-and-knowledge-test-workbook",
  B1: "https://www.falowen.app/campus/course/b1-day-0-orientation-and-knowledge-test-workbook",
};

function normalizeStudent(student = {}) {
  return {
    id: String(student.id || student.studentCode || student.email || student.name || "").trim(),
    name: String(student.name || "").trim(),
    email: String(student.email || "").trim(),
    className: String(student.className || student.class || student.level || "").trim(),
    studentCode: String(student.studentCode || student.studentcode || "").trim(),
  };
}

export default function OrientationPage() {
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [form, setForm] = useState({ name: "", email: "", level: "A1", startDate: "", studentCode: "" });
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  useEffect(() => {
    let active = true;
    setLoading(true);
    listAllStudents()
      .then((rows) => {
        if (!active) return;
        setStudents((rows || []).map(normalizeStudent).filter((row) => row.id));
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
    return students.filter((s) => [s.name, s.email, s.studentCode, s.className].join(" ").toLowerCase().includes(key));
  }, [students, search]);

  const selectedStudent = useMemo(() => students.find((s) => s.id === selectedId), [students, selectedId]);

  useEffect(() => {
    if (!selectedStudent) return;
    setForm((prev) => ({
      ...prev,
      name: selectedStudent.name,
      email: selectedStudent.email,
      studentCode: selectedStudent.studentCode,
    }));
  }, [selectedStudent]);

  async function onSubmit(event) {
    event.preventDefault();
    setMessage({ type: "", text: "" });
    setSyncing(true);
    try {
      await syncOrientationStudent(form);
      setMessage({ type: "success", text: "Student synced to orientation sheet. Due emails will be sent automatically." });
    } catch (error) {
      setMessage({ type: "error", text: error?.message || "Failed to sync orientation student." });
    } finally {
      setSyncing(false);
    }
  }

  return (
    <section style={{ maxWidth: 880, margin: "0 auto", background: "#fff", borderRadius: 12, padding: 24, boxShadow: "0 8px 24px rgba(0,0,0,0.08)" }}>
      <h1 style={{ marginTop: 0 }}>Orientation Sync</h1>
      <p>Select a student, choose level and start date, then sync to orientation sheet.</p>

      <label style={{ display: "block", marginBottom: 8, fontWeight: 600 }}>Search students</label>
      <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Type name, email, student code, class..." style={{ width: "100%", padding: 10, marginBottom: 12 }} />

      <label style={{ display: "block", marginBottom: 8, fontWeight: 600 }}>Student</label>
      <select value={selectedId} onChange={(e) => setSelectedId(e.target.value)} style={{ width: "100%", padding: 10, marginBottom: 16 }}>
        <option value="">Select a student</option>
        {filteredStudents.map((student) => (
          <option key={student.id} value={student.id}>{student.name} ({student.email || "No email"})</option>
        ))}
      </select>

      {loading && <p>Loading students...</p>}

      <form onSubmit={onSubmit}>
        <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
          <input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} placeholder="Name" required />
          <input type="email" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} placeholder="Email" required />
          <input value={selectedStudent?.className || ""} placeholder="Current class/level" readOnly />
          <input value={form.studentCode} onChange={(e) => setForm((p) => ({ ...p, studentCode: e.target.value }))} placeholder="Student code" />
          <select value={form.level} onChange={(e) => setForm((p) => ({ ...p, level: e.target.value }))} required>
            <option value="A1">A1</option>
            <option value="A2">A2</option>
            <option value="B1">B1</option>
          </select>
          <input type="date" value={form.startDate} onChange={(e) => setForm((p) => ({ ...p, startDate: e.target.value }))} required />
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
    </section>
  );
}
