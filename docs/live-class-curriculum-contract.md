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
