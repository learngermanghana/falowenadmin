import { useCallback, useEffect, useMemo, useState } from "react";
import { collection, doc, getDoc, getDocs, orderBy, query, serverTimestamp, updateDoc } from "firebase/firestore";
import { Link, useNavigate, useParams } from "react-router-dom";
import { db } from "../firebase.js";
import { useToast } from "../context/ToastContext.jsx";

const COLLECTION_NAME = "examTutorReviewQueue";

function toDate(value) {
  if (!value) return null;
  if (typeof value.toDate === "function") return value.toDate();
  if (typeof value.seconds === "number") return new Date(value.seconds * 1000);
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function displayDate(value) {
  const date = toDate(value);
  return date ? date.toLocaleString() : "—";
}

function normalize(value) {
  return String(value || "").trim();
}

function statusLabel(status) {
  const normalized = normalize(status || "pending").toLowerCase();
  if (normalized === "reviewed") return "Reviewed";
  if (normalized === "sent") return "Sent";
  if (normalized === "needs_changes") return "Needs changes";
  return "Pending";
}

function statusColor(status) {
  const normalized = normalize(status || "pending").toLowerCase();
  if (normalized === "reviewed" || normalized === "sent") return "#dcfce7";
  if (normalized === "needs_changes") return "#fef3c7";
  return "#eff6ff";
}

function compactText(value, max = 110) {
  const text = normalize(value).replace(/\s+/g, " ");
  return text.length > max ? `${text.slice(0, max)}...` : text;
}

function wordCount(value) {
  return normalize(value).split(/\s+/).filter(Boolean).length;
}

function normalizeReviewDoc(docSnap) {
  const data = docSnap.data() || {};
  return {
    id: docSnap.id,
    ...data,
    createdAtDate: toDate(data.createdAt),
  };
}

export default function ExamTutorReviewQueuePage() {
  const { reviewId } = useParams();
  const navigate = useNavigate();
  const { success, error } = useToast();
  const [rows, setRows] = useState([]);
  const [selectedId, setSelectedId] = useState(reviewId || "");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusFilter, setStatusFilter] = useState("pending");
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({
    revisedDraft: "",
    tutorFeedback: "",
    aiFeedback: "",
    reviewStatus: "pending",
  });

  const selected = useMemo(() => rows.find((row) => row.id === selectedId) || null, [rows, selectedId]);

  const hydrateForm = useCallback((entry) => {
    setForm({
      revisedDraft: entry?.revisedDraft || entry?.draft || "",
      tutorFeedback: entry?.tutorFeedback || "",
      aiFeedback: entry?.aiFeedback || "",
      reviewStatus: entry?.reviewStatus || "pending",
    });
  }, []);

  const loadRows = useCallback(async () => {
    setLoading(true);
    try {
      let snap;
      try {
        snap = await getDocs(query(collection(db, COLLECTION_NAME), orderBy("createdAt", "desc")));
      } catch {
        snap = await getDocs(collection(db, COLLECTION_NAME));
      }

      const nextRows = [];
      snap.forEach((docSnap) => nextRows.push(normalizeReviewDoc(docSnap)));
      nextRows.sort((a, b) => (b.createdAtDate?.getTime() || 0) - (a.createdAtDate?.getTime() || 0));

      if (reviewId && !nextRows.some((row) => row.id === reviewId)) {
        const directSnap = await getDoc(doc(db, COLLECTION_NAME, reviewId));
        if (directSnap.exists()) nextRows.unshift(normalizeReviewDoc(directSnap));
      }

      setRows(nextRows);
      const nextSelectedId = reviewId || selectedId || nextRows[0]?.id || "";
      setSelectedId(nextSelectedId);
      const nextSelected = nextRows.find((row) => row.id === nextSelectedId) || nextRows[0] || null;
      hydrateForm(nextSelected);
    } catch (err) {
      error(err?.message || "Failed to load exam tutor review queue.");
    } finally {
      setLoading(false);
    }
  }, [error, hydrateForm, reviewId, selectedId]);

  useEffect(() => {
    void loadRows();
  }, [loadRows]);

  useEffect(() => {
    if (!reviewId || reviewId === selectedId) return;
    setSelectedId(reviewId);
  }, [reviewId, selectedId]);

  useEffect(() => {
    if (selected) hydrateForm(selected);
  }, [hydrateForm, selected?.id]);

  const filteredRows = useMemo(() => {
    const q = normalize(search).toLowerCase();
    return rows.filter((row) => {
      const reviewStatus = normalize(row.reviewStatus || "pending").toLowerCase();
      const matchesStatus = statusFilter === "all" || reviewStatus === statusFilter;
      if (!matchesStatus) return false;
      if (!q) return true;
      const haystack = [
        row.studentName,
        row.studentCode,
        row.studentEmail,
        row.level,
        row.promptTitle,
        row.draft,
        row.revisedDraft,
        row.reflection,
      ].join(" ").toLowerCase();
      return haystack.includes(q);
    });
  }, [rows, search, statusFilter]);

  const handleSelect = (id) => {
    const entry = rows.find((row) => row.id === id);
    setSelectedId(id);
    hydrateForm(entry);
    navigate(`/examTutorReviewQueue/${id}`);
  };

  const saveReview = async (nextStatus = form.reviewStatus || "pending") => {
    if (!selected) {
      error("Select a review item first.");
      return;
    }

    setSaving(true);
    try {
      const reviewed = ["reviewed", "sent"].includes(String(nextStatus).toLowerCase());
      const payload = {
        revisedDraft: form.revisedDraft,
        tutorFeedback: form.tutorFeedback,
        aiFeedback: form.aiFeedback,
        reviewStatus: nextStatus,
        updatedAt: serverTimestamp(),
        reviewedAt: reviewed ? serverTimestamp() : null,
      };

      await updateDoc(doc(db, COLLECTION_NAME, selected.id), payload);
      setRows((current) => current.map((row) => row.id === selected.id ? {
        ...row,
        ...payload,
        updatedAt: new Date(),
        reviewedAt: reviewed ? new Date() : null,
      } : row));
      setForm((current) => ({ ...current, reviewStatus: nextStatus }));
      success(reviewed ? "Exam review saved and marked reviewed." : "Exam review saved.");
    } catch (err) {
      error(err?.message || "Failed to save exam review.");
    } finally {
      setSaving(false);
    }
  };

  const copyStudentFeedback = async () => {
    const text = form.tutorFeedback || form.aiFeedback || "";
    if (!text.trim()) {
      error("No tutor feedback to copy.");
      return;
    }
    try {
      await navigator.clipboard.writeText(text);
      success("Feedback copied.");
    } catch {
      error("Could not copy feedback.");
    }
  };

  const selectedStatus = selected?.reviewStatus || form.reviewStatus || "pending";

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <section style={{ border: "1px solid #ddd", borderRadius: 10, padding: 12, display: "grid", gap: 10 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
          <div>
            <h2 style={{ margin: 0 }}>Exam Tutor Review Queue</h2>
            <p style={{ margin: "4px 0 0", opacity: 0.75 }}>
              Separate queue for exam warm-up writing, mock exam practice, and exam-prep work sent from Falowen.
            </p>
          </div>
          <button type="button" onClick={loadRows} disabled={loading}>{loading ? "Loading..." : "Refresh"}</button>
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {["pending", "reviewed", "needs_changes", "all"].map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setStatusFilter(status)}
              style={{ fontWeight: statusFilter === status ? 700 : 500 }}
            >
              {status === "all" ? "All" : statusLabel(status)}
            </button>
          ))}
        </div>

        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search student, level, prompt, email, or draft..."
        />
      </section>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(260px, 360px) 1fr", gap: 14, alignItems: "start" }}>
        <section style={{ border: "1px solid #ddd", borderRadius: 10, padding: 12, display: "grid", gap: 8, maxHeight: "75vh", overflow: "auto" }}>
          <h3 style={{ margin: 0 }}>Review items ({filteredRows.length})</h3>
          {loading ? <p>Loading reviews...</p> : null}
          {!loading && !filteredRows.length ? <p>No exam review items found for this filter.</p> : null}
          {filteredRows.map((row) => (
            <button
              key={row.id}
              type="button"
              onClick={() => handleSelect(row.id)}
              style={{
                textAlign: "left",
                border: selectedId === row.id ? "2px solid #2563eb" : "1px solid #ddd",
                borderRadius: 10,
                background: selectedId === row.id ? "#eff6ff" : "#fff",
                padding: 10,
                display: "grid",
                gap: 5,
                cursor: "pointer",
              }}
            >
              <strong>{row.studentName || row.studentCode || "Unknown student"}</strong>
              <span style={{ fontSize: 13 }}>{row.level || "—"} · {row.studentEmail || "No email"}</span>
              <span style={{ fontSize: 13 }}>{compactText(row.promptTitle || row.promptId || "Exam practice")}</span>
              <span style={{ fontSize: 12, opacity: 0.7 }}>{displayDate(row.createdAt)}</span>
              <span style={{ justifySelf: "start", borderRadius: 999, padding: "3px 8px", fontSize: 12, background: statusColor(row.reviewStatus) }}>
                {statusLabel(row.reviewStatus)}
              </span>
            </button>
          ))}
        </section>

        <section style={{ border: "1px solid #ddd", borderRadius: 10, padding: 12, display: "grid", gap: 12 }}>
          {!selected ? (
            <p>Select an exam review item.</p>
          ) : (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                <div>
                  <h3 style={{ margin: 0 }}>{selected.studentName || "Unknown student"}</h3>
                  <p style={{ margin: "4px 0 0", opacity: 0.75 }}>
                    {selected.studentCode || "No code"} · {selected.level || "No level"} · {selected.studentEmail || "No email"}
                  </p>
                </div>
                <span style={{ alignSelf: "start", borderRadius: 999, padding: "5px 10px", background: statusColor(selectedStatus) }}>
                  {statusLabel(selectedStatus)}
                </span>
              </div>

              <div style={{ border: "1px solid #eee", borderRadius: 8, padding: 10, display: "grid", gap: 6 }}>
                <strong>{selected.promptTitle || selected.promptId || "Exam practice prompt"}</strong>
                <span style={{ fontSize: 13, opacity: 0.75 }}>Source: {selected.source || "—"} · Created: {displayDate(selected.createdAt)}</span>
                {selected.reflection ? <pre style={{ whiteSpace: "pre-wrap", fontFamily: "inherit", margin: 0 }}>{selected.reflection}</pre> : null}
              </div>

              <label style={{ display: "grid", gap: 4 }}>
                Student draft ({wordCount(selected.draft)} words)
                <textarea readOnly rows={8} value={selected.draft || ""} />
              </label>

              <label style={{ display: "grid", gap: 4 }}>
                Revised draft / tutor correction ({wordCount(form.revisedDraft)} words)
                <textarea
                  rows={8}
                  value={form.revisedDraft}
                  onChange={(event) => setForm((current) => ({ ...current, revisedDraft: event.target.value }))}
                />
              </label>

              <label style={{ display: "grid", gap: 4 }}>
                Tutor feedback for student
                <textarea
                  rows={6}
                  value={form.tutorFeedback}
                  onChange={(event) => setForm((current) => ({ ...current, tutorFeedback: event.target.value }))}
                  placeholder="Write clear tutor feedback here. This is separate from normal class submission marking."
                />
              </label>

              <details>
                <summary style={{ cursor: "pointer", fontWeight: 700 }}>AI feedback / internal note</summary>
                <textarea
                  rows={5}
                  value={form.aiFeedback}
                  onChange={(event) => setForm((current) => ({ ...current, aiFeedback: event.target.value }))}
                  placeholder="Optional AI/internal feedback."
                  style={{ width: "100%", marginTop: 8 }}
                />
              </details>

              <label style={{ display: "grid", gap: 4 }}>
                Review status
                <select
                  value={form.reviewStatus}
                  onChange={(event) => setForm((current) => ({ ...current, reviewStatus: event.target.value }))}
                >
                  <option value="pending">Pending</option>
                  <option value="needs_changes">Needs changes</option>
                  <option value="reviewed">Reviewed</option>
                  <option value="sent">Sent</option>
                </select>
              </label>

              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button type="button" onClick={() => saveReview(form.reviewStatus)} disabled={saving}>
                  {saving ? "Saving..." : "Save Review"}
                </button>
                <button type="button" onClick={() => saveReview("reviewed")} disabled={saving}>
                  Save & Mark Reviewed
                </button>
                <button type="button" onClick={() => saveReview("pending")} disabled={saving}>
                  Return to Pending
                </button>
                <button type="button" onClick={copyStudentFeedback}>Copy Feedback</button>
                <Link to={`/examTutorReviewQueue/${selected.id}`}>Open direct link</Link>
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
