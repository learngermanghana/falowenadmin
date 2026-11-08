# Live class curriculum contract

Falowen Admin writes live-class curriculum metadata to both `classSessions/{sessionId}` and the mirrored attendance session document at `attendance/{classId}/sessions/{sessionId}`.

The shared fields are:

- `topic`
- `assignmentIds`
- `chapterIds`
- `curriculumIds`

All three ID arrays contain the same canonical assignment IDs. New sessions are mapped in chronological order from the selected level's course dictionary. Existing sessions are repaired when the class dashboard opens only when curriculum data is missing; populated manual mappings and topics are retained.

Student-facing Falowen clients should read `assignmentIds` first, then fall back to `chapterIds`, `curriculumIds`, and legacy `assignment_id`.

## A1 presenter music — 2 November 2026

All 27 teaching blocks across A1 Days 1–24 use `A1GrammarPresenter` and include
one music stage, including Day 5 introducing yourself and Day 19 speaking
readiness. Orientation remains separate. Standard lessons place music after
Common mistakes, matching A1 Day 14's own layout (not the A2/B1 presenter);
the readiness lesson appends it after the exit check, and
Day 22 retains its existing single music finale.

The guide and presenter use `getA1PresenterRecording`: existing curated exact
recordings take precedence; other lessons discover a unique public recording
by the canonical slide day through the existing attendance music-library API.
Neither MP3 filenames nor playable URLs are inferred from draft song titles.
Missing or ambiguous uploads show a status message and no audio player.
Course-draft text and questions remain labelled as unverified against the
recording; this does not publish or approve lyrics, cues or assessment keys.
The timing hook also accepts exact-object published lyric text with an empty
cue array: updated recording lyrics must replace an older songwriting draft
even before synchronization is available. Untimed text cannot enable Follow
or lyric seeking.


The shared music players preserve `timingStatus`, `referenceOnly` and
`transcriptionStatus` from the recording API. Acoustic estimates still support
line highlighting and seeking, while automatic transcript drafts carry a
visible teacher-review warning. Recognized words must never silently become
teacher-approved recording text just because their cues are complete.

## A2 workbook presentation practice — 4 November 2026

The learner source `web/src/data/a2PresentationCards.js` owns the classroom
presentation questions and four keyword cues. Admin snapshots them through
`scripts/syncA2WorkbookPresentations.mjs <learner-checkout>` into the existing
`src/data/a2WorkbookPresentations.js`; commit both repositories together and
use `--check` against the recorded learner revision to verify parity.

The presenter shows the question, four keywords and bilingual instructions for
an individual talk inspired by Goethe A2 Sprechen Teil 2. Small Talk is Day 1
(`A2-1.1`) and uses “Wer bist du?” despite the legacy day-2 workbook URL. Day 8
shows personal restaurant presentation practice before the separate restaurant
role-play. Day 22 retains its speaking mock question pool and task IDs. These
are static teaching notes; no new grading flow or runtime fetch is introduced.

## B1 Day 26 classroom Hören — 4 November 2026

`B1-9.26` presents its existing lesson music, then a separate hotel-overbooking
conversation with five teacher-supplied multiple-choice questions. The uploaded
object is `a2/day-26/reiseprobleme-und-losungen.mp3`; the storage prefix does not
change its B1 Day 26 lesson identity. `src/data/b1Day26Listening.js` owns this
ungraded classroom activity and the supplied key B, A, C, A, B. Only answer
evidence excerpts were supplied, so no full transcript is displayed.

Admin requests the exact object through the existing authenticated
`www.falowen.app/api/course-media/classroom/audio-url` gateway with level B1 and
day 26. The learner repository must deploy its matching exact-object allowlist
entry. This does not publish private Hören as music or replace the separate
graded workbook questions, answers or audio.

## A2 Day 1 classroom media

