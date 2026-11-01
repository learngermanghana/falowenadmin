# Falowen Admin architecture

Reviewed: 2026-11-01.

The Admin UI is React/Vite in `src/`, hosted on Vercel. `api/router.js` handles local endpoints or proxies selected paths to Firebase Functions in `functions/`. Firebase Auth and Firestore provide controlled staff, student and class records.

The Admin app provides tutor lesson presentation, attendance, student management, content studios, music analytics, communications and teacher-reviewed/automatic marking. These are **not** learner public routes.

## Cross-repo boundary
- Learner site, student workbook and Music public playback: [falowenexamtrainer](https://github.com/learngermanghana/falowenexamtrainer).
- Admin marking receives student submissions and binds them to canonical assignment IDs, answer-key version and rubric. See [automatic marking](../automatic-course-marking.md) and [structured submissions](../structured-submission-contract.md).
- Admin Music Studio can author songs and lyric slides but an MP3 becomes public through the learner music publication rules. The two players must use exact recording-specific text/cues.
- The Student Learning Companion MCP is served by the learner platform and has read-only student-scoped tools. No Admin permission is granted merely by connecting it.

## Operational boundaries
- Staff-only functions enforce server permissions; client UI or VITE configuration cannot serve as an authorization check.
- Separate deployments may be required: Admin Vercel, Admin Firebase Functions, learner Vercel, learner APIs and plugin review.
- Avoid unbounded analytics polling, background AI calls or audio transcription during student playback.
