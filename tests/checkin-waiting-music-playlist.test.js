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
  assert.match(page, /startPresenterLiveSession/);
  assert.match(page, /classStartedAtMs: startMs/);
  assert.match(page, /classStartSource: "checkin"/);
  assert.match(page, /timerEndAt = startMs \+ \(durationSeconds \* 1000\)/);
  assert.match(page, /timerRunning = true/);
  assert.match(page, /timerUpdatedAtMs = startMs/);
  assert.match(page, /Retry slide sync/);
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
  assert.match(page, /const canRepairSharedTimer = !sharedEnd/);
  assert.match(page, /await publishPresenterLiveSession\(classRecordId, repairedPatch, sessionKey\)/);
  assert.match(page, /Slides timer corrected to the \$\{durationSeconds \/ 60\}-minute \$\{level\} class duration/);
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

test("restored class starts keep a manual slide synchronization path without auto-publishing", () => {
  const page = fs.readFileSync(path.join(repoRoot, "src", "pages", "CheckinDisplayPage.jsx"), "utf8");

  assert.match(page, /Use Sync slides now only if the earlier sync failed/);
  assert.match(page, /slideSyncStatus\.state === "restored"/);
  assert.match(page, />Sync slides now<\/button>/);
  assert.doesNotMatch(page, /void syncPresenterStart\(actualStartedAt\);\s*\n\s*}\s*,?\s*\[/);
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
  assert.match(page, /Presenter connected · timer running/);
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
  assert.match(service, /created: false/);
  assert.match(service, /transaction\.update\(classRef/);
  assert.doesNotMatch(service, /await updateDoc\(doc\(db, "classes", id\), \{\s*presenterActiveSessionKey/);

  assert.match(page, /const startResult = await startPresenterLiveSession\(classRecordId, sessionKey, livePatch\);/);
  assert.match(page, /if \(!startResult\.created\)/);
  assert.match(page, /This class session is already ended\. Shared state was preserved\./);
  assert.match(page, /This class session was already started on another display\. Existing timer state was preserved\./);
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
  assert.match(page, /state: "ended-synced", message: "Class end was already synchronized\."/);
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