`A2-1.1` / `a2-day-1-small-talk` retains its Small Talk, self-introduction and
weil/denn/deshalb teaching content. Its opening now matches the modern Day 19/21
sequence: intro, published A2 Day 1 music discovered by exact level/day, then
the separate teacher-supplied Small Talk conversation. Hören signs only
`a2/day-01/small-talk.mp3` through the staff-only A2 classroom endpoint. Its five
questions come from the supplied question key (indices 1,0,2,0,1); no transcript
is inferred from evidence snippets. This is ungraded classroom practice and
does not replace scored workbook questions, answer keys or submission rules.
Admin and learner signing-registry updates deploy separately.

## A2 Day 1 scenario practice — 4 November 2026

A2-1.1 replaces its word-sorting focused practice with the same scenario-challenge
renderer as Days 20 and 21. Three small-talk situations show one question at a
time and reveal model answers only on request. This replaces one practice stage;
lesson media, grammar, assessment identity and workbook tasks remain intact.

## App speaking assessments — 4 November 2026

A2 Day 22 (`A2-8.22`) and B1 Day 23 (`B1-7.23`) are app assessments with
no live class. Their timetable slots and canonical assignment IDs stay intact;
subsequent lessons must not move to a different date or day. Learners complete
the existing three-part AI speaking mock; its cloud progress and final result
remain authoritative. Opening the page does not count as submission.
Admin excludes these IDs from live attendance analytics and completion attendance,
live reminder emails, attendance confirmations and automatic check-in opening.
The attendance page links to the learner task instead of present/absent controls.
Existing session metadata is identified by assignment IDs even before repair.
No new background requests or assessment scoring changes are introduced.

## A2 Day 23 classroom media and scenarios — 6 November 2026

`A2-9.23` / `a2-day-23-schul-arbeitsweg` retains its canonical grammar, Markus reading, workbook submission identity and 11-stage presenter order. Its opening now uses the native published-song player for the exact `music/a2/day-23/Fahrrad zur Schule.mp3` recording, followed by a separate interactive Hören stage for the teacher-supplied `a2/day-23/wie-kommst-du-zur-schule-oder-zur-arbeit.mp3` conversation. The learner repository's existing staff-only classroom signer must allow this exact day/key pair before playback works. No public private-audio URL, bucket credential, generated media or student grading change is introduced.

The conversation transcript and fixed answer key were not supplied. Five open listening/transfer prompts use teacher discussion hints rather than invented dialogue facts or MCQ keys; the renderer labels those reveals as discussion hints. The existing published music library supplies the exact song recording/lyrics/timings if available. Draft lyrics or guessed cues must never substitute for a missing recording-specific pack.

The focused-practice slot becomes three teacher-led route scenarios (late bus, rain on the work route, connection to Berlin), each with three progressive prompts and hidden optional models using mit + Dativ, zur/zum, nach and zu Fuß. No additional practice stage, student login, grade or submission is created. The uploaded conversation is ungraded classroom material; it does not add a workbook Hören assessment.

Teaching CI failures on 6 November came from stale expectations: one opening test omitted the already-enabled A2 Day 1 song, an audio-route assertion omitted Day 1, and the wrap-up challenge list omitted Day 1. Tests now derive opening/challenge expectations from the authored registries where appropriate, while retaining exact-key, stage-order, published-track and staff-access regression checks. The Day 23 permalink is included in the teaching workflow.

## Weekly timetable edits — 7 November 2026

Saving class settings counts saved protected history before generating future
slots. A1–C1 use the complete grouped dictionary count, rather than counting
hypothetical past meetings on the newly selected weekdays. Remaining lessons
continue beyond the previous graduation date when necessary. Past, completed,
live, cancelled and manually rescheduled records remain protected. Saving an
already shortened class regenerates its missing future slots. No learner API
or assignment identity format changes are required.

## B1 repeated meetings and missing final lessons — 8 November 2026

