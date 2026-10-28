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
