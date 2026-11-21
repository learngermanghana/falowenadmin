# Admin source ownership and documentation update matrix

Reviewed: 2026-11-01.

| Feature | Implementation / authoritative contract | Documentation / validation |
| --- | --- | --- |
| Admin UI and staff roles | `src/`, staff guards and Firebase Auth/Firestore rules | [README](../../README.md), related staff-access tests |
| Student assignment submissions | Learner request format, Admin marking parser and versioning | [Structured submission](../structured-submission-contract.md), learner [assessment sync](https://github.com/learngermanghana/falowenexamtrainer/blob/main/docs/assessment-task-sync.md) |
| AI-marked coursework | Server-owned answer keys, grading worker, tutor review gates | [Automatic marking](../automatic-course-marking.md), marking and result tests |
| Teacher lectures / live classes | Admin lesson presenters, session data and access policies | [Live curriculum](../live-class-curriculum-contract.md) |
| Songs, music generation, lyrics videos | Language-scoped `/music-studio` source and APIs | [Music Studio](../music-studio.md), learner music publishing |
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

The owner chooses Marking, Teaching Slides and Attendance separately for each staff member in Staff Workspace. Page grants control navigation and protected Admin routes, and staff land on an available page after signing in. Accounts created before page grants keep their previous role-based defaults until edited. Attendance also checks the current staff record and the tutor assignment on the server. Language access is configured separately. Existing legacy staff email access to this workspace requires a verified email. Provision individual accounts in Firebase Auth and grant the role with the Firebase Admin SDK. The login page does not create accounts. Replace any deployed credential associated with the removed shared password before using the legacy staff account.

Marking selects the language in the URL. German uses the existing assignment, answer key and scoring pipeline. Swahili reads only the selected lesson in the existing `swahiliLessons` collection group, using the learner repository's composite index. If that index is unavailable, the queue pages through Swahili student records and reads each selected lesson by its canonical document path. Manual marking opens the selected student's submitted workbook. The shared AI tab explains the Swahili tutor-only workflow. Queue identity is taken from `users/{uid}/swahiliLessons/day-{day}`. Tutors review submitted writing and reading and save a decision, score out of 100 and feedback to `swahiliTeacherReviews/{uid}` for Day 1 or `swahiliTeacherReviews/{uid}_day-6` for Day 6. A transaction rejects attempts to mark an earlier revision of work. Deploy the learner repository's canonical Firestore rules before enabling the Admin UI. Existing API and data permissions outside these routes require their own authorization checks.

## Kiswahili A1 Day 1 and Day 6 — reuse German A2 classroom stage styling (13 Nov 2026)

`src/components/SwahiliTeachingSlides.jsx` retains the existing Falowen shared A2-style 16:9 presenter shell, lesson navigation, class session timer, activity timer, roster picker and reporting. The lesson body delegates to `SwahiliA2LessonStage.jsx` for the same **distinct stage presentation pattern** used in German A2 Day 1: objective hero, media/lyrics, listening, paged grammar, reading, speaking and classroom tasks instead of a generic text panel. The **existing** `MusicVideoEmbed.jsx` renders the previously published Day 6 Falowen Radio link as a teacher-controlled video, with an optional Kiswahili footer label that leaves German defaults unchanged. No Day 1 or Day 6 music recording was invented. Day 1 vowels and syllables appear as large pronunciation tiles; Day 6 menu is grouped under Chakula/Vinywaji with no invented prices, and the original Mhudumu/Mteja conversation has distinct speaker turns. Day 6 uses `daySixPresenterSlide` in `PresenterStudentPicker` for the correct class participation identity. Student workbook submissions, teacher notes, the original source-backed data, and all German A1–C2 slide content remain unchanged. Scoped CSS adds responsive design without creating another presenter or audio engine.

## Kiswahili A1 Day 6 · restaurant food pictures and A2-style oral scenarios (13 November 2026)

The teacher re-uploaded `FOOD&DRINKS=LIKE&DISLIKES(1).pdf` and `Odering Food(1).pdf`; both support the restaurant vocabulary and example dishes already published in Day 6: wali kuku, wali samaki, ugali nyama, ugali samaki, pilau nyama, maji, juisi and soda. `src/data/swahiliDaySixVisualActivities.js` adds four **representative**, properly attributed Wikimedia Commons food photos matched to supported dishes and three labelled drink icons; these are *not* claimed to be Ruth's original pictures or actual restaurant products/prices. The image cards appear in the introduction and matching menu items in Reading. `SwahiliA2LessonStage.jsx` renders the visual cards with accessible alt text, original-source food words, responsive sizing and image-error fallbacks; `SwahiliTeachingSlides.css` contains only scoped styling. Photos remain replaceable through a simple data entry when an approved local asset is provided, rather than creating another gallery or media backend.

The existing Day 6 `presentation` stage (same identifier, position eight of nine) now has the `scenario` rendering mode, with five selectable oral situations adapted to Ruth's grammar/food material: wali kuku and juice, no meat, choosing a different dish, ordering for two, and only ordering a drink. `SwahiliRestaurantScenario.jsx` follows the existing German A2 scenario component conventions (`presenter-career-hero`, `presenter-career-roadmap`, `presenter-career-question`, model-answer reveal and random next situation), but operates **client-side** and is ungraded; no student workbook fields or Firestore writes are introduced. The nine-stage course layout, the existing Falowen audio/video player, navigation, timers and student picker remain unchanged. Day 1 and German lessons are not changed.

The Swahili review publisher validates the current submission and the enrolled UID, writes a Firestore score, queues the existing score Sheet worker, and uses the Announcement webhook to email a direct Campus Results link. The review remains the source for the learner’s feedback. Legacy reviews display without a score and can be scored by the tutor. Swahili submissions do not enter the German AI queue. The Swahili inbox hides completed reviews for the current submission version and shows resubmissions again.

Staff Workspace can grant Students (read-only) and Results (score and feedback corrections) independently. The staff records API checks the active staff record, token page grants and teaching languages. Results corrections update the published score and queue the existing score Sheet upsert. For a published Swahili tutor review, the correction also updates the learner feedback on the matching review.

## Language access for Music Studio and Swahili Hören

Staff Workspace can grant Music Studio. Admin authorizes German generation and lyric edits against the staff permission and assigned language. A Swahili-only staff account sees the Swahili lyrics and video tools. The learner timing API checks the recording's catalog language with the Admin authorization endpoint before a staff member can publish a sidecar. Owners retain both workspaces.

The owner Hören Studio's Swahili workspace uses the selected A1, A2 or B1 course chapter or a custom topic to create level-specific two-person conversations and podcasts, reuses the speech quota and browser audio cache, and exports a transcript, WAV or MP3 for manual upload. German exam controls remain in their own workspace.

## Kiswahili A1 Day 5

Kiswahili A1 Day 5 uses the shared teaching presenter and the Swahili Music tab in Music Studio. Select the Day 5 recording, enter the sung lyrics, and mark each line to preview or export the video. Saving shared timing writes the matching R2 sidecar for the slide and workbook.

The Swahili Music recording uses `swahili/music/A1/day-05/Karibu Kufahamu Familia Yangu.mp3`. The separate `swahili/A1/day-05/` prefix is reserved for future Hören recordings.

All 20 published A1 workbooks and B1 Day 28 use the Swahili tutor queue. The learner reviews their own responses before submission. The marking view supplies the versioned reference answers. A1 Day 11 (Dukani) submits writing under `dialogue`, five reading choices and five listening choices to `users/{uid}/swahiliLessons/day-11`. Tutors mark it in the Swahili queue. The versioned Swahili answer key lives in `functions/swahili-answers.json`. B1 Day 28 submissions include writing and five reading and five listening responses. The tutor uses the private key in Marking. The result worker publishes the score and feedback without copying the B1 key to learner reviews. The `swahili-b1-day-28` reading key covers the five free-response questions on environmental care. For the waste question, accept any two distinct actions listed in the key. Admin compares learner work with this key, and the result publisher snapshots the key onto the learner-owned review and emails its Campus Results link.

Published German workbook marks create a learner-owned reference snapshot from the objective parts of the exact marking key. Draft AI reviews keep the snapshot staff-only pending publication. The score references the snapshot by ID, and the Scores Sheet sync omits that ID.

Swahili A1 Day 6 presents its song through Listen, Lyrics and Questions. The learner Music catalog owns its recording, lyrics, English and quiz data. Falowen Radio remains a separate stage.

### German and Swahili enrollment

The Admin Class tab labels each level by language. Campus opens the selected language at its assigned level. Swahili currently has published course books at A1 only.

Admin keeps the primary programme and placement in the existing student fields. An active second course is identified by `secondaryProgram` and uses its own level and class in `coursePlacements[secondaryProgram]`. Retained placements do not grant access. Campus selects an enrolled course for the current browser tab. German results and Swahili tutor reviews keep their existing identifiers, stores and publication workflows. Deploy the learner Firestore rules and Campus switch, then the Admin profile API, Swahili result worker and Admin editor before assigning dual enrollment.

## Student Reviews sharing enhancements — 20 November 2026

The `/social-media` → **Student Reviews** tool now offers Falowen Blue / Premium Gold / Minimal White PNG designs, a lossless multi-slide carousel ZIP for long reviews, review search and level/status filters, and the editable **Falowen Reviews / Learning Journey / Quick Share** caption templates. **Copy caption** uses the browser clipboard; **Share post** uses native Web Share where supported (and falls back to copying text). Source copy preserves the actual quoted review. The renderer and its pagination helpers live in `src/utils/socialStudentReviewRender.js`; the shared template, platform copy, review search and published CSV parsing are in `src/utils/socialReviewSharing.js`.

The separate Learn Language Education Academy public site still reads testimonials from its published Google Sheet. The Admin Student Reviews tab now reads **both** the published sheet and the canonical Falowen website `reviews.json` once when opened (no polling). The canonical JSON is `learngermanghana/falowenexamtrainer/web/public/reviews.json`, not the curated seed in this Admin repo. It uses the Admin Vercel `/api/public-student-reviews` GET endpoint for that read, and displays publicly posted reviews with any recorded or unverified stars. Local drafts remain browser-specific and are not written to Google Sheets. Marketing reuse of nonpublic student feedback still requires permission.

## Student Reviews poster tool — 20 November 2026

`src/components/SocialStudentReviews.jsx` adds a **Student Reviews** sub-tab inside `/social-media`. The curated seed `src/data/socialStudentReviews.js` contains Benedicta Selasi Kumah's publicly posted five-star A2 Google review in its original words. Staff can select that review or add, edit and save further testimonials in the current browser's localStorage; local drafts remain browser-only. The owner may additionally **submit a publicly posted Google review for inclusion in the public website JSON**. That explicit button calls `api/public-student-reviews.js`, validates the owner's signed Firebase ID token against Google's published certificate keys, checks the verified owner email, checks Google Maps source URL and approval status, preserves existing review entries, and creates a GitHub pull request against the learner repository. The JSON changes only once CI passes and the PR is merged and deployed. This service requires a fine-grained, server-side `FALOWEN_REVIEWS_GITHUB_TOKEN` in Vercel Admin with repository Contents and Pull Requests write permissions, never a browser token. There are no scheduled jobs or recurring Github calls. Google ratings are optional: an unverified rating is not replaced with five stars. The client-only canvas renderer `src/utils/socialStudentReviewRender.js` serves both the preview and downloadable PNG in portrait (1080×1350), square (1080×1080) and story (1080×1920) formats. A review that does not fit is not exported with silent truncation. The tool does not list private students, access account records, run AI models, request images, or add Firestore/API calls. Only share feedback with publication permission. Regression coverage: `tests/social-student-reviews.test.js`.

## Social Media campaigns

The Upcoming Classes campaign and single-poster exports use the same renderer in `src/pages/SocialMediaPage.jsx`. Choose Falowen Brochure for a framed photo beside the details, Classroom Banner for a photo above two columns, or Photo Spotlight for full-bleed photography. The selected layout applies to previews, PNGs, campaign packs and videos. Class language determines the campaign copy and enquiry or registration wording. The shared photo picker in `src/components/SocialPhotoGallery.jsx` loads generated illustrations from `public/social-photos/`. The caption appears above the preview. Posters show class start dates and schedules. The generated images illustrate learning scenes and do not depict actual Falowen students or staff.

## Language-aware live-class naming

The Create Class form on `/live-classes` reuses `src/utils/liveClassNameSuggestions.js` for both languages. German retains its established `A1 Berlin Klasse` style and city order. Swahili A1 offers `Kiswahili A1 – Dar es Salaam`, `Arusha`, `Zanzibar`, `Nairobi`, `Mombasa`, `Dodoma`, `Mwanza` and `Kisumu` in order. These are suggested **cohort names**, not times, physical teaching locations, automatically created classes, or changes to existing records. Scheduling stays in its own fields, staff can enter a custom name, and the shared backend slug collision rules still apply. Swahili level selection remains limited to A1 until the other course levels are published. No automatic renaming or data migration occurs.

## German A1 classroom presenter

The workbook rules and model sentences in `a1WorkbookGrammarTeaching.js` are keyed by assignment. The dedicated A1 presenter shows them immediately after the lesson objective. Days 11 and 12 reuse their existing authored grammar pages. The presenter uses the existing song stages, A1 classroom reading passages with answer evidence, and speaking scenarios with model answers. The A1 speaking readiness lesson retains its exam exercises. The reading and scenarios are classroom practice and do not alter Campus submissions or marking.

### Course discount links

Invitations → Discount Links manages program, level, original tuition, expiry, and maximum uses. Admin uses the Campus `/api/course-discounts/admin` API, which owns offers and use counts. Allocated uses include students who have not paid yet. Redeemed uses are recorded when Paystack confirms a payment. Revocation closes the link to new allocations.

## Bilingual public placement monitoring (21 November 2026)

The private **Admin → Timed Attempts → Placement tests** tab monitors both German and Kiswahili A1–B1 placement attempts via the existing authenticated `https://www.falowen.app/api/placement-attempts` endpoint. The public test links are `https://www.falowen.app/placement-test` (German) and `https://www.falowen.app/placement-test?language=swahili` (Kiswahili). Staff may open either without changing the monitored data. The placement API supplies each event's `language` marker; missing markers on legacy attempts are treated as German. Admin now offers a local language filter, language labels, and language-specific manual follow-up drafts; Kiswahili signup links explicitly preserve `program=swahili`.

No new paid API, Firestore subscription, scheduled task, or background polling is added. Placement records are fetched only when the staff member opens the placement tab or clicks **Refresh placements**. Review `tests/placement-attempt-monitoring.test.js` and ensure the learner deployment with language-aware events is live before publishing this Admin change.


## Kiswahili A1 Day 11 grammar — 21 November 2026

Day 11 Dukani grammar is adapted from the teacher-supplied `Buying from the Shop+Numbers.pdf`: numbers, item quantities, nitanunua, shilling prices, polite bargaining, payment and the original shop dialogue. English explanations and translations support the source examples. The learner source is `web/src/data/swahili/a1PracticeUnits.js` in the learner repository; Admin uses `src/data/swahiliDayElevenTeachingSlides.js` through the existing paged grammar presenter at `/teaching-slides/course/SWAHILI/swahili-day-11?present=1`. The source dialogue prices ten pens at 500 shillings, reduced to 400 in total. Workbook assessment questions, answer keys and submission fields are unchanged.

Day 11 now follows Day 10’s classroom sequence: introduction, lesson video slot, paged grammar, vocabulary, Music slot, Falowen Radio slot, teacher-led listening, reading, model dialogue, scenario, writing and class presentation. Unsupplied media use explicit pending stages with no players or invented links. The original source dialogue is a separate paired-reading stage; its teacher notes supply the teacher-led listening script.
