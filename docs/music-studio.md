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

## Automatic topic music and the public Falowen Music library

The **Music style** selector defaults to **Automatically match the lesson topic**. This uses a deterministic, free lookup of the selected dictionary title and CEFR level: health → gentle acoustic caring ballad; travel → light acoustic Afro-pop; food/shopping → warm bossa-pop; family → acoustic Afro-soul; work → optimistic soft pop; learning → gentle singalong; nature → airy folk; emotions → reflective soft soul. The teacher can select **Choose my own music direction** or a preset to override the suggestion. No model call is made until **Generate** is clicked; the existing daily/monthly caps and no-retry behavior remain.

The public song library lives at **https://music.falowen.app/** on the existing student Vercel project. Approved public songs are listed in the learner repository's `web/public/music/catalog.json`, with level, day, assignment, topic, public audio URL, and `attendance`/`coursebook` flags. The Admin attendance waiting room reads this small public JSON once when the teacher changes level/day and selects the matching published song. If no matching song exists or the request fails, the original waiting-room playlist remains. No Firestore reads, background polls, or automatic music generation are added. This catalog is a list of **public** songs; never put private Hören audio or signed URLs into it.

After approving a generated song, download the MP3 and deliberately publish it with a real public URL and catalog entry. A public static file can live at `web/public/music/a1/day-22/zoom-01.mp3` in the learner repo for a small library. For a growing library, store MP3s in a separate public Cloudflare R2 music bucket/media hostname and use those URLs in the catalog; keep `music.falowen.app` on Vercel for the listening website. Do not put secrets in the frontend or open the private course-audio bucket.

## Ready-to-use original A1–B1 songbook (84 lessons)

Falowen Music Studio includes **28 prewritten original German song drafts each for A1, A2 and B1 (84 total)**. The source is maintained as versioned frontend code in `src/data/musicSongDraftsA1.js`, `musicSongDraftsA2Part1.js`, `musicSongDraftsA2Part2.js`, `musicSongDraftsB1Part1.js`, and `musicSongDraftsB1Part2.js`. Each draft is keyed by the canonical course dictionary assignment ID and includes an original song title, a lesson-appropriate gentle music direction, and complete [Verse 1], [Chorus], [Verse 2], [Chorus], [Outro] text. Content has been checked for dictionary coverage and structure; final musical pronunciation/phrasing should still be listened to before public release.

**Owner workflow:** choose A1/A2/B1, day and assignment in Music Studio. The matching lyrics immediately appear in the lyrics box and an optional music arrangement is added to the automatically selected genre. This **does not call any paid API**, create R2 files, or publish audio. Edit the lyrics before generation if needed; edits are kept separately per assignment while the page remains open, not persisted to Firestore or a database. **Restore original** discards the temporary editing of that assignment.

**Reusing or archiving songs:** one-click **Copy lyrics**, **Copy music style**, **Download lyrics + music style (.txt)**, **Download all selected-level lyrics**, and **Download complete A1–B1 songbook (84 originals)**. Downloaded text includes title, level, day, chapter, assignment key, topic, lyrics and music style. Store edited text externally before leaving the page. The prewritten text is stable in source control and reusable without regeneration.

**Automatic MP3 filenames:** after a paid generation, clicking **Download MP3** uses the selected original title and canonical day/level, e.g. `falowen-a1-day-22-mein-kopf-tut-weh.mp3`. `src/utils/musicExportNames.js` transliterates German umlauts, strips unsafe filename characters and caps the length. Downloaded lyrics use the matching `.txt` name. A manually generated custom song defaults to `falowen-custom-music.mp3`.

**Publication is separate:** approved, downloaded MP3s must be uploaded manually to the designated public music store and entered in the public `music.falowen.app` catalog before students or attendance can play them. Course Hören audio in the private R2 bucket remains private. The generated MP3 is never automatically stored or published.

## More varied A1–B1 musical genres

