import { useMemo, useState } from "react";
import { courseDictionary, compareCourseDictionaryEntries } from "../data/courseDictionary.js";
import { getTeachingSlideByAssignmentId } from "../data/teachingSlides.js";
import {
  SOCIAL_VIDEO_TEMPLATES, lessonContentChoices, socialScript,
  socialCaption, notebookPack, socialUseKey,
} from "../utils/socialCourseTemplates.js";
import { useToast } from "../context/ToastContext";

const STORAGE_KEY = "falowen-social-content-v1";
const PLATFORMS = ["TikTok", "Instagram", "YouTube Shorts"];
const LEVELS = ["A1", "A2", "B1"];
const STATUS = ["Draft", "Ready", "Published"];
function dictionaryEntries(level) {
  return Object.values(courseDictionary[level] || {}).sort(compareCourseDictionaryEntries);
}
function readSaved() {
  try {
    const rows = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(rows) ? rows.filter((row) => row && typeof row === "object").slice(0, 100) : [];
  } catch {
    return [];
  }
}
function downloadText(name, content) {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = name;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function safeUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && Boolean(url.hostname);
  } catch {
    return false;
  }
}
export default function SocialCourseContentCreator() {
  const { pushToast } = useToast();
  const [level, setLevel] = useState("A1");
  const [assignmentId, setAssignmentId] = useState(() => dictionaryEntries("A1")[0]?.assignment_id || "");
  const [templateId, setTemplateId] = useState("speaking");
  const [platform, setPlatform] = useState("TikTok");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [edits, setEdits] = useState({});
  const [captionEdit, setCaptionEdit] = useState(null);
  const [status, setStatus] = useState("Draft");
  const [publishedUrl, setPublishedUrl] = useState("");
  const [saved, setSaved] = useState(readSaved);
  const [showTracker, setShowTracker] = useState(false);

  const entries = useMemo(() => dictionaryEntries(level), [level]);
  const entry = entries.find((row) => row.assignment_id === assignmentId) || entries[0] || {};
  const slide = getTeachingSlideByAssignmentId(entry.assignment_id);
  const choices = useMemo(() => lessonContentChoices(slide || {}, templateId), [slide, templateId]);
  const selected = choices[selectedIndex] || choices[0] || null;
  const primary = edits.primary ?? selected?.text ?? "";
  const answer = edits.answer ?? selected?.answer ?? "";
  const suggestion = selected?.suggestion || "";
  const scriptInput = { entry, templateId, primary, answer, platform };
  const script = socialScript(scriptInput);
  const autoCaption = socialCaption(scriptInput);
  const caption = captionEdit ?? autoCaption;
  const needsReview = !primary.trim() || !answer.trim();
  const key = socialUseKey({ assignmentId: entry.assignment_id, templateId, question: primary, platform });
  const priorUse = saved.find((row) => row.key === key);
  const sourceUrl = slide ? "/teaching-slides/course/" + slide.course + "/" + slide.id + "?present=1" : "";

  function changeLevel(value) {
    setLevel(value);
    setAssignmentId(dictionaryEntries(value)[0]?.assignment_id || "");
    setSelectedIndex(0);
    setEdits({});
    setCaptionEdit(null);
  }
  function changeLesson(value) {
    setAssignmentId(value);
    setSelectedIndex(0);
    setEdits({});
    setCaptionEdit(null);
  }
  function changeTemplate(value) {
    setTemplateId(value);
    setSelectedIndex(0);
    setEdits({});
    setCaptionEdit(null);
  }
  async function copy(text, name) {
    try {
      await navigator.clipboard.writeText(text);
      pushToast({ type: "success", message: name + " copied." });
    } catch {
      pushToast({ type: "error", message: "Could not copy. Select and copy the text manually." });
    }
  }
  function save() {
    if (!primary.trim()) {
      pushToast({ type: "error", message: "Choose lesson content or enter reviewed teaching text first." });
      return;
    }
    if (status !== "Draft" && needsReview) {
      pushToast({ type: "error", message: "A reviewed answer or explanation is required before marking this ready or published." });
      return;
    }
    if (status === "Published" && !safeUrl(publishedUrl)) {
      pushToast({ type: "error", message: "Enter a valid HTTPS post URL before marking this published." });
      return;
    }
    const now = new Date().toISOString();
    const record = {
      key, assignmentId: entry.assignment_id, topic: entry.en || entry.de,
      templateId, platform, question: primary, answer, caption, script,
      status, publishedUrl: status === "Published" ? publishedUrl.trim() : "",
      createdAt: priorUse?.createdAt || now, updatedAt: now,
    };
    const updated = [record, ...saved.filter((row) => row.key !== key)].slice(0, 100);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      setSaved(updated);
      pushToast({ type: "success", message: "Content saved on this browser." });
    } catch {
      pushToast({ type: "error", message: "Browser storage unavailable; please download the content pack." });
    }
  }
  function loadRecord(record) {
    const nextLevel = String(record.assignmentId || "").split("-")[0];
    if (!LEVELS.includes(nextLevel)) return;
    setLevel(nextLevel);
    setAssignmentId(record.assignmentId);
    setTemplateId(record.templateId);
    setPlatform(record.platform);
    setSelectedIndex(0);
    setEdits({ primary: record.question || "", answer: record.answer || "" });
    setCaptionEdit(record.caption || "");
    setStatus(record.status || "Draft");
    setPublishedUrl(record.publishedUrl || "");
    setShowTracker(false);
  }
  const downloadedName = [
    "falowen", entry.assignment_id || "lesson", templateId, platform,
  ].join("-").toLowerCase().replace(/[^a-z0-9-]+/g, "-");

  return (
    <section className="social-course-studio">
      <div className="social-section-lead">
        <div>
          <h2>Course Content Creator</h2>
          <p>Reuse real Falowen lesson questions and teaching notes. No AI, no video uploads.</p>
        </div>
        <button type="button" className="social-button-quiet" onClick={() => setShowTracker((open) => !open)}>
          {showTracker ? "Hide saved content" : "Saved content (" + saved.length + ")"}
        </button>
      </div>
      {showTracker && (
        <section className="social-panel social-tracker">
          <h3>Saved content on this browser</h3>
          <p>These drafts are local to this browser and are not synchronized with your other staff accounts.</p>
          {saved.length ? (
            <div className="social-saved-list">
              {saved.slice(0, 30).map((record) => (
                <button type="button" key={record.key} onClick={() => loadRecord(record)} className="social-saved-item">
                  <strong>{record.assignmentId} · {SOCIAL_VIDEO_TEMPLATES.find((item) => item.id === record.templateId)?.label || record.templateId}</strong>
                  <span>{record.platform} · {record.status} · {record.question.slice(0, 75)}</span>
                </button>
              ))}
            </div>
          ) : <p>No saved content yet.</p>}
        </section>
      )}
      <div className="social-creator-grid">
        <section className="social-panel">
          <h3>1. Choose source material</h3>
          <div className="social-form-row">
            <label htmlFor="social-level">Level</label>
            <select id="social-level" value={level} onChange={(e) => changeLevel(e.target.value)}>
              {LEVELS.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </div>
          <div className="social-form-row">
            <label htmlFor="social-lesson">Course dictionary lesson</label>
            <select id="social-lesson" value={entry.assignment_id || ""} onChange={(e) => changeLesson(e.target.value)}>
              {entries.map((item) => <option key={item.assignment_id} value={item.assignment_id}>{item.assignment_id} · {item.en || item.de}</option>)}
            </select>
          </div>
          <div className="social-source-note">
            <span>{slide ? "Teaching slide connected" : "No teaching slide found"}</span>
            {slide && <a target="_blank" rel="noreferrer" href={sourceUrl}>View original lesson ↗</a>}
          </div>
          <div className="social-form-row">
            <label htmlFor="social-video-type">Video template</label>
            <select id="social-video-type" value={templateId} onChange={(e) => changeTemplate(e.target.value)}>
              {SOCIAL_VIDEO_TEMPLATES.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
            </select>
            <small>{SOCIAL_VIDEO_TEMPLATES.find((item) => item.id === templateId)?.hint}</small>
          </div>
          <div className="social-form-row">
            <label htmlFor="social-content-choice">Lesson content</label>
            <select id="social-content-choice" value={choices.length ? Math.min(selectedIndex, choices.length - 1) : ""} disabled={!choices.length}
              onChange={(e) => { setSelectedIndex(Number(e.target.value)); setEdits({}); setCaptionEdit(null); }}>
              {choices.length ? choices.map((item, index) => <option key={index} value={index}>{index + 1}. {item.text.slice(0, 112)}</option>) : <option value="">No authored content available</option>}
            </select>
            <small>{selected ? "Source: " + selected.source : "Select another lesson or template. Any manual additions need teacher review."}</small>
          </div>
          <h3 className="social-subhead">2. Review the teaching text</h3>
          <div className="social-form-row">
            <label htmlFor="social-primary">{templateId === "grammar" ? "Verified grammar explanation" : templateId === "mistake" ? "Common mistake teaching note" : templateId === "vocabulary" ? "German phrase" : "German question"}</label>
            <textarea id="social-primary" value={primary} rows={3} onChange={(e) => { setEdits((current) => ({ ...current, primary: e.target.value })); setCaptionEdit(null); }} />
          </div>
          <div className="social-form-row">
            <label htmlFor="social-answer">{templateId === "grammar" ? "Teacher-approved example" : templateId === "vocabulary" ? "Reviewed English meaning" : templateId === "mistake" ? "Reviewed correction / explanation" : "Verified model answer"}</label>
            <textarea id="social-answer" value={answer} rows={3} onChange={(e) => setEdits((current) => ({ ...current, answer: e.target.value }))} placeholder="Use an accurate example already present in the lesson, or enter a teacher-reviewed answer." />
            {suggestion && !answer && <button type="button" className="social-text-button" onClick={() => setEdits((current) => ({ ...current, answer: suggestion }))}>Use lesson example (review first): {suggestion.slice(0, 80)}</button>}
          </div>
          {needsReview && <p className="social-inline-warning">This is a draft: {primary.trim() ? "add a teacher-verified answer or explanation before publishing." : "choose source material before exporting."}</p>}
          {priorUse && <p className="social-inline-info">Already saved as {priorUse.status} for {priorUse.platform}. Select another source item to avoid repeating the same video.</p>}
          <div className="social-form-row">
            <label htmlFor="social-platform">Destination</label>
            <select id="social-platform" value={platform} onChange={(e) => { setPlatform(e.target.value); setCaptionEdit(null); }}>
              {PLATFORMS.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </div>
        </section>
        <section className="social-panel social-preview-panel">
          <div className="social-preview-header">
            <div>
              <h3>Video script preview</h3>
              <span>{entry.assignment_id} · {SOCIAL_VIDEO_TEMPLATES.find((item) => item.id === templateId)?.label}</span>
            </div>
            <button type="button" className="social-button-quiet" onClick={() => copy(script, "Script")}>Copy script</button>
          </div>
          <pre className="social-script-preview">{script}</pre>
          <div className="social-actions">
            <button type="button" className="social-primary-button" disabled={!primary.trim()} onClick={() => downloadText(downloadedName + "-notebooklm.txt", notebookPack(scriptInput))}>Download NotebookLM pack</button>
            <button type="button" className="social-button-quiet" disabled={!primary.trim()} onClick={() => downloadText(downloadedName + "-script.txt", script)}>Download script</button>
          </div>
          <div className="social-caption-block">
            <div className="social-preview-header">
              <h3>Post caption</h3>
              <button type="button" className="social-button-quiet" onClick={() => copy(caption, "Caption")}>Copy</button>
            </div>
            <textarea value={caption} rows={5} onChange={(e) => setCaptionEdit(e.target.value)} aria-label="Editable social media caption" />
          </div>
          <details className="social-save-details">
            <summary>Save & track content</summary>
            <div className="social-form-row">
              <label htmlFor="social-status">Status</label>
              <select id="social-status" value={status} onChange={(e) => setStatus(e.target.value)}>
                {STATUS.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
            </div>
            {status === "Published" && (
              <div className="social-form-row">
                <label htmlFor="social-post-url">Published post URL</label>
                <input id="social-post-url" type="url" value={publishedUrl} onChange={(e) => setPublishedUrl(e.target.value)} placeholder="https://www.tiktok.com/..." />
              </div>
            )}
            <button type="button" className="social-primary-button" onClick={save}>Save content record</button>
            <small>Saved locally on this device; no video files or AI usage.</small>
          </details>
        </section>
      </div>
    </section>
  );
}
