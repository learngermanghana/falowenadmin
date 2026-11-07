import { useEffect, useMemo, useRef, useState } from "react";
import { loadRoster, fetchSubmissions, saveScoreRow } from "../services/markingService.js";
import { manualMarkingLessons, manualScorePayload, matchingManualSubmissions } from "../utils/manualMarking.js";
import { useToast } from "../context/ToastContext.jsx";
import "./ManualMarking.css";

export default function ManualMarking() {
  const { success, error } = useToast();
  const [roster, setRoster] = useState([]);
  const [rosterStatus, setRosterStatus] = useState("loading");
  const [rosterError, setRosterError] = useState("");
  const [reload, setReload] = useState(0);
  const [search, setSearch] = useState("");
  const [studentId, setStudentId] = useState("");
  const [level, setLevel] = useState("B1");
  const [assignmentId, setAssignmentId] = useState("");
  const [score, setScore] = useState("");
  const [feedback, setFeedback] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [retrieval, setRetrieval] = useState({ status: "idle", rows: [] });
  const savingRef = useRef(false);
  const retrievalRequest = useRef(0);
  const rosterRequest = useRef(null);
  const student = roster.find((row) => row.id === studentId);
  const lessons = useMemo(() => manualMarkingLessons(level), [level]);
  const lesson = lessons.find((row) => row.assignmentId === assignmentId);
  const reference = lesson?.reference;
  const visibleStudents = roster.filter((row) => row.id === studentId
    || `${row.name} ${row.studentCode}`.toLowerCase().includes(search.toLowerCase().trim()));

  useEffect(() => {
    let active = true;
    setRosterStatus("loading");
    setRosterError("");
    // Reuse the request during StrictMode effect replay; retry only on demand.
    if (!rosterRequest.current || rosterRequest.current.reload !== reload) {
      rosterRequest.current = { reload, promise: loadRoster() };
    }
    rosterRequest.current.promise.then((rows) => {
      if (active) { setRoster(rows); setRosterStatus("ready"); }
    }).catch((err) => {
      if (active) { setRosterError(err.message || "Could not load students."); setRosterStatus("error"); }
    });
    return () => { active = false; };
  }, [reload]);

  useEffect(() => () => { retrievalRequest.current += 1; }, []);

  const resetMark = () => {
    retrievalRequest.current += 1;
    setScore(""); setFeedback(""); setSaved(false);
    setRetrieval({ status: "idle", rows: [] });
  };
  const selectStudent = (id) => {
    resetMark(); setStudentId(id); setAssignmentId("");
    const selected = roster.find((row) => row.id === id);
    const studentLevel = String(selected?.level || "").toUpperCase().match(/\b[A-C][12]\b/)?.[0];
    if (studentLevel) setLevel(studentLevel);
  };
  const retrieve = async () => {
    if (!student || !lesson) return;
    const request = ++retrievalRequest.current;
    setRetrieval({ status: "loading", rows: [] });
    try {
      const rows = await fetchSubmissions(lesson.level, student.studentCode);
      if (request !== retrievalRequest.current) return;
      setRetrieval({ status: "ready", rows: matchingManualSubmissions(rows, lesson.assignmentId) });
    } catch (err) {
      if (request === retrievalRequest.current) setRetrieval({ status: "error", rows: [], message: err.message || "Could not retrieve work." });
    }
  };
  const save = async (event) => {
    event.preventDefault();
    if (savingRef.current) return;
    let payload;
    try { payload = manualScorePayload({ student, lesson, score, feedback }); }
    catch (err) { error(err.message); return; }
    savingRef.current = true; setSaving(true);
    try {
      const receipt = await saveScoreRow(payload);
      if (receipt.duplicateSkipped) {
        error("This student already has a score for this lesson. Review the existing result before changing it.");
        return;
      }
      if (!receipt.sheet?.success || (receipt.firestore?.attempted && !receipt.firestore.success)) {
        throw new Error("The score was not saved to all required destinations. Check the result before retrying.");
      }
      setSaved(true);
      success(`Saved ${payload.score}/100 for ${payload.name} · ${payload.assignmentId}.`);
    } catch (err) { error(err.message || "Could not save the score."); }
    finally { savingRef.current = false; setSaving(false); }
  };

  return <section className="manual-marking" aria-label="Manual marking">
    <h2>Manual marking</h2>
    <p>Select a student and lesson, review work received by email, then enter the final score and feedback. You can also try retrieving saved work.</p>
    {rosterError && <p role="alert">{rosterError} <button type="button" onClick={() => setReload((value) => value + 1)}>Retry loading students</button></p>}
    <form onSubmit={save}>
      <fieldset disabled={saving}>
        <legend>Student and lesson</legend>
        <div className="manual-marking-fields">
          <label>Find student<input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name or student code" /></label>
          <label>Student<select value={studentId} onChange={(event) => selectStudent(event.target.value)} disabled={rosterStatus !== "ready"} required>
            <option value="">{rosterStatus === "loading" ? "Loading students…" : "Select student"}</option>
            {visibleStudents.map((row) => <option key={row.id} value={row.id}>{row.name} · {row.studentCode} · {row.level}</option>)}
          </select></label>
          <label>Course level<select value={level} onChange={(event) => { resetMark(); setLevel(event.target.value); setAssignmentId(""); }}>
            {["A1", "A2", "B1", "B2", "C1", "C2"].map((value) => <option key={value}>{value}</option>)}
          </select></label>
          <label>Lesson day<select value={assignmentId} onChange={(event) => { resetMark(); setAssignmentId(event.target.value); }} required>
            <option value="">Select lesson day</option>
            {lessons.map((row) => <option key={row.assignmentId} value={row.assignmentId}>{row.label}</option>)}
          </select></label>
        </div>
        {!lessons.length && <p>No marking references are available for this level.</p>}
        {student && lesson && <p className="manual-marking-selection"><strong>{student.name} · {student.studentCode}</strong><br />{lesson.label}</p>}
      </fieldset>
      {reference && <section className="manual-marking-reference" aria-label="Lesson reference">
        <h3>Reference answer and writing prompt</h3>
        {reference.questionAwareWritingTask && <>
          <p>{reference.questionAwareWritingTask.taskSituationDe}</p>
          <ul>{reference.questionAwareWritingTask.taskPointsDe.map((point, index) => <li key={index}>{point}</li>)}</ul>
        </>}
        {Object.entries(reference.parts || {}).map(([partId, part]) => <div key={partId}>
          <h4>{partId.replace("teil", "Teil ")}</h4>
          <ol>{(part.answers || []).map((answer, index) => <li key={index}>{[answer.correctLetter, answer.correctText || answer.rawCorrectAnswer || answer.raw].filter(Boolean).join(" — ")}</li>)}</ol>
        </div>)}
      </section>}
      <section aria-label="Optional saved work">
        <button type="button" onClick={retrieve} disabled={!student || !lesson || saving || retrieval.status === "loading"}>{retrieval.status === "loading" ? "Retrieving…" : "Try retrieving saved work"}</button>
        {retrieval.status === "ready" && !retrieval.rows.length && <p>No submitted work was found for this lesson. You can still mark the copy received by email, or <a href="/student-results?tab=drafts">check saved drafts</a>.</p>}
        {retrieval.status === "error" && <p role="alert">{retrieval.message} You can still enter the score and feedback below.</p>}
        {retrieval.rows.map((row) => <details key={row.path || row.id}><summary>Saved work · {row.createdAt instanceof Date ? row.createdAt.toLocaleString() : row.status || "Submitted"}</summary><pre>{row.text || "This saved record has no text. Review the student's emailed copy."}</pre></details>)}
      </section>
      <fieldset disabled={saving || !student || !lesson}>
        <legend>Final assessment</legend>
        <label>Final score / 100<input type="number" min="1" max="100" step="1" required value={score} onChange={(event) => { setScore(event.target.value); setSaved(false); }} /></label>
        <label>Comment / feedback<textarea rows={6} required value={feedback} onChange={(event) => { setFeedback(event.target.value); setSaved(false); }} placeholder="Enter the feedback from your review" /></label>
        <button type="submit" disabled={saving || saved || !score || !feedback.trim()}>{saving ? "Saving…" : saved ? "Score saved" : "Save final score and feedback"}</button>
      </fieldset>
    </form>
  </section>;
}
