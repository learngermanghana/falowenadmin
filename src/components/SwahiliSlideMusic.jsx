import { useEffect, useState } from "react";

export default function SwahiliSlideMusic({ track }) {
  return <RecordingLyrics key={track.objectKey} track={track} />;
}

function RecordingLyrics({ track }) {
  const [pack, setPack] = useState(null);
  const [time, setTime] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    fetch("https://www.falowen.app/api/music-lyrics?track=" + track.id, { signal: controller.signal })
      .then((response) => response.ok ? response.json() : null)
      .then((pack) => {
        if (!controller.signal.aborted && pack?.objectKey === track.objectKey && typeof pack.lyrics === "string") {
          setPack(pack);
        }
      }).catch(() => {});
    return () => controller.abort();
  }, [track]);
  const cues = pack?.cues || [];
  const cue = cues.findLast((entry) => entry.start <= time);
  const current = cue && time < (cue.end ?? Infinity) ? cue : null;
  return <>
    <audio controls preload="none" src={track.audioUrl} onTimeUpdate={(event) => setTime(event.currentTarget.currentTime)} />
    {current && <p aria-live="off" style={{ fontSize: "clamp(1.5rem, 4vw, 3.5rem)" }}><mark>{current.text}</mark></p>}
    {pack?.timingStatus === "estimated" && <small>Lyric timing is estimated.</small>}
    {pack?.lyrics && <details>
      <summary>Maneno ya wimbo · Song lyrics</summary>
      <p lang="sw" style={{ whiteSpace: "pre-line" }}>{pack.lyrics}</p>
    </details>}
    {!pack?.lyrics && !cues.length && <p>Synced lyrics appear after timing is published in Music Studio.</p>}
  </>;
}
