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

Browser -> Firebase `api/music-studio` -> Google; no audio through Vercel functions.
Existing secured API function, 300s timeout (270s upstream).
Music concurrency is limited by its transactional budget lease. No always-on worker or scheduler.
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

Deploy the existing `api` export in the falowenadmin Functions codebase,
then deploy the Admin frontend. Reuses existing `GEMINI_API_KEY`; the associated
Google project needs paid Lyria access. Default frontend URL:
https://us-central1-falowen-examiner-trainer.cloudfunctions.net/api/music-studio
Optional override: VITE_MUSIC_STUDIO_API_URL. CORS allows production Admin and
localhost:5173. Shared API timeout is extended to 300s for music; other scaling settings remain unchanged.

For a targeted manual backend deployment use:
`firebase deploy --only functions:falowenadmin:api --project falowen-examiner-trainer`
The normal workflow may deploy other functions because main.js is shared.

Automated tests cover authorization, payload restrictions, budget limits/reset,
deduplication, failed-call accounting, stateless provider requests and MP3 parsing.
Build and focused lint also run. Live paid generation requires deployment and an
owner session; verify one preview, playback and MP3 download before relying on it.

## CEFR storytelling for lesson songs

For Course lesson mode, **Real-life storytelling** is the default songwriting approach. The selected dictionary lesson and CEFR level shape a coherent scene rather than a repeated bilingual vocabulary list. The AI is asked for a character, a realistic problem, a short dialogue, a useful German hook, resolution and explicit outro. At A1, sentences should be very short and present tense; A2 through C2 progressively add narrative complexity without losing singability. English support is brief and natural, not a parenthesized translation after each word.

The A1 chapter **14.1 Gesundheit und Körperteile** has a targeted seed: a learner with a headache says "Mein Kopf tut weh", a friend asks "Was ist los?", they request help and finish "Jetzt geht es mir besser". Body-part words appear in context, and the song does not pretend every body part hurts.

Teachers can write a custom story situation, switch back to **Vocabulary review / repetition**, or paste older lines as vocabulary reference by selecting **Source vocabulary — rewrite into a story**. The default **Exact lyrics — keep my words** continues to preserve teacher-provided lyrics. Bracketed transcription markers are not meant to be sung. Full songs still target 2½ minutes by default with quiet accompaniment, last 20-second outro, and no automatic retries. These are instructions to the model; the resulting MP3 and timing still require a human listen before publishing. No lyrics/audio are stored by Falowen, and the music generation budget is unchanged.
