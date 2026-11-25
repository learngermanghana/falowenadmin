# Falowen Attendance Email Migration — November 2026

## Implemented in this repository
- Attendance page: **Send check-in invitation emails** appears after opening check-in.
- Authenticated POST `/api/checkin-invitations` derives class/session and eligible recipients **server-side**, verifies active check-in, and calls the existing Calender Apps Script web app.
- Weekly `/api/weekly-engagement-summary` is administrator-triggered only; the former Sunday cron is retired. Preview and explicit POST send use the existing Apps Script integration.
- Weekly scan reads Firestore attendance and `classParticipationRecords` and forwards class/student aggregates to the Calender script.
- Apps Script must expose `sendCheckinInvitations` and `sendWeeklyEngagementSummaries` actions and keep delivery logs in `===LOGS===`.

## Required deployment steps (not yet done automatically)
1. In the **existing bound Calender spreadsheet Apps Script project**, replace the old Code.gs with the tested updated Code.gs generated from the supplied source. Deploy a new version of the **existing** web app; keep the original secret.
2. Configure the production Vercel project **attendance** (admin.falowen.app): `CALENDAR_APPS_SCRIPT_URL` with that web app URL and `CLASS_SCHEDULE_SYNC_SECRET` with the corresponding **already configured Apps Script secret**. These are server-only vars, **not** `VITE_*`. Redeploy after setting them.
3. `CRON_SECRET` is provisioned as a production encrypted variable for the weekly cron; redeploy after environment changes.
4. Use a controlled test class: Open check-in, press Send check-in invitation, confirm emails, verify retry reports skipped recipients and never duplicates.
5. Verify the Calender Apps Script five-minute trigger is installed. To enable the 30-minute reminders **only after** Cloud replacement testing, set Apps Script property `ENABLE_CLASS_EMAIL_REMINDERS=true` and verify one weekday and Saturday reminder. The updated script uses `SWAHILI_CLASS_JOIN_LINK` (and optional `SWAHILI_ZOOM_ID`, `SWAHILI_ZOOM_PASS`) for Kiswahili rather than sending the German Zoom credentials.
6. After **one complete week** of weekly digest comparison, pause the Cloud job `sendAttendanceConfirmationEmails` if the new weekly summary replaces that email for every program. Keep attendance data and `queueAttendanceConfirmation...` event triggers until verified.
7. Firebase confirmed deletion of `sendClassSessionReminderEmails` and `sendSaturdayClassSessionReminderEmails` in `us-central1` on 16 November 2026. Their exports and deploy targets are retired.

## Safety/quality notes
- A class-reminder email and an open-check-in invitation are distinct events. Pre-class emails go out 30 minutes before class and **must not** contain an open check-in link unless the server confirms the window is open.
- The check-in URL is shared per session; authorization belongs to the Falowen check-in endpoint and student login, not secrecy of the URL.
- One invite per **class+session+recipient**, one weekly digest per **week+class+recipient**; both deduplicated in `===LOGS===`.
- Current weekly report is based on stored classes and participation records; do not treat class participation as an academic grade.

## Safe migration flags
- Apps Script property `ENABLE_CLASS_EMAIL_REMINDERS` defaults to off. Set to `true` only after confirming the new sender and retiring Cloud weekday/Saturday reminder jobs.
- Vercel production env `WEEKLY_ENGAGEMENT_ENABLED` defaults to off. Set to `true` only after validating weekly numbers and retiring the legacy weekly attendance sender.
- One weekly Vercel Cron exists but intentionally returns a harmless `disabled: true` response until the flag is enabled.

## Weekly preview added (Nov 16, 2026)
- Admin → Communication → Attendance confirmation emails → **Preview weekly report (no emails)**.
- Calls GET `/api/weekly-engagement-summary?preview=1` using the owner's Firebase ID token; this does not send messages and never returns students' email addresses.
- New digest reads canonical `classSessions` and legacy attendance aliases, tutor manual Present/Late/Absent/Excused overrides, checkin subcollections, current eligible class roster, and `classParticipationRecords` once per Sunday run. Completed sessions only; cancelled, superseded and future sessions excluded. Students enrolled after a session are not marked absent for earlier classes.
- Classes configured `off` or `each_class` are **excluded**. Review them before retiring the old job; selecting weekly in Communication is a separate deliberate setting change.
- The owner must check preview totals against Attendance and Class Participation on real classes, especially German and Swahili and students with transfers. If a class is absent or numbers are wrong, do not enable sending.
- Deploy `Falowen_Calender_Weekly_Attendance_Updated.gs` as a new version of the existing bound Apps Script. It includes Late/Excused/Absent and excludes Excused from the attendance-rate denominator.
- After the Google Apps Script weekly delivery test, pause Cloud Scheduler `firebase-schedule-sendAttendanceConfirmationEmails-us-central1` (check the actual job name/region), then set Vercel production `WEEKLY_ENGAGEMENT_ENABLED=true` and redeploy. Do not run both systems concurrently. Maintain the attendance checkin tracking job.

## Manual attendance reports (25 November 2026)

In Attendance, choose a class, From week and To week, then Preview report and Send emails. Week 1 is the Monday-based week containing the course start. You may select the current week or previous weeks (up to 16 at once). Each selected week sends its existing weekly summary per eligible student, preserving Apps Script deduplication and sent receipts. A week sent early is considered sent; it is not automatically resent. Cancelled, future and app-only sessions do not count. Past sessions with recorded check-ins or tutor attendance count without a completed status; unverified past lessons are excluded and disclosed in the preview. Existing completed sessions still count. Explicitly disabled class emails are respected. No new scheduled jobs or automated sends are introduced, and the range shares the existing digest data load per request.
