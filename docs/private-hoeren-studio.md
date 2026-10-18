# Private Hören Studio (Falowen Admin)

Owner-only editor: `https://admin.falowen.app/ai-studio`

This feature adds original Goethe-style **practice** recordings (not official recordings), with A1–B2 scripted dialogs, public announcements, telephone messages, two Google voices, local timed pauses, optional second full playback and downloadable **WAV** + transcript. No audio files are persisted in Firestore/Cloud Storage.

## Activation (required; fail closed)

1. Determine the Firebase Authentication **UID** for the single Falowen owner account. Do not use a student's account.
2. Configure `HOEREN_STUDIO_OWNER_UID` in the **existing Firebase Functions runtime environment**, or place `{ "ai_studio": { "owner_uid": "<YOUR_FIREBASE_UID>" } }` into the deployment's securely managed `CLOUD_RUNTIME_CONFIG`. Keep any preexisting config keys. The backend refuses all users if this UID is missing.
3. Set the Firebase Functions Secret Manager secret: `firebase functions:secrets:set GEMINI_API_KEY --project <FIREBASE_PROJECT>`. Use a *restricted Gemini API key* from Google AI Studio. Never commit it to Git or put it in a `VITE_*` variable.
4. Bindings are declared in `functions/index.js`. Deploy the existing Firebase API function after validating the project selection, e.g. `firebase deploy --only functions:api --project <FIREBASE_PROJECT>` (check actual function codebase and name in the deployment first). Deployment **cannot complete until the secret exists**.
5. In the Vercel project building Falowen Admin, set the non-secret **build** variable `VITE_HOEREN_STUDIO_OWNER_UID=<YOUR_FIREBASE_UID>` and redeploy the admin website. This only hides the navigation and route from other UI accounts; the real authorization always takes place in Firebase.
6. Open `/ai-studio` with the owner account and verify the status says the key is ready. Test one short script/clip using Flash-Lite. Confirm browser preview, downloaded WAV, German numbers and pronunciation before producing lessons.

**Do not merge/deploy blindly** while owner UID, Secret Manager access, quota eligibility and Firebase project are unverified. No secret or billing plan is created by this commit.

## Budget safeguards

- Firebase verifies the signed ID token and requires **exact owner UID**.
- Firestore transactions reserve a hard application limit of **5 generated scripts and 36 speech clips per UTC day** across parallel calls.
- Audio clips limited to 320 characters each; recording limited to 18 spoken turns, 40 total transcript lines.
- Max API response WAV 2.6 MB per clip; no files uploaded or published automatically.
- Repeats and pauses are assembled in browser without extra AI calls. Save/download the recording after generation to avoid paying for regeneration.
- Google free quotas and billing are independent of this application cap. **Firestore limits are not a financial ceiling**: Gemini billing and other cloud usage may still incur charges, including errors/retries. Use a Google Cloud budget/alerts, restrict key scope and review actual consumption before enabling paid access.

## Technical details

- Server: `functions/hoerenStudioApi.js`; registered with existing `functions/index.js` + Firebase secret binding.
- Browser: `src/pages/HoerenStudioPage.jsx`, `src/utils/hoerenAudio.js`; existing `api/router.js` forwards `/api/ai-studio/*`.
- Google script model: `gemini-3.5-flash-lite` (REST `generateContent`).
- Google speech models: `gemini-3.8-flash-lite-tts` and `gemini-3.8-flash-tts` (REST `/v1beta/interactions`). Audio is generated as 24kHz 16-bit mono WAV.
- Test: `node --test tests/hoeren-studio.test.js`.
- No ElevenLabs subscription or Vercel plan upgrade is introduced. Existing Vercel Hobby commercial-use terms should be evaluated separately from this feature.
- **MP3 export**, exam question generation and direct student publication are not implemented; WAV is usable and lossless, and can be converted offline if needed.

## Transcript notation

```
A: Guten Tag! Ich möchte eine Fahrkarte nach Berlin.
B: Möchten Sie heute oder morgen fahren?
[PAUSE 3]
A: Morgen früh, bitte.
```

A and B map to two prebuilt voices. `[PAUSE N]` adds N seconds of *exact* digital silence. Line gap and repeat gap are added on the device, not spoken by the AI. Audio is generated turn by turn and cached only in the open browser session; losing the session before downloading means the WAV must be regenerated.
