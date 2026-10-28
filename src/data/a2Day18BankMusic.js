// A2 Day 18 · Teacher-approved Falowen MUSIC lesson, not Goethe Hören.
// The old Amir/YouTube lyrics are not the new Cloudflare recording; use the
// original "Die Karte funktioniert nicht" draft and shared question dictionary.
import { getReusableSongDraft } from './reusableMusicSongbook.js';
import { getReusableMusicQuestions } from './reusableMusicQuestions.js';
import { getCuratedMusicByAssignment } from './curatedLessonMusic.js';

const assignmentKey = 'A2-7.18';
const draft = getReusableSongDraft(assignmentKey);
const questions = getReusableMusicQuestions(assignmentKey);
const approved = getCuratedMusicByAssignment(assignmentKey);

export const A2_DAY18_BANK_MUSIC = Object.freeze({
  level: 'A2',
  day: 18,
  assignmentKey,
  mediaType: 'music',
  title: draft.title,
  audioUrl: approved.audioUrl,
  trackId: approved.trackId,
  introQuestion: 'Warum funktioniert die Karte nicht, und wie hilft die Bank?',
  studentPurpose: 'Höre die Falowen-Musikgeschichte. Lies den Liedtext und beantworte zwei Hörfragen und eine Sprechfrage.',
  teacherPurpose: 'Slide 2: erst Musik hören, dann optional Liedtext und drei wiederverwendbare Fragen. Slide 3: separates privates Banktelefonat mit fünf Richtig/Falsch-Fragen.',
  nextStep: 'Weiter zur eigenständigen Hören-Aufgabe: Banktelefonat mit Frau Weber. Das Musiklied ist unbewertet.',
  lyrics: draft.lyrics,
  questions: questions.questions,
  // No YouTube video, obsolete Amir lyrics, fictional timestamps or alternate
  // answer key; all quiz content uses the saved A2-7.18 Falowen songbook.
});