A B1 timetable may contain more than 29 rows while its mapped curriculum stops
at Day 19, because repeated meetings do not consume new dictionary lessons.
Dashboard repair now checks the last explicit assignment mapping before using
row count. For an active B1 class with a mapped lesson and a missing curriculum
tail, it appends the remaining groups after both today and the last saved
meeting, following the saved weekly rules and school closure calendar. Existing
sessions, their mappings, dates, completion state and student attendance remain
untouched. Historical and graduated classes are excluded. B1 duplicate-index
repair no longer positionally relabels repeat meetings on dashboard load.

New rows and attendance metadata are written in one transaction using the
existing deterministic session IDs; an existing target row is never overwritten.
The derived class end date extends to the last appended lesson. Subsequent
loads see Day 28 and add nothing. Repair errors appear on the Live Classes page.
This changes Admin scheduling only, with no learner payload or grading change.

The tail check runs in `liveClassCompatibilityServiceBase` immediately after
loading the stored compatible sessions and resolving the level, before display
enrichment, duplicate suppression, or persisted day-number repair. Successful
repair reloads the stored rows before building the dashboard. Explicit B1
assignment sets remain authoritative in enrichment, including repeated meetings;
the day-number repair does not write derived display metadata over those rows.
The outer dashboard preserves the raw repair result and does not fall back to a
positional rebuild when it fails. The dashboard integration regression executes
both service layers, the real enrichment helper and tail transaction against
in-memory Firestore operations, checking new Days 20–28, retained Day 19,
untouched original documents, zero writes on reload and failure handling.

### B1 Day 27 classroom opening (2026-11-08)

`B1-10.27` uses the V2 presenter with the teacher-confirmed song “Vor unserer Tür”,
pinned to `music/b1/day-27/Vor unserer Tür.mp3` in the published music feed,
followed by the separate Lisa conversation at `b1/day-27/umweltfreundlich-im-alltag.mp3`.
Six ungraded classroom questions cover reusable bags, loose produce, the local
Bioladen, shorter transport routes, switching lights off and brief ventilation.
The supplied 128-second recording repeats the conversation twice. Audio is signed
on demand by the learner platform's existing staff-only classroom gateway using
an exact level/day/key match. Deploy the learner allowlist before the Admin entry.
This activity does not replace or change the workbook Teil 4 answer key or scores.

## B1 continuation after a selected progress anchor — 8 November 2026

If historical rows already contain Days 20–28 but the real current lesson is
Day 19, automatic tail detection cannot infer which progression is intended.
Use Official class timetable repair and select the actual dated Day 19 session
as the anchor. The B1 anchor picker includes every compatible dated session,
including repeated days, rather than only one preferred record per lesson.
B1 continuation excludes earlier dated higher-day records from the future
planner and supersession candidates. It creates fresh future meetings for those
lessons, preserves all earlier dated records and attendance, and reuses matching
future sessions. Historical collisions before the anchor do not block this
continuation. A Bonn-shaped regression covers older Days 20–28, duplicate past
Day 27/28 timestamps, the 8 November Day 19 anchor, and the existing 14 November
Day 21 session. The next Day 20 follows the saved weekly pattern and closures.

## Flexible remaining-session recalculation

In Live Classes → Sessions → Change session, choose “Recalculate from this lesson onward”, select the weekly days/times for subsequent lessons, then choose the exact first date/time. The selected anchor is accepted outside the former timetable; remaining sessions follow the selected weekly rules. The rules and explicit anchor persist in the existing atomic schedule transaction with attendance dates, calendar version and audit history. Earlier session records and assignment arrays remain unchanged. Completed/live records and actual overlaps remain protected. The full dictionary can be opened for inspection even when a session is locked for editing.

## Correcting a completed session

Live Classes provides **Reopen session** for completed sessions. A reason is required. Reopening atomically changes the class session and attendance session metadata to scheduled, retains attendance entries and curriculum, clears active completion fields, and records previous completion evidence in the audit log. Automatic completion and reminders remain suppressed while the admin corrects the date; rescheduling restores normal automatic completion. The admin can also explicitly mark the lesson completed again. No student email is sent by reopening.
