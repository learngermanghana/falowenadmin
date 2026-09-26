import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { waitingMusicPlaylist } from "../src/data/pianoPlaylist.js";
import { checkinSessionDateKey } from "../src/utils/checkinSessionDate.js";
import { presenterSessionKey } from "../src/utils/presenterSessionIdentity.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");

function publicPathFromSrc(src) {
  return path.join(repoRoot, "public", decodeURIComponent(String(src || "").replace(/^\//, "")));
}

test("waiting room playlist includes every public MP3 and points only to real files", () => {
  const publicMp3Files = fs.readdirSync(path.join(repoRoot, "public"))
    .filter((name) => /\.mp3$/i.test(name))
    .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));

  assert.ok(publicMp3Files.length >= 1);
  assert.equal(waitingMusicPlaylist.length, publicMp3Files.length);
  assert.ok(waitingMusicPlaylist.some((track) => /Saxophone/i.test(track.title)));

  const configuredFiles = waitingMusicPlaylist
    .map((track) => path.basename(decodeURIComponent(track.src)))
    .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));

  assert.deepEqual(configuredFiles, publicMp3Files);

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

test("waiting room music can skip to the next configured track", () => {
  const audio = fs.readFileSync(path.join(repoRoot, "src", "utils", "pianoAudio.js"), "utf8");
  const page = fs.readFileSync(path.join(repoRoot, "src", "pages", "CheckinDisplayPage.jsx"), "utf8");
  const patch = fs.readFileSync(path.join(repoRoot, "scripts", "patchCheckinWaitingRoomPlaylist.mjs"), "utf8");

  assert.match(audio, /export async function skipWaitingMusicPlaylist/);
  assert.match(audio, /await player\.playTrack\(player\.index \+ 1\)/);
  assert.match(page, /const skipWaitingMusic = useCallback/);
  assert.match(page, /pianoPlaylist\.length > 1/);
  assert.match(page, /disabled=\{!musicPlaying\}/);
  assert.match(page, /Start waiting music before skipping tracks/);
  assert.match(page, />\s*Skip\s*<\/button>/);
  assert.match(patch, /skipWaitingMusicPlaylist/);
  assert.match(patch, /checkin-display-music-skip-button/);
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

  assert.match(page, /Scheduled start reached/);
  assert.match(page, /The class begins only when the teacher presses Start class & slides/);
  assert.doesNotMatch(page, /disabled=\{!musicPlaying && Boolean\(actualStartedAt\)\}/);
  assert.match(page, /onClick=\{musicPlaying \? stopWaitingMusic : startWaitingMusic\}/);
  assert.match(page, /masterGain\.gain\.setTargetAtTime\(\s*Math\.max\(0\.05, musicVolume \* 0\.35\)/);
});


test("teacher-confirmed start uses the synchronized display clock", () => {
  const page = fs.readFileSync(path.join(repoRoot, "src", "pages", "CheckinDisplayPage.jsx"), "utf8");
  assert.match(page, /const startedAt = nowMs;/);
  assert.doesNotMatch(page, /const startedAt = Date\.now\(\);/);
});



test("music can be started manually after class has started or ended", () => {
  const page = fs.readFileSync(path.join(repoRoot, "src", "pages", "CheckinDisplayPage.jsx"), "utf8");
  const patch = fs.readFileSync(path.join(repoRoot, "scripts", "patchCheckinWaitingRoomPlaylist.mjs"), "utf8");

  assert.match(page, /const startWaitingMusic = useCallback\(async \(\) => \{\s*if \(musicPlaying\) return;/);
  assert.doesNotMatch(page, /if \(musicPlaying \|\| classStartedRef\.current\) return;/);
  assert.doesNotMatch(page, /disabled=\{!musicPlaying && Boolean\(actualStartedAt\)\}/);
  assert.match(patch, /'    if \(musicPlaying \|\| classStartedRef\.current\) return;',\s*'    if \(musicPlaying\) return;'/);
  assert.match(patch, /disabled=\{!musicPlaying && Boolean\(actualStartedAt\)\}/);
});

test("starting class invalidates pending waiting-room audio startup", () => {
  const page = fs.readFileSync(path.join(repoRoot, "src", "pages", "CheckinDisplayPage.jsx"), "utf8");
  const patch = fs.readFileSync(path.join(repoRoot, "scripts", "patchCheckinWaitingRoomPlaylist.mjs"), "utf8");

  assert.match(page, /musicStartGenerationRef/);
  assert.match(page, /classStartedRef/);
  assert.match(page, /musicStartGenerationRef\.current !== startGeneration/);
  assert.doesNotMatch(page, /musicStartGenerationRef\.current !== startGeneration \|\| classStartedRef\.current/);
  assert.match(page, /classStartedRef\.current = true;/);
  assert.match(page, /musicStartGenerationRef\.current \+= 1;/);
  assert.match(page, /if \(!context \|\| !masterGain \|\| context\.state === "closed" \|\| !musicPlaying\) \{\s*stopWaitingMusic\(\);\s*return;/);

  assert.match(patch, /musicStartGenerationRef\.current !== startGeneration/);
  assert.match(patch, /stopWaitingMusicPlaylist\(context\)/);
});


test("playlist patch upgrades an already-transformed legacy workspace and stays idempotent", () => {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "falowen-checkin-patch-"));
  const scriptsDir = path.join(tempRoot, "scripts");
  const pagesDir = path.join(tempRoot, "src", "pages");
  const dataDir = path.join(tempRoot, "src", "data");
  fs.mkdirSync(scriptsDir, { recursive: true });
  fs.mkdirSync(pagesDir, { recursive: true });
  fs.mkdirSync(dataDir, { recursive: true });
  fs.writeFileSync(
    path.join(dataDir, "pianoPlaylist.js"),
    'export const waitingMusicPlaylist = Object.freeze([{ id: "fixture", title: "Fixture", src: "/fixture.mp3" }]);\nexport const pianoPlaylist = waitingMusicPlaylist;\nexport const pianoPieces = [];\n',
  );

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
  assert.match(upgradedOnce, /musicStartGenerationRef\.current !== startGeneration/);
  assert.doesNotMatch(upgradedOnce, /musicStartGenerationRef\.current !== startGeneration \|\| classStartedRef\.current/);
  assert.match(upgradedOnce, /stopWaitingMusicPlaylist\(context\)/);

  execFileSync(process.execPath, [path.join(scriptsDir, "patchCheckinWaitingRoomPlaylist.mjs")], {
    cwd: tempRoot,
    stdio: "pipe",
  });
  const upgradedTwice = fs.readFileSync(pagePath, "utf8");
  assert.equal(upgradedTwice, upgradedOnce);

  fs.rmSync(tempRoot, { recursive: true, force: true });
});


test("check-in infers class level from class names and fits short laptop screens", () => {
  const page = fs.readFileSync(path.join(repoRoot, "src", "pages", "CheckinDisplayPage.jsx"), "utf8");
  const css = fs.readFileSync(path.join(repoRoot, "src", "pages", "CheckinDisplayPage.css"), "utf8");

  assert.match(page, /klass\.resolvedLevelId/);
  assert.match(page, /klass\.classLevel/);
  assert.match(page, /klass\.name/);
  assert.match(page, /klass\.className/);
  assert.match(page, /klass\.slug/);
  assert.match(css, /@media \(min-width: 851px\) and \(max-height: 820px\)/);
  assert.match(css, /width: min\(220px, 30vh\) !important/);
  assert.match(css, /@media \(min-width: 851px\) and \(max-height: 700px\)/);
  assert.match(css, /width: min\(185px, 27vh\) !important/);
});

test("check-in starts the shared presenter timer from the actual synchronized class start", () => {
  const page = fs.readFileSync(path.join(repoRoot, "src", "pages", "CheckinDisplayPage.jsx"), "utf8");
  const service = fs.readFileSync(path.join(repoRoot, "src", "services", "presenterLiveSessionService.js"), "utf8");
  const timing = fs.readFileSync(path.join(repoRoot, "src", "utils", "presenterSessionTiming.js"), "utf8");

  assert.match(page, /listClasses\(\)/);
  assert.match(page, /setPresenterClassContext/);
  assert.match(page, /startPresenterLiveSession/);
  assert.match(page, /classStartedAtMs: startMs/);
  assert.match(page, /classStartSource: "checkin"/);
  assert.match(page, /timerEndAt = startMs \+ \(durationSeconds \* 1000\)/);
  assert.match(page, /timerRunning = true/);
  assert.match(page, /timerUpdatedAtMs = startMs/);
  assert.match(page, /sessionDurationSeconds\(startTime, endTime\)/);
  assert.match(page, /const configuredLevelDurationSeconds = presenterSessionDurationSeconds\(level\)/);
  assert.match(page, /attendanceDurationSeconds > 0 && configuredLevelDurationSeconds > 0/);
  assert.match(page, /Math\.min\(attendanceDurationSeconds, configuredLevelDurationSeconds\)/);
  assert.match(page, /attendanceDurationSeconds \|\| configuredLevelDurationSeconds/);
  assert.match(page, /Retry slide sync|Retry connection/);
  assert.match(page, /void syncPresenterStart\(startedAt\)/);

  assert.match(service, /presenterSessions\.\$\{key\}/);
  assert.match(timing, /presenterSessionDurationSeconds/);
});


test("check-in repairs an already-running shared timer that exceeds the level duration", () => {
  const page = fs.readFileSync(path.join(repoRoot, "src", "pages", "CheckinDisplayPage.jsx"), "utf8");

  assert.match(page, /publishPresenterLiveSession/);
  assert.match(page, /const sharedTimerDuration = Math\.max\(0, Number\(shared\.timerDurationSeconds \|\| 0\)\)/);
  assert.match(page, /const timerDurationMismatch = durationSeconds > 0/);
  assert.match(page, /const timerRemainingTooLong = sharedTimerEndAt > 0/);
  assert.match(page, /const timerNeverInitialized = shared\.classStartSource === "checkin"/);
  assert.match(page, /const canRepairSharedTimer = !sharedEnd/);
  assert.match(page, /timerNeverInitialized/);
  assert.match(page, /await publishPresenterLiveSession\(classRecordId, repairedPatch, sessionKey\)/);
  assert.match(page, /Timer corrected to the \$\{durationSeconds \/ 60\}-minute \$\{level\} class duration · waiting for Slides acknowledgement/);
});


test("refreshing a persisted check-in start reconnects shared slides without changing the original start", () => {
  const page = fs.readFileSync(path.join(repoRoot, "src", "pages", "CheckinDisplayPage.jsx"), "utf8");

  assert.match(page, /Class start restored\. Reconnecting the shared slide timer automatically/);
  assert.match(page, /autoPresenterRecoveryRef/);
  assert.match(page, /void syncPresenterStart\(actualStartedAt, \{ recovery: true \}\)/);
  assert.match(page, /document\.addEventListener\("visibilitychange", recoverAfterWake\)/);
  assert.match(page, /window\.addEventListener\("online", recoverOnline\)/);
  assert.match(page, /void syncPresenterStart\(startedAt\)/);
});

test("restored presenter snapshots revalidate attendance timers while preserving non-attendance active sessions", () => {
  const page = fs.readFileSync(path.join(repoRoot, "src", "pages", "CheckinDisplayPage.jsx"), "utf8");

  assert.match(page, /const sharedIsActive = Boolean\(presenterLiveState\.isActiveSession\)/);
  assert.match(page, /if \(sharedEnded\) \{/);
  assert.match(page, /state: "ended-synced"/);
  assert.match(page, /if \(sharedIsActive && presenterLiveState\.classStartSource !== "checkin"\) \{/);
  assert.match(page, /state: "synced"/);
  assert.match(page, /Attendance-owned sessions are revalidated against the level duration/);
  assert.match(page, /Let the transaction decide/);
  assert.match(page, /void syncPresenterStart\(actualStartedAt, \{ recovery: true \}\)/);
  assert.doesNotMatch(page, /sharedIsActive[\s\S]{0,500}state: "stale-blocked"/);
});

test("check-in only publishes presenter timer state for today's presenter date", () => {
  const page = fs.readFileSync(path.join(repoRoot, "src", "pages", "CheckinDisplayPage.jsx"), "utf8");

  assert.match(page, /const currentPresenterDate = presenterLocalDateKey\(\);/);
  assert.match(page, /if \(sessionDate !== currentPresenterDate\) \{/);
  assert.match(page, /state: "skipped-date"/);
  assert.match(page, /Presenter sync only runs for today/);

  const dateGuardIndex = page.indexOf("if (sessionDate !== currentPresenterDate)");
  const publishIndex = page.indexOf("await startPresenterLiveSession");
  assert.ok(dateGuardIndex >= 0 && publishIndex > dateGuardIndex, "date guard must run before Firestore presenter publish");
});


test("supported attendance dates normalize only when the calendar date is valid", () => {
  assert.equal(checkinSessionDateKey("Tuesday, 10 February 2026"), "2026-02-10");
  assert.equal(checkinSessionDateKey("10 February 2026"), "2026-02-10");
  assert.equal(checkinSessionDateKey("2026-09-20"), "2026-09-20");
  assert.equal(checkinSessionDateKey("Saturday, 29 February 2020"), "2020-02-29");

  assert.equal(checkinSessionDateKey("Tuesday, 31 February 2026"), null);
  assert.equal(checkinSessionDateKey("2026-02-31"), null);
  assert.equal(checkinSessionDateKey("29 February 2026"), null);
  assert.equal(checkinSessionDateKey("31 April 2026"), null);
  assert.equal(checkinSessionDateKey(""), "");
  assert.equal(checkinSessionDateKey("not-a-real-date"), null);
});

test("restored class starts recover automatically and keep manual retry for failed acknowledgement", () => {
  const page = fs.readFileSync(path.join(repoRoot, "src", "pages", "CheckinDisplayPage.jsx"), "utf8");

  assert.match(page, /\["restored", "error"\]\.includes\(slideSyncStatus\.state\)/);
  assert.match(page, /sharedTimerMissing/);
  assert.match(page, /Retry slide sync|Retry connection/);
  assert.doesNotMatch(page, />Sync slides now<\/button>/);
});

test("presenter date guard uses normalized supported labels and only falls back when the date is absent", () => {
  const page = fs.readFileSync(path.join(repoRoot, "src", "pages", "CheckinDisplayPage.jsx"), "utf8");

  assert.match(page, /const rawSessionDate = String\(dateLabel \|\| ""\)\.trim\(\);/);
  assert.match(page, /const parsedSessionDate = rawSessionDate \? checkinSessionDateKey\(rawSessionDate\) : "";/);
  assert.match(page, /const sessionDate = rawSessionDate\s*\? parsedSessionDate\s*:\s*presenterLocalDateKey\(new Date\(startMs\)\);/);
  assert.match(page, /if \(rawSessionDate && !sessionDate\) \{/);
});


test("check-in date parser does not rely on Date rollover semantics", () => {
  const util = fs.readFileSync(path.join(repoRoot, "src", "utils", "checkinSessionDate.js"), "utf8");
  assert.doesNotMatch(util, /new Date\(raw\)/);
  assert.match(util, /daysInMonth/);
  assert.match(util, /isLeapYear/);
  assert.match(util, /validDateParts/);
});


test("presenter session keys are deterministic and Firestore field-path safe", () => {
  const key = presenterSessionKey({
    sessionDate: "2026-09-20",
    sessionId: "14",
    assignmentId: "A2-7.20",
  });
  assert.equal(key, presenterSessionKey({
    sessionDate: "2026-09-20",
    sessionId: "14",
    assignmentId: "A2-7.20",
  }));
  assert.match(key, /^[A-Za-z0-9_-]+$/);
  assert.doesNotMatch(key, /\./);
});

test("check-in exposes session status and records class end duration", () => {
  const page = fs.readFileSync(path.join(repoRoot, "src", "pages", "CheckinDisplayPage.jsx"), "utf8");
  assert.match(page, /Slides connected · timer synced/);
  assert.match(page, />End class<\/button>/);
  assert.match(page, /endPresenterLiveSession/);
  assert.match(page, /classDurationSeconds/);
  assert.match(page, /attendanceCheckedInCountAtEnd/);
  assert.match(page, /actualEndedAt/);
});

test("initial presenter start is atomic and preserves the transaction winner", () => {
  const page = fs.readFileSync(path.join(repoRoot, "src", "pages", "CheckinDisplayPage.jsx"), "utf8");
  const service = fs.readFileSync(path.join(repoRoot, "src", "services", "presenterLiveSessionService.js"), "utf8");

  assert.match(service, /runTransaction/);
  assert.match(service, /const snapshot = await transaction\.get\(classRef\);/);
  assert.match(service, /if \(existing\.sessionKey === key && existingStart > 0\)/);
  assert.match(service, /const activeSessionKey = normalize\(data\.presenterActiveSessionKey\)/);
  assert.match(service, /const wasActive = activeSessionKey === key/);
  assert.match(service, /const sessionEnded = existing\.classLifecycleStatus === "ended"/);
  assert.match(service, /blockedByNewerActiveSession/);
  assert.match(service, /const shouldReactivate = !wasActive && !sessionEnded && !blockedByNewerActiveSession/);
  assert.match(service, /reactivated: shouldReactivate/);
  assert.match(service, /shouldReactivate \? \{ activeSessionKey: key, isActiveSession: true \} : \{\}/);
  assert.match(service, /created: false/);
  assert.match(service, /transaction\.update\(classRef/);
  assert.doesNotMatch(service, /await updateDoc\(doc\(db, "classes", id\), \{\s*presenterActiveSessionKey/);

  assert.match(page, /const startResult = await startPresenterLiveSession\(classRecordId, sessionKey, livePatch\);/);
  assert.match(page, /if \(!startResult\.created\)/);
  assert.match(page, /This class session is already ended\. Shared state was preserved\./);
  assert.match(page, /Class start sent to Slides · waiting for acknowledgement/);
});

test("session-scoped presenter state remains inside the existing class document", () => {
  const service = fs.readFileSync(path.join(repoRoot, "src", "services", "presenterLiveSessionService.js"), "utf8");
  assert.match(service, /presenterSessions\.\$\{key\}/);
  assert.match(service, /presenterActiveSessionKey/);
  assert.match(service, /doc\(db, "classes", id\)/);
  assert.doesNotMatch(service, /collection\(/);
});


test("shared end state applies even after this display already knows the class start", () => {
  const page = fs.readFileSync(path.join(repoRoot, "src", "pages", "CheckinDisplayPage.jsx"), "utf8");
  assert.doesNotMatch(page, /if \(!sharedStart \|\| actualStartedAt\) return;/);
  assert.match(page, /const endChanged = Boolean\(sharedEnd && Number\(actualEndedAt \|\| 0\) !== sharedEnd\);/);
  assert.match(page, /if \(endChanged\) setActualEndedAt\(sharedEnd\);/);
  assert.match(page, /state: "ended-synced"/);
});

test("restored local class end keeps an explicit manual end-sync recovery path", () => {
  const page = fs.readFileSync(path.join(repoRoot, "src", "pages", "CheckinDisplayPage.jsx"), "utf8");
  assert.match(page, /state: "ended-restored"/);
  assert.match(page, /Use Sync end now if the earlier shared end save failed/);
  assert.match(page, /slideSyncStatus\.state === "ended-restored"/);
  assert.match(page, />Sync end now<\/button>/);
  assert.match(page, /state: "ended-acknowledged"/);
  assert.match(page, /Class end restored · waiting for Presenter acknowledgement|Class ended from Presenter · shared end state synchronized/);
});

test("ended class timing reacts when a shared end arrives later", () => {
  const page = fs.readFileSync(path.join(repoRoot, "src", "pages", "CheckinDisplayPage.jsx"), "utf8");
  assert.match(page, /\[actualEndedAt, actualStartedAt, dateLabel, delayUntil, nowMs, startTime\]/);
});


test("check-in ignores presenter snapshots from the previous URL session", () => {
  const page = fs.readFileSync(path.join(repoRoot, "src", "pages", "CheckinDisplayPage.jsx"), "utf8");

  assert.match(page, /sessionKey !== String\(linkPresenterSessionKey \|\| ""\)/);
  assert.match(page, /const targetSessionKey = String\(presenterTarget\.sessionKey \|\| ""\);/);
  assert.match(page, /const currentSessionKey = String\(linkPresenterSessionKey \|\| ""\);/);
  assert.match(page, /if \(!targetSessionKey \|\| targetSessionKey !== currentSessionKey\) return;/);
  assert.match(page, /String\(presenterLiveState\.sessionKey \|\| ""\) !== targetSessionKey/);
  assert.match(page, /setPresenterTarget\(\(current\) =>/);
  assert.match(page, /setPresenterLiveState\(\(current\) =>/);
});


test("attendance owns session timing and stale tabs cannot replace a newer active class", () => {
  const page = fs.readFileSync(path.join(repoRoot, "src", "pages", "CheckinDisplayPage.jsx"), "utf8");
  const service = fs.readFileSync(path.join(repoRoot, "src", "services", "presenterLiveSessionService.js"), "utf8");

  assert.match(page, /sessionTimingAuthority: "attendance"/);
  assert.match(page, /classLifecycleStatus: "running"/);
  assert.match(page, /classLifecycleStatus: "ended"/);
  assert.match(page, /state: "stale-blocked"/);
  assert.match(service, /blockedByNewerActiveSession/);
  assert.match(service, /reason: "newer-active-session"/);
  assert.match(service, /classLifecycleStatus: "running"/);
  assert.match(service, /classLifecycleStatus: "ended"/);
});


test("attendance start waits for Presenter acknowledgement and retries automatically", () => {
  const page = fs.readFileSync(path.join(repoRoot, "src", "pages", "CheckinDisplayPage.jsx"), "utf8");

  assert.match(page, /START_HANDSHAKE_RETRY_DELAYS_MS = Object\.freeze\(\[2000, 5000, 10000\]\)/);
  assert.match(page, /START_HANDSHAKE_MAX_ATTEMPTS = START_HANDSHAKE_RETRY_DELAYS_MS\.length \+ 1/);
  assert.match(page, /attendanceStartRequestId/);
  assert.match(page, /attendanceStartRequestedAtMs: requestSentAtMs/);
  assert.match(page, /attendanceStartAttempt: requestAttempt/);
  assert.match(page, /presenterStartAckRequestId/);
  assert.match(page, /state: "awaiting-ack"/);
  assert.match(page, /state: "acknowledged"/);
  assert.match(page, /state: "unresponsive"/);
  assert.match(page, /window\.setTimeout\(\(\) => \{[\s\S]*handshakeAttempt: sharedAttempt \+ 1/);
  assert.match(page, /Slides connected · timer synced/);
  assert.match(page, /Slides not responding · start sent/);
  assert.match(page, /Retry connection|Retry slide sync/);
});

test("attendance never reports Slides synchronized before acknowledgement", () => {
  const page = fs.readFileSync(path.join(repoRoot, "src", "pages", "CheckinDisplayPage.jsx"), "utf8");

  assert.match(page, /Class start sent to Slides · waiting for acknowledgement/);
  assert.match(page, /Slides acknowledged the class start · timer synchronized/);
  assert.match(page, /presenterStartAcknowledged\(presenterLiveState, requestId\)/);
  assert.match(page, /restoredAcknowledged/);
});



test("waiting Attendance rotates a Smart Class Lobby with lesson-derived content", () => {
  const page = fs.readFileSync(path.join(repoRoot, "src", "pages", "CheckinDisplayPage.jsx"), "utf8");
  const css = fs.readFileSync(path.join(repoRoot, "src", "pages", "CheckinDisplayPage.css"), "utf8");

  assert.match(page, /SMART_LOBBY_ROTATION_MS = 14000/);
  assert.match(page, /const smartLobbySlides = useMemo/);
  assert.match(page, /id: "checkin", label: "Check in"/);
  assert.match(page, /id: "lesson", label: "Today’s lesson"/);
  assert.match(page, /id: "outcomes", label: "What you’ll learn"/);
  assert.match(page, /id: "warmup", label: "Get ready"/);
  assert.match(page, /id: "starting", label: "Starting soon"/);
  assert.match(page, /window\.setInterval\(\(\) => \{/);
  assert.match(page, /SMART_LOBBY_ROTATION_MS/);
  assert.match(page, /actualStartedAt \|\| smartLobbyPaused/);
  assert.match(page, /Pause rotation/);
  assert.match(page, /Resume rotation/);
  assert.match(page, />Previous<\/button>/);
  assert.match(page, />Next<\/button>/);
  assert.match(page, /Adaptive rotation · every 14 seconds/);

  assert.match(page, /const presenterStages = buildTeachingPresenterStages/);
  assert.match(page, /find\(\(stage\) => stage\.id === "lesson-summary"\)/);
  assert.match(page, /filter\(\(item\) => String\(item\?\.label \|\| ""\) !== "Self-check"\)/);
  assert.match(page, /slice\(0, 3\)/);
  assert.match(page, /By the end of class/);
  assert.match(page, /You should be able to…/);

  assert.match(css, /\.checkin-display-smart-lobby\s*\{/);
  assert.match(css, /@keyframes checkin-lobby-enter/);
  assert.match(css, /\.checkin-display-lobby-dots button\.is-active/);
});

test("Smart Class Lobby keeps check-in available on every waiting slide", () => {
  const page = fs.readFileSync(path.join(repoRoot, "src", "pages", "CheckinDisplayPage.jsx"), "utf8");

  assert.match(page, /activeSmartLobbySlide\.id === "checkin"/);
  assert.match(page, /QRCodeCanvas value=\{checkinUrl\} size=\{280\}/);
  assert.match(page, /activeSmartLobbySlide\.id !== "checkin"/);
  assert.match(page, /QRCodeCanvas value=\{checkinUrl\} size=\{112\}/);
  assert.match(page, /Still need to check in\?/);
  assert.match(page, /Scan anytime\./);
  assert.match(page, /checkedInCount \+ " \/ " \+ expectedTotal/);
});

test("Smart Class Lobby warm-up remains preview-only and never starts the five-minute timer", () => {
  const page = fs.readFileSync(path.join(repoRoot, "src", "pages", "CheckinDisplayPage.jsx"), "utf8");
  const css = fs.readFileSync(path.join(repoRoot, "src", "pages", "CheckinDisplayPage.css"), "utf8");

  assert.match(page, /getTeachingSlideByAssignmentId/);
  assert.match(page, /getSlidesByCourse/);
  assert.match(page, /find\(\(stage\) => stage\.id === "warmup"\)/);
  assert.match(page, /warmupStage\?\.items\?\.\[0\]/);
  assert.match(page, /Get ready · Warm-up preview/);
  assert.match(page, /Think about your answer\./);
  assert.match(page, /You will answer after class starts\. The 5-minute warm-up timer is not running yet\./);
  assert.match(page, /renderWaitingWarmupQuestion/);
  assert.match(page, /splitWarmupQuestionSegments/);
  assert.match(page, /listClasses\(\)[\s\S]*setWaitingClassLevel/);
  assert.match(css, /\.checkin-display-warmup-keyword\s*\{[\s\S]*background:\s*#facc15/);

  const lobbyStart = page.indexOf('className="checkin-display-smart-lobby"');
  const musicStart = page.indexOf("checkin-display-music", lobbyStart);
  assert.ok(lobbyStart > 0 && musicStart > lobbyStart, "Smart Lobby should render before waiting-room music");

  assert.doesNotMatch(
    page.slice(Math.max(0, lobbyStart - 1500), musicStart),
    /setWarmup|warmupDeadline|WARMUP_PREPARATION_MINUTES|startWarmup/i,
    "Attendance lobby must preview the question without owning the Presenter warm-up timer",
  );
});

test("Smart Class Lobby disappears immediately after the teacher starts class", () => {
  const page = fs.readFileSync(path.join(repoRoot, "src", "pages", "CheckinDisplayPage.jsx"), "utf8");

  assert.match(page, /!actualStartedAt && activeSmartLobbySlide/);
  assert.match(page, /if \(actualStartedAt \|\| smartLobbyPaused \|\| smartLobbySlides\.length <= 1\) return undefined/);
  assert.match(page, /Start class & slides/);
  assert.match(page, /setActualStartedAt\(startedAt\)/);
  assert.match(page, /checkin-display-main-grid/);
});


test("Smart Class Lobby adapts its rotation to attendance and proximity to start", () => {
  const page = fs.readFileSync(path.join(repoRoot, "src", "pages", "CheckinDisplayPage.jsx"), "utf8");

  assert.match(page, /const nearStart = Boolean\(scheduledStartAt && \(scheduledStartAt - nowMs\) <= 2 \* 60 \* 1000\)/);
  assert.match(page, /const lowAttendance = attendanceRatio !== null && attendanceRatio < 0\.6/);
  assert.match(page, /const highAttendance = attendanceRatio !== null && attendanceRatio >= 0\.75/);
  assert.match(page, /\["starting", "warmup", "starting", "checkin", "lesson", "starting", "outcomes"\]/);
  assert.match(page, /\["checkin", "lesson", "checkin", "outcomes", "checkin", "warmup", "starting"\]/);
  assert.match(page, /\["lesson", "outcomes", "warmup", "starting", "checkin"\]/);
  assert.match(page, /sequenceKey:/);
});

test("Start class uses a visible Smart Start handoff and opens Presenter within the click gesture", () => {
  const page = fs.readFileSync(path.join(repoRoot, "src", "pages", "CheckinDisplayPage.jsx"), "utf8");
  const css = fs.readFileSync(path.join(repoRoot, "src", "pages", "CheckinDisplayPage.css"), "utf8");

  assert.match(page, /SMART_HANDOFF_MIN_VISIBLE_MS = 3000/);
  assert.match(page, /SMART_HANDOFF_CONNECTED_VISIBLE_MS = 1200/);
  assert.match(page, /const presenterLessonUrl = useMemo/);
  assert.match(page, /\?present=1/);
  assert.match(page, /const openPresenterWindow = useCallback/);
  assert.match(page, /window\.open\(presenterLessonUrl, "falowen-presenter"\)/);

  const handler = page.slice(
    page.indexOf("const handleStartClassNow"),
    page.indexOf("const syncPresenterEnd"),
  );
  assert.ok(handler.indexOf("openPresenterWindow(false)") < handler.indexOf("void syncPresenterStart(startedAt)"), "Presenter should open during the teacher click before async sync");
  assert.match(handler, /phase: "starting"/);
  assert.match(handler, /Class starting…/);
  assert.match(handler, /phase: "connecting"/);
  assert.match(handler, /Connecting slides…/);
  assert.match(handler, /setTargetAtTime\(\s*0\.0001/);

  assert.match(css, /\.checkin-display-smart-handoff\s*\{/);
  assert.match(css, /\.checkin-display-smart-handoff\.is-connected/);
  assert.match(css, /\.checkin-display-smart-handoff\.is-failed/);
});

test("Smart Start only reports success after Presenter acknowledges the exact Attendance request", () => {
  const page = fs.readFileSync(path.join(repoRoot, "src", "pages", "CheckinDisplayPage.jsx"), "utf8");

  assert.match(page, /const requestId = attendanceStartRequestId\(linkPresenterSessionKey, actualStartedAt\)/);
  assert.match(page, /const acknowledged = presenterStartAcknowledged\(presenterLiveState, requestId\)/);
  assert.match(page, /Slides connected · Timer started/);
  assert.match(page, /Presenter confirmed this exact Attendance start/);
  assert.match(page, /presenterWindowRef\.current\?\.focus/);
  assert.match(page, /SMART_HANDOFF_CONNECTED_VISIBLE_MS/);
});

test("Smart Start exposes recovery actions when Presenter does not acknowledge", () => {
  const page = fs.readFileSync(path.join(repoRoot, "src", "pages", "CheckinDisplayPage.jsx"), "utf8");

  assert.match(page, /\["error", "unresponsive", "stale-blocked", "skipped-date"\]\.includes\(slideSyncStatus\.state\)/);
  assert.match(page, /phase: "failed"/);
  assert.match(page, /Retrying Presenter connection…/);
  assert.match(page, />Retry connection<\/button>/);
  assert.match(page, />\s*Open slides manually\s*<\/button>/);
  assert.match(page, /window\.location\.assign\(presenterLessonUrl\)/);
});

test("Attendance and Presenter use the resolved lesson assignment for the same session key", () => {
  const page = fs.readFileSync(path.join(repoRoot, "src", "pages", "CheckinDisplayPage.jsx"), "utf8");

  assert.match(page, /const effectiveAssignmentId = String\(assignmentId \|\| scheduleInfo\?\.assignmentId \|\| ""\)\.trim\(\)/);
  assert.match(page, /assignmentId: effectiveAssignmentId/);
  assert.match(page, /lessonId: String\(effectiveAssignmentId \|\| sessionId \|\| ""\)\.trim\(\)/);
  assert.match(page, /presenterSessionKey\(\{ sessionDate, sessionId, assignmentId: effectiveAssignmentId \}\)/);
});


test("Smart Class Lobby preserves pending and failed live-attendance state instead of presenting a false zero", () => {
  const page = fs.readFileSync(path.join(repoRoot, "src", "pages", "CheckinDisplayPage.jsx"), "utf8");
  const css = fs.readFileSync(path.join(repoRoot, "src", "pages", "CheckinDisplayPage.css"), "utf8");

  assert.match(page, /const attendanceConnectionState = attendanceError \? "error" : attendanceLive \? "live" : "connecting"/);
  assert.match(page, /const attendanceCountLabel = attendanceLive/);
  assert.match(page, /expectedTotal \? "— \/ " \+ expectedTotal : "—"/);
  assert.match(page, /Live attendance disconnected/);
  assert.match(page, /Connecting live attendance…/);
  assert.match(page, /Live attendance connected/);
  assert.match(page, /className=\{"checkin-display-lobby-live-state is-" \+ attendanceConnectionState\}/);
  assert.match(page, /\{attendanceError \? <small>\{attendanceError\}<\/small> : null\}/);
  assert.match(page, /\{attendanceCountLabel\}<\/strong>/);
  assert.match(page, /waiting for verified live attendance/);

  assert.match(css, /\.checkin-display-lobby-live-state\.is-live/);
  assert.match(css, /\.checkin-display-lobby-live-state\.is-error/);
});

test("Smart End saves class completion and waits for exact Presenter end acknowledgement", () => {
  const page = fs.readFileSync(path.join(repoRoot, "src", "pages", "CheckinDisplayPage.jsx"), "utf8");

  assert.match(page, /END_HANDSHAKE_RETRY_DELAYS_MS = Object\.freeze\(\[2000, 5000, 10000\]\)/);
  assert.match(page, /END_HANDSHAKE_MAX_ATTEMPTS = END_HANDSHAKE_RETRY_DELAYS_MS\.length \+ 1/);
  assert.match(page, /function attendanceEndRequestId/);
  assert.match(page, /function presenterEndAcknowledged/);
  assert.match(page, /attendanceEndRequestId: requestId/);
  assert.match(page, /attendanceEndRequestedAtMs: requestSentAtMs/);
  assert.match(page, /attendanceEndAttempt: requestAttempt/);
  assert.match(page, /attendanceLiveAtEnd: Boolean\(attendanceLive\)/);
  assert.match(page, /attendanceCheckedInCountAtEnd: attendanceLive \? checkedInCount : null/);
  assert.match(page, /state: "end-awaiting-ack"/);
  assert.match(page, /state: "ended-acknowledged"/);
  assert.match(page, /Presenter acknowledged the class end · final session synchronized/);
  assert.match(page, /END_HANDSHAKE_RETRY_DELAYS_MS\[Math\.max\(0, sharedAttempt - 1\)\]/);
  assert.match(page, /state: "end-unresponsive"/);
  assert.match(page, /Retry end sync/);
});

test("Smart End shows class outcomes, duration, next lesson and restarts lobby music from the End click", () => {
  const page = fs.readFileSync(path.join(repoRoot, "src", "pages", "CheckinDisplayPage.jsx"), "utf8");
  const css = fs.readFileSync(path.join(repoRoot, "src", "pages", "CheckinDisplayPage.css"), "utf8");

  assert.match(page, /className=\{"checkin-display-smart-end/);
  assert.match(page, /Teaching time/);
  assert.match(page, /Students should now be able to…/);
  assert.match(page, /waitingWarmupTeaser\.outcomes\.map/);
  assert.match(page, /Next up/);
  assert.match(page, /nextLesson/);
  assert.match(page, /getSlidesByCourse\(course\)\.find/);
  assert.match(page, /if \(!musicPlaying\) void startWaitingMusic\(\)/);

  assert.match(css, /\.checkin-display-smart-end\s*\{/);
  assert.match(css, /\.checkin-display-smart-end\.is-confirmed/);
  assert.match(css, /\.checkin-display-smart-end\.is-failed/);
});


test("CheckinDisplay defines statusInfo before rendering the shared status alert", () => {
  const page = fs.readFileSync(path.join(repoRoot, "src", "pages", "CheckinDisplayPage.jsx"), "utf8");

  assert.match(page, /const statusInfo = useMemo\(\(\) => \{/);
  assert.match(page, /title: "Attendance connection issue"/);
  assert.match(page, /title: "Connecting live attendance"/);
  assert.match(page, /title: "Class in progress"/);
  assert.match(page, /title: "Class complete"/);

  const definitionIndex = page.indexOf("const statusInfo = useMemo");
  const renderIndex = page.indexOf("statusInfo.kind");
  assert.ok(definitionIndex > 0 && renderIndex > definitionIndex, "statusInfo must be defined before the render uses it");
});
