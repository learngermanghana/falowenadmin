import { useEffect, useRef, useState } from "react";
import { SOCIAL_STUDENT_REVIEWS, STUDENT_REVIEW_FORMATS } from "../data/socialStudentReviews.js";
import { drawStudentReviewPoster, reviewImageFileName } from "../utils/socialStudentReviewRender.js";
import "./SocialStudentReviews.css";

const STORAGE_KEY = "falowen-social-student-reviews-v1";
const MAX_REVIEW_LENGTH = 1800;
const starterReview = () => ({ id: "", studentName: "", course: "", source: "Google Review", rating: 5, date: "", review: "" });

function readReviews() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    if (!Array.isArray(saved)) return [...SOCIAL_STUDENT_REVIEWS];
    const byId = new Map(SOCIAL_STUDENT_REVIEWS.map((review) => [review.id, { ...review }]));
    for (const item of saved) {
      if (!item || typeof item !== "object" || typeof item.id !== "string") continue;
      if (typeof item.studentName !== "string" || typeof item.review !== "string") continue;
      byId.set(item.id, {
        id: item.id,
        studentName: item.studentName.slice(0, 100),
        course: String(item.course || "").slice(0, 80),
        source: item.source === "Google Review" ? "Google Review" : "Student feedback",
        rating: Math.max(1, Math.min(5, Number(item.rating) || 5)),
        date: String(item.date || "").slice(0, 10),
        review: item.review.slice(0, MAX_REVIEW_LENGTH),
      });
    }
    return [...byId.values()];
  } catch {
    return [...SOCIAL_STUDENT_REVIEWS];
  }
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 60000);
}