The 84 prewritten A1–B1 song drafts now have explicit, teacher-editable `genre` and `musicStyle` fields. There are **25 distinct genres** in the songbook, including soft Afrobeat, Afro-pop, German pop, neo-soul, soft R&B, synth-pop, lo-fi hip-hop (clear sung German, not fast rap), reggae-pop, bossa-pop, jazz-pop, soft funk, piano ballads, Afro-fusion, indie-pop, downtempo electronic, flute chill and some acoustic arrangements. Only **4 of 84** music directions mention acoustic instruments as the primary genre. The original lyrics have not been rewritten.

In Music Studio, **Automatically match the lesson topic** uses the exact selected song's curated music direction as `preferredStyle`; the generic topic fallback is *not* appended on top. This prevents contradictory directions such as \"soft R&B plus acoustic folk\" for one song. The visible genre appears beneath the music-style selector, and text exports now include `Genre:` for easy searching and reuse. If a lesson has no curated draft (for example B2–C2), the existing topic-matching fallback still applies. Teachers can select **Choose my own music direction** to override any genre. Clear vocals, soft mixing, complete endings, and the unchanged budget/single-generation controls remain mandatory. No new MP3 was generated or uploaded by this change.

## Reusable song listening questions and slide activity (A1–B1)

Every one of the 84 original A1–B1 course songs has **three manually written, level-matched exercises** in `src/data/musicQuestionSeedsA1.js`, `musicQuestionSeedsA2.js` and `musicQuestionSeedsB1.js`: two questions about concrete events or meanings in the song, each with a teacher answer, and one speaking/transfer prompt. There are **252 questions total**. `src/data/reusableMusicQuestions.js` provides the canonical read-only helper, structured types, IDs and song-verse evidence. It matches each assignment key exactly with the `reusableMusicSongbook.js` lyrics, not an audio URL or unpublished song. No database, background AI call or additional generation fee.

**In Admin Music Studio:** select the course level, day and assignment as usual. A **Song questions** section shows all three questions and an initially hidden answer key. Copy questions for slides (student version **without** answers), copy the teacher answer key, or download a text file. Exporting an individual song, level songbook or all 84 originals now includes each song's questions and teacher answers in the same text teaching pack. Questions always refer to the original written lyrics; after changing lyrics or generating a different version, recheck them before assigning to students.

**In Teaching Slides:** open a course lesson that has a matching song draft. Its teacher guide displays the song question panel, and **Present song questions** opens an optional clean full-screen projector activity with answers **hidden by default**. This is separate from the standard presenter/lesson stages and does not assume a public MP3 exists. **Student handout mode does not contain the teacher answer key.** The song must be played separately before asking its listening questions. It is intentionally not inserted automatically into every lesson stage, since the user may not have published the corresponding MP3 yet.

**The same canonical question bank** can subsequently feed the public Falowen Music song-detail UI and coursebook when a published song corresponds to the exact saved draft. Do not automatically show unpublished draft questions as though they match a different recording; the teacher must verify the final audio's lyrics and answers first.

## Natural Falowen signatures in original song lyrics

Each of the 84 A1/A2/B1 original drafts ends with one short, lesson-appropriate line containing **Falowen**. Examples: **A1 Day 22 health:** `Bei Falowen lerne ich: Gute Besserung!`; **A2 pharmacy:** `Mit Falowen kann ich Beschwerden besser erklären.`; **B1 sustainable consumption:** `Bei Falowen lerne ich, bewusster zu entscheiden.` These signatures are part of the final [Outro], not a disruptive advertisement during the story, and remain optional/editable in Music Studio. The vocabulary stories, verse structure, music styles, canonical assignment IDs and the 252 listening/speaking questions remain unchanged. No API call, storage write, audio upload or generation occurs when selecting, copying or exporting a draft. Since original source lyrics changed, previously generated recordings will **not** automatically include the new Falowen line; to add it to an MP3, manually generate or record an approved new version after reviewing the song.
