import { auth } from '../firebaseAuth';

const API = String(import.meta.env.VITE_MUSIC_PRACTICE_API_URL ||
  'https://us-central1-falowen-examiner-trainer.cloudfunctions.net/api/music-practice/summary');

export async function loadStudentMusicPractice(days = 7, { signal } = {}) {
  const user = auth.currentUser;
  if (!user) throw new Error('Sign in to Falowen Admin first.');
  const token = await user.getIdToken();
  const url = new URL(API);
  url.searchParams.set('days', String([1, 7, 30].includes(Number(days)) ? Number(days) : 7));
  const response = await fetch(url, {
    headers: { Authorization: 'Bearer ' + token, Accept: 'application/json' },
    cache: 'no-store', signal,
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok || !result.ok) {
    throw new Error(result.error || 'Unable to load student music practice. Check that the Firebase API has been deployed.');
  }
  return result;
}
