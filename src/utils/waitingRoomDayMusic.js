// Deterministic, read-only waiting-room music mapping. No Firestore reads,
// Cloudflare listing requests, storage secrets or background checks.
const LEVELS = new Set(["A1", "A2", "B1", "B2", "C1", "C2"]);
export function waitingRoomMusicObjectKey(level, day) {
  const normalizedLevel = String(level || "").trim().toUpperCase();
  const numericDay = Number(day);
  if (!LEVELS.has(normalizedLevel) || !Number.isInteger(numericDay) || numericDay < 1 || numericDay > 99) return "";
  return `${normalizedLevel.toLowerCase()}/day-${String(numericDay).padStart(2, "0")}/zoom-01.mp3`;
}

export function waitingRoomMusicUrl({ level, day, publicBaseUrl } = {}) {
  const key = waitingRoomMusicObjectKey(level, day);
  if (!key || !publicBaseUrl) return "";
  try {
    const base = new URL(String(publicBaseUrl).trim());
    // Never try to use the private S3 endpoint or the Cloudflare dashboard as
    // a public music host. Use a separate public music bucket/custom domain.
    if (base.protocol !== "https:" || base.username || base.password || base.search || base.hash
      || /(?:^|\.)r2\.cloudflarestorage\.com$|(?:^|\.)dash\.cloudflare\.com$/.test(base.hostname)) return "";
    return `${base.href.replace(/\/+$/, "")}/${key}`;
  } catch {
    return "";
  }
}

export function waitingRoomMusicPlaylistForSession({
  level, day, publicBaseUrl, fallbackPlaylist = [],
} = {}) {
  const fallback = Array.isArray(fallbackPlaylist) ? fallbackPlaylist : [];
  const src = waitingRoomMusicUrl({ level, day, publicBaseUrl });
  if (!src) return fallback;
  const key = waitingRoomMusicObjectKey(level, day);
  return [
    { id: `r2-${level.toLowerCase()}-day-${day}`, title: `${String(level).toUpperCase()} · Day ${day} Zoom music`, src, repeat: true, objectKey: key },
    // These bundled tracks play only if today's Cloudflare audio is unavailable
    // or if the teacher explicitly skips the day track.
    ...fallback,
  ];
}

/**
 * Resolve an approved level/day track from the public Falowen Music catalog.
 * The catalog is public static JSON, not a Firebase query or R2 bucket listing.
 * A missing/unpublished song returns null so the existing playlist still works.
 */
export function waitingRoomPublishedCatalogTrack(catalog, { level, day } = {}) {
  const key = waitingRoomMusicObjectKey(level, day);
  if (!key) return null;
  const rows = Array.isArray(catalog?.tracks) ? catalog.tracks : [];
  const normalizedLevel = String(level).toUpperCase();
  const row = rows.find(item => item && item.attendance === true
    && String(item.level || "").toUpperCase() === normalizedLevel
    && Number(item.day) === Number(day) && item.id && item.title);
  if (!row) return null;
  try {
    const url = new URL(String(row.audioUrl || ""));
    if (url.protocol !== "https:" || url.username || url.password
      || /(?:^|\\.)r2\\.cloudflarestorage\\.com$|(?:^|\\.)dash\\.cloudflare\\.com$/i.test(url.hostname)) return null;
    return { id: `published-${String(row.id).slice(0, 80)}`,
      title: String(row.title).slice(0, 120), src: url.href,
      repeat: true, objectKey: key };
  } catch { return null; }
}


// R2 songs uploaded to music/<level>/day-XX are published through Falowen
// Music's existing on-demand discovery API. Do not construct filenames from
// the Admin songbook, which might not match the actual MP3 or timed lyrics.
const EXPECTED_ATTENDANCE_TITLES = Object.freeze({
  'A1-3.5': 'zwei tees vier euro',
  'A2-7.19': 'lieber online oder im laden',
  'A2-7.20': 'die jacke ist zu klein',
});
function normalizedMusicTitle(value) {
  return String(value || '').normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim().replace(/\s+/g, ' ');
}
export function waitingRoomDiscoveredMusicTrack(feed, { level, day, assignmentKey } = {}) {
  const l = String(level || '').trim().toUpperCase();
  const n = Number(day);
  if (!LEVELS.has(l) || !Number.isInteger(n) || n < 1 || n > 28) return null;
  const folder = `music/${l.toLowerCase()}/day-${String(n).padStart(2, '0')}/`;
  const prefix = `r2-${l.toLowerCase()}-day-${String(n).padStart(2, '0')}-`;
  const tracks = (Array.isArray(feed?.tracks) ? feed.tracks : []).filter(row =>
    row?.autoDiscovered === true && row.coursebook === true
    && String(row.level || '').toUpperCase() === l && Number(row.day) === n
    && String(row.objectKey || '').startsWith(folder)
    && /^[a-zA-Z0-9_ ,.()äöüÄÖÜß-]+\.mp3$/i.test(String(row.objectKey || '').slice(folder.length))
    && String(row.id || '').startsWith(prefix)
    && /^[a-zA-Z0-9_-]{1,245}$/.test(String(row.id || ''))
    && row.audioUrl === `https://www.falowen.app/api/music?track=${row.id}`
    && typeof row.title === 'string' && row.title.trim()
  );
  if (!tracks.length) return null;
  let matches = tracks;
  const preferred = EXPECTED_ATTENDANCE_TITLES[String(assignmentKey || '').trim().toUpperCase()];
  if (preferred) {
    const preferredMatches = tracks.filter(row =>
      normalizedMusicTitle(row.title).includes(preferred)
      || normalizedMusicTitle(row.objectKey.split('/').pop()).includes(preferred));
    if (preferredMatches.length === 1) matches = preferredMatches;
    // Day13's pinned song was previously invented: never fall back to
    // a different single MP3 in that folder just because it happens to exist.
    else if (preferredMatches.length > 1 || String(assignmentKey || '').trim().toUpperCase() === 'A1-3.5') return null;
  }
  // More than one same-day recording with no unique known match is ambiguous.
  if (matches.length !== 1) return null;
  const track = matches[0];
  return { id: track.id, title: track.title.slice(0, 120), src: track.audioUrl,
    repeat: true, objectKey: track.objectKey, nativePlayback: true };
}
