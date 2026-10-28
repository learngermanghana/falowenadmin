// Consistent human-readable names for downloaded MP3 and lyric files.
export function falowenMusicSlug(input) {
  return String(input || "")
    .replace(/ä/g, "ae").replace(/Ä/g, "Ae")
    .replace(/ö/g, "oe").replace(/Ö/g, "Oe")
    .replace(/ü/g, "ue").replace(/Ü/g, "Ue")
    .replace(/ß/g, "ss")
    .normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase().replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "").slice(0, 74).replace(/-+$/g, "");
}
export function falowenMusicFileBase(entry, songTitle) {
  if (!entry?.level) return "falowen-custom-music";
  const level = String(entry.level || "a1").toLowerCase().replace(/[^a-z0-9]/g, "");
  const day = Number.isInteger(Number(entry.day)) && Number(entry.day) >= 0
    ? String(Number(entry.day)).padStart(2, "0") : "00";
  const title = falowenMusicSlug(songTitle || entry.germanTitle || entry.title) || "lesson-song";
  return `falowen-${level}-day-${day}-${title}`;
}
export function falowenMusicFileName(entry, songTitle, extension = "mp3") {
  const ext = String(extension).replace(/[^a-z0-9]/gi, "").toLowerCase() || "mp3";
  return `${falowenMusicFileBase(entry, songTitle)}.${ext}`;
}
