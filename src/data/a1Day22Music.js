import { A1_DAY22_MUSIC as song } from './lessonMusic.js';
export const A1_DAY22_MUSIC = Object.freeze({ ...song, objectKey: song.audioKey });
export function getLessonSong({ assignmentId, level, day } = {}) {
  if (assignmentId) return String(assignmentId).toUpperCase() === song.assignmentId ? A1_DAY22_MUSIC : null;
  return String(level).toUpperCase() === 'A1' && Number(day) === 22 ? A1_DAY22_MUSIC : null;
}
