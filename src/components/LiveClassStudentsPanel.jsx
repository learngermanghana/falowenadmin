import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { listStudentsByClass } from "../services/studentsService.js";

function normalize(value) {
  return String(value ?? "").trim();
}

function displayValue(...values) {
  return values.map(normalize).find(Boolean) || "Not set";
}

function studentKey(student = {}, index = 0) {
  return displayValue(
    student.id,
    student.studentCode,
    student.studentcode,
    student.uid,
    student.email,
    `${student.name || "student"}-${index}`,
  );
}

function studentName(student = {}) {
  return displayValue(student.name, student.displayName, student.studentCode, student.studentcode, student.email, "Student");
}

function studentCode(student = {}) {
  return displayValue(student.studentCode, student.studentcode, student.uid, student.id);
}

function studentPhone(student = {}) {
  return displayValue(student.phone, student.phoneNumber, student.whatsapp, student.guardianPhone);
}

function numberValue(...values) {
  for (const value of values) {
    if (value === "" || value == null) continue;
    const parsed = Number(String(value).replace(/[^0-9.-]/g, ""));
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

function formatMoney(...values) {
  const amount = numberValue(...values);
  return amount == null ? "Not set" : `GHS ${amount.toLocaleString("en-GH", { maximumFractionDigits: 2 })}`;
}

function normalizePhoneForLink(value) {
  const phone = normalize(value);
  if (!phone || phone === "Not set") return "";
  return phone.replace(/(?!^)\+|[^\d+]/g, "");
}

function whatsappNumber(value) {
  const digits = normalize(value).replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("233")) return digits;
  if (digits.startsWith("0")) return `233${digits.slice(1)}`;
  if (digits.length === 9) return `233${digits}`;
  return digits;
}

function detail(label, value) {
  return (
    <div style={{ padding: 10, border: "1px solid #e2e8f0", borderRadius: 8, background: "#fff" }}>
      <div style={{ color: "#64748b", fontSize: 12, fontWeight: 700, textTransform: "uppercase" }}>{label}</div>
      <div style={{ marginTop: 4, overflowWrap: "anywhere" }}>{value || "Not set"}</div>
    </div>
  );
}

export default function LiveClassStudentsPanel({ classId = "", className = "", levelId = "" }) {
  const [students, setStudents] = useState([]);
  const [selectedKey, setSelectedKey] = useState("");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    setQuery("");
    setSelectedKey("");

    listStudentsByClass(classId, { className })
      .then((rows) => {
        if (!active) return;
        const nextRows = Array.isArray(rows) ? rows : [];
        setStudents(nextRows);
        setSelectedKey(nextRows.length ? studentKey(nextRows[0], 0) : "");
      })
      .catch((loadError) => {
        if (!active) return;
        setStudents([]);
        setError(loadError?.message || "Could not load students for this class.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => { active = false; };
  }, [classId, className, reloadToken]);

  const roster = useMemo(() => students.map((student, index) => ({
    student,
    key: studentKey(student, index),
    name: studentName(student),
  })), [students]);

  const filteredRoster = useMemo(() => {
    const wanted = normalize(query).toLowerCase();
    if (!wanted) return roster;
    return roster.filter(({ student, name }) => [
      name,
      student.email,
      studentCode(student),
      studentPhone(student),
      student.status,
      student.paymentStatus,
    ].map((value) => normalize(value).toLowerCase()).some((value) => value.includes(wanted)));
  }, [query, roster]);

  const selectedEntry = roster.find((entry) => entry.key === selectedKey) || filteredRoster[0] || roster[0] || null;
  const selected = selectedEntry?.student || null;
  const phone = selected ? studentPhone(selected) : "";
  const callNumber = normalizePhoneForLink(phone);
  const whatsapp = whatsappNumber(phone);
  const email = normalize(selected?.email);
  const name = selected ? studentName(selected) : "";

  return (
    <article className="card">
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "flex-start" }}>
        <div>
          <h2 style={{ marginTop: 0 }}>Students in {className || "this class"}</h2>
          <p style={{ marginBottom: 0 }}>
            Select one student to review their class, contact, payment and contract information.
          </p>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <strong>{students.length} student{students.length === 1 ? "" : "s"}</strong>
          <button type="button" disabled={loading} onClick={() => setReloadToken((value) => value + 1)}>
            {loading ? "Loading…" : "Refresh roster"}
          </button>
          <Link to="/students">Open full Students page</Link>
        </div>
      </div>

      {error ? <div style={{ marginTop: 14, padding: 12, border: "1px solid #fecaca", background: "#fef2f2", color: "#991b1b", borderRadius: 8 }}>{error}</div> : null}
      {loading ? <p>Loading students for the selected class…</p> : null}

      {!loading && !error && !students.length ? (
        <div style={{ marginTop: 16, padding: 14, border: "1px solid #fde68a", background: "#fffbeb", borderRadius: 10 }}>
          <strong>No active students were matched to this class.</strong>
          <p style={{ marginBottom: 0 }}>Check that each student has the same class ID or class name as <strong>{className || classId}</strong>.</p>
        </div>
      ) : null}

      {!loading && students.length ? (
        <div style={{ display: "grid", gridTemplateColumns: "minmax(230px, 0.8fr) minmax(0, 1.7fr)", gap: 16, marginTop: 16 }}>
          <aside style={{ border: "1px solid #e2e8f0", borderRadius: 10, padding: 12, alignSelf: "start" }}>
            <label style={{ display: "grid", gap: 6 }}>
              <strong>Search class roster</strong>
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Name, email, phone or student code"
              />
            </label>
            <div style={{ display: "grid", gap: 8, marginTop: 12, maxHeight: 520, overflowY: "auto" }}>
              {filteredRoster.map((entry) => {
                const active = entry.key === selectedEntry?.key;
                return (
                  <button
                    type="button"
                    key={entry.key}
                    onClick={() => setSelectedKey(entry.key)}
                    style={{
                      textAlign: "left",
                      padding: 10,
                      borderRadius: 8,
                      border: active ? "1px solid #2457ff" : "1px solid #cbd5e1",
                      background: active ? "#eff6ff" : "#fff",
                      color: "#0f172a",
                    }}
                  >
                    <strong style={{ display: "block" }}>{entry.name}</strong>
                    <small>{displayValue(studentCode(entry.student), entry.student.email)}</small>
                  </button>
                );
              })}
              {!filteredRoster.length ? <p style={{ margin: 0 }}>No student matches this search.</p> : null}
            </div>
          </aside>

          {selected ? (
            <section style={{ minWidth: 0 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "flex-start" }}>
                <div>
                  <h3 style={{ margin: 0 }}>{name}</h3>
                  <p style={{ margin: "5px 0 0", color: "#475569" }}>
                    {displayValue(selected.status, selected.studentStatus, selected.enrollmentStatus, "Active")} · {displayValue(selected.level, levelId)}
                  </p>
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {email ? <a href={`mailto:${email}`}>Email</a> : null}
                  {callNumber ? <a href={`tel:${callNumber}`}>Call</a> : null}
                  {whatsapp ? <a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noreferrer">WhatsApp</a> : null}
                  <Link to="/student-activity">Student Activity</Link>
                  <Link to="/student-results">Results</Link>
                  <Link to={`/attendance/session/${encodeURIComponent(classId)}`}>Class Attendance</Link>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10, marginTop: 16 }}>
                {detail("Student code", studentCode(selected))}
                {detail("Email", email || "Not set")}
                {detail("Phone", phone || "Not set")}
                {detail("Class", displayValue(selected.className, selected.class, className))}
                {detail("Level / program", displayValue(selected.level, selected.program, levelId))}
                {detail("Learning mode", displayValue(selected.learningMode, selected.mode, selected.location))}
                {detail("Payment status", displayValue(selected.paymentStatus, selected.status))}
                {detail("Tuition fee", formatMoney(selected.tuitionFee, selected.fee))}
                {detail("Paid", formatMoney(selected.paid, selected.initialPaymentAmount, selected.amountPaid))}
                {detail("Balance due", formatMoney(selected.balanceDue, selected.balance, selected.outstandingBalance, selected.amountDue))}
                {detail("Contract start", displayValue(selected.contractStart, selected.enrollDate))}
                {detail("Contract end", displayValue(selected.contractEnd))}
              </div>
            </section>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}
