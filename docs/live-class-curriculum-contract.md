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
