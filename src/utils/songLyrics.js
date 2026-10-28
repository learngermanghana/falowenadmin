export function lyricLines(text = '') {
  return String(text).replace(/\\n/g, '\n').split(/\r?\n/).map(s => s.trim())
    .filter(s => s && !/^\[.*\]$/.test(s));
}
export function validateLyricCues(cues, lines) {
  if (!Array.isArray(cues) || cues.length > lines.length) return [];
  let previous = -1;
  const valid = [];
  for (let i = 0; i < cues.length; i++) {
    const cue = cues[i];
    if (cue?.text !== lines[i] || typeof cue.start !== 'number' || !Number.isFinite(cue.start) || cue.start < 0 || cue.start <= previous) return [];
    if (cue.end !== undefined && (!Number.isFinite(cue.end) || cue.end <= cue.start)) return [];
    valid.push({ start: cue.start, text: cue.text, ...(cue.end !== undefined ? {end:cue.end} : {}) }); previous = cue.start;
  }
  return valid;
}
export function activeLyricIndex(cues, time) {
  if (!Number.isFinite(time)) return -1;
  for (let i = cues.length - 1; i >= 0; i--) if (time >= cues[i].start) return cues[i].end === undefined || time < cues[i].end ? i : -1;
  return -1;
}
export function readSongCues(song, storage) {
  const lines = lyricLines(song.lyrics);
  try {
    const source = storage || globalThis.localStorage;
    const saved = JSON.parse(source?.getItem(`falowen-song-timing:${song.objectKey}`) || source?.getItem(`falowen-song-cues:${song.id}`) || 'null');
    const checked = saved?.objectKey === song.objectKey ? validateLyricCues(saved.cues, lines) : [];
    return checked.length ? checked : validateLyricCues(song.cues, lines);
  } catch { return validateLyricCues(song.cues, lines); }
}
export function songTime(seconds = 0) {
  return `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;
}
