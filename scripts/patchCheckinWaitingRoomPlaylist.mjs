import fs from "node:fs";

const pageTarget = new URL("../src/pages/CheckinDisplayPage.jsx", import.meta.url);
let source = fs.readFileSync(pageTarget, "utf8");

function replaceOnce(before, after, label) {
  if (source.includes(after)) return;
  if (!source.includes(before)) throw new Error(`Check-in waiting music patch anchor changed: ${label}`);
  source = source.replace(before, after);
}

function upgradeOnce(before, after) {
  if (source.includes(after)) return;
  if (source.includes(before)) source = source.replace(before, after);
}

replaceOnce(
  'import { pianoPieces, pianoPlaylist } from "../data/pianoPlaylist.js";',
  'import { pianoPlaylist } from "../data/pianoPlaylist.js";',
  "playlist import",
);

replaceOnce(
  'import { PIANO_BAR_INTERVAL_MS, schedulePianoBar } from "../utils/pianoAudio.js";',
  'import { startWaitingMusicPlaylist, stopWaitingMusicPlaylist } from "../utils/pianoAudio.js";',
  "audio helper import",
);

upgradeOnce(
  'import { startWaitingMusicPlaylist, stopWaitingMusicPlaylist } from "../utils/pianoAudio.js";',
  'import { skipWaitingMusicPlaylist, startWaitingMusicPlaylist, stopWaitingMusicPlaylist } from "../utils/pianoAudio.js";',
);

replaceOnce(
  '  const [currentPianoPiece, setCurrentPianoPiece] = useState(pianoPieces[0][0]);',
  '  const [currentMusicTrack, setCurrentMusicTrack] = useState(pianoPlaylist[0]?.title || "Waiting room music");',
  "current track state",
);

replaceOnce(
  '  const musicTimerRef = useRef(null);\n  const musicChordIndexRef = useRef(0);\n',
  '',
  "legacy interval refs",
);

upgradeOnce(
  '    if (musicPlaying || classStartedRef.current) return;',
  '    if (musicPlaying) return;',
);

upgradeOnce(
  '              disabled={!musicPlaying && Boolean(actualStartedAt)}\n',
  '',
);

upgradeOnce(
  `  const stopWaitingMusic = useCallback(() => {
    const context = audioContextRef.current;
    audioContextRef.current = null;
    musicGainRef.current = null;
    setCurrentMusicTrack(pianoPlaylist[0]?.title || "Waiting room music");

    if (context) stopWaitingMusicPlaylist(context);
    if (context && context.state !== "closed") {
      context.close().catch(() => {});
    }
    setMusicPlaying(false);
  }, []);`,
  `  const stopWaitingMusic = useCallback(() => {
    musicStartGenerationRef.current += 1;
    const context = audioContextRef.current;
    audioContextRef.current = null;
    musicGainRef.current = null;
    setCurrentMusicTrack(pianoPlaylist[0]?.title || "Waiting room music");

    if (context) stopWaitingMusicPlaylist(context);
    if (context && context.state !== "closed") {
      context.close().catch(() => {});
    }
    setMusicPlaying(false);
  }, []);`,
);

replaceOnce(
  `  const stopWaitingMusic = useCallback(() => {
    musicStartGenerationRef.current += 1;
    if (musicTimerRef.current) {
      window.clearInterval(musicTimerRef.current);
      musicTimerRef.current = null;
    }

    const context = audioContextRef.current;
    audioContextRef.current = null;
    musicGainRef.current = null;
    musicChordIndexRef.current = 0;
    setCurrentPianoPiece(pianoPieces[0][0]);

    if (context && context.state !== "closed") {
      context.close().catch(() => {});
    }
    setMusicPlaying(false);
  }, []);`,
  `  const stopWaitingMusic = useCallback(() => {
    musicStartGenerationRef.current += 1;
    const context = audioContextRef.current;
    audioContextRef.current = null;
    musicGainRef.current = null;
    setCurrentMusicTrack(pianoPlaylist[0]?.title || "Waiting room music");

    if (context) stopWaitingMusicPlaylist(context);
    if (context && context.state !== "closed") {
      context.close().catch(() => {});
    }
    setMusicPlaying(false);
  }, []);`,
  "stop waiting music",
);

upgradeOnce(
  `  const stopWaitingMusic = useCallback(() => {
    musicStartGenerationRef.current += 1;
    const context = audioContextRef.current;
    audioContextRef.current = null;
    musicGainRef.current = null;
    setCurrentMusicTrack(pianoPlaylist[0]?.title || "Waiting room music");

    if (context) stopWaitingMusicPlaylist(context);
    if (context && context.state !== "closed") {
      context.close().catch(() => {});
    }
    setMusicPlaying(false);
  }, []);`,
  `  const stopWaitingMusic = useCallback(() => {
    musicStartGenerationRef.current += 1;
    const context = audioContextRef.current;
    audioContextRef.current = null;
    musicGainRef.current = null;
    setCurrentMusicTrack(pianoPlaylist[0]?.title || "Waiting room music");

    if (context) stopWaitingMusicPlaylist(context);
    if (context && context.state !== "closed") {
      context.close().catch(() => {});
    }
    setMusicPlaying(false);
  }, []);

  const skipWaitingMusic = useCallback(async () => {
    const context = audioContextRef.current;
    if (!musicPlaying || pianoPlaylist.length <= 1 || !context || context.state === "closed") return;

    try {
      setMusicError("");
      await skipWaitingMusicPlaylist(context);
    } catch (error) {
      setMusicError(error?.message || "The next waiting room track could not start.");
    }
  }, [musicPlaying]);`,
);

