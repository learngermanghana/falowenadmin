# Grammar Audio Generator — Falowen Admin

Owner-only: https://admin.falowen.app/ai-studio → **Grammar Audio**.

## What this does

Creates bilingual English/German or German-only narration for teacher-authored grammar lessons. It reuses the existing Gemini API key, Firebase owner guard, shared daily counters, local clip cache and WAV/MP3 export. It does not use ElevenLabs. Gemini model usage may still incur Google charges.

## Editing and generation

1. Choose A1–C2 level, topic, narration mode and Gemini Flash-Lite (budget) or Flash (expressive).
2. Optionally generate a draft script using one of the existing **20 script requests/day**. Pasting or editing a script is free.
3. Mark each spoken line `EN:` or `DE:`. Put `[PAUSE 2]` on a separate line for two seconds of silence. These markers are never spoken.
4. Review the grammar and word spacing carefully, e.g. `je mehr` and `desto besser` are separate words.
5. Generate audio. Same-language segments are grouped where possible; German and English use distinct language configurations. Existing scene clips are cached on this device and reused.
6. Preview and export MP3, WAV or the script. Export and pauses are assembled locally; no automatic publication or new audio storage service.

## Safeguards

- Owner authentication is checked by the existing Firebase API.
- Uses the existing **72 speech scenes/day** owner-only limit, shared with Hören; no background generation.
- Script ≤6,500 characters, each TTS turn ≤320, scene ≤520 spoken characters and 8 turns, ≤36 scenes per recording, manual pauses 1–15 seconds.
- Cache is IndexedDB on the current device for up to 14 days, if browser storage is available. Export before clearing browser data.
- Existing Course Book / Goethe / Complete ZIP modes and their publishing rules are unchanged.
- No R2 upload, student data writes, scheduled jobs or new API keys.
- Falowen quotas are NOT billing caps. Google may charge for requests and apply separate rate limits.
- Review every generated grammar explanation and the pronunciation before sharing.

## Verification before release

Run `node --test tests/grammar-audio-studio.test.js tests/hoeren-studio.test.js` and `npm run build`. Deploy both the Admin UI and the existing Firebase function. Owner must verify bilingual scene pronunciation, caching and MP3 download. Confirm non-owner rejection and existing Hören regression tests.