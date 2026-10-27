import { useEffect, useRef, useState } from 'react';
import { musicRequest, musicBlob } from '../services/musicStudioService';
import './MusicStudioPage.css';
const PRESETS = {
  welcome: 'A gentle Falowen welcome song for German learners before their Zoom class. Encourage learners not to give up: Gemeinsam schaffen wir das / Together we can. Bilingual German and English. Acoustic guitar only, one smooth warm male voice, relaxed Afro-soul feel, quiet and reassuring, no backing singers.',
  vocabulary: 'A memorable Falowen German vocabulary song for A1 learners. Clear slow pronunciation, short German phrases followed by their English meanings. Warm acoustic guitar and one smooth male voice. Repeat key vocabulary in the chorus.',
  instrumental: 'A gentle instrumental acoustic guitar piece for the Falowen classroom waiting room. Calm, warm, unobtrusive. No vocals, no lyrics, no drums.',
};
export default function MusicStudioPage() {
  const [brief, setBrief] = useState(PRESETS.welcome);
  const [lyrics, setLyrics] = useState('');
  const [mode, setMode] = useState('clip');
  const [status, setStatus] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const lock = useRef(false), audioUrl = useRef(null);
  useEffect(() => { let active = true;
    musicRequest().then(s => { if (active) setStatus(s); }).catch(e => { if (active) setError(e.message); });
    return () => { active = false; if (audioUrl.current) URL.revokeObjectURL(audioUrl.current); };
  }, []);
  useEffect(() => {
    const warn = event => { if (busy || result) { event.preventDefault(); event.returnValue = ''; } };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [busy, result]);
  async function generate(event) {
    event.preventDefault();
    if (lock.current) return;
    lock.current = true; setBusy(true); setError('');
    try {
      const data = await musicRequest({ mode, requestId: crypto.randomUUID(), prompt: `${brief}\n${mode === 'song' ? 'Aim for a complete song around two minutes long.' : 'Create a 30-second preview.'}${lyrics.trim() ? `\nLyrics:\n${lyrics.trim()}` : ''}` });
      const url = URL.createObjectURL(musicBlob(data));
      if (audioUrl.current) URL.revokeObjectURL(audioUrl.current);
      audioUrl.current = url;
      setResult({ url, lyrics: data.lyrics });
      setStatus(s => ({ ...s, ...data, audio: undefined, lyrics: undefined }));
    } catch (e) { setError(e.message); }
    finally { lock.current = false; setBusy(false); musicRequest().then(setStatus).catch(() => {}); }
  }
  const cents = mode === 'clip' ? 4 : 8;
  const capped = status && (status.dailyCents + cents > status.limits.dailyCents || status.monthlyCents + cents > status.limits.monthlyCents);
  return <main className="music-studio">
    <header><p className="music-eyebrow">FALOWEN · CREATE & LEARN</p><h1>Falowen Music Studio</h1><p>Turn your lesson ideas and lyrics into music. Preview, listen, then download your MP3.</p></header>
    <div className="music-layout"><form onSubmit={generate} className="music-card">
      <fieldset disabled={busy}><legend>1. Shape your song</legend>
        <div className="music-presets">{Object.entries(PRESETS).map(([id, text]) => <button type="button" key={id} onClick={() => setBrief(text)}>{id === 'welcome' ? 'Class welcome' : id === 'vocabulary' ? 'Vocabulary song' : 'Guitar instrumental'}</button>)}</div>
        <label htmlFor="music-brief">Music direction</label><textarea id="music-brief" required maxLength={2000} rows={6} value={brief} onChange={e => setBrief(e.target.value)} />
        <label htmlFor="music-lyrics">Your lyrics <span>(optional)</span></label><textarea id="music-lyrics" maxLength={5500} rows={9} value={lyrics} onChange={e => setLyrics(e.target.value)} placeholder={'[Verse 1]\nWrite your German and English lyrics here…\n\n[Chorus]'} />
        <p className="music-note">Leave lyrics empty to let Google compose them. Review pronunciation and wording before sharing.</p>
        <label htmlFor="music-mode">2. Choose generation</label><select id="music-mode" value={mode} onChange={e => setMode(e.target.value)}><option value="clip">30-second preview · estimated $0.04</option><option value="song">Full song · estimated $0.08</option></select>
        <p className="music-note">A full song is a new generation; it does not extend the preview. Duration is approximate.</p>
        <button className="music-generate" disabled={!status?.ready || capped || !brief.trim()} type="submit">{busy ? 'Creating your music…' : `Generate ${mode === 'clip' ? 'preview' : 'full song'} · ~$${(cents / 100).toFixed(2)}`}</button>
      </fieldset>
      {busy && <p role="status">This may take a few minutes. Keep this page open. Your request will not retry automatically.</p>}
      {error && <p role="alert" className="music-error">{error}</p>}
    </form><aside className="music-card"><h2>Your listening room</h2>
      {result ? <><audio controls src={result.url} preload="metadata" /><a className="music-download" href={result.url} download="falowen-music.mp3">Download MP3</a>{result.lyrics && <details><summary>Generated lyrics & structure</summary><pre>{result.lyrics}</pre></details>}</> : <p>Your generated song will appear here.</p>}
      <p>Download before leaving. Audio stays in this page and is not saved in Falowen.</p>
      <hr /><h3>Budget controls</h3><p>Preview first. One generation at a time, with no automatic retries.</p>
      {status && <p>Today: ${(status.dailyCents / 100).toFixed(2)} / $0.80<br />This month: ${(status.monthlyCents / 100).toFixed(2)} / $5.00</p>}
      {capped && <p role="status">Budget reached for this generation. Try after the budget resets.</p>}
      {status && !status.ready && <p>Google API configuration is required before generating.</p>}
      <p className="music-note">Estimates use Google’s listed music prices, excluding backend usage. Failed or timed-out attempts remain counted because they may be billed. Limits reset at midnight UTC / the start of each month.</p>
    </aside></div>
  </main>;
}