upgradeOnce(
  `      await startWaitingMusicPlaylist(context, masterGain, {
        playlist: pianoPlaylist,
        onTrackChange: (track) => {
          setCurrentMusicTrack(track?.title || "Waiting room music");
          setMusicError("");
        },
        onError: (message) => setMusicError(message || "Waiting room music could not continue."),
      });
      setMusicPlaying(true);`,
  `      await startWaitingMusicPlaylist(context, masterGain, {
        playlist: pianoPlaylist,
        onTrackChange: (track) => {
          setCurrentMusicTrack(track?.title || "Waiting room music");
          setMusicError("");
        },
        onError: (message) => setMusicError(message || "Waiting room music could not continue."),
      });
      if (musicStartGenerationRef.current !== startGeneration) {
        stopWaitingMusicPlaylist(context);
        if (context.state !== "closed") context.close().catch(() => {});
        return;
      }
      setMusicPlaying(true);`,
);

replaceOnce(
  `      const playNextBar = () => {
        if (context.state !== "running") return;
        const bar = pianoPlaylist[musicChordIndexRef.current % pianoPlaylist.length];
        musicChordIndexRef.current += 1;
        setCurrentPianoPiece(bar.title);
        schedulePianoBar(context, masterGain, bar);
      };

      playNextBar();
      musicTimerRef.current = window.setInterval(playNextBar, PIANO_BAR_INTERVAL_MS);
      setMusicPlaying(true);`,
  `      await startWaitingMusicPlaylist(context, masterGain, {
        playlist: pianoPlaylist,
        onTrackChange: (track) => {
          setCurrentMusicTrack(track?.title || "Waiting room music");
          setMusicError("");
        },
        onError: (message) => setMusicError(message || "Waiting room music could not continue."),
      });
      if (musicStartGenerationRef.current !== startGeneration) {
        stopWaitingMusicPlaylist(context);
        if (context.state !== "closed") context.close().catch(() => {});
        return;
      }
      setMusicPlaying(true);`,
  "real playlist start",
);

replaceOnce(
  '      setMusicError(error?.message || "Piano music could not start. Raise the device media volume and try again.");',
  '      setMusicError(error?.message || "Waiting room music could not start. Raise the device media volume and try again.");',
  "start error copy",
);

replaceOnce(
  `  useEffect(() => () => {
    if (musicTimerRef.current) window.clearInterval(musicTimerRef.current);
    const context = audioContextRef.current;
    if (context && context.state !== "closed") context.close().catch(() => {});
  }, []);`,
  `  useEffect(() => () => {
    const context = audioContextRef.current;
    if (context) stopWaitingMusicPlaylist(context);
    if (context && context.state !== "closed") context.close().catch(() => {});
  }, []);`,
  "component cleanup",
);

replaceOnce(
  '<span aria-hidden="true">♫</span> Extended piano playlist',
  '<span aria-hidden="true">♫</span> Waiting room music',
  "music title",
);

replaceOnce(
  '                About four minutes of original modern and cinematic piano before repeating. {musicPlaying ? `Now playing: ${currentPianoPiece}.` : ""}',
  '                Relaxing instrumental tracks play in sequence and loop while students wait. {musicPlaying ? `Now playing: ${currentMusicTrack}.` : ""}',
  "music description",
);

replaceOnce(
  '{musicPlaying ? "Stop piano" : "Start piano playlist"}',
  '{musicPlaying ? "Stop music" : "Start waiting music"}',
  "music button copy",
);

upgradeOnce(
  `            <button
              type="button"
              className="checkin-display-music-button"
              onClick={musicPlaying ? stopWaitingMusic : startWaitingMusic}
            >`,
  `            {musicPlaying && pianoPlaylist.length > 1 ? (
              <button
                type="button"
                className="checkin-display-music-skip-button"
                onClick={skipWaitingMusic}
                aria-label="Skip to next waiting room track"
              >
                Skip
              </button>
            ) : null}
            <button
              type="button"
              className="checkin-display-music-button"
              onClick={musicPlaying ? stopWaitingMusic : startWaitingMusic}
            >`,
);

replaceOnce(
  '              aria-label="Piano music volume"',
  '              aria-label="Waiting room music volume"',
  "volume label",
);

for (const marker of [
  "startWaitingMusicPlaylist(context, masterGain",
  "Waiting room music",
  "Now playing: ${currentMusicTrack}",
  "Stop music",
  "Start waiting music",
  "skipWaitingMusicPlaylist(context)",
  "musicStartGenerationRef.current !== startGeneration",
]) {
  if (!source.includes(marker)) throw new Error(`Waiting room playlist marker missing: ${marker}`);
}

fs.writeFileSync(pageTarget, source, "utf8");
console.log("Check-in display now plays the configured waiting room playlist sequentially.");
