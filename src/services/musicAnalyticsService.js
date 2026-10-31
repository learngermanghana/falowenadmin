import { auth } from '../firebaseAuth';

const API = String(import.meta.env.VITE_MUSIC_ANALYTICS_API_URL || 'https://us-central1-falowen-examiner-trainer.cloudfunctions.net/api/music-analytics/summary');

export async function loadMusicAnalytics(days = 7, { signal } = {}) {
  const current = auth.currentUser;
  if (!current) throw new Error('Sign in to Falowen Admin first.');
  const token = await current.getIdToken();
  const url = new URL(API);
  url.searchParams.set('days', String([1, 7, 30].includes(Number(days)) ? days : 7));
  const response = await fetch(url, {
    headers: { Authorization: 'Bearer ' + token, Accept: 'application/json' },
    cache: 'no-store',
    signal,
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok || !body.ok) throw new Error(body.error || 'Unable to load music analytics.');
  return body;
}
