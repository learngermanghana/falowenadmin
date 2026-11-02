import { getCuratedMusicByAssignment } from './curatedLessonMusic.js';
import { getReusableSongDraft } from './reusableMusicSongbook.js';
import { getReusableMusicQuestions } from './reusableMusicQuestions.js';

// The canonical slide day supplies discovery context, never an invented MP3.
// Existing curated recording identities retain precedence over discovery.
export function getA1PresenterRecording(assignmentId, courseDay) {
  const curated = getCuratedMusicByAssignment(assignmentId);
  if (curated) return curated.level === 'A1' ? curated : null;
  const key = String(assignmentId || '').trim().toUpperCase();
  const day = Number(courseDay);
  const song = getReusableSongDraft(key);
  if (!key.startsWith('A1-') || key === 'A1-TUTORIAL' || !song ||
      !Number.isInteger(day) || day < 1 || day > 24) return null;
  return { assignmentKey:key, level:'A1', day, title:song.title,
    status:'discovery', discover:true };
}

// Every real A1 lesson has a music stage in the shared presenter. Discovery
// verifies availability on entry; a draft alone never enables audio playback.
export function getA1PresenterMusicStage(assignmentId, courseDay) {
  const recording = getA1PresenterRecording(assignmentId, courseDay);
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
