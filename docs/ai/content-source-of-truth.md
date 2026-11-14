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


## B1 Day 28 · Klimafreundlich leben · classroom Hören (13 November 2026)

The teacher supplied the exact private object path `b1/day-28/klimafreundlich-leben.mp3` in the `falowen-course-audio` R2 bucket and uploaded `falowen-b1-hoeren-klimafreundlich-leben-questions-key(2).json`. `src/data/b1Day28Listening.js` contains all **five** source-order Richtig/Falsch statements, answers (Falsch, Richtig, Falsch, Richtig, Falsch) and evidence quotations exactly as provided. `src/data/interactiveLessonOpenings.js` maps `B1-10.28` to this source using the existing `knowledge` / interactive Hören stage. `src/components/InteractiveLessonOpening.jsx` routes only this exact B1 Day 28 key through the staff-authenticated `https://www.falowen.app/api/course-media/classroom/audio-url` signer, whose matching `B1-28` allowlist entry is held in `learngermanghana/falowenexamtrainer/server/courseMusic.cjs`. No public R2 URL and no new storage service are used. The classroom exercise is distinct from the graded learner workbook `Teil 4`: changing the Admin slides does **not** establish equivalence to, or modify, the workbook's grading contract. The original B1 Day 28 lesson speaking, writing and grammar remain unchanged.


## Teaching staff workspace and Kiswahili marking

Falowen Admin sends individual Firebase users with a staff or tutor claim to Marking. Their protected app routes are Marking and Teaching Slides. Existing legacy staff email access to this workspace requires a verified email. Provision individual accounts in Firebase Auth and grant the role with the Firebase Admin SDK. The login page does not create accounts. Replace any deployed credential associated with the removed shared password before using the legacy staff account.

Marking selects the language in the URL. German uses the existing assignment, answer key and scoring pipeline. Swahili reads only the selected lesson in the existing `swahiliLessons` collection group, using the learner repository's composite index. If that index is unavailable, the queue pages through Swahili student records and reads each selected lesson by its canonical document path. Manual marking opens the selected student's submitted workbook. The shared AI tab explains the Swahili tutor-only workflow. Queue identity is taken from `users/{uid}/swahiliLessons/day-{day}`. Tutors review submitted writing and reading and save a decision, score out of 100 and feedback to `swahiliTeacherReviews/{uid}` for Day 1 or `swahiliTeacherReviews/{uid}_day-6` for Day 6. A transaction rejects attempts to mark an earlier revision of work. Deploy the learner repository's canonical Firestore rules before enabling the Admin UI. Existing API and data permissions outside these routes require their own authorization checks.

## Kiswahili A1 Day 1 and Day 6 — reuse German A2 classroom stage styling (13 Nov 2026)

`src/components/SwahiliTeachingSlides.jsx` retains the existing Falowen shared A2-style 16:9 presenter shell, lesson navigation, class session timer, activity timer, roster picker and reporting. The lesson body delegates to `SwahiliA2LessonStage.jsx` for the same **distinct stage presentation pattern** used in German A2 Day 1: objective hero, media/lyrics, listening, paged grammar, reading, speaking and classroom tasks instead of a generic text panel. The **existing** `MusicVideoEmbed.jsx` renders the previously published Day 6 Falowen Radio link as a teacher-controlled video, with an optional Kiswahili footer label that leaves German defaults unchanged. No Day 1 or Day 6 music recording was invented. Day 1 vowels and syllables appear as large pronunciation tiles; Day 6 menu is grouped under Chakula/Vinywaji with no invented prices, and the original Mhudumu/Mteja conversation has distinct speaker turns. Day 6 uses `daySixPresenterSlide` in `PresenterStudentPicker` for the correct class participation identity. Student workbook submissions, teacher notes, the original source-backed data, and all German A1–C2 slide content remain unchanged. Scoped CSS adds responsive design without creating another presenter or audio engine.

## Kiswahili A1 Day 6 · restaurant food pictures and A2-style oral scenarios (13 November 2026)

The teacher re-uploaded `FOOD&DRINKS=LIKE&DISLIKES(1).pdf` and `Odering Food(1).pdf`; both support the restaurant vocabulary and example dishes already published in Day 6: wali kuku, wali samaki, ugali nyama, ugali samaki, pilau nyama, maji, juisi and soda. `src/data/swahiliDaySixVisualActivities.js` adds four **representative**, properly attributed Wikimedia Commons food photos matched to supported dishes and three labelled drink icons; these are *not* claimed to be Ruth's original pictures or actual restaurant products/prices. The image cards appear in the introduction and matching menu items in Reading. `SwahiliA2LessonStage.jsx` renders the visual cards with accessible alt text, original-source food words, responsive sizing and image-error fallbacks; `SwahiliTeachingSlides.css` contains only scoped styling. Photos remain replaceable through a simple data entry when an approved local asset is provided, rather than creating another gallery or media backend.

The existing Day 6 `presentation` stage (same identifier, position eight of nine) now has the `scenario` rendering mode, with five selectable oral situations adapted to Ruth's grammar/food material: wali kuku and juice, no meat, choosing a different dish, ordering for two, and only ordering a drink. `SwahiliRestaurantScenario.jsx` follows the existing German A2 scenario component conventions (`presenter-career-hero`, `presenter-career-roadmap`, `presenter-career-question`, model-answer reveal and random next situation), but operates **client-side** and is ungraded; no student workbook fields or Firestore writes are introduced. The nine-stage course layout, the existing Falowen audio/video player, navigation, timers and student picker remain unchanged. Day 1 and German lessons are not changed.

The Swahili review publisher validates the current submission and the enrolled UID, writes a Firestore score, queues the existing score Sheet worker, and uses the Announcement webhook to email a direct Campus Results link. The review remains the source for the learner’s feedback. Legacy reviews display without a score and can be scored by the tutor. Swahili submissions do not enter the German AI queue.

## Kiswahili A1 Day 5

Kiswahili A1 Day 5 uses the shared teaching presenter and the Swahili Music tab in Music Studio. Select the Day 5 recording, enter the sung lyrics, and mark each line to preview or export the video. Saving shared timing writes the matching R2 sidecar for the slide and workbook.

The Swahili Music recording uses `swahili/music/A1/day-05/Karibu Kufahamu Familia Yangu.mp3`. The separate `swahili/A1/day-05/` prefix is reserved for future Hören recordings.

The versioned Swahili answer key lives in `functions/swahili-answers.json`. Admin compares learner work with this key, and the result publisher snapshots the key onto the learner-owned review and emails its Campus Results link.
