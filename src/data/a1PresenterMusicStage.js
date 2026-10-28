import { getCuratedMusicByAssignment } from './curatedLessonMusic.js';
import { getReusableSongDraft } from './reusableMusicSongbook.js';
import { getReusableMusicQuestions } from './reusableMusicQuestions.js';

// A1 music in Presenter Mode follows Common mistakes, not the graded workbook.
// Only explicitly published/approved songs qualify. Future A1 days reuse this
// stage automatically after their R2 recording has been approved in the catalog.
export function getA1PresenterMusicStage(assignmentId) {
  const recording = getCuratedMusicByAssignment(assignmentId);
  if (!recording || recording.level !== 'A1' || recording.assignmentKey === 'A1-14.1') return null;
  const song = getReusableSongDraft(assignmentId);
  const bank = getReusableMusicQuestions(assignmentId);
  if (!song?.lyrics || !Array.isArray(bank?.questions) || bank.questions.length < 3) return null;
  if (!bank.questions.some(question => question.type === 'listening') ||
      !bank.questions.some(question => question.type === 'speaking')) return null;

  return {
    id: 'music-lesson',
    type: 'published-music',
    kicker: 'Falowen Music · Hören',
    title: `${recording.title} · Hören · Verstehen · Sprechen`,
    items: [{}],
  };
}
