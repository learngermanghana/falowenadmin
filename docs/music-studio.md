# Falowen Music Studio

Owner-only `/music-studio` navigation uses the same owner account and build-time
`VITE_HOEREN_STUDIO_OWNER_UID` as AI Hören Studio. Server authorization also checks
the existing owner UID/hash. Staff and students cannot generate music.

Google Lyria Clip (`lyria-3-clip-preview`) generates 30 seconds; `lyria-3.5`
generates a full song with optional custom lyrics. Both return MP3. Pricing checked
27 October 2026: $0.04/clip, $0.08/song, excluding infrastructure.
https://ai.google.dev/gemini-api/docs/music-generation
https://ai.google.dev/gemini-api/docs/pricing

## Cost and privacy

Browser -> Firebase `musicStudio` -> Google; no audio through Vercel functions.
Dedicated function: minInstances 0, maxInstances 1, concurrency 1, 256 MiB,
fractional CPU, 300s timeout (270s upstream). No always-on worker or scheduler.
The static page is lazy-loaded. Google key stays in Secret Manager.

One private Firestore budget document, accessed only on demand. Transactions
reserve estimated cost before calling Google: $0.80/day and $5/month UTC.
Failed attempts remain counted; no retry, refund, or provider fallback. Monthly
request IDs prevent duplicate dispatch and a five-minute lease blocks concurrent
requests across tabs. Estimates are not a Google billing-account hard cap:
provider price changes and backend/Firestore/egress costs are separate.
No Firestore rule changes; private budget collection must remain client-denied.

No audio/lyrics saved by Falowen. `store:false` disables Google Interaction
history storage (Google's other service retention policies still apply). Audio
lives in browser memory until navigation/reload; download MP3 before leaving.

## Deployment and verification

Deploy the new `musicStudio` export in the existing falowenadmin Functions codebase,
then deploy the Admin frontend. Reuses existing `GEMINI_API_KEY`; the associated
Google project needs paid Lyria access. Default frontend URL:
https://us-central1-falowen-examiner-trainer.cloudfunctions.net/musicStudio
Optional override: VITE_MUSIC_STUDIO_API_URL. CORS allows production Admin and
localhost:5173. Existing shared API timeout/settings remain unchanged.

For a targeted manual backend deployment use:
`firebase deploy --only functions:falowenadmin:musicStudio --project falowen-examiner-trainer`
The normal workflow may deploy other functions because main.js is shared.

Automated tests cover authorization, payload restrictions, budget limits/reset,
deduplication, failed-call accounting, stateless provider requests and MP3 parsing.
Build and focused lint also run. Live paid generation requires deployment and an
owner session; verify one preview, playback and MP3 download before relying on it.
