import { useEffect, useMemo, useState } from "react";
import { teachingSlides } from "../data/teachingSlides.js";
import {
  loadAssignmentRegistryPreview,
  publishAssignmentRegistryDraft,
} from "../services/assignmentRegistryService.js";
import { buildAssignmentRegistryDrafts } from "../utils/assignmentRegistry.js";
import { WRITING_REGISTERS, WRITING_TEXT_TYPES } from "../utils/writingTaskSchema.js";

const baseDrafts = buildAssignmentRegistryDrafts(teachingSlides);
const textTypeOptions = Object.values(WRITING_TEXT_TYPES).filter((value) => value !== WRITING_TEXT_TYPES.WRITING);
const registerOptions = [WRITING_REGISTERS.INFORMAL, WRITING_REGISTERS.FORMAL];

function mergePublishedIntoDraft(draft, published) {
  if (!published) return structuredClone(draft);
  return {
    ...structuredClone(draft),
    ...published,
    source: { ...(draft.source || {}), ...(published.source || {}) },
    publicTask: { ...(draft.publicTask || {}), ...(published.publicTask || {}), promptVerified: true },
    markingSpec: { ...(draft.markingSpec || {}), ...(published.markingSpec || {}) },
  };
}

function fieldStyle() {
  return { width: "100%", boxSizing: "border-box", border: "1px solid #d1d5db", borderRadius: 8, padding: "9px 10px", font: "inherit" };
}

