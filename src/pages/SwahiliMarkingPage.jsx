import { useEffect, useState } from "react";
import { loadSwahiliMarkingPage, loadSwahiliReview, saveSwahiliReview } from "../services/swahiliMarkingService";
import { getSwahiliReviewStatus } from "../utils/swahiliReviewQueue";

const LESSONS = {
  1: { title: "Alfabeti, sauti na matamshi", writing: { vowels: "Vokali", syllables: "Silabi", words: "Maneno" }, reading: { mother: "Ni neno gani lina maana ya mother?", child: "Ni neno gani lina maana ya child?", chair: "Ni neno gani lina maana ya chair?", u: "Ni neno gani lina vokali U mara mbili?" } },
  6: { title: "Mgahawani", writing: { likes: "Ninapenda", dislikes: "Sipendi", order: "Agizo" }, reading: { food: "Mteja anapenda kula nini?", drink: "Mteja anapenda kunywa nini?", server: "Nani anauliza ‘Wewe unapenda kula nini?’", menu: "Ni chakula gani kina samaki?" } },
};

function SubmissionReview({ submission, day }) {
  const [review, setReview] = useState(null);
  const [status, setStatus] = useState("reviewed");
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
      }
      setLoading(false);
    }).catch(() => {
      if (active) setError("Could not load existing feedback. Refresh the queue to retry.");
    });
    return () => { active = false; };
  }, [submission, day]);

  async function submit(event) {
    event.preventDefault();
    setSaving(true);
    setSaved(false);
    setError("");
    try {
      await saveSwahiliReview({ submission, day, status, feedback });
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
      <fieldset disabled={loading || saving}>
        <label>Decision
          <select value={status} onChange={(event) => { setStatus(event.target.value); setSaved(false); }}>
            <option value="reviewed">Reviewed</option>
            <option value="needs_revision">Needs revision</option>
          </select>
        </label>
        <label>Feedback for the learner
          <textarea value={feedback} onChange={(event) => { setFeedback(event.target.value); setSaved(false); }} maxLength={3000} rows={5} />
        </label>
        <button type="submit">{saving ? "Saving…" : "Save feedback"}</button>
      </fieldset>
      {saved && <p role="status">Feedback saved to the learner’s workbook.</p>}
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
    }).catch(() => {
      if (active) setError("Could not load the Swahili queue. Check access and the Firestore index.");
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
      {!loading && !error && page.rows.length === 0 && <p>No submitted work for this lesson.</p>}
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

export default function SwahiliMarkingPage() {
  const [day, setDay] = useState(1);
  return (
    <>
      <label className="swahili-marking-lesson">Lesson
        <select value={day} onChange={(event) => setDay(Number(event.target.value))}>
          {Object.entries(LESSONS).map(([number, { title }]) => <option key={number} value={number}>Day {number} · {title}</option>)}
        </select>
      </label>
      <LessonQueue key={day} day={day} />
    </>
  );
}
