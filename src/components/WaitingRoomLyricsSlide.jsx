import { activeLyricIndex } from '../utils/songLyrics.js';

export default function WaitingRoomLyricsSlide({title,cues=[],time=0,playing=false}) {
  const current=playing?activeLyricIndex(cues,time):-1;
  return <div className="checkin-display-lobby-content checkin-display-lobby-lyrics" aria-label="Waiting room lyrics" lang="de">
    <span className="checkin-display-lobby-eyebrow">Falowen Music · Liedtext</span>
    <h2>{title}</h2>
    {current<0 ? <div className="checkin-display-lyrics-break" role="status">
      <span aria-hidden="true">♫</span>
      <p>{playing?'Listen to the music…':'Music paused'}</p>
    </div> : <div className="checkin-display-lyric-window" aria-label="Previous, current and next lyric">
      {[current-1,current,current+1].map((index,slot)=><p key={slot}
        className={slot===1?'is-current':''} aria-current={slot===1?'true':undefined}
        aria-live={slot===1?'polite':undefined} aria-hidden={!cues[index]?true:undefined}>
        {cues[index]?.text || '\u00a0'}
      </p>)}
    </div>}
    <p className="checkin-display-lyrics-hint">Hör zu und lies mit. · Press Next to return to the lobby slides.</p>
  </div>;
}