export default function SocialStudentReviews() {
  const [reviews, setReviews] = useState(readReviews);
  const [selectedId, setSelectedId] = useState(SOCIAL_STUDENT_REVIEWS[0]?.id || "");
  const [draft, setDraft] = useState(() => ({ ...(readReviews()[0] || starterReview()) }));
  const [formatId, setFormatId] = useState("portrait");
  const [fits, setFits] = useState(true);
  const [savingImage, setSavingImage] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const canvasRef = useRef(null);

  useEffect(() => {
    // Keep the preview and PNG export on the same renderer and 1080-pixel design.
    const output = drawStudentReviewPoster(canvasRef.current, draft, formatId);
    setFits(output.fits);
  }, [draft, formatId]);

  const edit = (key, value) => {
    setDraft((current) => ({ ...current, [key]: value }));
    setMessage("");
    setError("");
  };

  const chooseReview = (id) => {
    const found = reviews.find((review) => review.id === id);
    setSelectedId(id);
    setDraft(found ? { ...found } : starterReview());
    setError("");
    setMessage("");
  };

  const startNew = () => {
    setSelectedId("");
    setDraft(starterReview());
    setMessage("");
    setError("");
  };

  const saveReview = () => {
    const studentName = draft.studentName.trim();
    const review = draft.review.trim();
    if (!studentName || !review) {
      setError("Add the student's name and review text before saving.");
      return;
    }
    if (review.length > MAX_REVIEW_LENGTH) {
      setError("The review is too long to save.");
      return;
    }
    const record = {
      ...draft,
      id: draft.id || `review-${Date.now()}`,
      studentName,
      review,
      course: draft.course.trim(),
      source: draft.source === "Google Review" ? "Google Review" : "Student feedback",
      rating: Math.max(1, Math.min(5, Number(draft.rating) || 5)),
    };
    const next = reviews.some((item) => item.id === record.id)
      ? reviews.map((item) => item.id === record.id ? record : item)
      : [...reviews, record];
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      setError("This browser cannot save reviews locally. The PNG export still works.");
      return;
    }
    setReviews(next);
    setSelectedId(record.id);
    setDraft({ ...record });
    setError("");
    setMessage("Review saved in this browser. Select it again from the student list.");
  };

  const removeReview = () => {
    if (SOCIAL_STUDENT_REVIEWS.some((review) => review.id === selectedId)) return;
    const next = reviews.filter((review) => review.id !== selectedId);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      setError("Unable to remove this locally saved review.");
      return;
    }
    setReviews(next);
    const first = next[0];
    setSelectedId(first?.id || "");
    setDraft(first ? { ...first } : starterReview());
    setMessage("Local review removed.");
    setError("");
  };

  const exportPng = async () => {
    if (savingImage) return;
    if (!draft.studentName.trim() || !draft.review.trim()) {
      setError("Add the student name and review first.");
      return;
    }
    const canvas = canvasRef.current;
    const result = drawStudentReviewPoster(canvas, draft, formatId);
    if (!result.fits) {
      setError("This full review does not fit. Choose a taller format or shorten the text.");
      return;
    }
    setSavingImage(true);
    setError("");
    try {
      const blob = await new Promise((resolve, reject) => {
        canvas.toBlob((output) => output ? resolve(output) : reject(new Error("PNG creation failed")), "image/png");
      });
      downloadBlob(blob, reviewImageFileName(draft.studentName, formatId));
      setMessage("PNG export ready.");
    } catch {
      setError("PNG export failed. Check that your browser allows downloads and try again.");
    } finally {
      setSavingImage(false);
    }
  };

  return (
    <section className="social-reviews-workspace" aria-label="Student Reviews">
      <header className="social-reviews-heading">
        <div>
          <span className="social-studio-kicker">Consistent, branded testimonials</span>
          <h2>Student Reviews</h2>
          <p>Select a student with a shared review, edit the exact wording if needed, and export a ready-to-post PNG.</p>
        </div>
        <span className="social-reviews-mark">Falowen blue · Gold accents</span>
      </header>
      <div className="social-reviews-grid">
        <section className="social-reviews-editor">
          <h3>Review details</h3>
          <label htmlFor="social-review-student">Select student review</label>
          <div className="social-reviews-select-row">
            <select id="social-review-student" value={selectedId} onChange={(event) => chooseReview(event.target.value)}>
              <option value="">New review</option>
              {reviews.map((item) => <option key={item.id} value={item.id}>{item.studentName} · {item.course || "Student"}</option>)}
            </select>
            <button type="button" className="social-reviews-secondary" onClick={startNew}>+ Add</button>
          </div>
          <label htmlFor="social-review-name">Student name</label>
          <input id="social-review-name" maxLength={100} value={draft.studentName} onChange={(event) => edit("studentName", event.target.value)} placeholder="Name as shown on the review" />
          <div className="social-reviews-small-grid">
            <div>
              <label htmlFor="social-review-course">Course / level</label>
              <input id="social-review-course" maxLength={80} value={draft.course} onChange={(event) => edit("course", event.target.value)} placeholder="German A2" />
            </div>
            <div>
              <label htmlFor="social-review-stars">Rating</label>
              <select id="social-review-stars" value={draft.rating} onChange={(event) => edit("rating", Number(event.target.value))}>
                {[5, 4, 3, 2, 1].map((value) => <option key={value} value={value}>{value} star{value === 1 ? "" : "s"}</option>)}
              </select>
            </div>
          </div>
          <label htmlFor="social-review-source">Review source</label>
          <select id="social-review-source" value={draft.source} onChange={(event) => edit("source", event.target.value)}>
            <option value="Google Review">Google Review</option>
            <option value="Student feedback">Student feedback</option>
          </select>
          <label htmlFor="social-review-text">Student's exact review</label>
          <textarea id="social-review-text" rows={9} maxLength={MAX_REVIEW_LENGTH} value={draft.review} onChange={(event) => edit("review", event.target.value)} placeholder="Paste the student's own words here" />
          <p className="social-reviews-hint">Keep the original wording. Only use feedback the student has agreed to share publicly. No student photo is needed.</p>
          <div className="social-reviews-actions">
            <button className="social-reviews-primary" type="button" onClick={saveReview}>Save review</button>
            {selectedId && !SOCIAL_STUDENT_REVIEWS.some((review) => review.id === selectedId) ? <button className="social-reviews-secondary" type="button" onClick={removeReview}>Delete saved review</button> : null}
          </div>
          <p className="social-reviews-hint">New or edited reviews are saved in this browser only; the starter review is included with Falowen Admin.</p>
          {message ? <p role="status" className="social-reviews-success">{message}</p> : null}
          {error ? <p role="alert" className="social-reviews-error">{error}</p> : null}
        </section>
        <section className="social-reviews-preview">
          <div className="social-reviews-preview-top">
            <div>
              <h3>Live poster preview</h3>
              <p>Same layout in the preview and the downloaded PNG.</p>
            </div>
            <span>1080px · PNG</span>
          </div>
          <div className="social-reviews-formats" aria-label="Review poster format">
            {STUDENT_REVIEW_FORMATS.map((format) => (
              <button key={format.id} type="button" aria-pressed={formatId === format.id} onClick={() => setFormatId(format.id)}>
                {format.label}
              </button>
            ))}
          </div>
          <div className="social-reviews-canvas-frame">
            <canvas ref={canvasRef} aria-label="Preview of the student testimonial poster" role="img" />
          </div>
          {!fits ? <p role="alert" className="social-reviews-error">This review will not fit fully in this size. Select a taller format or shorten it before exporting.</p> : null}
          <button type="button" className="social-reviews-export" onClick={exportPng} disabled={savingImage || !fits || !draft.studentName.trim() || !draft.review.trim()}>
            {savingImage ? "Preparing PNG..." : "Export PNG"}
          </button>
        </section>
      </div>
    </section>
  );
}
