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

The public player displays a consent banner before loading GA4. Visitors can decline without affecting playback. The consent decision is saved locally. The embedded campus music player is not tracked by **public GA4**. A separate authenticated Campus activity report records signed-in students' play starts, completed listens and completed question checks.

Tracked events: page_view (only after opt-in), music_play (actual start but not pause/resume), music_complete (audio ended), music_share (share button clicks), music_signup_click (Falowen Classes link clicks). Music events include a canonical track page URL so standard GA4 pagePathPlusQueryString can group songs without registered custom dimensions. No student UID, name, email, answers or speech data are sent to GA4.

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

## Signed-in Campus student practice (separate from public GA4)

The student course player uses Firebase Authentication and sends a verified ID token over HTTPS to POST `/music-analytics/practice` on the existing Admin `api` Function. The signed-in Campus iframe sends only a same-origin activity signal to its authenticated React parent; it never sees the student's Firebase token. Direct coursebook audio players use the same reporter. Public music.falowen.app visitors are not linked to student accounts.

The Function verifies the token server-side, resolves the student's name from the existing `students/{uid}` profile on first activity (falling back to authenticated identity), and stores one compact `musicPracticeSummaries/{uid}` record. For older student-code-keyed profiles it can also resolve the account by its UID. Daily event totals are limited to a rolling 35-day window when a student practises again; the owner report never shows totals outside the selected 1/7/30-day range. Inactive student summary documents are not automatically deleted, so a Firestore TTL policy is needed if strict physical deletion is required. Duplicate play/resume/check events within 45 seconds do not count twice. It never stores answers, speech recordings, unverified student identity from the player, or private course audio.

The existing owner-only Admin page calls GET `/music-analytics/students?days=1|7|30` **only when the admin opens Music Analytics, selects a date range, or clicks Refresh**, showing the student's account, last song, play starts, full listens, completed question checks and latest activity. It filters Firestore to recently active students before returning rows. It never polls or requests reports while the Admin page is closed. This API is restricted by the same Music Studio owner check as public GA4 reporting. Data collection begins only after deployment; anonymous historical listening cannot be assigned to students.

This separate authenticated tracking saves the first meaningful play promptly, then buffers subsequent actions in the student browser for up to 10 minutes or 24 events and flushes when the student leaves the lesson or hides/closes the page. One authenticated transaction can record an entire batch in **one student-summary write** rather than writing for every play, completion and question check. A browser exit can interrupt pending network requests, so the latest actions are best-effort rather than guaranteed instant reports. There is no backend polling, scheduled job, background report refresh, GA4 user ID, per-second timer or AI. It is not literally zero cost; test usage against Firebase's free quotas before scaling. Campus includes student-facing notice.

Validation: `node --test tests/music-analytics.test.js tests/music-practice.test.js` in Admin; student navigation/music tests in the learner repo. Deploy the Admin Firebase `api` Function, Admin frontend and learner website. No new environment variable or Google Analytics permission is required for signed-in practice. Anonymous public GA4 still requires its existing Analytics Data API permissions.
