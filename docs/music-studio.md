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

## Selected lesson music in the live classroom (28 October 2026)

Music Studio stores original reusable A1–B1 lyrics plus 252 questions for all 84 assignments, but **not every teaching slide plays music**. `src/data/curatedLessonMusic.js` is the selected-day plan. Only **A1 Day 22 (A1-14.1)** and **A2 Day 18 (A2-7.18)** are approved/published; the other few planned days have no audio URL and do not activate in slides or check-in.

A1 Day 22 gains a new music stage after its A1 grammar presenter introduction. A2 Day 18's slide 2 uses the **new R2 song** (not the obsolete Amir YouTube track). Each selected stage provides real music controls, a lyric tab, and an ungraded three-question listening/speaking activity from the canonical lesson-specific dictionary. Student answers are hidden until the teacher presses reveal. A2 Day 18's slide 3 remains **the existing distinct Hören recording** `a2/day-18/bank-telefonat.mp3` with five original Richtig/Falsch questions, transcript and private authorization.

Attendance check-in immediately chooses the curated R2 song for matching level/day or assignment, independent of a catalog network race. It loops that song alone; if playback fails, it **shows the actual error** rather than silently switching to the old GitHub song. Other unrelated class days retain the general playlist. Approved R2 songs use browser media playback instead of MediaElementSource to avoid CORS silence on the temporary R2 signed redirect. Volume controls and timed fading remain attached. No R2 permissions are changed, no extra music is generated, and no background scans run.

## Shared timed lyric highlighting

Admin song slides now use the same reviewed `<MP3 basename>.lyrics.json` metadata as music.falowen.app. In the slide's **Liedtext** tab, expand **Lehrkraft · Zeitmarken für beide Musikplayer**, play the final recording and mark each line's actual start (including repeated choruses). Undo corrects the most recent mark. Complete sets can be exported for Cloudflare; upload the JSON beside its MP3 under `music/<level>/day-XX/` to publish it. The JSON includes the exact MP3 `objectKey`, final `lyrics` and ordered `{start,text}` cues in seconds.

Local timing edits are shared across Admin views on the same device; a complete local edit takes priority over published data. Timings are checked against every lyric line and the exact recording. No approximate timing, AI alignment requests, Firestore changes or background scans are added. Until a recording has reviewed timings, its plain lyrics remain readable. Reload after publishing (up to 60 seconds for metadata caching).

## Harmonic songwriting and modern production palettes

Falowen Music Studio now has an independent **Musical production & chord progression** selector that works for both course songs and custom songs. Available choices: original automatic lesson genre; chill 808 with acoustic piano and flute; piano/flute ballad; rich-chord neo-soul; mellow Afro-soul; acoustic piano pop; melodic chill house; anthemic nostalgic hip-hop/pop; and nostalgic flowing piano pop.

All production palettes are versioned, deterministic text instructions and consume **no separate API calls**. Selecting one overrides the potentially conflicting auto-curated lesson genre at generation time, while preserving its CEFR storytelling context and teacher lyrics. The selected musical direction is also used by Copy music style and by the current song-text export. Choosing Original lesson arrangement restores the original automatic or custom direction. No music is generated until the teacher clicks Generate.

The production direction specifies an original key, tempo, chord movement, instrumental layering and song development: sparse intro, purposeful verse, melodic chorus, second-verse contrast and resolved outro. Chill 808 and melodic house are allowed a controlled kick, hats and tuned sub-bass rather than being silently disallowed by the general quiet-accompaniment guideline. German consonants and a single clear voice retain priority. These are **creative prompts, not verified audio controls**: the provider may not follow exact chords, beat timing, instrument choice or finished-song length. Listen before publication.

The nostalgic anthemic style emphasizes the broad hook and verse/chorus dynamic contrast of classic emotional pop/hip-hop; the flowing piano style uses eight-chord descending movement and gradual textural growth. These are original production ideas and must not copy another artist's melody, lyrics or samples. The old songbook lyrics, public music catalog, publishing workflow and existing $0.80/day / $5/month budget limits are unchanged. No additional storage, Firestore rules, Cloud Functions, background jobs or paid preview requests are introduced.

## Adult songwriting and guitar-led production

**Audience:** Falowen's learner music is for adults, including A1 learners with limited German. CEFR simplicity must not translate into babyish melodies. The default guidance now asks for believable adult situations, natural German stresses, emotional chord movement and a developed verse-to-chorus arc rather than forced rhymes, repetitive vocabulary chants or nursery-school singalongs. This is a preference conveyed to the AI model, not a hard guarantee of output quality; listen and approve before publication.

Four new **Musical production & chord progression** choices are available for both custom and course songwriting, with original specified chords and rhythms:

- **Fingerstyle acoustic · intimate storytelling:** Dadd9 – A/C# – Bm7 – Gmaj7; warm real steel-string guitar, a single expressive voice, no drums.
- **Acoustic guitar + piano · emotional pop:** Cadd9 – G/B – Am7 – Fmaj7 – C/E – Dm7 – Gsus4 – G; smooth guitar and piano interplay with a gradually wider chorus.
- **Soul guitar · mellow R&B groove:** Am9 – D13 – Gmaj9 – Cmaj7; warm electric guitar voicings, melodic bass, relaxed pocket rhythm and tasteful flute fills.
- **Acoustic Afro-soul · guitar groove:** Gmaj9 – D/F# – Em7 – Cadd9; syncopated acoustic picking, subtle percussion and soulful melody.

