import { getReusableSongDraft } from './reusableMusicSongbook.js';
import { getReusableMusicQuestions } from './reusableMusicQuestions.js';
const draft = getReusableSongDraft('A1-14.1');
const exercise = getReusableMusicQuestions('A1-14.1');
// One approved recording shared by slides and attendance; questions come
// from the same saved dictionary used by Music Studio, never workbook keys.
export const A1_DAY22_MUSIC = Object.freeze({
  id: 'a1-day22-mein-kopf-tut-weh', assignmentId: 'A1-14.1', level: 'A1', day: 22,
  title: draft.title, lyrics: draft.lyrics,
  audioKey: 'music/a1/day-22/mein-kopf-tut-weh.mp3', cues: [],
  questions: exercise.questions.filter(q => q.type === 'listening'),
  speaking: exercise.questions.filter(q => q.type === 'speaking').map(q => ({
    ...q, model: 'Zum Beispiel: Mir geht es nicht gut. Mein Kopf tut weh. Ich brauche ein Glas Wasser.',
  })),
});
export function getLessonMusic(assignmentId) {
  return String(assignmentId || '').trim().toUpperCase() === A1_DAY22_MUSIC.assignmentId ? A1_DAY22_MUSIC : null;
}
export function getLessonMusicForDay(level, day) {
  return String(level || '').trim().toUpperCase() === 'A1' && Number(day) === 22 ? A1_DAY22_MUSIC : null;
}