export default function AssignmentRegistryPage() {
  const [published, setPublished] = useState([]);
  const [selectedId, setSelectedId] = useState(baseDrafts[0]?.assignmentId || "");
  const [draft, setDraft] = useState(baseDrafts[0] || null);
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [message, setMessage] = useState("");
  const [registryError, setRegistryError] = useState("");

  const publishedById = useMemo(() => new Map(published.map((row) => [row.assignmentId || row.id, row])), [published]);
  const visibleDrafts = useMemo(() => {
    const query = filter.trim().toLowerCase();
    return baseDrafts.filter((row) => !query || `${row.assignmentId} ${row.title} ${row.level}`.toLowerCase().includes(query));
  }, [filter]);

  async function refreshRegistry() {
    setLoading(true);
    setRegistryError("");
    try {
      setPublished(await loadAssignmentRegistryPreview());
    } catch (error) {
      setPublished([]);
      setRegistryError(error?.code === "permission-denied"
        ? "Firestore denied access to the existing Admin answer-key registry. Sign in with an authorised Admin account before publishing."
        : (error?.message || "Could not load assignment registry."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { refreshRegistry(); }, []);

  useEffect(() => {
    const base = baseDrafts.find((row) => row.assignmentId === selectedId);
    if (base) setDraft(mergePublishedIntoDraft(base, publishedById.get(selectedId)));
  }, [selectedId, publishedById]);

  if (!draft) return <p>No A2/B1 workbook writing tasks were found.</p>;

  const pointText = (draft.markingSpec?.taskPoints || []).map((point) => point.requirement).join("\n");
  const selectedPublished = publishedById.get(draft.assignmentId);

  function updateTaskPoints(value) {
    const requirements = value.split(/\r?\n/).map((item) => item.trim()).filter(Boolean);
    setDraft((current) => ({
      ...current,
      publicTask: { ...current.publicTask, taskPoints: requirements },
      markingSpec: {
        ...current.markingSpec,
        taskPoints: requirements.map((requirement, index) => ({ id: `point_${index + 1}`, requirement })),
      },
    }));
  }

  async function publish() {
    setPublishing(true);
    setMessage("");
    try {
      const result = await publishAssignmentRegistryDraft(draft);
      setMessage(`${result.assignmentId} published as Admin version ${result.version}. The canonical task and immutable version snapshot were saved in the existing answer-key registry.`);
      await refreshRegistry();
    } catch (error) {
      setMessage(error?.message || "Publishing failed.");
    } finally {
      setPublishing(false);
    }
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "minmax(250px, 0.7fr) minmax(420px, 1.3fr)", gap: 14, alignItems: "start" }}>
      <section style={{ border: "1px solid #ddd", borderRadius: 10, padding: 12, display: "grid", gap: 10 }}>
        <div>
          <h3 style={{ margin: 0 }}>Assignment Registry</h3>
          <p style={{ margin: "5px 0 0", fontSize: 13, color: "#4b5563" }}>
            Canonical A2/B1 writing tasks for Admin marking. Phase 1 stays private inside the existing answer-key registry; the student-safe Falowen projection will be added only when we connect the Falowen app.
          </p>
        </div>
        <input value={filter} onChange={(event) => setFilter(event.target.value)} placeholder="Filter assignment…" style={fieldStyle()} />
        <div style={{ fontSize: 12, color: "#6b7280" }}>
          {baseDrafts.length} writing tasks detected · {published.length} published {loading ? "· loading…" : ""}
        </div>
        {registryError ? <div style={{ padding: 10, borderRadius: 8, background: "#fff7ed", fontSize: 13 }}>{registryError}</div> : null}
        <div style={{ display: "grid", gap: 6, maxHeight: 620, overflow: "auto" }}>
          {visibleDrafts.map((row) => {
            const live = publishedById.get(row.assignmentId);
            const active = row.assignmentId === selectedId;
            return (
              <button key={row.assignmentId} type="button" onClick={() => setSelectedId(row.assignmentId)} style={{ textAlign: "left", border: active ? "2px solid #2563eb" : "1px solid #d1d5db", borderRadius: 8, padding: 9, background: active ? "#eff6ff" : "#fff", cursor: "pointer" }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                  <strong>{row.assignmentId}</strong>
                  <span style={{ fontSize: 12 }}>{live ? `v${live.version}` : "Draft"}</span>
                </div>
                <div style={{ fontSize: 12, color: "#4b5563", marginTop: 3 }}>{row.title}</div>
              </button>
            );
          })}
        </div>
      </section>

      <section style={{ border: "1px solid #ddd", borderRadius: 10, padding: 14, display: "grid", gap: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "start" }}>
          <div>
            <h3 style={{ margin: 0 }}>{draft.assignmentId} · {draft.title}</h3>
            <p style={{ margin: "4px 0 0", fontSize: 13, color: "#6b7280" }}>
              {selectedPublished ? `Published Admin version ${selectedPublished.version}. Publishing again creates another immutable snapshot.` : "Not published in the Admin registry yet."}
            </p>
          </div>
          <span style={{ padding: "4px 8px", borderRadius: 999, background: "#f3f4f6", fontSize: 12 }}>{draft.level}</span>
        </div>

        <div style={{ padding: 10, borderRadius: 8, background: "#f9fafb", fontSize: 13 }}>
          <strong>Workbook source summary</strong>
          <div style={{ marginTop: 5 }}>{draft.source?.summary}</div>
        </div>

        <label style={{ display: "grid", gap: 5 }}>
          <strong>Exact student-facing prompt</strong>
          <textarea rows={5} value={draft.publicTask?.prompt || ""} onChange={(event) => setDraft((current) => ({ ...current, publicTask: { ...current.publicTask, prompt: event.target.value, promptVerified: false } }))} style={fieldStyle()} />
          <span style={{ fontSize: 12, color: "#6b7280" }}>The initial value comes from the Admin workbook summary. Replace it with the exact wording students see when needed.</span>
        </label>

        <label style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 13 }}>
          <input type="checkbox" checked={Boolean(draft.publicTask?.promptVerified)} onChange={(event) => setDraft((current) => ({ ...current, publicTask: { ...current.publicTask, promptVerified: event.target.checked } }))} />
          I verified that this is the exact student-facing task.
        </label>

        <label style={{ display: "grid", gap: 5 }}>
          <strong>Required task points · one per line</strong>
          <textarea rows={5} value={pointText} onChange={(event) => updateTaskPoints(event.target.value)} style={fieldStyle()} />
        </label>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <label style={{ display: "grid", gap: 5 }}>
            <strong>Text type</strong>
            <select value={draft.markingSpec?.textType || ""} onChange={(event) => setDraft((current) => ({ ...current, markingSpec: { ...current.markingSpec, textType: event.target.value } }))} style={fieldStyle()}>
              {textTypeOptions.map((value) => <option key={value} value={value}>{value}</option>)}
            </select>
          </label>
          <label style={{ display: "grid", gap: 5 }}>
            <strong>Register</strong>
            <select value={draft.markingSpec?.register || ""} onChange={(event) => setDraft((current) => ({ ...current, markingSpec: { ...current.markingSpec, register: event.target.value } }))} style={fieldStyle()}>
              {registerOptions.map((value) => <option key={value} value={value}>{value}</option>)}
            </select>
          </label>
        </div>

        <label style={{ display: "grid", gap: 5 }}>
          <strong>Recipient role</strong>
          <input value={draft.markingSpec?.recipient || ""} onChange={(event) => setDraft((current) => ({ ...current, markingSpec: { ...current.markingSpec, recipient: event.target.value } }))} style={fieldStyle()} />
        </label>

        <div style={{ padding: 10, borderRadius: 8, background: "#eff6ff", fontSize: 13 }}>
          Phase 1 writes into the existing admin-only <code>answerKeyRegistry</code> collection in one Firestore transaction. It adds no Vercel API route and requires no new Firestore collection rules. Falowen remains untouched until phase 2.
        </div>

        {message ? <div style={{ padding: 10, borderRadius: 8, background: message.includes("published") ? "#ecfdf5" : "#fff7ed", fontSize: 13 }}>{message}</div> : null}

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button type="button" disabled={publishing} onClick={publish} style={{ border: 0, borderRadius: 8, padding: "10px 14px", background: "#111827", color: "#fff", fontWeight: 700, cursor: publishing ? "wait" : "pointer" }}>
            {publishing ? "Publishing…" : selectedPublished ? "Publish new Admin version" : "Publish to Admin registry"}
          </button>
          <button type="button" onClick={() => setDraft(mergePublishedIntoDraft(baseDrafts.find((row) => row.assignmentId === selectedId), publishedById.get(selectedId)))} style={{ border: "1px solid #d1d5db", borderRadius: 8, padding: "10px 14px", background: "#fff", fontWeight: 600, cursor: "pointer" }}>
            Reset editor
          </button>
        </div>
      </section>
    </div>
  );
}
