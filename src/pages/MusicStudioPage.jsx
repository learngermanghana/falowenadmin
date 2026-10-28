import { useEffect, useMemo, useRef, useState } from 'react';
import { musicRequest, musicBlob } from '../services/musicStudioService';
import { buildFalowenMusicPrompt, musicLyricLimit } from '../utils/musicGenerationPrompt.js';
import { waitingRoomMusicObjectKey } from '../utils/waitingRoomDayMusic.js';
import './MusicStudioPage.css';
import { getMusicDays, musicLessonContext } from '../utils/musicCourseContext.js';
import { STUDIO_COURSE_LEVELS } from '../utils/hoerenCourseCatalog.js';
import { getMusicTopicStyle, suggestLessonMusicDirection } from '../utils/musicTopicStyle.js';
import { getReusableSongDraft, getReusableSongDrafts } from '../data/reusableMusicSongbook.js';
import { musicSongTeachingPackText } from '../data/reusableMusicQuestions.js';
import ReusableMusicQuestions from '../components/ReusableMusicQuestions.jsx';
import { falowenMusicFileName } from '../utils/musicExportNames.js';
const PRESETS = {
  welcome: 'A gentle Falowen welcome song for German learners before their Zoom class. Encourage learners not to give up: Gemeinsam schaffen wir das / Together we can. Bilingual German and English. Acoustic guitar only, one smooth warm male voice, relaxed Afro-soul feel, quiet and reassuring, no backing singers.',
  vocabulary: 'A memorable Falowen German-learning story song at the selected CEFR level. A relatable everyday situation, clear natural German dialogue, and a catchy useful-sentence chorus. Occasional short English support for beginners. Gentle acoustic guitar, one smooth warm male voice, and very quiet accompaniment.',
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
  const [brief, setBrief] = useState(PRESETS.vocabulary);
  const [styleMode, setStyleMode] = useState('auto');
  // Prewritten A1–B1 lyrics are selected from the local dictionary; edits are
  // scoped by assignment so changing lessons never reuses the wrong lyrics.
  const [lyricsOverrides, setLyricsOverrides] = useState({});
  const [customLyrics, setCustomLyrics] = useState('');
  const [copyStatus, setCopyStatus] = useState('');
  const draft = courseMode === 'course' ? getReusableSongDraft(lesson?.assignmentKey) : null;
  const assignmentKey = lesson?.assignmentKey || '';
  const lyrics = courseMode === 'course'
    ? Object.prototype.hasOwnProperty.call(lyricsOverrides, assignmentKey)
      ? lyricsOverrides[assignmentKey] : draft?.lyrics || ''
    : customLyrics;
  const setLyrics = next => {
    if (courseMode === 'course' && assignmentKey) {
      setLyricsOverrides(previous => ({ ...previous, [assignmentKey]: next }));
    } else setCustomLyrics(next);
  };
  const trackTitle = draft?.title || lesson?.germanTitle || 'Falowen Music';
  const [mode, setMode] = useState('song');
  const [durationSeconds, setDurationSeconds] = useState(150);
  const [vocalMode, setVocalMode] = useState('voice');
  const [backingLevel, setBackingLevel] = useState('very-soft');
  const [songStyle, setSongStyle] = useState('story');
  const [storyIdea, setStoryIdea] = useState('');
  const [lyricTreatment, setLyricTreatment] = useState('exact');
  const rewriteFromLyrics = courseMode === 'course' && vocalMode === 'voice' && songStyle === 'story' && lyricTreatment === 'story-source';
  const effectiveBrief = styleMode === 'auto' && courseMode === 'course'
    ? suggestLessonMusicDirection(lesson, {
        instrumental: vocalMode === 'instrumental',
        preferredStyle: draft?.musicStyle || '',
      })
    : brief;
  const context = courseMode === 'course' ? musicLessonContext(lesson, language, focus, {
    songStyle: vocalMode === 'voice' ? songStyle : 'vocabulary',
    storyIdea,
    teacherLyricsProvided: Boolean(lyrics.trim()),
    rewriteFromLyrics,
  }) : '';
  const [status, setStatus] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const lock = useRef(false), audioUrl = useRef(null);
  useEffect(() => {
    // New dictionary topics must not accidentally inherit "rewrite from source"
    // from the previous song: prewritten lyrics default to exact playback.
    setLyricTreatment('exact');
    setCopyStatus('');
  }, [assignmentKey, level]);
  useEffect(() => { let active = true;
    musicRequest().then(s => { if (active) setStatus(s); }).catch(e => { if (active) setError(e.message); });
    return () => { active = false; if (audioUrl.current) URL.revokeObjectURL(audioUrl.current); };
  }, []);
  useEffect(() => {
    const warn = event => { if (busy || result) { event.preventDefault(); event.returnValue = ''; } };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [busy, result]);
  function downloadLyricsText(content, filename) {
    const url = URL.createObjectURL(new Blob([content], { type: 'text/plain;charset=utf-8' }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  function saveCurrentLyrics() {
    const text = draft
      ? musicSongTeachingPackText({ ...draft, lyrics, musicStyle: effectiveBrief }, lesson)
      : `FALOWEN MUSIC\nTitle: ${trackTitle}\n\nMUSIC STYLE\n${effectiveBrief}\n\nLYRICS\n${lyrics}`;
    downloadLyricsText(text, falowenMusicFileName(lesson, trackTitle, 'txt'));
  }
  function exportCompleteSongbook() {
    const text = ['A1', 'A2', 'B1'].map(songLevel => {
      const entries = getMusicDays(songLevel).flatMap(group => group.lessons);
      const songs = getReusableSongDrafts(songLevel);
      const content = songs.map(song => musicSongTeachingPackText(song,
        entries.find(entry => entry.assignmentKey === song.assignmentKey)))
        .join('\n\n' + '='.repeat(70) + '\n\n');
      return `FALOWEN MUSIC · ${songLevel} · ${songs.length} ORIGINAL SONGS\n\n${content}`;
    }).join('\n\n' + '#'.repeat(70) + '\n\n');
    downloadLyricsText(text, 'falowen-a1-to-b1-84-song-lyrics-and-music-styles.txt');
  }
  function exportLevelSongbook() {
    if (!['A1', 'A2', 'B1'].includes(level)) return;
    const entries = days.flatMap(group => group.lessons);
    const contents = getReusableSongDrafts(level).map(song => {
      const lessonEntry = entries.find(entry => entry.assignmentKey === song.assignmentKey);
      return musicSongTeachingPackText(song, lessonEntry);
    }).join('\n\n' + '='.repeat(70) + '\n\n');
    downloadLyricsText(contents, `falowen-${level.toLowerCase()}-complete-songbook-lyrics-and-styles.txt`);
  }
  async function copyDraftStyle() {
    try {
      await navigator.clipboard.writeText(effectiveBrief);
      setCopyStatus('Music style copied.');
    } catch {
      setCopyStatus('Copy unavailable in this browser; download the song text instead.');
    }
  }
  async function copyDraftLyrics() {
    try {
      await navigator.clipboard.writeText(lyrics);
      setCopyStatus('Lyrics copied.');
    } catch {
      setCopyStatus('Copy unavailable in this browser; download the lyrics text instead.');
    }
  }
  async function generate(event) {
    event.preventDefault();
    if (lock.current) return;
    lock.current = true; setBusy(true); setError('');
    try {
      const prompt = buildFalowenMusicPrompt({ brief: effectiveBrief, context, lyrics, mode, durationSeconds, vocalMode, backingLevel,
        lyricTreatment: rewriteFromLyrics ? 'story-source' : 'exact' });
      const data = await musicRequest({ mode, requestId: crypto.randomUUID(), prompt });
      const url = URL.createObjectURL(musicBlob(data));
      if (audioUrl.current) URL.revokeObjectURL(audioUrl.current);
      audioUrl.current = url;
      setResult({ url, title: trackTitle, level, day: lesson?.day, lyrics: data.lyrics, filename: courseMode === 'course' && lesson ? falowenMusicFileName(lesson, trackTitle, 'mp3') : 'falowen-custom-music.mp3' });
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
          <p className="music-note">The selected level, day and dictionary topic guide the song automatically. Changing lessons loads the matching prewritten lyrics and style when available. Your edits stay with that lesson while the page is open. Choosing or copying lyrics is free.</p>
        </>}
        {courseMode === 'course' && ['A1', 'A2', 'B1'].includes(level) && <div className="music-songbook-actions" style={{ padding: 12, border: '1px solid #bfdfc3', borderRadius: 12, background: '#f0f9f0', display: 'grid', gap: 8 }}>
          <strong>Ready-to-use songbook · {getReusableSongDrafts(level).length} original songs</strong>
          <p style={{ margin: 0, fontSize: 13 }}>Select a lesson to load its original storytelling lyrics and matching music style. Reuse the text free of charge, then generate audio only when ready.</p>
          {draft && <p style={{ margin: 0, fontSize: 13 }}><strong>Selected song:</strong> {draft.title}</p>}
          <button type="button" onClick={exportLevelSongbook}>Download all {level} lyrics & music styles (.txt)</button>
          <button type="button" onClick={exportCompleteSongbook}>Download complete A1–B1 songbook · 84 songs (.txt)</button>
        </div>}
        <h2>2. Shape your song</h2>
        <div className="music-presets">{Object.entries(PRESETS).map(([id, text]) => <button type="button" key={id} onClick={() => { setBrief(text); setStyleMode('custom'); setVocalMode(id === 'instrumental' ? 'instrumental' : 'voice'); }}>{id === 'welcome' ? 'Class welcome' : id === 'vocabulary' ? 'Lesson story song' : 'Guitar instrumental'}</button>)}</div>
        {courseMode === 'course' && vocalMode === 'voice' && <>
          <label htmlFor="music-story-style">Songwriting approach</label>
          <select id="music-story-style" value={songStyle} onChange={e => setSongStyle(e.target.value)}>
            <option value="story">Real-life storytelling — recommended</option>
            <option value="vocabulary">Vocabulary review / repetition</option>
          </select>
          {songStyle === 'story' && <>
            <label htmlFor="music-story-idea">Story situation <span>(optional)</span></label>
            <textarea id="music-story-idea" rows={2} maxLength={240} value={storyIdea} onChange={e => setStoryIdea(e.target.value)} placeholder={lesson?.assignmentKey === 'A1-14.1'
              ? 'A learner says "Mein Kopf tut weh", asks a friend for help, rests and feels better.'
              : 'For example: Two classmates solve an everyday problem using the lesson vocabulary.'} />
            <p className="music-note">AI uses the selected CEFR level to create a beginning, problem, dialogue and resolution. A1 uses simple sentences; higher levels add richer situations.</p>
          </>}
        </>}
        {courseMode === 'course' && <>
          <label htmlFor="music-style-mode">Music style</label>
          <select id="music-style-mode" value={styleMode} onChange={e => {
            if (e.target.value === 'custom' && styleMode === 'auto') setBrief(effectiveBrief);
            setStyleMode(e.target.value);
          }}>
            <option value="auto">Automatically match the lesson topic — recommended</option>
            <option value="custom">Choose my own music direction</option>
          </select>
          {styleMode === 'auto' && <p className="music-note">Music genre for this lesson: <strong>{draft?.genre || getMusicTopicStyle(lesson).label}</strong>. Every lesson has a different arrangement; change the lesson to update it. Switch to custom to edit the direction.</p>}
        </>}
        <label htmlFor="music-brief">Music direction {styleMode === 'auto' && courseMode === 'course' ? '(automatically selected)' : ''}</label>
        <textarea id="music-brief" required maxLength={2000} rows={6} value={effectiveBrief} readOnly={styleMode === 'auto' && courseMode === 'course'} onChange={e => setBrief(e.target.value)} />
        <label htmlFor="music-voice">Vocals and instrumental balance</label><select id="music-voice" value={vocalMode} onChange={e => setVocalMode(e.target.value)}><option value="voice">Clear lead vocals (recommended)</option><option value="instrumental">Instrumental only — no singer</option></select>
        {vocalMode === 'voice' && <><label htmlFor="music-backing">Accompaniment behind the singer</label><select id="music-backing" value={backingLevel} onChange={e => setBackingLevel(e.target.value)}><option value="very-soft">Very quiet — voice upfront (recommended)</option><option value="soft">Soft — moderate accompaniment</option></select><p className="music-note">These settings guide Google’s mix; they cannot separately turn down instruments in an already-generated MP3.</p></>}
        <label htmlFor="music-lyrics">{draft ? `Prewritten lyrics · ${draft.title}` : 'Your lyrics or vocabulary draft'} <span>(editable)</span></label>
        <textarea id="music-lyrics" maxLength={5500} rows={10} value={lyrics} onChange={e => { setLyrics(e.target.value); setCopyStatus(''); }} placeholder={'[Verse 1]\\nWrite your German and English lyrics here…\\n\\n[Chorus]'} />
        {draft && <div className="music-songbook-actions" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button type="button" onClick={copyDraftLyrics}>Copy lyrics</button>
          <button type="button" onClick={copyDraftStyle}>Copy music style</button>
          <button type="button" onClick={saveCurrentLyrics}>Download lyrics + music style (.txt)</button>
          <button type="button" onClick={() => { setLyricsOverrides(previous => { const next = { ...previous }; delete next[assignmentKey]; return next; }); setLyricTreatment('exact'); setCopyStatus('Original lyrics restored.'); }}>Restore original</button>
        </div>}
        {!draft && lyrics.trim() && <button type="button" onClick={saveCurrentLyrics}>Download lyrics + music style (.txt)</button>}
        {copyStatus && <p role="status" className="music-note">{copyStatus}</p>}
        {draft && <p className="music-note">Original Falowen lyrics are loaded automatically and preserved exactly when generating the song. Edits here are only saved in the current page until you export them. To have AI rewrite this draft, select Source vocabulary below.</p>}
        {courseMode === 'course' && vocalMode === 'voice' && songStyle === 'story' && lyrics.trim() && <>
          <label htmlFor="music-lyric-treatment">Use the text above as</label>
          <select id="music-lyric-treatment" value={lyricTreatment} onChange={e => setLyricTreatment(e.target.value)}>
            <option value="exact">Exact lyrics — keep my words</option>
            <option value="story-source">Source vocabulary — rewrite into a story</option>
          </select>
          <p className="music-note">{rewriteFromLyrics
            ? 'The draft lines are references; AI will write new level-appropriate story lyrics.'
            : 'Your exact lyrics are kept. Clear this field or choose Source vocabulary if you want a new story.'}</p>
        </>}
        <p className="music-note">{lyrics.trim().split(/\s+/).filter(Boolean).length} / {musicLyricLimit(mode, durationSeconds)} suggested words for this length. Leave the text empty for an AI-written level-appropriate story when storytelling is selected. Too many lines can lead to a cut-off ending.</p>
        <label htmlFor="music-mode">3. Choose generation</label><select id="music-mode" value={mode} onChange={e => setMode(e.target.value)}><option value="clip">30-second preview only (not a complete song) · estimated $0.04</option><option value="song">Full song · estimated $0.08</option></select>
        {mode === 'song' && <><label htmlFor="music-duration">Target song length</label><select id="music-duration" value={durationSeconds} onChange={e => setDurationSeconds(Number(e.target.value))}><option value={120}>About 2 minutes</option><option value={150}>About 2½ minutes — recommended</option><option value={180}>About 3 minutes</option></select></>}
        <p className="music-note">The preview always ends after 30 seconds; choose Full song for a complete track. A full song is a new generation, not an extension of the preview. Duration is approximate. The prompt reserves an ending with a completed final phrase, resolved chord and natural fade; Google does not guarantee an exact length or mix.</p>
        {courseMode === 'course' && selectedDay && <p className="music-note">After listening and approving, publish your MP3 to the Falowen Music library as a public track for this level and day. For GitHub-hosted day music, use <code>{waitingRoomMusicObjectKey(level, Number(selectedDay.day)) || 'choose a numbered day'}</code> under the student repository’s <code>web/public/music/</code> folder and add it to the public music catalog. A dedicated public R2 music URL can also be listed there.</p>}
        <p className="music-note">The downloadable song teaching pack also contains listening questions, a speaking activity and the teacher answer key. Copy the student-only questions below for presentation slides.</p>
        <button className="music-generate" disabled={!status?.ready || capped || !effectiveBrief.trim()} type="submit">{busy ? 'Creating your music…' : `Generate ${mode === 'clip' ? 'preview' : 'full song'} · ~$${(cents / 100).toFixed(2)}`}</button>
      </fieldset>
      {busy && <p role="status">This may take a few minutes. Keep this page open. Your request will not retry automatically.</p>}
      {error && <p role="alert" className="music-error">{error}</p>}
    </form><aside className="music-card"><h2>Your listening room</h2>
      {result ? <><p><strong>Generated audio:</strong> {result.title} {result.day != null ? `· ${result.level} Day ${result.day}` : ''}</p><audio controls src={result.url} preload="metadata" /><a className="music-download" href={result.url} download={result.filename}>Download MP3</a>{result.lyrics && <details><summary>Generated lyrics & structure</summary><pre>{result.lyrics}</pre></details>}</> : <p>Your generated song will appear here.</p>}
      <p>Download before leaving. Audio stays in this page and is not saved in Falowen.</p>
      <hr /><h3>Budget controls</h3><p>Preview first. One generation at a time, with no automatic retries.</p>
      {status && <p>Today: ${(status.dailyCents / 100).toFixed(2)} / $0.80<br />This month: ${(status.monthlyCents / 100).toFixed(2)} / $5.00</p>}
      {capped && <p role="status">Budget reached for this generation. Try after the budget resets.</p>}
      {status && !status.ready && <p>Google API configuration is required before generating.</p>}
      <p className="music-note">Estimates use Google’s listed music prices, excluding backend usage. Failed or timed-out attempts remain counted because they may be billed. Limits reset at midnight UTC / the start of each month.</p>
    </aside></div>
    {courseMode === 'course' && draft && <ReusableMusicQuestions assignmentKey={assignmentKey} lyricsChanged={lyrics !== draft.lyrics} />}
  </main>;
}
