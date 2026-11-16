# Falowen Attendance Email Migration — November 2026

## Implemented in this repository
- Attendance page: **Send check-in invitation emails** appears after opening check-in.
- Authenticated POST `/api/checkin-invitations` derives class/session and eligible recipients **server-side**, verifies active check-in, and calls the existing Calender Apps Script web app.
- Weekly GET `/api/weekly-engagement-summary` is scheduled for **Sunday 20:00 UTC (Africa/Accra)** by Vercel Cron and authenticated with `CRON_SECRET`.
- Weekly scan reads Firestore attendance and `classParticipationRecords` and forwards class/student aggregates to the Calender script.
- Apps Script must expose `sendCheckinInvitations` and `sendWeeklyEngagementSummaries` actions and keep delivery logs in `===LOGS===`.

## Required deployment steps (not yet done automatically)
1. In the **existing bound Calender spreadsheet Apps Script project**, replace the old Code.gs with the tested updated Code.gs generated from the supplied source. Deploy a new version of the **existing** web app; keep the original secret.
2. Configure the production Vercel project **attendance** (admin.falowen.app): `CALENDAR_APPS_SCRIPT_URL` with that web app URL and `CLASS_SCHEDULE_SYNC_SECRET` with the corresponding **already configured Apps Script secret**. These are server-only vars, **not** `VITE_*`. Redeploy after setting them.
3. `CRON_SECRET` is provisioned as a production encrypted variable for the weekly cron; redeploy after environment changes.
4. Use a controlled test class: Open check-in, press Send check-in invitation, confirm emails, verify retry reports skipped recipients and never duplicates.
5. Verify the Calender Apps Script five-minute trigger is installed and its 30-minute reminder works on a weekday and Saturday; verify BCC and correct Zoom link for **each language**. The existing script's Zoom constants are German-specific — update them for Swahili before turning on reminders for Swahili.
6. After **one complete week** of weekly digest comparison, pause the Cloud job `sendAttendanceConfirmationEmails` if the new weekly summary replaces that email for every program. Keep attendance data and `queueAttendanceConfirmation...` event triggers until verified.
7. Only once Apps Script reminder delivery is confirmed, **delete the deployed Firebase functions** `sendClassSessionReminderEmails` and `sendSaturdayClassSessionReminderEmails` in us-central1. Deleting the Scheduler jobs alone is insufficient.

## Safety/quality notes
- A class-reminder email and an open-check-in invitation are distinct events. Pre-class emails go out 30 minutes before class and **must not** contain an open check-in link unless the server confirms the window is open.
- The check-in URL is shared per session; authorization belongs to the Falowen check-in endpoint and student login, not secrecy of the URL.
- One invite per **class+session+recipient**, one weekly digest per **week+class+recipient**; both deduplicated in `===LOGS===`.
- Do **not** disable the two existing Cloud reminder jobs until verified end-to-end. Otherwise students may stop receiving reminders.
- Current weekly report is based on stored classes and participation records; do not treat class participation as an academic grade.
