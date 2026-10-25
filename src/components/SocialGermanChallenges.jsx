import {chooseSocialVideoFormat, requireValidSocialVideo} from "../utils/socialMp4Export.js";
import { SOCIAL_MUSIC_TRACKS, addSocialMusic } from "../utils/socialMusicLibrary.js";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  CHALLENGE_LEVELS, CHALLENGE_TYPES, challengeCopy,
  filterGermanChallenges, nextUnusedGermanChallenge,
  SOCIAL_GERMAN_CHALLENGES,
} from "../data/socialGermanChallenges.js";
import {
  CHALLENGE_EXPORT_SIZES, CHALLENGE_SCENES, CHALLENGE_VIDEO_SECONDS,
  challengeFileStem, challengeVideoMime, renderChallengeFrame, sceneAtTime,
} from "../utils/socialGermanChallengeRender.js";

const STORAGE_KEY = "falowen-social-german-challenge-status-v1";
const PANEL = { border: "1px solid #dce5ee", background: "#fff", borderRadius: 15, padding: 16, display: "grid", gap: 13 };
const FIELD = { boxSizing: "border-box", width: "100%", padding: 10, border: "1px solid #cbd5e1", borderRadius: 9, background: "#fff", color: "#0f172a" };
const NOTE = { margin: 0, fontSize: 13, color: "#64748b", lineHeight: 1.5 };
function getStatuses() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    return saved && typeof saved === "object" && !Array.isArray(saved) ? saved : {};
  } catch { return {}; }
}
function download(blob, filename) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url; anchor.download = filename;
  document.body.appendChild(anchor); anchor.click(); anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}
