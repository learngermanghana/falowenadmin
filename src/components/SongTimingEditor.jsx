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
  function updateLineTime(index,value) {
    const parsed=Number(value);
    const previous=index>0 ? cues[index-1]?.start : -1;
    const next=index<cues.length-1 ? cues[index+1]?.start : Number.POSITIVE_INFINITY;
    if(!Number.isFinite(parsed)||parsed<0||parsed<=previous||parsed>=next){
      setError('Diese Zeitmarke muss zwischen der vorherigen und der nächsten Zeile liegen.');
      return;
    }
    save(cues.map((cue,i)=>i===index?{...cue,start:Math.round(parsed*100)/100}:cue));
  }
  function useCurrentTime(index) {
    const player=audio.current;
    if(!player || player.readyState<1 || !Number.isFinite(player.currentTime)){
      setError('Bitte zuerst das Lied laden und abspielen.');
      return;
    }
    updateLineTime(index,player.currentTime);
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
    {cues.length>0 && <div className="music-timing-line-editor" style={{maxHeight:360,overflowY:"auto",border:"1px solid #dbe5df",borderRadius:12,padding:10,display:"grid",gap:8}}>
      <strong>Jede Liedzeile zeitlich korrigieren</strong>
      <small>Spiele die Aufnahme, setze den Anfang jeder gesungenen Zeile und verlasse das Zahlenfeld zum Speichern.</small>
      {cues.map((cue,i)=><div key={i} style={{display:"grid",gridTemplateColumns:"minmax(0,1fr) auto auto",alignItems:"center",gap:7,paddingBottom:6,borderBottom:"1px solid #e6eee9"}}>
        <span style={{fontSize:13}}>{i+1}. {cue.text}</span>
        <input type="number" min="0" step="0.01" key={i+"-"+cue.start} defaultValue={cue.start}
          aria-label={"Zeilenanfang "+(i+1)+" (Sekunden)"}
          style={{width:82,maxWidth:"100%"}} onBlur={event=>updateLineTime(i,event.currentTarget.value)}/>
        <button type="button" onClick={()=>useCurrentTime(i)}>Jetzt</button>
      </div>)}
    </div>}
    <p>Nach der Prüfung: <strong>{filename}</strong> neben der MP3 in <code>{objectKey?.slice(0,objectKey.lastIndexOf('/')+1)}</code> hochladen. Admin-Folien und Falowen Music lesen dieselbe Datei. Die MP3 bleibt unverändert.</p>
    {cues.length>0 && <p>Letzte Markierung: {songTime(cues.at(-1).start)}</p>}
    {error && <p role="alert">{error}</p>}
  </details>;
}
