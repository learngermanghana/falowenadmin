# Lesson Video Studio

Owner-only Admin route: **/lesson-video-studio** (protected by the existing
`VITE_HOEREN_STUDIO_OWNER_UID` / Admin-only route gate).

## Workflow

1. Import a PowerPoint `.pptx` presentation, or ordered PNG/JPG/WebP images.
2. Prepare an **editable, free script outline** from text that is embedded
   in the slides, paste a full transcript, or import a `.txt` narration.
   The script outline is deliberately not described as an AI-generated
   script: slide images do not contain text that can be reliably extracted.
3. Attach an audio file, or record real microphone narration directly in
   the browser. Audio is kept in the tab, not uploaded to Falowen.
4. Play the audio and click a slide thumbnail, then **Mark slide here** at
   the narration position where it should enter. Use **Space slide times
   evenly** for a quick first draft.
5. Draw rectangles on the current slide during narration. This captures a
   highlight start time and a default three-second end; **Set end at
   playhead** and numeric fields allow frame-appropriate edits.
6. Save an editable `.json` project containing the slides, narration,
   scripts, slide timestamps and highlight regions, or export the complete
   rendered video.

## Export and cost

Browser `MediaRecorder` + Canvas and Web Audio mix narration and highlights
locally. The export runs in **real time** (a five-minute video takes around
five minutes to record in the active browser tab) and does not invoke
a Firebase function, transcription API, render worker, AI model or storage
bucket. **MP4/AAC** is chosen only where the current browser advertises
a compatible audio/video encoder; otherwise a real WebM file is produced.
No mislabeled WebM/MP4 files. Output choices are 16:9 YouTube teaching
video or 9:16 TikTok/Reels, standard HD or Full HD. Full presentation
is letterboxed rather than cropped.

Browser speech synthesis is *preview only*. Browser TTS playback cannot
currently be captured as the editable/exportable narration soundtrack.
For a natural-sounding voice in exports, upload a recorded speaker or
an externally synthesized audio file. The built-in microphone recording
option needs microphone permission and HTTPS.

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
No background API, Firestore, storage or inference usage is introduced.

## Follow-up opportunities

Optional future enhancements (not part of this version): authenticated
AI script generation on explicit button click with spending caps; multi-track
German/English studio-grade TTS provider; subtitle alignment; upload completed
videos to R2; offline fast transcoding for large decks.
