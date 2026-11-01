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
