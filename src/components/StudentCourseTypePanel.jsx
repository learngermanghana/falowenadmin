import { useState } from "react";
import { auth } from "../firebase.js";
import { changeStudentCourseType } from "../services/studentsService.js";

export function resolveCourseType(student = {}) {
  return student.courseType === "exam_preparation" || student.courseType !== "full_course" && student.accountType === "exam_only"
    ? "exam_preparation" : "full_course";
}

export default function StudentCourseTypePanel({ student, onStudentUpdated }) {
  const current = resolveCourseType(student);
  const [target, setTarget] = useState(current);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const owner = auth?.currentUser?.emailVerified === true &&
    auth.currentUser.email?.toLowerCase() === "moxflex@gmail.com";
  if (!owner) return null;
  const restricted = String(student.program || "german").toLowerCase() !== "german" || String(student.secondaryProgram || "").toLowerCase() === "swahili" || student.institutionVerification === "approved";
  async function save(event) {
    event.preventDefault();
    if (restricted || busy || target === current || !reason.trim() || !student.uid) return;
    if (!window.confirm("Change course type for " + (student.name || student.studentCode) + "? Existing payments and trial dates must be preserved.")) return;
    setBusy(true); setError(""); setNotice("");
    try {
      const result = await changeStudentCourseType(student.id, { courseType: target, expectedCourseType: current, reason: reason.trim() });
      if (!result.updates || result.updates.courseType !== target || !["course", "exam_only"].includes(result.updates.accountType)) {
        throw new Error("The server did not confirm the change. Refresh the student record before retrying.");
      }
      onStudentUpdated?.(student.id, result.updates);
      setReason("");
      setNotice(result.sheetSync === "synced" ? "Course type changed and Students Sheet synchronized." : "Course type changed. Verify Students Sheet synchronization.");
    } catch (err) { setError(err.message || "Could not change course type."); }
    finally { setBusy(false); }
  }
  return <section aria-label="Course type management" style={{ border: "1px solid #cbd5e1", borderRadius: 12, padding: 14, marginTop: 14, display: "grid", gap: 10 }}>
    <h3 style={{ margin: 0, fontSize: 16 }}>Course type management</h3>
    <div>Current course: <strong>{current === "exam_preparation" ? "Exam Preparation" : "Full Course"}</strong></div>
    <div>Account access: <strong>{student.accountType === "exam_only" ? "Exam only" : "Course"}</strong></div>
    {restricted ? <p role="status" style={{ margin: 0 }}>This student has Kiswahili or a protected institutional enrollment. German-only account switching is unavailable until language-specific access can be changed safely. Existing enrollments remain intact.</p> : <form onSubmit={save} style={{ display: "grid", gap: 10 }}>
      <label style={{ display: "grid", gap: 4 }}>New course type
        <select value={target} onChange={event => { setTarget(event.target.value); setError(""); setNotice(""); }} disabled={busy}>
          <option value="full_course">Full Course</option>
          <option value="exam_preparation">Exam Preparation</option>
        </select>
      </label>
      <p style={{ margin: 0, fontSize: 13 }}>The server determines access from existing enrollment and payment records. This action must not create a payment, restart a trial, or erase a balance.</p>
      <label style={{ display: "grid", gap: 4 }}>Reason for change
        <textarea required maxLength={500} rows={2} value={reason} onChange={event => setReason(event.target.value)} disabled={busy} />
      </label>
      {!student.uid && <p role="alert">Link the existing Firebase login before changing course type.</p>}
      <button type="submit" disabled={busy || !student.uid || target === current || !reason.trim()}>{busy ? "Saving…" : "Confirm course type change"}</button>
    </form>}
    {notice && <p role="status">{notice}</p>}
    {error && <p role="alert">{error}</p>}
  </section>;
}
