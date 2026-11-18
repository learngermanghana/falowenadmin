import { useEffect, useState } from "react";

export default function SwahiliSlideMusic({ track }) {
  const [cues, setCues] = useState([]);
  const [timingStatus, setTimingStatus] = useState("");
  const [time, setTime] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    fetch("https://www.falowen.app/api/music-lyrics?track=" + track.id, { signal: controller.signal })
      .then((response) => response.ok ? response.json() : null)
      .then((pack) => {
        if (!controller.signal.aborted && pack?.objectKey === track.objectKey && Array.isArray(pack.cues)) {
          setCues(pack.cues);
          setTimingStatus(pack.timingStatus);
        }
      }).catch(() => {});
    return () => controller.abort();
  }, [track]);
  const cue = cues.findLast((entry) => entry.start <= time);
  const current = cue && time < (cue.end ?? Infinity) ? cue : null;
  return <>
    <audio controls preload="none" src={track.audioUrl} onTimeUpdate={(event) => setTime(event.currentTarget.currentTime)} />
    {current && <p aria-live="off" style={{ fontSize: "clamp(1.5rem, 4vw, 3.5rem)" }}><mark>{current.text}</mark></p>}
    {timingStatus === "estimated" && <small>Lyric timing is estimated.</small>}
    {!cues.length && <p>Synced lyrics appear after timing is published in Music Studio.</p>}
  </>;
}
