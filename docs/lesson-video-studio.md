# Lesson Video Studio

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
