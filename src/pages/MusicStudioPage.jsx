import { useEffect, useMemo, useRef, useState } from 'react';
import { musicRequest, musicBlob } from '../services/musicStudioService';
import './MusicStudioPage.css';
import { getMusicDays, musicLessonContext } from '../utils/musicCourseContext.js';
import { STUDIO_COURSE_LEVELS } from '../utils/hoerenCourseCatalog.js';
const PRESETS = {
  welcome: 'A gentle Falowen welcome song for German learners before their Zoom class. Encourage learners not to give up: Gemeinsam schaffen wir das / Together we can. Bilingual German and English. Acoustic guitar only, one smooth warm male voice, relaxed Afro-soul feel, quiet and reassuring, no backing singers.',
  vocabulary: 'A memorable Falowen German vocabulary song for German learners at the selected course level. Clear slow pronunciation, short German phrases followed by their English meanings. Warm acoustic guitar and one smooth male voice. Repeat key vocabulary in the chorus.',
  instrumental: 'A gentle instrumental acoustic guitar piece for the Falowen classroom waiting room. Calm, warm, unobtrusive. No vocals, no lyrics, no drums.',
};
export default function MusicStudioPage() {
  const [courseMode, setCourseMode] = useState('course');
  const [level, setLevel] = useState('A1');
  const [day, setDay] = useState('1');
  const [assignment, setAssignment] = useState('');
  const [language, setLanguage] = useState('bilingual');
  const [focus, setFocus] = useState('');
  const days = useMemo(() => getMusicDays(level), [level]);
  const selectedDay = days.find(group => String(group.day) === day) || days[0];
  const lesson = selectedDay?.lessons.find(entry => entry.assignmentKey === assignment) || selectedDay?.lessons[0];
  const context = courseMode === 'course' ? musicLessonContext(lesson, language, focus) : '';
  const [brief, setBrief] = useState(PRESETS.vocabulary);
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
      const prompt = `${brief}\n${context}\n${mode === 'song' ? 'Aim for a complete song around two minutes long.' : 'Create a 30-second preview.'}${lyrics.trim() ? `\nLyrics:\n${lyrics.trim()}` : ''}`;
      if (prompt.length > 8000) throw new Error('Your combined lesson context, direction and lyrics exceed 8,000 characters. Shorten the direction or lyrics.');
      const data = await musicRequest({ mode, requestId: crypto.randomUUID(), prompt });
      const url = URL.createObjectURL(musicBlob(data));
      if (audioUrl.current) URL.revokeObjectURL(audioUrl.current);
      audioUrl.current = url;
      setResult({ url, lyrics: data.lyrics, filename: courseMode === 'course' && lesson ? `falowen-${level.toLowerCase()}-day-${lesson.day}-${lesson.assignmentKey.toLowerCase()}.mp3` : 'falowen-music.mp3' });
      setStatus(s => ({ ...s, ...data, audio: undefined, lyrics: undefined }));
    } catch (e) { setError(e.message); }
    finally { lock.current = false; setBusy(false); musicRequest().then(setStatus).catch(() => {}); }
  }
  const cents = mode === 'clip' ? 4 : 8;
  const capped = status && (status.dailyCents + cents > status.limits.dailyCents || status.monthlyCents + cents > status.limits.monthlyCents);
  return <main className="music-studio">
    <header><p className="music-eyebrow">FALOWEN · CREATE & LEARN</p><h1>Falowen Music Studio</h1><p>Turn your lesson ideas and lyrics into music. Preview, listen, then download your MP3.</p></header>
    <div className="music-layout"><form onSubmit={generate} className="music-card">
      <fieldset disabled={busy}><legend>1. Choose your lesson</legend>
        <label htmlFor="music-source">Song purpose</label><select id="music-source" value={courseMode} onChange={e => setCourseMode(e.target.value)}><option value="course">Course lesson from dictionary</option><option value="custom">Custom / class welcome</option></select>
        {courseMode === 'course' && <>
          <label htmlFor="music-level">Level</label><select id="music-level" value={level} onChange={e => { setLevel(e.target.value); setDay('1'); setAssignment(''); setFocus(''); }}>{STUDIO_COURSE_LEVELS.map(value => <option key={value}>{value}</option>)}</select>
          <label htmlFor="music-day">Course day</label><select id="music-day" value={selectedDay?.day ?? ''} onChange={e => { setDay(e.target.value); setAssignment(''); setFocus(''); }}>{days.map(group => <option key={group.day} value={group.day}>{group.day === 0 ? 'Orientation' : `Day ${group.day}`} · {group.lessons.map(entry => entry.title).join(' / ')}</option>)}</select>
          <label htmlFor="music-lesson">Dictionary lesson</label><select id="music-lesson" value={lesson?.assignmentKey ?? ''} onChange={e => { setAssignment(e.target.value); setFocus(''); }}>{(selectedDay?.lessons || []).map(entry => <option key={entry.assignmentKey} value={entry.assignmentKey}>{entry.label}</option>)}</select>
          {lesson && <p className="music-lesson-summary"><strong>{lesson.germanTitle}</strong><br />{lesson.englishTitle}<br /><small>{lesson.level} · Day {lesson.day} · {lesson.assignmentKey}</small></p>}
          <label htmlFor="music-language">Song language</label><select id="music-language" value={language} onChange={e => setLanguage(e.target.value)}><option value="bilingual">German + English support</option><option value="german">German only</option></select>
          <label htmlFor="music-focus">Words or grammar to practise (optional)</label><textarea id="music-focus" rows={2} maxLength={400} value={focus} onChange={e => setFocus(e.target.value)} placeholder="Add specific words or structures from your lesson" />
          <p className="music-note">The selected level, day and dictionary topic guide the song automatically. Changing lessons keeps your music direction and lyrics for you to review. Choosing a lesson is free.</p>
        </>}
        <h2>2. Shape your song</h2>
        <div className="music-presets">{Object.entries(PRESETS).map(([id, text]) => <button type="button" key={id} onClick={() => setBrief(text)}>{id === 'welcome' ? 'Class welcome' : id === 'vocabulary' ? 'Vocabulary song' : 'Guitar instrumental'}</button>)}</div>
        <label htmlFor="music-brief">Music direction</label><textarea id="music-brief" required maxLength={2000} rows={6} value={brief} onChange={e => setBrief(e.target.value)} />
        <label htmlFor="music-lyrics">Your lyrics <span>(optional)</span></label><textarea id="music-lyrics" maxLength={5500} rows={9} value={lyrics} onChange={e => setLyrics(e.target.value)} placeholder={'[Verse 1]\nWrite your German and English lyrics here…\n\n[Chorus]'} />
        <p className="music-note">Leave lyrics empty to let Google compose them. Review pronunciation and wording before sharing.</p>
        <label htmlFor="music-mode">3. Choose generation</label><select id="music-mode" value={mode} onChange={e => setMode(e.target.value)}><option value="clip">30-second preview · estimated $0.04</option><option value="song">Full song · estimated $0.08</option></select>
        <p className="music-note">A full song is a new generation; it does not extend the preview. Duration is approximate.</p>
        <button className="music-generate" disabled={!status?.ready || capped || !brief.trim()} type="submit">{busy ? 'Creating your music…' : `Generate ${mode === 'clip' ? 'preview' : 'full song'} · ~$${(cents / 100).toFixed(2)}`}</button>
      </fieldset>
      {busy && <p role="status">This may take a few minutes. Keep this page open. Your request will not retry automatically.</p>}
      {error && <p role="alert" className="music-error">{error}</p>}
    </form><aside className="music-card"><h2>Your listening room</h2>
      {result ? <><audio controls src={result.url} preload="metadata" /><a className="music-download" href={result.url} download={result.filename}>Download MP3</a>{result.lyrics && <details><summary>Generated lyrics & structure</summary><pre>{result.lyrics}</pre></details>}</> : <p>Your generated song will appear here.</p>}
      <p>Download before leaving. Audio stays in this page and is not saved in Falowen.</p>
      <hr /><h3>Budget controls</h3><p>Preview first. One generation at a time, with no automatic retries.</p>
      {status && <p>Today: ${(status.dailyCents / 100).toFixed(2)} / $0.80<br />This month: ${(status.monthlyCents / 100).toFixed(2)} / $5.00</p>}
      {capped && <p role="status">Budget reached for this generation. Try after the budget resets.</p>}
      {status && !status.ready && <p>Google API configuration is required before generating.</p>}
      <p className="music-note">Estimates use Google’s listed music prices, excluding backend usage. Failed or timed-out attempts remain counted because they may be billed. Limits reset at midnight UTC / the start of each month.</p>
    </aside></div>
  </main>;
}
