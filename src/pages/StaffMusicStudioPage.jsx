import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { musicBlob, musicRequest } from "../services/musicStudioService.js";
import MusicLyricsVideoStudio from "../components/MusicLyricsVideoStudio.jsx";
import "./MusicStudioPage.css";

export default function StaffMusicStudioPage() {
  const { workspaceLanguage } = useAuth();
  const language = workspaceLanguage;
  const [tab, setTab] = useState("generator");
  const [prompt, setPrompt] = useState("");
  const [lyrics, setLyrics] = useState("");
  const [status, setStatus] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  useEffect(() => {
    let active = true;
    setError(""); setResult(null); setPrompt(""); setLyrics(""); setStatus(null);
    musicRequest(null, language).then(data => { if (active) setStatus(data); })
      .catch(cause => { if (active) setError(cause.message); });
    return () => { active = false; };
  }, [language]);
  useEffect(() => () => { if (result?.url) URL.revokeObjectURL(result.url); }, [result]);

  const generate = async (event) => {
    event.preventDefault();
    if (!prompt.trim() || busy) return;
    setBusy(true); setError("");
    try {
      const brief = `Create an original ${language === "swahili" ? "natural Kiswahili" : "German"} educational song for Falowen learners. ${prompt.trim()}` +
        (lyrics.trim() ? "\n\nUse these teacher-written lyrics:\n" + lyrics.trim() : "");
      const data = await musicRequest({ mode: "song", requestId: crypto.randomUUID(), prompt: brief, language }, language);
      const url = URL.createObjectURL(musicBlob(data));
      setResult({ url, title: language === "swahili" ? "Kiswahili teacher draft" : "German teacher draft", lyrics: lyrics.trim() || data.lyrics || "", isFreeform: true });
      setStatus(current => ({ ...current, dailyCents: data.dailyCents, monthlyCents: data.monthlyCents }));
    } catch (cause) { setError(cause.message); }
    finally { setBusy(false); }
  };
  return <main className="music-studio music-studio-simple">
    <header><p className="music-eyebrow">FALOWEN · {language.toUpperCase()}</p><h1>Music Studio</h1>
      <p>Create teacher drafts and videos for {language === "swahili" ? "Swahili" : "German"}. The German and Swahili lesson libraries remain separate.</p>
    </header>
    <div className="music-studio-tabs" role="tablist" aria-label="Staff music tools">
      <button type="button" role="tab" aria-selected={tab === "generator"} onClick={() => setTab("generator")}>Music Generator</button>
      <button type="button" role="tab" aria-selected={tab === "video"} onClick={() => setTab("video")}>Lyrics Video Studio</button>
    </div>
    <section hidden={tab !== "generator"} aria-label="Generate music">
      <form onSubmit={generate} style={{ display: "grid", gap: 14, maxWidth: 700, padding: 16 }}>
        <label>Song direction <textarea value={prompt} maxLength={3000} rows={4} onChange={event => setPrompt(event.target.value)}
          placeholder={language === "swahili" ? "A warm restaurant song in natural Kiswahili…" : "A short German learning song…"} required style={{ display: "block", width: "100%" }} /></label>
        <label>Teacher lyrics (optional) <textarea value={lyrics} maxLength={4800} rows={7} onChange={event => setLyrics(event.target.value)}
          placeholder={"[Verse 1]\n…"} style={{ display: "block", width: "100%" }} /></label>
        <p>Shared music generation budget: $0.80 per day / $5.00 per month. A full song is approximately $0.08. No automatic retry.</p>
        <button type="submit" disabled={!status?.ready || busy || !prompt.trim()}>{busy ? "Generating music…" : "Generate full song"}</button>
        {status && <small>Usage today: ${''}{(status.dailyCents / 100).toFixed(2)} · this month: ${''}{(status.monthlyCents / 100).toFixed(2)}</small>}
        {error && <p role="alert">{error}</p>}
        {result && <section><h2>Teacher draft</h2><audio controls src={result.url} /><a href={result.url} download="falowen-teacher-draft.mp3">Download MP3</a>
          <p>This audio stays in your browser until you download it. Publishing is a separate approval.</p>
        </section>}
      </form>
    </section>
    <section hidden={tab !== "video"} aria-label="Make lyrics video">
      <MusicLyricsVideoStudio active={tab === "video"} swahili={language === "swahili"}
        generated={result} lyrics={lyrics} title={result?.title || "Falowen teacher draft"} allowPublish={false} />
    </section>
  </main>;
}