function captionFromCopy(entry, copy) {
  if (!entry || !copy) return "";
  return [
    copy.hook,
    copy.challenge,
    entry.type === "dialogue" ? "🇩🇪 Read it aloud, then check the translation." : "💬 Comment your answer before you reveal it.",
    "✅ " + copy.reveal,
    "💡 " + copy.explanation,
    "Learn with Falowen: https://falowen.app",
    entry.type === "exam" ? "#GermanExam #GoethePreparation #LearnGerman #Falowen" : "#LearnGerman #DeutschLernen #GermanPractice #Falowen",
  ].join("\n\n");
}
export default function SocialGermanChallenges() {
  const [type, setType] = useState("all");
  const [level, setLevel] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState(SOCIAL_GERMAN_CHALLENGES[0].id);
  const [edits, setEdits] = useState({});
  const [captionEdit, setCaptionEdit] = useState("");
  const [scene, setScene] = useState(1);
  const [previewPlaying, setPreviewPlaying] = useState(false);
  const [format, setFormat] = useState("story");
  const [exportFormat, setExportFormat] = useState("auto");
  const [statuses, setStatuses] = useState(getStatuses);
  const [working, setWorking] = useState(false);
  const [falowenTrack, setFalowenTrack] = useState("none");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const canvasRef = useRef(null);
  const recordingRef = useRef(null);
  const filtered = useMemo(() => filterGermanChallenges({ type, level, search }), [type, level, search]);
  const selected = filtered.find((entry) => entry.id === selectedId) || filtered[0] || null;
  const original = useMemo(() => challengeCopy(selected), [selected]);
  const copy = useMemo(() => original ? { ...original, ...edits } : null, [original, edits]);
  const caption = captionEdit || captionFromCopy(selected, copy);
  const usedCount = SOCIAL_GERMAN_CHALLENGES.filter((entry) => statuses[entry.id] === "Published").length;
  const fileStem = challengeFileStem(selected);
  const videoMime = typeof MediaRecorder !== "undefined" && typeof MediaRecorder.isTypeSupported === "function"
    ? chooseSocialVideoFormat((mime) => MediaRecorder.isTypeSupported(mime), exportFormat, { audioRequired: falowenTrack !== "none" }) : null;

  const resetSelection = (id) => {
    setSelectedId(id);
    setEdits({});
    setCaptionEdit("");
    setScene(1);
    setPreviewPlaying(false);
    setError("");
    setNotice("");
  };
  const setFilter = (key, value) => {
    if (key === "type") setType(value);
    if (key === "level") setLevel(value);
    if (key === "search") setSearch(value);
    setEdits({});
    setCaptionEdit("");
    setScene(1);
    setPreviewPlaying(false);
    setError("");
    setNotice("");
  };

  useEffect(() => {
    if (!canvasRef.current || !selected || !copy || previewPlaying) return;
    const node = canvasRef.current;
    node.width = 540; node.height = 960;
    renderChallengeFrame(node, selected, copy, scene, scene === 1 ? 2 : 0);
  }, [selected, copy, scene, previewPlaying]);

  useEffect(() => {
    if (!previewPlaying || !selected || !copy) return undefined;
    let frame = 0;
    const started = performance.now();
    let lastScene = -1;
    const animate = (now) => {
      const t = ((now - started) / 1000) % CHALLENGE_VIDEO_SECONDS;
      const currentScene = sceneAtTime(t);
      if (canvasRef.current) renderChallengeFrame(canvasRef.current, selected, copy, currentScene, t);
      if (currentScene !== lastScene) { lastScene = currentScene; setScene(currentScene); }
      frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [previewPlaying, selected, copy]);

  useEffect(() => () => {
    const active = recordingRef.current;
    if (active) {
      active.cancelled = true;
      cancelAnimationFrame(active.frame);
      clearTimeout(active.timer);
      if (active.recorder?.state !== "inactive") active.recorder?.stop();
      active.stream?.getTracks().forEach((track) => track.stop());
      active.audioContext?.close().catch(() => {});
    }
  }, []);

  const updateStatus = (value) => {
    if (!selected) return;
    const next = { ...statuses, [selected.id]: value };
    setStatuses(next);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); }
    catch { setError("Your browser blocked saved publication statuses. You can still export a post."); }
  };
  const nextUnused = () => {
    const next = nextUnusedGermanChallenge(filtered, statuses);
    if (next) resetSelection(next.id);
    else setNotice("All posts matching these filters are marked Published. Change your filters to see more.");
  };
  const copyCaption = async () => {
    try { await navigator.clipboard.writeText(caption); setNotice("Caption copied. Posting remains manual."); setError(""); }
    catch { setError("Could not copy automatically. Select and copy the caption text."); }
  };
  const exportSlide = (stage) => {
    if (!selected || !copy) return;
    setError(""); setNotice("");
    const size = CHALLENGE_EXPORT_SIZES[format];
    const canvas = document.createElement("canvas");
    canvas.width = size.width;
    canvas.height = size.height;
    if (!renderChallengeFrame(canvas, selected, copy, stage, stage === 1 ? 2 : 8)) {
      setError("Some text is too long for this size. Shorten the question or explanation before exporting.");
      return;
    }
    try {
      canvas.toBlob((blob) => {
        if (!blob) { setError("PNG export failed. Try a different browser."); return; }
        download(blob, fileStem + (stage === 1 ? "-question-" : "-answer-") + format + ".png");
        setNotice("PNG exported. Check the slide before publishing.");
      }, "image/png");
    } catch { setError("PNG export is not supported in this browser."); }
  };
  const exportVideo = async () => {
    if (!selected || !copy || working) return;
    setError(""); setNotice(""); setPreviewPlaying(false);
    if (!videoMime || typeof HTMLCanvasElement === "undefined" || typeof HTMLCanvasElement.prototype.captureStream !== "function") {
      setError("The selected format cannot include the chosen audio in this browser. Choose Auto or WebM, or export without audio.");
      return;
    }
    // Verify all scenes at output resolution before starting a 12-second real-time recording.
    const exportCanvas = document.createElement("canvas");
    exportCanvas.width = 720; exportCanvas.height = 1280;
    for (let stage = 0; stage < CHALLENGE_SCENES.length; stage++) {
      if (!renderChallengeFrame(exportCanvas, selected, copy, stage, stage === 1 ? 2 : 8)) {
        setError("The text does not fit the vertical video. Shorten it before exporting.");
        return;
      }
    }
    let stream, recorder, audioContext, soundtrack, animationFrame = 0, timer = 0;
    setWorking(true);
    try {
      renderChallengeFrame(exportCanvas, selected, copy, 0, 0);
      stream = exportCanvas.captureStream(30);
      if (!stream.getVideoTracks().length) throw new Error("This browser did not create a video track.");
      if (falowenTrack !== "none") {
        const Context = window.AudioContext || window.webkitAudioContext;
        if (!Context) throw new Error("This browser cannot mix audio into video.");
        audioContext = new Context();
        await audioContext.resume();
        const output = audioContext.createMediaStreamDestination();
        soundtrack = await addSocialMusic(audioContext, output, falowenTrack, CHALLENGE_VIDEO_SECONDS);
        await audioContext.resume();
        if (audioContext.state !== "running") throw new Error("Audio is paused by this browser. Keep the tab active and try export again.");
        stream = new MediaStream([...stream.getVideoTracks(), ...output.stream.getAudioTracks()]);
      }
      recorder = new MediaRecorder(stream, { mimeType: videoMime.mime, videoBitsPerSecond: 3500000 });
      const chunks = [];
      const finished = new Promise((resolve, reject) => {
        recorder.ondataavailable = (event) => { if (event.data?.size) chunks.push(event.data); };
        recorder.onerror = (event) => reject(new Error(event.error?.message || "Video recording failed."));
        recorder.onstop = () => resolve(new Blob(chunks, { type: recorder.mimeType || videoMime.mime }));
      });
      const active = { recorder, stream, audioContext, frame: 0, timer: 0, cancelled: false };
      recordingRef.current = active;
      const start = performance.now();
      const tick = (now) => {
        if (active.cancelled || recorder.state === "inactive") return;
        const elapsed = Math.min(CHALLENGE_VIDEO_SECONDS, (now - start) / 1000);
        renderChallengeFrame(exportCanvas, selected, copy, sceneAtTime(elapsed), elapsed);
        animationFrame = requestAnimationFrame(tick);
        active.frame = animationFrame;
      };
      recorder.start();
      soundtrack?.start();
      animationFrame = requestAnimationFrame(tick);
      active.frame = animationFrame;
      timer = setTimeout(() => {
        if (recorder.state !== "inactive") recorder.stop();
      }, CHALLENGE_VIDEO_SECONDS * 1000 + 180);
      active.timer = timer;
      const blob = await finished;
      if (!active.cancelled) {
        if (!blob.size) throw new Error("The video was empty. Please retry in a supported desktop browser.");
        await requireValidSocialVideo(blob, videoMime);
        download(blob, fileStem + "-12s." + videoMime.extension);
        setNotice("12-second " + videoMime.extension.toUpperCase() + " exported" + (falowenTrack === "none" ? " without music." : " with " + (SOCIAL_MUSIC_TRACKS.find(track => track.id === falowenTrack)?.label || "Falowen music") + "."));
      }
    } catch (cause) {
      setError(cause?.message || "Video export failed.");
    } finally {
      clearTimeout(timer);
      cancelAnimationFrame(animationFrame);
      stream?.getTracks().forEach((track) => track.stop());
      if (audioContext) await audioContext.close().catch(() => {});
      if (recorder && recorder.state !== "inactive") recorder.stop();
      recordingRef.current = null;
      setWorking(false);
    }
  };
  const countLabel = (count) => count + (count === 1 ? " post" : " posts");
  return <section style={{ display: "grid", gap: 18 }}>
    <header>
      <p style={{ margin: "0 0 4px", fontSize: 12, color: "#2563eb", fontWeight: 800, letterSpacing: ".07em" }}>FALOWEN CONTENT LIBRARY</p>
      <h2 style={{ margin: "0 0 6px" }}>German Challenge Dictionary</h2>
      <p style={{ color: "#475569", margin: 0 }}>120 authored posts, A1–B2. Pick a challenge, preview the four scenes, then export a two-slide image set or a 12-second vertical video—without a paid AI video service.</p>
    </header>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 330px), 1fr))", gap: 18, alignItems: "start" }}>
      <div style={{ display: "grid", gap: 13 }}>
        <section style={PANEL}>
          <strong>1. Find your next post</strong>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <label>Category<select style={FIELD} value={type} onChange={(e) => setFilter("type", e.target.value)}>
              <option value="all">All categories</option>{CHALLENGE_TYPES.map((category) => <option key={category.id} value={category.id}>{category.short} ({category.count})</option>)}
            </select></label>
            <label>German level<select style={FIELD} value={level} onChange={(e) => setFilter("level", e.target.value)}>
              <option value="all">All levels</option>{CHALLENGE_LEVELS.map((value) => <option key={value}>{value}</option>)}
            </select></label>
          </div>
          <label>Search by ID, topic or German text<input style={FIELD} value={search} onChange={(e) => setFilter("search", e.target.value)} placeholder="e.g. dative, timetable, B1" /></label>
          <small style={NOTE}>{countLabel(filtered.length)} match · {usedCount} of 120 marked Published in this browser</small>
          <button type="button" onClick={nextUnused} disabled={!filtered.length}>Choose next unpublished challenge</button>
          {selected && <label>Dictionary entry<select style={FIELD} value={selected.id} onChange={(e) => resetSelection(e.target.value)}>
            {filtered.map((entry) => <option key={entry.id} value={entry.id}>{entry.id} · {entry.level} · {entry.topic}{statuses[entry.id] === "Published" ? " ✓" : ""}</option>)}
          </select></label>}
          {!selected && <p role="status">No matching challenges. Try a different topic, category or level.</p>}
        </section>
        {selected && <section style={PANEL}>
          <strong>2. Review and personalise</strong>
          <p style={NOTE}><b>{selected.id}</b> · {selected.level} · {original.label} · {selected.topic}</p>
          <label>Video hook / headline<textarea style={FIELD} rows={2} value={copy.hook} onChange={(e) => setEdits((prev) => ({ ...prev, hook: e.target.value }))} /></label>
          <label>Question or conversation<textarea style={FIELD} rows={5} value={copy.challenge} onChange={(e) => setEdits((prev) => ({ ...prev, challenge: e.target.value }))} /></label>
          <label>Answer or translation<textarea style={FIELD} rows={3} value={copy.reveal} onChange={(e) => setEdits((prev) => ({ ...prev, reveal: e.target.value }))} /></label>
          <label>Explanation<textarea style={FIELD} rows={3} value={copy.explanation} onChange={(e) => setEdits((prev) => ({ ...prev, explanation: e.target.value }))} /></label>
          <button type="button" onClick={() => { setEdits({}); setCaptionEdit(""); }}>Restore original dictionary text</button>
          {selected.type === "exam" && <p style={NOTE}>Original exam-style mini practice. Not official Goethe content or a past paper.</p>}
        </section>}
        {selected && <section style={PANEL}>
          <strong>3. Publish and track</strong>
          <label>Publication status<select style={FIELD} value={statuses[selected.id] || "Draft"} onChange={(e) => updateStatus(e.target.value)}>
            <option>Draft</option><option>Ready</option><option>Published</option>
          </select></label>
          <p style={NOTE}>Statuses are saved in this browser only. Exporting does not publish automatically or mark the post Published.</p>
          <label>Copy-ready caption and hashtags<textarea style={FIELD} rows={9} value={caption} onChange={(e) => setCaptionEdit(e.target.value)} /></label>
          <button type="button" onClick={copyCaption}>Copy caption + hashtags</button>
          <p style={NOTE}>Suggested cadence: Monday quiz · Wednesday mistake · Thursday dialogue or exam challenge. Ads and motivation keep their existing schedule.</p>
        </section>}
      </div>
      {selected && <section style={{ ...PANEL, background: "#f8fafc" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <strong>4. Preview &amp; export</strong><span style={{ fontSize: 12, color: "#475569" }}>{selected.level} · {original.label}</span>
        </div>
        <div style={{ maxWidth: 390, margin: "0 auto", width: "100%" }}>
          <canvas ref={canvasRef} width={540} height={960} role="img" aria-label="German challenge video scene preview" style={{ display: "block", width: "100%", height: "auto", aspectRatio: "9 / 16", background: "#071a3a", borderRadius: 12, boxShadow: "0 14px 32px rgba(7, 26, 58, 0.16)" }} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6 }}>
          {CHALLENGE_SCENES.map((item, index) => <button key={item.id} type="button" aria-pressed={scene === index} disabled={working} onClick={() => { setPreviewPlaying(false); setScene(index); }} style={{ padding: "9px 4px", background: scene === index ? "#102e55" : "#fff", color: scene === index ? "#fff" : "#0f172a", border: "1px solid #9baecc", borderRadius: 9, fontSize: 12 }}>{item.label}<br />{item.seconds}</button>)}
        </div>
        <button type="button" disabled={working} onClick={() => setPreviewPlaying((value) => !value)}>{previewPlaying ? "Pause 12-second preview" : "▶ Play animated preview"}</button>
        <label>Image dimensions
          <select style={FIELD} value={format} onChange={(e) => setFormat(e.target.value)}>
            {Object.entries(CHALLENGE_EXPORT_SIZES).map(([value, dimensions]) => <option value={value} key={value}>{dimensions.label} · {dimensions.width} × {dimensions.height}</option>)}
          </select>
        </label>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          <button type="button" disabled={working} onClick={() => exportSlide(1)}>Export question PNG</button>
          <button type="button" disabled={working} onClick={() => exportSlide(2)}>Export answer PNG</button>
        </div>
        <label>Video file format
          <select style={FIELD} disabled={working} value={exportFormat} onChange={event => setExportFormat(event.target.value)}>
            <option value="auto">Auto (MP4 preferred, WebM fallback)</option>
            <option value="mp4">MP4 · H.264</option>
            <option value="webm">WebM · Chrome/Firefox</option>
          </select>
        </label>
        <label>Falowen background song for video
          <select style={FIELD} disabled={working} value={falowenTrack} onChange={(event) => setFalowenTrack(event.target.value)}>
            {SOCIAL_MUSIC_TRACKS.map(track => <option key={track.id} value={track.id}>{track.label}</option>)}
          </select>
        </label>
        <button type="button" disabled={working || !videoMime} onClick={exportVideo}>{working ? "Recording your 12-second video…" : "Export 12-second video"}</button>
        {!videoMime && <p style={NOTE}>Selected video format unavailable. Choose Auto or WebM, or export PNG.</p>}
        <p style={NOTE}>Videos are recorded on your device, vertically at 720 × 1280, without watermarks or paid AI tokens. Choose one of the two Falowen songs to embed it into the MP4, or export without music.</p>
        {notice && <p role="status" style={{ margin: 0, color: "#166534", fontWeight: 600 }}>{notice}</p>}
        {error && <p role="alert" style={{ margin: 0, color: "#b91c1c" }}>{error}</p>}
      </section>}
    </div>
  </section>;
}