The existing chill 808, piano/flute, neo-soul, nostalgic anthem, nostalgic piano pop and melodic house options remain available. These are **genre and chord directions for original music**, not requests to reproduce existing copyrighted recordings, melodies or samples.

**Lyrics control matters:** Prewritten dictionary lyrics remain preserved by default as **Exact lyrics — keep my words**. To replace nursery-like prewritten lines with a natural adult story, deliberately choose **Source vocabulary — rewrite into a story**; this treats the source text as ideas rather than exact lyrics. Original saved songbook content is not overwritten by that choice, and no generation runs until clicked.

**Instrumentals:** Guitar instrumental mode no longer sends preloaded classroom lyrics to the provider; it sends a lyric-free instrumental lesson context instead. No changes to backend, R2, pricing, Firestore security, Vercel settings, storage or publication rules.

## Ghanaian guitar highlife and frikyiwa percussion

The Falowen A1–B1 dictionary had **no song explicitly labeled Highlife**. Three suitable guitar-led Afro-Pop song drafts are now intentionally reclassified with **Ghanaian Highlife** as their curated genre and a detailed frikyiwa musical direction:

| Level | Assignment | Song | BPM |
| --- | --- | --- | --- |
| A1 | A1-4 | Woher kommst du? | 92 |
| A2 | A2-9.23 | Mein Weg zur Arbeit | 94 |
| B1 | B1-8.24 | Weniger kaufen, mehr erleben | 91 |

The **lyrics are unchanged**; the new details live only in each song's `musicStyle` and `genre`, so the existing automatic lesson-style selector and songbook text export pick up the change without adding sung syllables. This change does **not** modify recordings already published to Cloudflare R2, course audio, student playback or timed lyrics. To hear the new accompaniment, create and approve a *new* recording when desired.

In addition, the owner can select **Ghanaian guitar highlife · frikyiwa rhythm** for any song from the existing Music Studio production dropdown. This original production direction specifies interlocking highlife guitars, flowing bass, gentle live drums, a clear warm lead voice and a **bright metallic frikyiwa (firikyiwa) castanet**. Ask the AI for a recurring group of **three short syncopated offbeat instrumental taps** perceived as *ko-ko-ko*. These are *percussion hits*, never a vocal chant. Use a human, musical interpretation with rests and leave it behind the singer; do not replace it with conga drums or woodblocks. The three taps are a creative onomatopoeic cue, not a claim of a complete fixed traditional Sikyi timeline transcription.

Preserve German CEFR teaching value while emphasizing a natural adult highlife melody and a developed arrangement, not a nursery rhyme. All lyrics/source dictionary records remain in code. No provider calls, new background jobs, billing logic changes, extra cloud storage or altered Firestore permissions are involved. Google Lyria's adherence to instrument, groove and rhythm instructions is not guaranteed and must be checked by listening before publication.

## Follow lyrics and recording questions — 29 October 2026

A1 Day 14 (`A1-3.6`) uses the exact published `Einsteigen – Wir fahren los.mp3` recording and the shared music-lyrics API. Its new 44-line timing pack is delivered by the student repository's music API. No audio or songwriting draft was changed. Published-song slides derive questions from recording lyrics when they differ from the songbook; Day 14 checks Hannover and Berlin and has a train-travel speaking prompt.

A1–B1 slide DOM interaction tests cover actual React components: highlighted lyric at playback time, seeking, repeat to the intro, follow off/on, question selection, and teacher answer reveal. Missing timings disable Follow and line seeking. The dedicated music UI workflow runs these tests for future changes. DOM tests simulate media time/layout; they do not certify acoustic timing precision.

Validation: 17 targeted tests and production build pass. The broader music suite reports seven unrelated failures, reproduced unchanged on main `a118ca99` (signature/songbook content, guitar prompt expectation, story defaults, attendance fallback expectations, and legacy social soundtrack files).

## Attendance lobby lyric slide

The existing Smart Class Lobby now offers **Song lyrics** in the right-hand stage when the currently playing public lesson recording has complete matching timestamps. **Show lyrics** selects it directly. QR check-in, attendance count and the class countdown stay in their existing positions; hiding teacher controls does not hide this slide.

The card shows previous/current/next lines, highlights the current line, and shows “Listen to the music…” during the intro and instrumental gaps. Playback repeat resets the lyric clock. Stop, track changes, unavailable metadata and class start remove unavailable lyrics rather than showing another recording's text. No new audio is created or uploaded, and metadata uses the existing read-only music API.

Rotation holds while Lyrics is selected; Next/Previous returns to the other cards and respects the teacher's existing pause setting. Selection is tracked by slide ID so adaptive attendance/start-time reordering cannot interrupt Lyrics. Class/session changes reset the selection.

Validation: 73 targeted checks pass, including a real attendance-page React DOM test with mocked network/audio/Firebase boundaries. It starts the discovered Day 13 track, opens Lyrics, hides teacher controls, advances playback through a line and a gap, verifies persistent QR/countdown/count, navigates Next and stops playback. Hook tests also cover adaptive slide order, repeat, missing/incorrect metadata and timer cleanup. Production Vite build passes.
