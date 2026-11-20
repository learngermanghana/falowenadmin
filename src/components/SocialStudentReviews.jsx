import { useEffect, useRef, useState } from "react";
import { SOCIAL_STUDENT_REVIEWS, STUDENT_REVIEW_FORMATS } from "../data/socialStudentReviews.js";
import { drawStudentReviewPoster, reviewImageFileName, splitReviewIntoSlides } from "../utils/socialStudentReviewRender.js";
import { makeCampaignZip } from "../utils/socialClassCampaign.js";
import { buildReviewCaption, mergeReviewSources, parseReviewCsv, PUBLIC_REVIEW_SHEET_CSV, REVIEW_CAPTION_STYLES, REVIEW_POSTER_THEMES, searchReviews } from "../utils/socialReviewSharing.js";
import "./SocialStudentReviews.css";

const STORAGE_KEY = "falowen-social-student-reviews-v1";
const MAX_REVIEW_LENGTH = 1800;
const starterReview = () => ({ id: "", studentName: "", course: "", source: "Student feedback", rating: 5, date: "", review: "", status: "Draft" });

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
        status: ["Draft", "Approved", "Published"].includes(item.status) ? item.status : "Draft",
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
  const [themeId, setThemeId] = useState("blue");
  const [pageIndex, setPageIndex] = useState(0);
  const [pages, setPages] = useState([SOCIAL_STUDENT_REVIEWS[0]?.review || ""]);
  const [search, setSearch] = useState("");
  const [level, setLevel] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sharedInfo, setSharedInfo] = useState("Loading published reviews...");
  const [captionStyle, setCaptionStyle] = useState("falowen");
  const [captionPlatform, setCaptionPlatform] = useState("instagram");
  const [captionEdit, setCaptionEdit] = useState(null);
  const visibleReviews = searchReviews(reviews, search, level, statusFilter);
  const caption = captionEdit === null ? buildReviewCaption(draft, captionStyle, captionPlatform) : captionEdit;
  const [fits, setFits] = useState(true);
  const [savingImage, setSavingImage] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const canvasRef = useRef(null);

  useEffect(() => {
    const context = canvasRef.current?.getContext("2d");
    setPages(context ? splitReviewIntoSlides(context, draft.review, formatId) : []);
    setPageIndex(0);
  }, [draft.review, formatId]);

  useEffect(() => {
    const part = pages[pageIndex] || "";
    const output = drawStudentReviewPoster(canvasRef.current, { ...draft, review: part }, formatId, { themeId, pageIndex, pageCount: pages.length });
    setFits(Boolean(pages.length) && output.fits);
  }, [draft, formatId, themeId, pageIndex, pages]);

  useEffect(() => {
    // Read the public, already-published reviews only when this tab opens.
    const controller = new AbortController();
    (async () => {
      try {
        const response = await fetch(PUBLIC_REVIEW_SHEET_CSV, { signal: controller.signal, cache: "no-store" });
        if (!response.ok) throw new Error("Shared review feed unavailable");
        const imported = parseReviewCsv(await response.text());
        if (controller.signal.aborted) return;
        setReviews((previous) => mergeReviewSources(SOCIAL_STUDENT_REVIEWS, imported, previous));
        setSharedInfo(imported.length ? imported.length + " shared reviews loaded from the published sheet." : "Published sheet returned no compatible reviews.");
      } catch {
        if (!controller.signal.aborted) setSharedInfo("Could not load the published sheet in this browser; locally saved reviews remain available.");
      }
    })();
    return () => controller.abort();
  }, []);

  const edit = (key, value) => {
    setDraft((current) => ({ ...current, [key]: value }));
    setMessage("");
    setError("");
  };

  const chooseReview = (id) => {
    const found = reviews.find((review) => review.id === id);
    setSelectedId(id);
    setCaptionEdit(null);
    setDraft(found ? { ...found } : starterReview());
    setError("");
    setMessage("");
  };

  const startNew = () => {
    setSelectedId("");
    setCaptionEdit(null);
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
      status: ["Draft", "Approved", "Published"].includes(draft.status) ? draft.status : "Draft",
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

  const renderSlide = (canvas, index) => drawStudentReviewPoster(
    canvas, { ...draft, review: pages[index] }, formatId,
    { themeId, pageIndex: index, pageCount: pages.length },
  );
  const toBlob = (canvas) => new Promise((resolve, reject) => {
    canvas.toBlob((output) => output ? resolve(output) : reject(new Error("PNG creation failed")), "image/png");
  });
  const exportPng = async (all = false) => {
    if (savingImage) return;
    if (!draft.studentName.trim() || !draft.review.trim() || !pages.length) {
      setError("Add a complete review before exporting.");
      return;
    }
    setSavingImage(true); setError("");
    try {
      if (all && pages.length > 1) {
        const files = [];
        for (let index = 0; index < pages.length; index++) {
          const canvas = document.createElement("canvas");
          if (!renderSlide(canvas, index).fits) throw new Error("A review slide does not fit.");
          const blob = await toBlob(canvas);
          files.push({ name: reviewImageFileName(draft.studentName, formatId, index + 1), content: new Uint8Array(await blob.arrayBuffer()) });
        }
        downloadBlob(makeCampaignZip(files), "falowen-review-carousel.zip");
        setMessage("Carousel ZIP downloaded with " + files.length + " numbered PNG slides.");
      } else {
        const index = Math.min(pageIndex, pages.length - 1);
        const canvas = canvasRef.current;
        if (!renderSlide(canvas, index).fits) throw new Error("The review text does not fit.");
        downloadBlob(await toBlob(canvas), reviewImageFileName(draft.studentName, formatId, pages.length > 1 ? index + 1 : null));
        setMessage("PNG downloaded.");
      }
    } catch {
      setError("PNG export failed. Check browser download permissions and retry.");
    } finally { setSavingImage(false); }
  };
  const copyCaption = async () => {
    try {
      await navigator.clipboard.writeText(caption);
      setMessage("Falowen Reviews caption copied. Paste it into your social media post.");
      setError("");
    } catch {
      setError("Clipboard access was blocked. Select and copy the caption text manually.");
    }
  };
  const sharePost = async () => {
    if (typeof navigator.share !== "function") { await copyCaption(); return; }
    try {
      const payload = { title: "Falowen Reviews", text: caption };
      if (pages.length === 1 && fits && typeof File !== "undefined") {
        const canvas = document.createElement("canvas");
        if (renderSlide(canvas, 0).fits) {
          const blob = await toBlob(canvas);
          const file = new File([blob], reviewImageFileName(draft.studentName, formatId), { type: "image/png" });
          if (typeof navigator.canShare === "function" && navigator.canShare({ files: [file] })) payload.files = [file];
        }
      }
      await navigator.share(payload);
      setMessage("Share dialog opened. Confirm the post in your chosen app.");
      setError("");
    } catch (cause) {
      if (cause?.name !== "AbortError") setError("Sharing is unavailable. Copy the caption and export the PNG instead.");
    }
  };

  return (
    <section className="social-reviews-workspace" aria-label="Student Reviews">
      <header className="social-reviews-heading">
        <div>
          <span className="social-studio-kicker">Consistent, branded testimonials</span>
          <h2>Student Reviews</h2>
          <p>Choose a reviewer, use a consistent design, then export the PNG and copy a ready-to-share caption.</p>
        </div>
        <span className="social-reviews-mark">Falowen Reviews · Share Studio</span>
      </header>
      <div className="social-reviews-grid">
        <section className="social-reviews-editor">
          <h3>Review details</h3>
          <p role="status" className="social-reviews-hint">{sharedInfo}</p>
          <label htmlFor="social-review-search">Search student reviews</label>
          <input id="social-review-search" type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Student, level or review text" />
          <div className="social-reviews-small-grid">
            <div>
              <label htmlFor="social-review-level-filter">Course level</label>
              <select id="social-review-level-filter" value={level} onChange={(event) => setLevel(event.target.value)}>
                {["all", "A1", "A2", "B1", "B2", "C1", "C2"].map((value) => <option key={value} value={value}>{value === "all" ? "All levels" : value}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="social-review-status-filter">Publication status</label>
              <select id="social-review-status-filter" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                {["all", "Draft", "Approved", "Published"].map((value) => <option key={value} value={value}>{value === "all" ? "All statuses" : value}</option>)}
              </select>
            </div>
          </div>
          <label htmlFor="social-review-student">Select student review</label>
          <div className="social-reviews-select-row">
            <select id="social-review-student" value={selectedId} onChange={(event) => chooseReview(event.target.value)}>
              <option value="">New review</option>
              {visibleReviews.map((item) => <option key={item.id} value={item.id}>{item.studentName} · {item.course || "Student"}</option>)}
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
          <label htmlFor="social-review-status">Publication status</label>
          <select id="social-review-status" value={draft.status || "Draft"} onChange={(event) => edit("status", event.target.value)}>
            <option>Draft</option><option>Approved</option><option>Published</option>
          </select>
          <label htmlFor="social-review-text">Student's exact review</label>
          <textarea id="social-review-text" rows={9} maxLength={MAX_REVIEW_LENGTH} value={draft.review} onChange={(event) => edit("review", event.target.value)} placeholder="Paste the student's own words here" />
          <p className="social-reviews-hint">Keep the original wording. Only use feedback the student has agreed to share publicly. No student photo is needed.</p>
          <div className="social-reviews-actions">
            <button className="social-reviews-primary" type="button" onClick={saveReview}>Save review</button>
            {selectedId && !SOCIAL_STUDENT_REVIEWS.some((review) => review.id === selectedId) ? <button className="social-reviews-secondary" type="button" onClick={removeReview}>Delete saved review</button> : null}
          </div>
          <p className="social-reviews-hint">Published-sheet reviews are loaded on opening this tab. Locally saved edits are not automatically written back to the Google Sheet.</p>
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
          <label className="social-reviews-control-label" htmlFor="social-review-theme">Poster template</label>
          <select className="social-reviews-template-select" id="social-review-theme" value={themeId} onChange={(event) => setThemeId(event.target.value)}>
            {REVIEW_POSTER_THEMES.map((theme) => <option key={theme.id} value={theme.id}>{theme.label}</option>)}
          </select>
          <div className="social-reviews-formats" aria-label="Review poster format">
            {STUDENT_REVIEW_FORMATS.map((format) => (
              <button key={format.id} type="button" aria-pressed={formatId === format.id} onClick={() => setFormatId(format.id)}>
                {format.label}
              </button>
            ))}
          </div>
          {pages.length > 1 ? <div className="social-reviews-pagination">
            <button type="button" className="social-reviews-secondary" disabled={pageIndex === 0} onClick={() => setPageIndex((value) => value - 1)}>Previous</button>
            <strong>Slide {pageIndex + 1} of {pages.length}</strong>
            <button type="button" className="social-reviews-secondary" disabled={pageIndex >= pages.length - 1} onClick={() => setPageIndex((value) => value + 1)}>Next</button>
          </div> : null}
          <div className="social-reviews-canvas-frame">
            <canvas ref={canvasRef} aria-label="Preview of the student testimonial poster" role="img" />
          </div>
          {!fits ? <p role="alert" className="social-reviews-error">This quote cannot fit in this format. Try a taller layout.</p> : null}
          <button type="button" className="social-reviews-export" onClick={() => exportPng(false)} disabled={savingImage || !fits || !pages.length || !draft.studentName.trim() || !draft.review.trim()}>
            {savingImage ? "Preparing PNG..." : pages.length > 1 ? "Export this slide PNG" : "Export PNG"}
          </button>
          {pages.length > 1 ? <button type="button" className="social-reviews-primary social-reviews-wide" onClick={() => exportPng(true)} disabled={savingImage || !fits}>Export all {pages.length} slides (ZIP)</button> : null}
          <div className="social-reviews-caption-box">
            <h3>Falowen Reviews · Share caption</h3>
            <p className="social-reviews-hint">Copy this caption into Instagram, Facebook, LinkedIn or WhatsApp. No AI required.</p>
            <div className="social-reviews-small-grid">
              <div>
                <label htmlFor="social-review-caption-template">Caption template</label>
                <select id="social-review-caption-template" value={captionStyle} onChange={(event) => { setCaptionStyle(event.target.value); setCaptionEdit(null); }}>
                  {REVIEW_CAPTION_STYLES.map((style) => <option key={style.id} value={style.id}>{style.label}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="social-review-caption-platform">Platform</label>
                <select id="social-review-caption-platform" value={captionPlatform} onChange={(event) => { setCaptionPlatform(event.target.value); setCaptionEdit(null); }}>
                  <option value="instagram">Instagram</option><option value="facebook">Facebook</option><option value="linkedin">LinkedIn</option><option value="whatsapp">WhatsApp</option>
                </select>
              </div>
            </div>
            <textarea aria-label="Editable Falowen Reviews social caption" value={caption} rows={12} onChange={(event) => setCaptionEdit(event.target.value)} />
            <div className="social-reviews-actions">
              <button className="social-reviews-primary" type="button" onClick={copyCaption}>Copy caption</button>
              <button className="social-reviews-secondary" type="button" onClick={sharePost}>Share post</button>
              {captionEdit !== null ? <button className="social-reviews-secondary" type="button" onClick={() => setCaptionEdit(null)}>Reset template</button> : null}
            </div>
            {(draft.status || "Draft") === "Draft" ? <p className="social-reviews-hint">Draft review: confirm permission and approve before posting publicly.</p> : null}
          </div>
        </section>
      </div>
    </section>
  );
}
