import MarkingSectionTabs from "../components/MarkingSectionTabs.jsx";
import { useEffect, useState } from "react";
import { loadSwahiliMarkingPage, loadSwahiliRoster, loadSwahiliStudentSubmission, loadSwahiliReview, saveSwahiliReview } from "../services/swahiliMarkingService";
import { getSwahiliReviewStatus } from "../utils/swahiliReviewQueue";

const LESSONS = {
  1: { title: "Alfabeti, sauti na matamshi", writing: { vowels: "Vokali", syllables: "Silabi", words: "Maneno" }, reading: { mother: "Ni neno gani lina maana ya mother?", child: "Ni neno gani lina maana ya child?", chair: "Ni neno gani lina maana ya chair?", u: "Ni neno gani lina vokali U mara mbili?" } },
  6: { title: "Mgahawani", writing: { likes: "Ninapenda", dislikes: "Sipendi", order: "Agizo" }, reading: { food: "Mteja anapenda kula nini?", drink: "Mteja anapenda kunywa nini?", server: "Nani anauliza ‘Wewe unapenda kula nini?’", menu: "Ni chakula gani kina samaki?" } },
};

function SubmissionReview({ submission, day }) {
  const [review, setReview] = useState(null);
  const [status, setStatus] = useState("reviewed");
  const [score, setScore] = useState("");
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let active = true;
    loadSwahiliReview(submission, day).then((value) => {
      if (!active) return;
      setReview(value);
      const currentStatus = getSwahiliReviewStatus(submission, value);
      if (currentStatus !== "awaiting_review") {
        setStatus(currentStatus);
        setFeedback(value.feedback || "");
        setScore(value.score ?? "");
      }
      setLoading(false);
    }).catch(() => {
      if (active) {
        setLoading(false);
        setError("Could not load existing feedback. Reopen the submission to retry.");
      }
    });
    return () => { active = false; };
  }, [submission, day]);

  async function submit(event) {
    event.preventDefault();
    setSaving(true);
    setSaved(false);
    setError("");
    try {
      await saveSwahiliReview({ submission, day, status, feedback, score: score === "" ? null : Number(score) });
      setSaved(true);
    } catch (failure) {
      setError(failure.message || "Could not save feedback.");
    } finally {
      setSaving(false);
    }
  }

  const reviewState = saved ? status : getSwahiliReviewStatus(submission, review);
  return (
    <form className="marking-card swahili-marking-form" onSubmit={submit}>
      <h3>{submission.studentName || submission.studentEmail || submission.studentId}</h3>
      <p>{loading ? "Loading feedback…" : { awaiting_review: "Awaiting review", reviewed: "Reviewed", needs_revision: "Needs revision" }[reviewState]}</p>
      <section>
        <h4>Teil 2 · Kuandika</h4>
        {Object.entries(LESSONS[day].writing).map(([key, label]) => (
          <p key={key}><strong>{label}</strong> {String(submission.writing?.[key] ?? "—")}</p>
        ))}
      </section>
      <section>
        <h4>Teil 3 · Kusoma</h4>
        <ol>
          {Object.entries(LESSONS[day].reading).map(([key, question]) => (
            <li key={key}><strong>{question}</strong> {String(submission.readingAnswers?.[key] ?? "—")}</li>
          ))}
        </ol>
      </section>
      <fieldset disabled={loading || saving || (!saved && error.startsWith("Could not load existing feedback"))}>
        <label>Decision
          <select value={status} onChange={(event) => { setStatus(event.target.value); setSaved(false); }}>
            <option value="reviewed">Reviewed</option>
            <option value="needs_revision">Needs revision</option>
          </select>
        </label>
        <label>Score out of 100
          <input type="number" min="0" max="100" step="1" value={score} required
            onChange={(event) => { setScore(event.target.value); setSaved(false); }} />
        </label>
        <label>Feedback for the learner
          <textarea value={feedback} onChange={(event) => { setFeedback(event.target.value); setSaved(false); }} maxLength={3000} rows={5} required />
        </label>
        <button type="submit">{saving ? "Saving…" : "Save feedback"}</button>
      </fieldset>
      {saved && <p role="status">Result saved. Sheet sync and email delivery are queued.</p>}
      {error && <p role="alert">{error}</p>}
    </form>
  );
}

