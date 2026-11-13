# Admin source ownership and documentation update matrix

Reviewed: 2026-11-01.

| Feature | Implementation / authoritative contract | Documentation / validation |
| --- | --- | --- |
| Admin UI and staff roles | `src/`, staff guards and Firebase Auth/Firestore rules | [README](../../README.md), related staff-access tests |
| Student assignment submissions | Learner request format, Admin marking parser and versioning | [Structured submission](../structured-submission-contract.md), learner [assessment sync](https://github.com/learngermanghana/falowenexamtrainer/blob/main/docs/assessment-task-sync.md) |
| AI-marked coursework | Server-owned answer keys, grading worker, tutor review gates | [Automatic marking](../automatic-course-marking.md), marking and result tests |
| Teacher lectures / live classes | Admin lesson presenters, session data and access policies | [Live curriculum](../live-class-curriculum-contract.md) |
| Songs, music generation, lyrics videos | Owner-scoped `/music-studio` source and APIs | [Music Studio](../music-studio.md), learner music publishing |
| Music consent/reporting | Public player opt-in and read-only Admin GA4 API | [Music analytics](../music-analytics.md) |
| Communication, scores, lifecycle webhooks | Server-side event hub + Apps Script contracts | [Event hub](../integration-event-hub.md) |
| Deployment | Admin Vercel and separate Firebase workflows | `README.md`, workflow files, verified live revision |

Review the learner and Admin repository versions before changing a shared field. An Admin page working locally does not guarantee that the student Campus writes the expected payload.

Documentation check: `node scripts/checkAiDocumentation.mjs` verifies local guide links, cross-repo references and the redacted environment example. This is not an end-to-end integration test.

## Kiswahili A1 Day 6 classroom slides — 13 November 2026

`src/data/swahiliDaySixTeachingSlides.js` defines the Day 6 `swahili-day-6` nine-stage lesson for the existing Admin Swahili presenter. Its source-aligned phrases, food/drink list, original restaurant dialogue, and seven grammar topics are adapted from Ruth's previously supplied `FOOD&DRINKS=LIKE&DISLIKES.pdf`, `Odering Food.pdf`, and `22MGAHAWANI GRAMMAR AND SONG LYRICS.docx` as already represented in the published Falowen student workbook. `src/components/SwahiliTeachingSlides.jsx` now lists both Day 1 and Day 6 at `/teaching-slides/course/SWAHILI`; Day 6 presenter route is `/teaching-slides/course/SWAHILI/swahili-day-6?present=1`. The shared A2-style class clock, seven-minute activity timer, stage navigation, student picker and class report are unchanged and selected with a stable lesson-specific identity. The Day 6 learner link is `https://www.falowen.app/swahili/day-6`. Existing Day 1 remains available.

Day 6 listening points to the already published Falowen Radio video `https://youtu.be/oErMpRojTkg`; comprehension answers sourced from the *separate* printed classroom dialogue are not claimed to describe the radio recording. Music uses Ruth's chorus as text only and awaits an approved recording. Menu text is a source-backed classroom practice example with no invented prices. The slides do not alter the learner workbook, Firestore submission fields, tutor marking, or German lessons.

