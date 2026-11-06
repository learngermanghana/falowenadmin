# Lesson Video Studio

## New default: Dictionary to video (quarterly curriculum)

The owner-only route now opens Dictionary Studio by default. The previous PowerPoint/image-import editor remains available under Legacy PowerPoint studio for compatibility with older projects.

- Ten editable starter German topic dictionaries (A1–C1), each with introduction, objective, vocabulary, grammar, German/English examples, common mistakes, practice and recap.
- A reusable Canvas template builds six scenes: introduction, vocabulary, grammar, examples, mistakes and practice.
- Midnight, Classroom and Forest themes; 16:9 and 9:16 framing; scene-by-scene editable narration. These drafts come from teacher-authored content: no AI language-generation call is made.
- The existing owner-scoped Hören TTS accepts scripts only when generation is explicitly requested. Its WAV output is attached to the video and scenes align to actual narration length. Existing caching, daily budget and 429 safeguards apply.
- Existing browser-based MediaRecorder + Canvas exports MP4 where supported or genuine WebM without a paid server-side renderer. Video recording takes real time in an active tab.
- Edits are saved in this browser's localStorage. Mark reviewed records the current quarter, and import/export provides a versioned JSON master backup. **There is not yet a centrally published multi-device content library or automatic quarterly update.**

Follow-up before multi-editor rollout: owner-scoped cloud publishing, revision history and teacher approval. This implementation intentionally avoids new Firestore reads, background jobs or subscription rendering costs.

---
Owner-only Admin route: **/lesson-video-studio** (protected by the existing
`VITE_HOEREN_STUDIO_OWNER_UID` / Admin-only route gate).

## Workflow

1. Import a PowerPoint `.pptx` presentation, or ordered PNG/JPG/WebP images.
2. Prepare an **editable, free script outline** from text that is embedded
   in the slides, paste a full transcript, or import a `.txt` narration.
   The script outline is deliberately not described as an AI-generated
   script: slide images do not contain text that can be reliably extracted.
3. Choose **Generate audio from text** to narrate the per-slide scripts or
   the full transcript using the existing authenticated Hören Studio TTS
   endpoint. The default is Flash-Lite; Flash is available for higher
   fidelity and higher provider cost. Alternatively attach MP3/WAV/M4A or
   record a real microphone voice. Do not need a second paid audio account.
   Generated audio is attached to the current project automatically.
4. **Per-slide generation** positions slide starts using the actual length
   of each synthesized WAV scene. **Full-transcript generation** leaves slide
   positions to the manual marker workflow. Play the recording and click a
   slide thumbnail, then **Mark slide here** at its narration position.
   Use **Space slide times evenly** for a quick first draft.
5. Draw rectangles on the current slide during narration. This captures a
   highlight start time and a default three-second end; **Set end at
   playhead** and numeric fields allow frame-appropriate edits.
6. Save an editable `.json` project containing the slides, narration,
   scripts, slide timestamps and highlight regions, or export the complete
   rendered video.

## Export and cost

Browser `MediaRecorder` + Canvas and Web Audio mix narration and highlights
locally. Video export itself runs in **real time** (a five-minute video takes
around five minutes to record in the active browser tab) and does not invoke
a server render worker or upload the video. **MP4/AAC** is chosen only where the current browser advertises
a compatible audio/video encoder; otherwise a real WebM file is produced.
No mislabeled WebM/MP4 files. Output choices are 16:9 YouTube teaching
video or 9:16 TikTok/Reels, standard HD or Full HD. Full presentation
is letterboxed rather than cropped.

Browser speech synthesis remains *preview only*. The new **Generate audio
from text** action is different: it uses `makeSpeechClip` from the
existing Hören Studio Firebase endpoint and turns the returned WAV files
into a real, downloadable/attachable narration track. It can be reused
in the canvas MP4/WebM export. This owner-only endpoint shares Hören's
existing **72 voice calls/day** application safety limit and Google
project/model provider quotas. Speech creation may cost money. The
backend currently pins voice language to **de-DE**; English/German
code-switching may need teacher review or a separately recorded voice.
There is no new server API, quota collection or storage bucket.

Before any model call, the UI builds 320-character-safe speech turns,
at most 520 characters per voice scene, and caps each video at 36 scenes
and 12,000 text characters. It previews the number of missing requests;
already generated clips are read from the same IndexedDB voice cache
used by Hören Studio. Edits reuse unaffected clips. Pauses written as
`[PAUSE 2]` are inserted locally into the audio. Only clicking the
Generate button incurs new requests; the slide import, script drafting,
marking, audio assembly and export do not.

The built-in microphone recording option needs microphone permission
and HTTPS. Uploaded and generated media stay in the browser until the
owner explicitly downloads a video or editable project.

## PowerPoint fidelity

The lightweight PPTX reader extracts slide-associated **full-frame images**
directly from the ZIP archive; it is particularly suited to image-built
slide decks (including the referenced grammar deck). No Microsoft Office
account is required. Slides containing editable shapes, text, charts,
SmartArt, transitions or animation cannot be faithfully reproduced by
this lightweight renderer: a basic text card or dominant embedded picture
is substituted and a user-visible warning is shown. For pixel-perfect
results, export each slide as PNG in PowerPoint and use image import.

ZIP bounds, slide count (max 160), file size (70 MB), project file size
(130 MB), and audio size (80 MB) have limits. Extracted slide images and
audio remain in browser memory; save an editable project before leaving.
No background polling, new Firestore collection or automatic generation
is introduced; only explicit Hören TTS requests reach the existing backend.

## Follow-up opportunities

Optional future enhancements (not part of this version): AI script
generation with explicit spending caps; per-sentence bilingual voice
switching (English narration / German examples); subtitle alignment;
upload completed videos to R2; offline fast transcoding for large decks.


## Recovering from a Google 429 rate limit

A 429 returned by Google's Gemini Interactions TTS endpoint is **not** the
same as Falowen's 72-scenes/day owner safety budget. It may mean that the
selected speech model has reached its own RPM/RPD/TPS allocation, a provider
spending cap, or a provider-side capacity restriction. The app cannot bypass
that. Check the Google AI Studio Rate Limits, Usage and Billing pages for
the project that owns the API key. Do not repeatedly retry a blocked model.

Successful voice clips are cached in browser IndexedDB as before. When a
narration has been partially produced, the editor now offers **Download
completed narration (partial WAV)**, created locally from the contiguous
saved voice clips. It is intentionally labelled partial, not passed off as
the full synchronized narration. The user can download it immediately, or
later assemble the full track from saved voice clips when Google's quota
has been resolved. No calls are made during partial WAV download.

After a 429, this page **stops sending new speech requests** until the
teacher clicks an explicit acknowledgement that Google's quota or billing
has been checked. This state is scoped to the open page; it is not a
provider-quota-reset mechanism. A refresh of Falowen's own allowance only
updates Falowen's budget, not Google's quota. Existing MP3/WAV upload and
microphone recording remain available without Gemini.
