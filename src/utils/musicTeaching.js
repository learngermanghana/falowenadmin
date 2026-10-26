// Safe shared helpers for teacher-led music lessons.
export function musicTimestamp(seconds = 0) {
  const value = Math.max(0, Math.floor(Number(seconds) || 0));
  return `${String(Math.floor(value / 60)).padStart(2, "0")}:${String(value % 60).padStart(2, "0")}`;
}

export function musicMomentUrl(youtubeId, seconds = 0) {
  if (!/^[A-Za-z0-9_-]{11}$/.test(String(youtubeId || ""))) return "";
  const value = Math.max(0, Math.floor(Number(seconds) || 0));
  return `https://www.youtube.com/watch?v=${youtubeId}&t=${value}s`;
}
