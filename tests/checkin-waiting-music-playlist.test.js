import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { waitingMusicPlaylist } from "../src/data/pianoPlaylist.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");

function publicPathFromSrc(src) {
  return path.join(repoRoot, "public", decodeURIComponent(String(src || "").replace(/^\//, "")));
}

test("waiting room playlist points only to real public audio files", () => {
  assert.ok(waitingMusicPlaylist.length >= 1);
  assert.ok(waitingMusicPlaylist.some((track) => /Saxophone/i.test(track.title)));

  for (const track of waitingMusicPlaylist) {
    assert.match(track.src, /^\/.+\.mp3$/i);
    assert.equal(fs.existsSync(publicPathFromSrc(track.src)), true, `Missing public audio file for ${track.src}`);
  }
});

test("waiting room audio advances on ended instead of replaying a hard-coded source", () => {
  const source = fs.readFileSync(path.join(repoRoot, "src", "utils", "pianoAudio.js"), "utf8");
  assert.match(source, /startWaitingMusicPlaylist/);
  assert.match(source, /addEventListener\("ended"/);
  assert.match(source, /playTrack\(player\.index \+ 1\)/);
  assert.doesNotMatch(source, /WAITING_MUSIC_SRC/);
  assert.doesNotMatch(source, /audio\.loop\s*=\s*true/);
});

test("check-in display presents waiting room music and current track", () => {
  const page = fs.readFileSync(path.join(repoRoot, "src", "pages", "CheckinDisplayPage.jsx"), "utf8");
  assert.match(page, /Waiting room music/);
  assert.match(page, /startWaitingMusicPlaylist\(context, masterGain/);
  assert.match(page, /Now playing: \$\{currentMusicTrack\}/);
  assert.match(page, /Start waiting music/);
  assert.doesNotMatch(page, /Extended piano playlist/);
  assert.doesNotMatch(page, /PIANO_BAR_INTERVAL_MS/);
});


test("check-in display is a live classroom attendance screen", () => {
  const page = fs.readFileSync(path.join(repoRoot, "src", "pages", "CheckinDisplayPage.jsx"), "utf8");
  const service = fs.readFileSync(path.join(repoRoot, "src", "services", "attendanceService.js"), "utf8");

  assert.match(page, /subscribeSessionCheckins/);
  assert.match(page, /checkin-display-attendance-count/);
  assert.match(page, /QRCodeCanvas value=\{checkinUrl\} size=\{320\}/);
  assert.match(page, /Student names are hidden on the projector by default/);
  assert.match(page, /requestFullscreen/);
  assert.match(page, /Copy check-in link/);
  assert.doesNotMatch(page, /expectedStudents: String/);

  assert.match(service, /export function subscribeSessionCheckins/);
  assert.match(service, /onSnapshot\(/);
});

test("scheduled start is a soft threshold controlled by the teacher", () => {
  const page = fs.readFileSync(path.join(repoRoot, "src", "pages", "CheckinDisplayPage.jsx"), "utf8");

  assert.match(page, /Start class & slides/);
  assert.match(page, /delayClassStart\(5\)/);
  assert.match(page, /delayClassStart\(10\)/);
  assert.match(page, /The class begins only when the teacher presses Start class & slides/);
  assert.match(page, /musicVolume \* 0\.35/);
  assert.match(page, /handleStartClassNow/);
  assert.match(page, /scheduleStartChime\(context, masterGain\)/);
  assert.match(page, /classStartStopTimerRef/);
  assert.doesNotMatch(page, /autoStoppedMusicRef/);
});

test("teacher delay and actual start survive a projector refresh", () => {
  const page = fs.readFileSync(path.join(repoRoot, "src", "pages", "CheckinDisplayPage.jsx"), "utf8");

  assert.match(page, /classStartDecisionStorageKey/);
  assert.match(page, /readClassStartDecision/);
  assert.match(page, /writeClassStartDecision/);
  assert.match(page, /window\.localStorage\.setItem/);
  assert.match(page, /actualStartedAt/);
  assert.match(page, /delayUntil/);
});

test("music can continue after scheduled time until teacher starts class", () => {
  const page = fs.readFileSync(path.join(repoRoot, "src", "pages", "CheckinDisplayPage.jsx"), "utf8");

  assert.match(page, /Scheduled start time reached/);
  assert.match(page, /Waiting-room music can continue quietly/);
  assert.match(page, /disabled=\{!musicPlaying && Boolean\(actualStartedAt\)\}/);
  assert.match(page, /masterGain\.gain\.setTargetAtTime\(\s*Math\.max\(0\.05, musicVolume \* 0\.35\)/);
});


test("teacher-confirmed start uses the synchronized display clock", () => {
  const page = fs.readFileSync(path.join(repoRoot, "src", "pages", "CheckinDisplayPage.jsx"), "utf8");
  assert.match(page, /const startedAt = nowMs;/);
  assert.doesNotMatch(page, /const startedAt = Date\.now\(\);/);
});

test("starting class invalidates pending waiting-room audio startup", () => {
  const page = fs.readFileSync(path.join(repoRoot, "src", "pages", "CheckinDisplayPage.jsx"), "utf8");
  const patch = fs.readFileSync(path.join(repoRoot, "scripts", "patchCheckinWaitingRoomPlaylist.mjs"), "utf8");

  assert.match(page, /musicStartGenerationRef/);
  assert.match(page, /classStartedRef/);
  assert.match(page, /musicStartGenerationRef\.current !== startGeneration \|\| classStartedRef\.current/);
  assert.match(page, /classStartedRef\.current = true;/);
  assert.match(page, /musicStartGenerationRef\.current \+= 1;/);
  assert.match(page, /if \(!musicPlaying\) \{\s*stopWaitingMusic\(\);\s*return;/);

  assert.match(patch, /musicStartGenerationRef\.current !== startGeneration/);
  assert.match(patch, /stopWaitingMusicPlaylist\(context\)/);
});


test("playlist patch upgrades an already-transformed legacy workspace and stays idempotent", () => {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "falowen-checkin-patch-"));
  const scriptsDir = path.join(tempRoot, "scripts");
  const pagesDir = path.join(tempRoot, "src", "pages");
  fs.mkdirSync(scriptsDir, { recursive: true });
  fs.mkdirSync(pagesDir, { recursive: true });

  const patchSource = fs.readFileSync(
    path.join(repoRoot, "scripts", "patchCheckinWaitingRoomPlaylist.mjs"),
    "utf8",
  );
  fs.writeFileSync(path.join(scriptsDir, "patchCheckinWaitingRoomPlaylist.mjs"), patchSource);

  const legacyTransformedPage = `
import { pianoPlaylist } from "../data/pianoPlaylist.js";
import { startWaitingMusicPlaylist, stopWaitingMusicPlaylist } from "../utils/pianoAudio.js";
  const [currentMusicTrack, setCurrentMusicTrack] = useState(pianoPlaylist[0]?.title || "Waiting room music");
  const musicStartGenerationRef = useRef(0);
  const classStartedRef = useRef(false);

  const stopWaitingMusic = useCallback(() => {
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

      await startWaitingMusicPlaylist(context, masterGain, {
        playlist: pianoPlaylist,
        onTrackChange: (track) => {
          setCurrentMusicTrack(track?.title || "Waiting room music");
          setMusicError("");
        },
        onError: (message) => setMusicError(message || "Waiting room music could not continue."),
      });
      setMusicPlaying(true);

      setMusicError(error?.message || "Waiting room music could not start. Raise the device media volume and try again.");

  useEffect(() => () => {
    const context = audioContextRef.current;
    if (context) stopWaitingMusicPlaylist(context);
    if (context && context.state !== "closed") context.close().catch(() => {});
  }, []);

<span aria-hidden="true">♫</span> Waiting room music
                Relaxing instrumental tracks play in sequence and loop while students wait. {musicPlaying ? \`Now playing: \${currentMusicTrack}.\` : ""}
{musicPlaying ? "Stop music" : "Start waiting music"}
              aria-label="Waiting room music volume"
`

  const expectedLegacyAnchors = [
    '  const [currentMusicTrack, setCurrentMusicTrack] = useState(pianoPlaylist[0]?.title || "Waiting room music");',
    `  const stopWaitingMusic = useCallback(() => {
    const context = audioContextRef.current;`,
    `      await startWaitingMusicPlaylist(context, masterGain, {
        playlist: pianoPlaylist,`,
    `  useEffect(() => () => {
    const context = audioContextRef.current;`,
    '                Relaxing instrumental tracks play in sequence and loop while students wait. {musicPlaying ? \`Now playing: \${currentMusicTrack}.\` : ""}',
    '              aria-label="Waiting room music volume"',
  ];

  for (const expectedAnchor of expectedLegacyAnchors) {
    assert.equal(
      legacyTransformedPage.includes(expectedAnchor),
      true,
      `Legacy transformed fixture lost exact whitespace-sensitive anchor: ${expectedAnchor}`,
    );
  }

  const pagePath = path.join(pagesDir, "CheckinDisplayPage.jsx");
  fs.writeFileSync(pagePath, legacyTransformedPage);

  execFileSync(process.execPath, [path.join(scriptsDir, "patchCheckinWaitingRoomPlaylist.mjs")], {
    cwd: tempRoot,
    stdio: "pipe",
  });
  const upgradedOnce = fs.readFileSync(pagePath, "utf8");

  assert.match(upgradedOnce, /const stopWaitingMusic = useCallback\(\(\) => \{\s*musicStartGenerationRef\.current \+= 1;/);
  assert.match(upgradedOnce, /musicStartGenerationRef\.current !== startGeneration \|\| classStartedRef\.current/);
  assert.match(upgradedOnce, /stopWaitingMusicPlaylist\(context\)/);

  execFileSync(process.execPath, [path.join(scriptsDir, "patchCheckinWaitingRoomPlaylist.mjs")], {
    cwd: tempRoot,
    stdio: "pipe",
  });
  const upgradedTwice = fs.readFileSync(pagePath, "utf8");
  assert.equal(upgradedTwice, upgradedOnce);

  fs.rmSync(tempRoot, { recursive: true, force: true });
});


test("check-in starts the shared presenter timer from the actual synchronized class start", () => {
  const page = fs.readFileSync(path.join(repoRoot, "src", "pages", "CheckinDisplayPage.jsx"), "utf8");
  const service = fs.readFileSync(path.join(repoRoot, "src", "services", "presenterLiveSessionService.js"), "utf8");
  const timing = fs.readFileSync(path.join(repoRoot, "src", "utils", "presenterSessionTiming.js"), "utf8");

  assert.match(page, /listClasses\(\)/);
  assert.match(page, /setPresenterClassContext/);
  assert.match(page, /publishPresenterLiveSession/);
  assert.match(page, /classStartedAtMs: startMs/);
  assert.match(page, /classStartSource: "checkin"/);
  assert.match(page, /timerEndAt = startMs \+ \(durationSeconds \* 1000\)/);
  assert.match(page, /timerRunning = true/);
  assert.match(page, /timerUpdatedAtMs = startMs/);
  assert.match(page, /Retry slide sync/);
  assert.match(page, /void syncPresenterStart\(startedAt\)/);

  assert.match(service, /presenterLiveSession\.updatedAt/);
  assert.match(timing, /presenterSessionDurationSeconds/);
});


test("refreshing a persisted check-in start does not republish or restart the shared slide timer", () => {
  const page = fs.readFileSync(path.join(repoRoot, "src", "pages", "CheckinDisplayPage.jsx"), "utf8");

  assert.match(page, /Class start restored\. Shared slide timer was not changed\./);
  assert.doesNotMatch(page, /if \(!actualStartedAt \|\| slideSyncStatus\.state !== "idle"\) return;/);
  assert.doesNotMatch(page, /void syncPresenterStart\(actualStartedAt\);\s*\n\s*}\s*,?\s*\[/);
  assert.match(page, /void syncPresenterStart\(startedAt\)/);
});

test("check-in only publishes presenter timer state for today's presenter date", () => {
  const page = fs.readFileSync(path.join(repoRoot, "src", "pages", "CheckinDisplayPage.jsx"), "utf8");

  assert.match(page, /const currentPresenterDate = presenterLocalDateKey\(\);/);
  assert.match(page, /if \(sessionDate !== currentPresenterDate\) \{/);
  assert.match(page, /state: "skipped-date"/);
  assert.match(page, /Presenter sync only runs for today/);

  const dateGuardIndex = page.indexOf("if (sessionDate !== currentPresenterDate)");
  const publishIndex = page.indexOf("await publishPresenterLiveSession");
  assert.ok(dateGuardIndex >= 0 && publishIndex > dateGuardIndex, "date guard must run before Firestore presenter publish");
});
