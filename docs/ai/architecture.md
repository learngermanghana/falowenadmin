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

## Teacher application review

The public learner site `/teach` posts JSON to `/api/public/teacher-applications`, which proxies POST to Admin `/api/teacher-applications`. Admin owns the validation and stores text-only records in the private `falowenTeacherApplications` Firestore collection using the existing server service account. No browser Firestore access or uploads are required. Public POST requires consent, a supported HTTPS demonstration video URL, required text fields and levels. The endpoint deduplicates by normalized email and uses an instance-local request throttle. The response is `{ok:true}` for accepted or duplicate submissions; no email is sent. Owner-verified GET/PATCH/DELETE power `/teacher-applications`; GET is paginated and review saves carry the Firestore update-time version to reject stale writes. Refresh remounts changed review forms. Approval never provisions a staff account. Deploy Admin Vercel before the learner website; verify both actual revisions, public submission, owner listing/review/deletion, and denied anonymous reads. See the [learner release runbook](https://github.com/learngermanghana/falowenexamtrainer/blob/main/docs/workflows/deployment-and-rollback.md). No new schedules, storage service or Firebase functions deployment.

### Dashboard teacher application count

The verified owner’s Admin dashboard requests `GET /api/teacher-applications?view=count` once when opened. The same owner-authenticated endpoint runs a Firestore `count` aggregation with `status == new` and returns only `{ok:true,newCount}`; no applicant records, pagination reads, browser listeners, polling, scheduled jobs, counters written to Firestore or email notifications are needed. The count is a snapshot, refreshed when returning to or reloading the dashboard. The existing status workflow determines which records are new, and errors display an unavailable indicator rather than a false zero. The card opens the existing owner review screen. A Firestore aggregation can incur index-entry reads, but it avoids downloading all application documents.
