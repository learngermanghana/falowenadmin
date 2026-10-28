# Falowen attendance day music (Cloudflare R2)

The check-in display now chooses a waiting-room song from the **course level and
curriculum day** already attached to the class session. It does not scan/list
R2, store audio in Firebase, or add a scheduled job.

## Upload convention

Use a **dedicated public-delivery R2 music bucket** with an HTTPS custom domain.
Do **not** make the private `falowen-course-audio` Hören bucket publicly
readable to support waiting-room songs.

Examples:

| Attendance session | Object key in public music bucket |
| --- | --- |
| A1 Day 1 | `a1/day-01/zoom-01.mp3` |
| A1 Day 2 | `a1/day-02/zoom-01.mp3` |
| A2 Day 18 | `a2/day-18/zoom-01.mp3` |
| B1 Day 26 | `b1/day-26/zoom-01.mp3` |

Spelling is `day`, **not `daz`**. Include the `.mp3` extension and zero-pad
single-digit days. A single track can be reused for more than one day by
uploading it under each matching key. There is no need to edit Admin code.

## One-time deployment configuration

1. Give the dedicated music bucket a public HTTPS delivery domain (ideally a
   custom Cloudflare domain). Keep the existing course-audio bucket private.
2. Set the **Falowen Admin Vercel frontend environment variable**
   `VITE_WAITING_ROOM_R2_PUBLIC_BASE_URL` to the public domain,
   e.g. `https://music.example.org` (this is an illustration, not a live URL).
   Redeploy Admin so Vite can include the variable.
3. Configure R2 bucket CORS to allow `GET` and `HEAD` from
   `https://admin.falowen.app` (and any preview origins actually used). The
   waiting-room player uses a Web Audio gain/compressor graph and needs the
   cross-origin media response to permit access. The media object's
   `Content-Type` should be `audio/mpeg`.
4. Upload `a1/day-01/zoom-01.mp3`; open the A1 Day 1 check-in display, tap
   **Start waiting music** and verify the current track title.

Only the defined public *music* delivery domain is exposed in the frontend; no
R2 credentials, account ID, private endpoints, signing keys or Cloudflare
dashboard links are embedded. If this env var is absent or the class day cannot
be resolved, the existing bundled playlist plays instead. If an object is
missing or fails during playback, the player moves on to that playlist.
When the day's track is available, it repeats until the teacher starts class or
manually skips it. Browser autoplay policies still require a user tap.

## Music generation

The owner-only Music Studio now defaults to a voice-forward mix description and
a full song of about 2.5 minutes with an explicit final 20-second outro and fade.
It offers approximate 2, 2.5 and 3-minute targets, plus a quieter instrumental
mix. Preview is still fixed at 30 seconds. These are **prompt instructions**
to Lyria 3.5; it generates a single flattened MP3, so Falowen cannot separately
remix instrumental and vocal stems or guarantee the end won't be truncated.
The studio checks custom lyric length *before* a paid call to reduce avoidable
cut-offs. Listen to the exported file before uploading it to the waiting-room
bucket. No file is sent to R2 automatically and no music remains stored in Admin.

For classroom audio, set the display volume low enough that the teacher can
speak comfortably over it. Starting the class still fades and stops the music.
