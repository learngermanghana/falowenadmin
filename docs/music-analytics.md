# Falowen Music Analytics — opt-in GA4

Falowen Music is public and static. Analytics is optional, and it does not write per-listen Firebase records or use AI.

## One-time configuration

1. Use the existing **falowen-examiner-trainer** Google Analytics 4 property and its **Falowen Music** web stream for https://music.falowen.app/.
2. The public Measurement ID **G-Q7BNDTQ68B** is already configured in the companion student website PR, including the build generator. You do **not** need to paste the Google tag or configure a Vercel environment variable. Redeploy the student site after merging PR #3268; its build writes music/analytics-config.js. The optional MUSIC_GA4_MEASUREMENT_ID environment variable may override the default if ever deliberately changed.
3. The numeric GA4 **Property ID** is **515909911**. The Admin Firebase reporting endpoint defaults to this non-secret public property identifier; no additional Firebase environment-variable step is required. An explicitly set `FALOWEN_MUSIC_GA4_PROPERTY_ID` overrides the default.
4. Enable Google Analytics Data API in the Admin Firebase Cloud project.
5. In GA4 Property Access Management, grant the Cloud Functions runtime service account **Viewer** access to the property. The server uses Google Application Default Credentials with analytics.readonly scope, not a public API key.
6. Deploy the Admin Firebase api Function and the Admin frontend. Visit Falowen Admin > Music Analytics.

The music tracker loads Google Analytics only after the visitor accepts consent. The server uses Property ID `515909911` unless an explicit environment override is supplied. If that override is empty or invalid, Admin shows setup guidance rather than invented report counts. A Property ID alone does not grant reporting permission.

## Privacy

The public player displays a consent banner before loading GA4. Visitors can decline without affecting playback. The consent decision is saved locally. The embedded campus music player is not tracked by this feature.

Tracked events: page_view (only after opt-in), music_play (actual start but not pause/resume), music_complete (audio ended), music_share (share button clicks), music_signup_click (Falowen Classes link clicks). Music events include a canonical track page URL so standard GA4 pagePathPlusQueryString can group songs without registered custom dimensions. No student UID, name, email, answers or speech data are collected by this code.

## Admin

The existing Admin Firebase Function serves GET /music-analytics/summary?days=1|7|30. A valid Firebase ID token and the owner-only Music Studio guard are required. It calls Google Analytics Data API, filtering hostName to music.falowen.app, to read aggregate visitors, page views, plays/completions, top songs, levels, country and daily trends. It uses in-memory 15-minute caching and in-flight request coalescing; there are no per-listen Firestore writes, AI calls, scheduled jobs or BigQuery exports.

Standard GA4 and its API can be used within free quotas. Server calls and normal CDN/network usage are still subject to the hosting provider's limits. No promise of absolute zero infrastructure charges is made.

## Manual checks

1. Load music.falowen.app in a clean browser. Before choosing Allow, confirm no requests to googletagmanager.com. Decline and check music still works.
2. Clear local browser key falowen_music_analytics_consent_v1, reload and accept. Confirm GA4 loads.
3. Play a track, pause/resume, then finish: one play event and one completed event. Test next-track and share.
4. Sign in as Admin owner, open Music Analytics and use 1, 7, and 30 days. Unconfigured state must be explicit.
5. Verify non-owner access receives 403, missing login 401, and missing GA4 permission displays a readable error.

## Tests

Run: node --test tests/music-analytics.test.js, node --check functions/musicAnalytics.js, and npm run build in the Admin repository.
Run: node --check web/public/music/analytics.js, and node web/scripts/write-music-analytics-config.mjs in the learner repository.
GA4 reporting can take time; the dashboard is not a real-time analytics log. Aggregate counts exclude visitors who decline consent and may include anonymized/pseudonymous GA4 processing.


## Signed-in Campus Student Practice (separate from GA4)

