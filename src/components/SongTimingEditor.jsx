import { useState } from 'react';
import { lyricLines, songTime, validateLyricCues } from '../utils/songLyrics.js';
export default function SongTimingEditor({song, audio, cues, onSave}) {
  const [error, setError] = useState('');
  const lines = lyricLines(song.lyrics);
  const objectKey = song.objectKey || song.audioKey;
  const filename = objectKey?.split('/').pop().replace(/\.mp3$/i,'.lyrics.json');
  function save(next) {
    setError(onSave(next) ? '' : 'Zeitmarken bleiben nur bis zum Schließen erhalten. Bitte exportieren.');
  }
  function mark() {
    const player = audio.current;
    if (!player || player.readyState < 1 || !Number.isFinite(player.currentTime)) { setError('Bitte zuerst das Lied laden und abspielen.'); return; }
    const start = Math.round(player.currentTime * 100) / 100;
    if (cues.length && start <= cues.at(-1).start) { setError('Die nächste Zeile muss nach der letzten Markierung beginnen.'); return; }
    if (cues.length < lines.length) save([...cues,{start,text:lines[cues.length]}]);
  }
  async function importFile(event) {
    const file=event.target.files?.[0]; if(!file) return;
    try {
      if(file.size>100000) throw Error();
      const data=JSON.parse(await file.text());
      const checked=validateLyricCues(data.cues,lines);
      if(data.objectKey!==objectKey || !checked.length) throw Error();
      save(checked);
    } catch { setError('Diese Datei passt nicht zum Liedtext und zur Aufnahme.'); }
    event.target.value='';
  }
  function exportFile() {
    const data={version:1,objectKey,lyrics:song.lyrics,cues};
    const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));
    const link=document.createElement('a');link.href=url;link.download=filename;link.click();URL.revokeObjectURL(url);
  }
  return <details className="lesson-song-sync"><summary>Lehrkraft · Zeitmarken für beide Musikplayer</summary>
    <p>Spiele die fertige Aufnahme und markiere jeden Zeilenanfang. Wiederholte Refrains bekommen eigene Zeitmarken. Die Hervorhebung folgt anschließend automatisch dem Lied.</p>
    <p><strong>{cues.length}/{lines.length} Zeilen · Nächste Zeile: {lines[cues.length] || 'Fertig'}</strong></p>
    <div className="lesson-song-sync-actions">
      <button type="button" disabled={cues.length>=lines.length} onClick={mark}>Zeilenanfang markieren</button>
      <button type="button" disabled={!cues.length} onClick={()=>save(cues.slice(0,-1))}>Letzte Markierung zurück</button>
      <button type="button" disabled={!objectKey || !lines.length || cues.length!==lines.length} onClick={exportFile}>Zeitmarken für Cloudflare exportieren</button>
      <label>Zeitmarken importieren <input type="file" accept="application/json,.json" onChange={importFile}/></label>
    </div>
    <p>Nach der Prüfung: <strong>{filename}</strong> neben der MP3 in <code>{objectKey?.slice(0,objectKey.lastIndexOf('/')+1)}</code> hochladen. Admin-Folien und Falowen Music lesen dieselbe Datei. Die MP3 bleibt unverändert.</p>
    {cues.length>0 && <p>Letzte Markierung: {songTime(cues.at(-1).start)}</p>}
    {error && <p role="alert">{error}</p>}
  </details>;
}
