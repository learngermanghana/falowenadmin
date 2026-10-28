import { auth } from '../firebaseAuth.js';
// Uses the Vercel API where R2 is configured, not the older Cloud Run signer.
const MUSIC_API = 'https://www.falowen.app/api/course-media/music/audio-url';
export async function prepareLessonSong(song, { signal } = {}) {
  const user = auth.currentUser;
  if (!user) throw new Error('Bitte zuerst in Falowen Admin anmelden.');
  const response = await fetch(`${MUSIC_API}?track=${encodeURIComponent(song.id)}`, {
    headers: { Authorization: `Bearer ${await user.getIdToken()}` }, cache: 'no-store', signal,
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.url) throw new Error(data.error || 'Das Lied konnte nicht geladen werden. Bitte erneut versuchen.');
  const url = new URL(data.url);
  if (url.protocol !== 'https:' || url.username || url.password) throw new Error('Ungültiger Audiolink.');
  return data.url;
}