**Student Practice** is a separate tab under Admin > Music Analytics. It is intentionally NOT a GA4 user-ID feature, and visitors using \`https://music.falowen.app/\` remain anonymous.

- In the authenticated **/campus/music** page on \`www.falowen.app\`, the same-origin embedded music player sends \`start\`, \`progress\` (pause / track change) and \`complete\` (audio ended) messages to its parent frame. The parent validates the frame source, the exact origin and payload, and sends a Firebase ID token to Admin's API. Only signed-in non-anonymous Firebase students are recorded.
- \`POST /music-practice/record\` verifies the Firebase ID token on the server, ignores any claimed client UID/name/email and records the **verified identity** in one Firestore document per student / UTC day / song. Only counts and approximate elapsed listening seconds are stored. No transcript, quiz answers, recording, speech, analytics cookie or IP is added.
- Updates occur on start / pause / completion, not per second. The API caps events at 600 seconds and rate-limits 24 updates per authenticated account per minute (instance-local best effort). A Firestore \`expireAt\` field is written 90 days ahead; enable the **Firestore TTL policy for collection group \`studentMusicPractice\` field \`expireAt\`** to enforce automatic expiry. Until that TTL policy is enabled, historical records will not be deleted automatically.
- \`GET /music-practice/summary?days=1|7|30\` is owner-only (same guard as Music Studio), reads at most the latest 300 matching documents once when the Student Practice tab is opened or refreshed, and reports unique student accounts, starts, completions, listening time, last activity and song details. The interface flags when 300 documents cap the report. No polling, export job or AI call is required.
- Records are indicative playback activity, **not evidence of attentive learning** and not marks or assignment completion. A song's level is not necessarily the student's enrolled course level.
- Only Campus Music listens occurring *after deployment* are identifiable. Previously consented GA4 events cannot be linked back to student accounts, and the public music site continues to show only anonymous aggregates. Listening via other lesson-specific players is not part of this initial tracking integration.

The student Campus page discloses practice logging above the music player. Review the platform privacy notice and, if required, offer a school-managed opt-out before requiring use. Admin reports contain student identifiers and are restricted to authorised owners. No new third-party analytics vendor or paid API was added.

### Release order

1. Merge/deploy Admin backend Firebase \`api\` function and Admin frontend.
2. Merge/deploy the learner \`CampusMusicPage\` and public music static player file.
3. Sign in as a test student, open \`/campus/music\`, play and pause a song, and finish one. Check Admin > Music Analytics > Student Practice for this student's account.
4. Test signed-out listening on the public \`music.falowen.app\` domain to confirm **no student record** is written. Test the endpoint with no token (401), another signed-in student for report (403), and owner (200).
5. Enable the Firestore TTL policy described above separately. This cannot be enabled by checking in a document field alone.

Test files: \`tests/student-music-practice.test.js\` (Admin), \`web/src/components/musicPracticeTracking.test.mjs\` (learner). The existing GA4 dashboard is unchanged.

### Workbook music practice — 8 November 2026

Authenticated workbook song players reuse the existing `/music-practice/record`
endpoint with `source: workbook`. The API accepts only the `campus` and
`workbook` source values; older Campus clients without a source remain
`campus`. Workbook listens use distinct document IDs from Campus listens
for the same student, UTC day and track, preserving existing Campus data.
This adds **no per-second writes, new queries, external analytics service,
transcription, AI calls, or automatic refresh**. Listening events are bounded to
one start, one optional meaningful pause summary, and one completion per song
session. The Admin Recent song practice table distinguishes Workbook from
Campus Music; existing owner-only authentication, 300-document query cap and
manual Refresh practice button are unchanged.

Only playback inside a signed-in workbook counts. Opening the workbook or
music tab without starting audio is not practice. Finishing after seeking to
the end is not a full listen unless enough audio was actually heard.
Private Hören and public `music.falowen.app` visits are not identifiable
student listening records. Do not use practice metrics as exam marks.

Deploy this Admin Firebase API change **before** the learner workbook change.
Confirm a signed-in test student plays, pauses and completes a workbook song,
then explicitly refresh Admin > Music Analytics > Student Practice. Verify
the source reads Workbook and check that Campus Music still reads Campus Music.
