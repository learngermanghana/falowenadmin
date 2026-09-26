import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

function read(path) {
  return fs.readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

test("presenter class timer caps oversized shared durations but honors shorter scheduled sessions", () => {
  const source = read("src/components/PresenterSessionTimer.jsx");
  const timing = read("src/utils/presenterSessionTiming.js");
  assert.match(timing, /A1:\s*60/);
  assert.match(timing, /A2:\s*90/);
  assert.match(timing, /B1:\s*90/);
  assert.match(source, /configuredDurationMinutes/);
  assert.match(source, /presenterLive\.liveState\?\.timerDurationSeconds/);
  assert.match(source, /sharedTimerLevel === level/);
  assert.match(source, /Number\.isFinite\(rawSharedDurationSeconds\)/);
  assert.match(source, /const configuredDurationSeconds = configuredDurationMinutes \* 60/);
  assert.match(source, /configuredDurationSeconds > 0 && sharedDurationSeconds > 0/);
  assert.match(source, /Math\.min\(configuredDurationSeconds, sharedDurationSeconds\)/);
  assert.match(source, /sharedDurationSeconds \|\| configuredDurationSeconds/);
  assert.match(source, /checkinStartedAtMs > 0 && configuredDurationSeconds > 0/);
  assert.match(source, /checkinStartedAtMs \+ \(durationSeconds \* 1000\)/);
  assert.match(source, /Start class/);
  assert.match(source, /Class time is up/);
});

test("presenter timer infers A1/A2/B1 from assignment identity when slide.course is missing", () => {
  const source = read("src/components/PresenterSessionTimer.jsx");
  const timing = read("src/utils/presenterSessionTiming.js");
  const hook = read("src/hooks/usePresenterLiveSession.js");

  assert.match(timing, /export function inferPresenterLevel/);
  assert.match(timing, /A1\|A2\|B1\|B2\|C1\|C2/);
  assert.match(source, /inferPresenterLevel\(/);
  assert.match(source, /slide\?\.assignmentId/);
  assert.match(source, /presenterLive\.liveState\?\.timerLevel/);
  assert.match(hook, /inferPresenterLevel\(/);
  assert.match(hook, /slide\?\.assignmentId/);
});

test("class timer storage is isolated by selected class and presenter session", () => {
  const source = read("src/components/PresenterSessionTimer.jsx");
  assert.match(source, /presenterClassTimerStorageKey/);
  assert.match(source, /LAST_CLASS_KEY = "falowen:presenter:last-class"/);
  assert.match(source, /safeSession/);
  assert.match(source, /class-timer:\$\{localDateKey\(now\)\}:\$\{safeLevel\}:\$\{safeClass\}:\$\{safeSession\}/);
  assert.match(source, /presenterLive\.sessionKey/);
  assert.match(source, /window\.localStorage\.getItem\(key\)/);
  assert.match(source, /window\.localStorage\.setItem\(storageKey/);
  assert.doesNotMatch(source, /sessionStorage/);
});

test("class timer gives unobtrusive 30, 15, 10, 5 minute and time-up warnings", () => {
  const source = read("src/components/PresenterSessionTimer.jsx");
  assert.match(source, /CLASS_WARNING_MINUTES = Object\.freeze\(\[30, 15, 10, 5, 0\]\)/);
  assert.match(source, /30, 15, 10 and 5 minutes left and at time up/);
  assert.match(source, /recordCrossedWarnings/);
  assert.match(source, /warningLabel/);
  assert.doesNotMatch(source, /window\.alert/);
});

test("class timer warning sound is optional and persisted", () => {
  const source = read("src/components/PresenterSessionTimer.jsx");
  assert.match(source, /SOUND_PREFERENCE_KEY/);
  assert.match(source, /Sound: \{soundEnabled \? "on" : "off"\}/);
  assert.match(source, /playWarningTone/);
  assert.match(source, /window\.localStorage\.setItem\(SOUND_PREFERENCE_KEY/);
  assert.match(source, /aria-pressed=\{soundEnabled\}/);
});

test("both A1 and general teaching presenters show the class timer", () => {
  const a1 = read("src/components/A1GrammarPresenter.jsx");
  const general = read("src/components/TeachingSlidePresenter.jsx");
  assert.match(a1, /PresenterSessionTimer/);
  assert.match(a1, /<PresenterSessionTimer slide=\{slide\} \/>/);
  assert.match(general, /PresenterSessionTimer/);
  assert.match(general, /<PresenterSessionTimer slide=\{slide\} \/>/);
});

test("Start class stays visually primary and sound controls cannot crowd it out", () => {
  const timer = read("src/components/PresenterSessionTimer.jsx");
  const timerCss = read("src/components/PresenterSessionTimer.css");
  const presenterCss = read("src/components/TeachingSlidePresenter.css");

  assert.match(timer, /className="presenter-session-start"/);
  assert.match(timer, /className="presenter-session-sound"/);
  assert.match(timerCss, /\.presenter-session-timer\s*\{[\s\S]*flex-wrap:\s*wrap/);
  assert.match(timerCss, /\.presenter-session-timer-actions\s*\{[\s\S]*flex-wrap:\s*wrap/);
  assert.match(timerCss, /\.presenter-session-timer-actions \.presenter-session-start\s*\{[\s\S]*background:\s*#1d4ed8/);
  assert.match(timerCss, /@media \(max-width: 1100px\)[\s\S]*\.presenter-session-timer\s*\{[\s\S]*flex-basis:\s*100%/);
  assert.match(presenterCss, /\.presenter-topbar > \*\s*\{\s*min-width:\s*0/);
});

test("student speaking timer is level-aware and beeps when time ends", () => {
  const picker = read("src/components/PresenterStudentPicker.jsx");
  assert.match(picker, /DEFAULT_RESPONSE_SECONDS = 60/);
  assert.match(picker, /RESPONSE_TIME_KEY = "falowen:presenter:response-seconds:v3"/);
  assert.match(picker, /RESPONSE_TIME_PRESETS = \[60, 120, 180\]/);
  assert.match(picker, /if \(level === "A2"\) return 120/);
  assert.match(picker, /if \(level === "B1"\) return 180/);
  assert.match(picker, /responseTimeStorageKey\(slide\?\.course\)/);
  assert.match(picker, /startResponseTimer\(\);\s*\n\s*}\s*\n\s*\n\s*function pickNextQuestion/);
  assert.match(picker, /publishQuestion\(nextQuestion\);\s*\n\s*startResponseTimer\(\)/);
  assert.match(picker, /function playResponseTimeoutBeep\(\)/);
  assert.match(picker, /responseTimeoutBeepedRef/);
  assert.match(picker, /createOscillator\(\)/);
  assert.match(picker, /const alertDurationSeconds = 5/);
  assert.match(picker, /offset \+= 0\.75/);
  assert.match(picker, /oscillator\.stop\(startedAt \+ alertDurationSeconds\)/);
  assert.match(picker, /playResponseTimeoutBeep\(\);\s*\n\s*setResponseDeadline\(0\)/);
  assert.match(picker, /A2 defaults to 2 minutes\. B1 defaults to 3 minutes\. A1 remains 1 minute\. A 5-second alert sounds when time ends/);
  assert.match(picker, /Time's up —/);
  assert.match(picker, /\+15s/);
});

test("normal presenter build chain applies speaking feedback after timer patches", () => {
  const pickerPatch = read("scripts/patchPresenterStudentPicker.mjs");
  const timerPatch = read("scripts/patchPresenterSessionAndResponseTimers.mjs");
  assert.match(pickerPatch, /patchPresenterSessionAndResponseTimers\.mjs/);
  assert.match(timerPatch, /patchPresenterStudentAnswerTime60s\.mjs/);
  assert.match(timerPatch, /patchPresenterSpeakingFeedback\.mjs/);
  assert.ok(
    timerPatch.indexOf("patchPresenterSpeakingFeedback.mjs") > timerPatch.indexOf("patchPresenterStudentAnswerTime60s.mjs"),
    "Speaking feedback must run after the level-aware timer patch.",
  );
});

test("A2 through C2 use Speak to Feedback to Next student with a live rubric", () => {
  const picker = read("src/components/PresenterStudentPicker.jsx");
  const css = read("src/components/PresenterStudentPicker.css");
  assert.match(picker, /structuredSpeakingFlow = \["A2", "B1", "B2", "C1", "C2"\]\.includes\(course\)/);
  assert.match(picker, /SPEAKING_RUBRIC_ITEMS/);
  assert.match(picker, /Language clear/);
  assert.match(picker, /Grammar controlled/);
  assert.match(picker, /Task completed/);
  assert.match(picker, /setSpeakingPhase\("feedback"\)/);
  assert.match(picker, /setSpeakingFeedbackReason\("time"\)/);
  assert.match(picker, /Finish speaking → feedback/);
  assert.match(picker, /Give \+15s/);
  assert.match(picker, /structuredSpeakingFlow && speakingPhase === "speaking"/);
  assert.match(picker, /Then record Correct or Needs help below/);
  assert.match(css, /presenter-structured-speaking-feedback/);
  assert.match(css, /\.presenter-speaking-rubric button\.is-observed/);
});

test("student answer timer uses an absolute deadline clock and recovers after browser throttling", () => {
  const picker = read("src/components/PresenterStudentPicker.jsx");
  assert.match(picker, /presenter-response-deadline-clock-v2/);
  assert.match(picker, /window\.requestAnimationFrame\(animate\)/);
  assert.match(picker, /document\.addEventListener\("visibilitychange", resync\)/);
  assert.match(picker, /window\.addEventListener\("focus", resync\)/);
  assert.match(picker, /Math\.ceil\(\(responseDeadline - Date\.now\(\)\) \/ 1000\)/);
  assert.doesNotMatch(picker, /window\.setInterval\(tick, 250\)/);
});

test("picker sync couples writer identity to the picker update and falls back for legacy clients", () => {
  const picker = read("src/components/PresenterStudentPicker.jsx");
  assert.match(picker, /pickerUpdatedByDeviceId/);
  assert.match(picker, /pickerUpdatedByAtMs/);
  assert.match(picker, /remotePickerWriterStamp === remoteStamp/);
  assert.match(picker, /const pickerWriterMatchesUpdate = Boolean/);
  assert.match(picker, /pickerWriterMatchesUpdate\s*\? remotePickerWriter !== presenterLive\.deviceId\s*:\s*normalize\(remote\.updatedBy\) !== presenterLive\.deviceId/);
  assert.match(picker, /const pickerUpdatedAtMs = Date\.now\(\)/);
  assert.match(picker, /pickerUpdatedByAtMs: pickerUpdatedAtMs/);
  assert.match(picker, /pickerUpdatedAtMs,/);
});

test("presenter response actions wrap so Absent remains visible before Next student", () => {
  const picker = read("src/components/PresenterStudentPicker.jsx");
  const css = read("src/components/PresenterStudentPicker.css");
  const absentIndex = picker.indexOf(">\n              Absent\n");
  const nextStudentIndex = picker.indexOf('current ? "Next student →"');
  assert.ok(absentIndex >= 0 && nextStudentIndex > absentIndex, "Absent must remain before Next student in the toolbar");
  assert.match(css, /presenter-student-actions-no-overlap/);
  assert.match(css, /\.presenter-student-actions \{[\s\S]*flex: 1 1 430px;[\s\S]*flex-wrap: wrap;/);
  assert.match(css, /\.presenter-pick-student \{[\s\S]*margin-left: 0;/);
});

test("recording a student result stops the answer timer instead of auto-marking timeout", () => {
  const picker = read("src/components/PresenterStudentPicker.jsx");
  assert.match(picker, /if \(hasQuestionMode && !currentQuestion\) return;\s*\n\s*stopResponseTimer\(\);\s*\n\s*const result = recordedResult\(status\)/);
  assert.doesNotMatch(picker, /responseTimedOut[\s\S]{0,120}markCurrent\(/);
});

test("presenter live sync stays on the existing class document but isolates sessions", () => {
  const service = read("src/services/presenterLiveSessionService.js");
  assert.match(service, /onSnapshot/);
  assert.match(service, /updateDoc/);
  assert.match(service, /doc\(db, "classes", id\)/);
  assert.match(service, /presenterSessions\.\$\{key\}/);
  assert.match(service, /presenterActiveSessionKey/);
  assert.match(service, /PRESENTER_LAST_SESSION_KEY/);
  assert.doesNotMatch(service, /liveTeachingSessions/);
});

test("class timer publishes and consumes shared absolute timer state", () => {
  const source = read("src/components/PresenterSessionTimer.jsx");
  assert.match(source, /usePresenterLiveSession/);
  assert.match(source, /timerEndAt/);
  assert.match(source, /timerUpdatedAtMs/);
  assert.match(source, /publishTimerState/);
  assert.match(source, /computer ↔ iPad live/);
});


test("attendance-owned timer is consumed as authoritative shared state", () => {
  const source = read("src/components/PresenterSessionTimer.jsx");
  assert.match(source, /const attendanceControlsTimer = presenterLive\.isToday/);
  assert.match(source, /liveState\.classStartSource === "checkin"/);
  assert.match(source, /sessionTimingAuthority \|\| "attendance"/);
  assert.match(source, /const candidateRemoteEndAt = remoteRunning/);
  assert.match(source, /rawRemoteEndAt \|\| derivedCheckinEndAt/);
  assert.match(source, /const maximumAllowedEndAt/);
  assert.match(source, /Math\.min\(candidateRemoteEndAt, maximumAllowedEndAt\)/);
  assert.match(source, /Math\.min\(durationSeconds, Math\.ceil\(\(remoteEndAt - nowMs\) \/ 1000\)\)/);
  assert.match(source, /if \(attendanceControlsTimer\) return;/);
  assert.match(source, /Class started/);
  assert.match(source, /The class timer was started from Attendance/);
  assert.doesNotMatch(source, /Managed by Attendance/);
  assert.doesNotMatch(source, /const timerNeedsRepair = remoteRunning/);
  assert.doesNotMatch(source, /durationMismatch && checkinEndAt/);
});

test("student picker synchronizes class, student, question, fair-pick state and response deadline", () => {
  const picker = read("src/components/PresenterStudentPicker.jsx");
  assert.match(picker, /setPresenterClassContext/);
  assert.match(picker, /usePresenterLiveSession/);
  assert.match(picker, /pickerStudentKey/);
  assert.match(picker, /pickerQuestionId/);
  assert.match(picker, /pickerResponseDeadline/);
  assert.match(picker, /pickerRoundPicked/);
  assert.match(picker, /pickerRoundQuestionIds/);
  assert.match(picker, /Computer ↔ iPad live/);
});

test("A1 and general presenters synchronize their stage position", () => {
  const a1 = read("src/components/A1GrammarPresenter.jsx");
  const general = read("src/components/TeachingSlidePresenter.jsx");
  for (const source of [a1, general]) {
    assert.match(source, /usePresenterLiveSession/);
    assert.match(source, /presenterStageUpdatedAtMs/);
    assert.match(source, /presenterStageIndex/);
    assert.match(source, /presenterLessonId/);
  }
  assert.match(a1, /presenterItemIndex/);
  assert.match(general, /presenterQuestionIndex/);
});


test("presenter applies synchronized timer snapshots even when check-in used the same browser session", () => {
  const source = read("src/components/PresenterSessionTimer.jsx");
  assert.match(source, /if \(!presenterLive\.hasSnapshot \|\| !presenterLive\.isToday \|\| !remoteStamp\) return;/);
  assert.doesNotMatch(source, /!presenterLive\.isRemoteState \|\| !remoteStamp/);
  assert.match(source, /remote\.classStartSource === "checkin"/);
  assert.match(source, /Running from Attendance/);
});


test("presenter heartbeat is low-frequency and does not write countdown ticks", () => {
  const hook = read("src/hooks/usePresenterLiveSession.js");
  assert.match(hook, /PRESENTER_HEARTBEAT_MS = 90 \* 1000/);
  assert.match(hook, /presenterHeartbeatAtMs/);
  assert.match(hook, /window\.setInterval\(heartbeat, PRESENTER_HEARTBEAT_MS\)/);
  assert.doesNotMatch(hook, /setInterval\([^\n]*1000\)/);
});

test("presenter timer recognizes check-in class end state", () => {
  const source = read("src/components/PresenterSessionTimer.jsx");
  assert.match(source, /remote\.classStatus === "ended"/);
  assert.match(source, /Class ended from check-in/);
});


test("manual presenter timer uses explicit waiting running and paused lifecycle states", () => {
  const source = read("src/components/PresenterSessionTimer.jsx");
  assert.match(source, /classLifecycleStatus: "running"/);
  assert.match(source, /classLifecycleStatus: "paused"/);
  assert.match(source, /classLifecycleStatus: "waiting"/);
  assert.match(source, /if \(attendanceControlsTimer \|\| !running\) return;/);
});


test("per-student warm-up suspends and hides the picker answer timer", () => {
  const presenter = read("src/components/TeachingSlidePresenter.jsx");
  const picker = read("src/components/PresenterStudentPicker.jsx");
  assert.match(presenter, /responseTimerEnabled=\{!warmupPerStudent\}/);
  assert.match(picker, /if \(!responseTimerEnabled \|\| !responseDeadline \|\| lastMarked\) return undefined/);
  assert.match(picker, /if \(!responseTimerEnabled\) \{[\s\S]*setResponseDeadline\(0\)[\s\S]*return;/);
  assert.match(picker, /current && responseTimerEnabled && \(!structuredSpeakingFlow \|\| speakingPhase === "speaking"\) \? \(/);
  assert.match(picker, /effectiveRemoteDeadline = responseTimerEnabled \? remoteDeadline : 0/);
  assert.match(picker, /pickerResponseDeadline: sharedResponseDeadline/);
  assert.match(picker, /pickerResponseTimedOut: sharedResponseTimedOut/);
});


test("slide offers a manual timer fallback when Attendance marks class started but timer sync failed", () => {
  const source = read("src/components/PresenterSessionTimer.jsx");
  const css = read("src/components/PresenterSessionTimer.css");

  assert.match(source, /const attendanceTimerNeedsManualStart = attendanceControlsTimer/);
  assert.match(source, /!Boolean\(liveState\.timerExpired\)/);
  assert.match(source, /!Boolean\(liveState\.timerRunning\)/);
  assert.match(source, /Start timer manually/);
  assert.match(source, /startAttendanceTimerManually/);
  assert.match(source, /classStartedAtMs \+ \(durationSeconds \* 1000\)/);
  assert.match(source, /timerRepairSource: "presenter-manual-fallback"/);
  assert.match(source, /sessionTimingAuthority: "attendance"/);
  assert.match(source, /Attendance marked the class started, but the timer is not running/);
  assert.match(css, /is-attendance-repair/);
});

test("Agenda Start class opens Presenter and starts the class timer in one click", () => {
  const dashboard = read("src/pages/TeacherLessonDashboardPage.jsx");
  const timer = read("src/components/PresenterSessionTimer.jsx");

  assert.match(dashboard, /startClassUrl = slideUrl \? `\$\{slideUrl\}\?present=1&autostart=1`/);
  assert.match(dashboard, /onClick=\{preparePresenterStart\}>Start class<\/Link>/);
  assert.match(dashboard, /setPresenterClassContext\(\{ classId, classRecordId, sessionKey \}\)/);
  assert.match(dashboard, /presenterSessionKey\(/);
  assert.match(timer, /new URLSearchParams\(window\.location\.search\)\.get\("autostart"\) === "1"/);
  assert.match(timer, /agendaAutoStartHandledRef/);
  assert.match(timer, /startPresenterLiveSession\(/);
  assert.match(timer, /classStartSource: "presenter"/);
  assert.match(timer, /url\.searchParams\.delete\("autostart"\)/);
});


test("Presenter acknowledges Attendance start only after timer state is usable", () => {
  const source = read("src/components/PresenterSessionTimer.jsx");

  assert.match(source, /const attendanceStartRequestId = normalize\(liveState\.attendanceStartRequestId\)/);
  assert.match(source, /presenterStartAckMatches/);
  assert.match(source, /const timerReady = Boolean\(liveState\.timerRunning\)/);
  assert.match(source, /presenterStartAckRequestId: attendanceStartRequestId/);
  assert.match(source, /presenterStartAckAtMs: Date\.now\(\)/);
  assert.match(source, /presenterStartAckDeviceId: presenterLive\.deviceId/);
  assert.match(source, /presenterStartAckStatus: timerReady \? "timer-running" : "time-up"/);
  assert.match(source, /liveState\.attendanceStartAttempt/);
  assert.match(source, /Attendance connected · timer synced/);
});

test("Presenter self-repairs a missing Attendance timer before showing manual fallback", () => {
  const source = read("src/components/PresenterSessionTimer.jsx");

  assert.match(source, /timerRepairSource: "presenter-auto-repair"/);
  assert.match(source, /classStartedAtMs \+ \(durationSeconds \* 1000\)/);
  assert.match(source, /setAttendanceRepairState\("repairing"\)/);
  assert.match(source, /setAttendanceRepairState\("failed"\)/);
  assert.match(source, /4000/);
  assert.match(source, /attendanceTimerNeedsManualStart && attendanceRepairState === "failed"/);
  assert.match(source, /Repairing timer…/);
  assert.match(source, /Start timer manually/);
});