function LessonQueue({ day }) {
  const [page, setPage] = useState({ rows: [], nextCursor: null });
  const [selectedPath, setSelectedPath] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let active = true;
    loadSwahiliMarkingPage(day).then((result) => {
      if (!active) return;
      setPage(result);
      setSelectedPath(result.rows[0]?.path || "");
    }).catch((failure) => {
      if (active) setError(failure.code === "permission-denied"
        ? "Your account needs Swahili marking access. If it was just granted, sign out and back in."
        : "Could not load Swahili submissions. Use Refresh to retry.");
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [day, version]);

  async function loadMore() {
    setLoading(true);
    setError("");
    try {
      const next = await loadSwahiliMarkingPage(day, page.nextCursor);
      setPage(({ rows }) => ({
        rows: [...rows, ...next.rows.filter((row) => !rows.some(({ path }) => path === row.path))],
        nextCursor: next.nextCursor,
      }));
    } catch {
      setError("Could not load more submissions.");
    } finally {
      setLoading(false);
    }
  }

  const selected = page.rows.find(({ path }) => path === selectedPath);
  return (
    <section aria-label="Swahili student submissions" className="swahili-marking-queue">
      <div className="swahili-marking-toolbar">
        <h2>Day {day} · {LESSONS[day].title}</h2>
        <button type="button" disabled={loading} onClick={() => {
          setLoading(true);
          setError("");
          setPage({ rows: [], nextCursor: null });
          setVersion((value) => value + 1);
        }}>Refresh</button>
      </div>
      {loading && <p role="status">Loading submissions…</p>}
      {error && <p role="alert">{error}</p>}
      {!loading && !error && page.rows.length === 0 && <p>{page.nextCursor ? "No submissions on this page. Load more to keep checking." : "No submitted work for this lesson."}</p>}
      {page.rows.length > 0 && (
        <label>Learner submission
          <select value={selectedPath} onChange={(event) => setSelectedPath(event.target.value)}>
            {page.rows.map((row) => <option key={row.path} value={row.path}>{row.studentName || row.studentEmail || row.studentId}</option>)}
          </select>
        </label>
      )}
      {selected && <SubmissionReview key={selected.path} submission={selected} day={day} />}
      {page.nextCursor && <button type="button" disabled={loading} onClick={loadMore}>Load more submissions</button>}
    </section>
  );
}

function ManualSwahiliMarking({ day }) {
  const [roster, setRoster] = useState({ students: [], nextCursor: null });
  const [uid, setUid] = useState("");
  const [submission, setSubmission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lookupPending, setLookupPending] = useState(false);
  const [rosterError, setRosterError] = useState("");
  const [lookupError, setLookupError] = useState("");
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    let active = true;
    loadSwahiliRoster().then(result => { if (active) setRoster(result); }).catch(() => {
      if (active) setRosterError("Could not load the Swahili student list.");
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [retry]);

  useEffect(() => {
    if (!uid) return;
    let active = true;
    loadSwahiliStudentSubmission(uid, day).then(result => { if (active) setSubmission(result); }).catch(() => {
      if (active) setLookupError("Could not load this student's workbook. Select the student again to retry.");
    }).finally(() => { if (active) setLookupPending(false); });
    return () => { active = false; };
  }, [uid, day]);

  async function moreStudents() {
    setLoading(true);
    setRosterError("");
    try {
      const next = await loadSwahiliRoster(roster.nextCursor);
      setRoster({ students: [...roster.students, ...next.students.filter(student => !roster.students.some(existing => existing.uid === student.uid))], nextCursor: next.nextCursor });
    } catch {
      setRosterError("Could not load more Swahili students.");
    } finally {
      setLoading(false);
    }
  }

  return <section className="swahili-marking-queue">
    <h2>Manual marking</h2>
    <label>Swahili student
      <select value={uid} onChange={event => {
        setSubmission(null);
        setLookupError("");
        setLookupPending(Boolean(event.target.value));
        setUid(event.target.value);
      }}>
        <option value="">Select a student</option>
        {roster.students.map(student => <option key={student.uid} value={student.uid}>
          {student.name || student.studentCode || student.email || student.uid}
        </option>)}
      </select>
    </label>
    {loading && <p role="status">Loading students…</p>}
    {rosterError && <p role="alert">{rosterError}</p>}
    {roster.nextCursor ? <button type="button" disabled={loading} onClick={moreStudents}>Load more students</button>
      : rosterError && <button type="button" onClick={() => {
        setRosterError("");
        setLoading(true);
        setRetry(value => value + 1);
      }}>Retry</button>}
    {lookupPending && <p role="status">Loading submitted workbook…</p>}
    {lookupError && <p role="alert">{lookupError}</p>}
    {uid && !lookupPending && !lookupError && !submission && <p>This student has yet to submit this lesson.</p>}
    {submission && <SubmissionReview key={submission.path} submission={submission} day={day} />}
  </section>;
}

export default function SwahiliMarkingPage() {
  return <MarkingSectionTabs>{tab => tab === "automatic"
    ? <p>Swahili results are marked by a tutor. Open Submissions to mark or Manual marking to review student work.</p>
    : <SwahiliLessonSelection key={tab} manual={tab === "manual"} />
  }</MarkingSectionTabs>;
}

function SwahiliLessonSelection({ manual }) {
  const [day, setDay] = useState(1);
  return (
    <>
      <label className="swahili-marking-lesson">Lesson
        <select value={day} onChange={(event) => setDay(Number(event.target.value))}>
          {Object.entries(LESSONS).map(([number, { title }]) => <option key={number} value={number}>Day {number} · {title}</option>)}
        </select>
      </label>
      {manual ? <ManualSwahiliMarking key={day} day={day} /> : <LessonQueue key={day} day={day} />}
    </>
  );
}
