import fs from "node:fs";
function waitingTrackTitle(fileName) {
  return String(fileName || "")
    .replace(/\.mp3$/i, "")
    .replace(/\(\d+\)\s*$/i, "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function waitingTrackId(fileName) {
  const base = waitingTrackTitle(fileName)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return base || "waiting-track";
}

function publicTrackSrc(fileName) {
  return "/" + encodeURIComponent(fileName)
    .replace(/%2F/gi, "/")
    .replace(/%20/g, "%20");
}

export function buildWaitingMusicPlaylist(publicDir) {
  const publicMp3Files = fs.existsSync(publicDir)
  ? fs.readdirSync(publicDir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && /\.mp3$/i.test(entry.name))
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }))
  : [];

  const generatedPlaylist = publicMp3Files.map((fileName, index) => ({
  id: waitingTrackId(fileName) + "-" + (index + 1),
  title: waitingTrackTitle(fileName),
  src: publicTrackSrc(fileName),
}));

  return generatedPlaylist;
}

export function waitingMusicModule(playlist) {
  return `// Generated from the MP3 files currently in public/.\nexport const waitingMusicPlaylist = Object.freeze(${JSON.stringify(playlist, null, 2)});\nexport const pianoPlaylist = waitingMusicPlaylist;\nexport const pianoPieces = waitingMusicPlaylist.map((track) => [track.title, [], []]);\n`;
}
