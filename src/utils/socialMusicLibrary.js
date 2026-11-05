// Public Falowen music. The Cloudflare catalog is loaded only on request;
// browsers never access R2 credentials, bucket listing, or the Cloudflare dashboard.
export const SOCIAL_MUSIC_TRACKS = Object.freeze([
  { id: "none", label: "No background music", src: "" },
  { id: "gemeinsam", label: "Gemeinsam schaffen wir das", src: "/Gemeinsam%20schaffen%20wir%20das.mp3" },
  { id: "willkommen", label: "Willkommen bei Falowen", src: "/Willkommen%20bei%20Falowen(1).mp3" },
]);

const PUBLIC_MUSIC_ORIGIN = "https://www.falowen.app";
export function validCloudflareSocialTrack(row) {
  if (!row || !/^[a-zA-Z0-9_-]{1,245}$/.test(String(row.id || ""))) return null;
  if (!/^music\/(a1|a2|b1|b2|c1|c2)\/day-(0[1-9]|1[0-9]|2[0-8])\/[^/]{1,150}\.mp3$/i.test(String(row.objectKey || ""))) return null;
  const src = PUBLIC_MUSIC_ORIGIN + "/api/music?track=" + row.id + "&download=1";
  if (row.audioUrl !== PUBLIC_MUSIC_ORIGIN + "/api/music?track=" + row.id && row.src !== src) return null;
  if (!String(row.title || row.label || "").trim()) return null;
  return { id: row.id, label: row.label || (String(row.level || "").toUpperCase() + " · Day " + row.day + " · " + String(row.title).slice(0, 120)),
    src, objectKey: row.objectKey };
}

export async function loadSocialCloudflareTracks({ signal } = {}) {
  const response = await fetch("/api/attendance-music-library", { cache: "no-cache", signal });
  if (!response.ok) throw new Error("Falowen music library is unavailable (" + response.status + ").");
  const data = await response.json();
  if (data?.ok === false || !Array.isArray(data?.tracks)) throw new Error("Invalid Falowen music catalog.");
  const unique = new Map();
  for (const row of data.tracks) {
    const track = validCloudflareSocialTrack(row);
    if (track) unique.set(track.id, track);
  }
  return [...unique.values()].sort((a,b)=>a.label.localeCompare(b.label,undefined,{numeric:true}));
}
export function socialMusicRange(selection = {}, duration = 0) {
  const length = Number(duration);
  if (!(length > 0)) throw new Error("The chosen song has no playable duration.");
  const start = Number(selection.start) || 0;
  const end = selection.end === "" || selection.end == null || Number(selection.end) === 0 ? length : Number(selection.end);
  if (!Number.isFinite(start) || !Number.isFinite(end) || start < 0 || start >= length || end > length + .05 || end - start < .25)
    throw new Error("Choose a song loop whose end is at least 0.25 seconds after the start and within the recording.");
  return { start, end: Math.min(end,length) };
}
export function selectedSocialTrack(selection, cloudflareTracks = []) {
  const id = typeof selection === "string" ? selection : selection?.id;
  return SOCIAL_MUSIC_TRACKS.find(track => track.id === id)
    || cloudflareTracks.find(track => track.id === id)
    || validCloudflareSocialTrack(selection?.track);
}

// This helper is shared by Upcoming Classes, Challenges and Vocabulary.
// A chosen start/end region loops in the finished video. Audio is fetched once
// per export, decoded locally, and starts only after MediaRecorder starts.
export async function addSocialMusic(context, destination, trackId, seconds, volume = 0.22, options = {}) {
  const track = selectedSocialTrack(trackId, options.tracks || []);
  if (!track?.src) {
    if (trackId !== "none" && trackId?.id !== "none") throw new Error("Choose an available Falowen song.");
    return null;
  }
  let response;
  try { response = await fetch(track.src); }
  catch { throw new Error("Cannot reach Falowen song. Check your connection and retry."); }
  if (!response.ok) throw new Error("Cannot load Falowen music: " + track.label);
  let buffer;
  try { buffer = await context.decodeAudioData(await response.arrayBuffer()); }
  catch { throw new Error("Cannot decode Falowen music: " + track.label + ". The music API must permit browser audio downloads."); }
  const range = socialMusicRange(options.selection || {}, buffer.duration || seconds);
  const source = context.createBufferSource();
  const gain = context.createGain();
  source.buffer = buffer;
  source.loop = true;
  source.loopStart = range.start;
  source.loopEnd = range.end;
  source.connect(gain);
  gain.connect(destination);
  let started = false;
  return { start() {
    if (started) return;
    started = true;
    const start = context.currentTime;
    gain.gain.setValueAtTime(volume, start);
    gain.gain.setValueAtTime(volume, start + Math.max(0, seconds - .35));
    gain.gain.linearRampToValueAtTime(0.0001, start + seconds);
    if (range.start > 0) source.start(start, range.start); else source.start(start);
    source.stop(start + seconds + .05);
  } };
}
