# Falowen Music Analytics — opt-in GA4

Falowen Music is public and static. Analytics is optional, and it does not write per-listen Firebase records or use AI.

## One-time configuration

1. Use the existing **falowen-examiner-trainer** Google Analytics 4 property and its **Falowen Music** web stream for https://music.falowen.app/.
2. The public Measurement ID **G-Q7BNDTQ68B** is already configured in the companion student website PR, including the build generator. You do **not** need to paste the Google tag or configure a Vercel environment variable. Redeploy the student site after merging PR #3268; its build writes music/analytics-config.js. The optional MUSIC_GA4_MEASUREMENT_ID environment variable may override the default if ever deliberately changed.
3. Copy the separate GA4 **numeric Property ID**. In the **Falowen Admin Firebase Functions** environment, set FALOWEN_MUSIC_GA4_PROPERTY_ID to that number.
4. Enable Google Analytics Data API in the Admin Firebase Cloud project.
5. In GA4 Property Access Management, grant the Cloud Functions runtime service account **Viewer** access to the property. The server uses Google Application Default Credentials with analytics.readonly scope, not a public API key.
6. Deploy the Admin Firebase api Function and the Admin frontend. Visit Falowen Admin > Music Analytics.

The music tracker loads Google Analytics only after the visitor accepts consent. If the numeric property ID is unset, Admin shows a setup notice rather than invented report counts.

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
