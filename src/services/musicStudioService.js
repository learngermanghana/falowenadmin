import { auth } from '../firebaseAuth';
const BASE = (import.meta.env.VITE_MUSIC_STUDIO_API_URL || 'https://us-central1-falowen-examiner-trainer.cloudfunctions.net/api/music-studio').replace(/\/+$/, '');
export async function musicRequest(payload) {
  if (!auth.currentUser) throw new Error('Sign in to Falowen Admin first.');
  const response = await fetch(BASE, {
    method: payload ? 'POST' : 'GET', cache: 'no-store',
    headers: { Authorization: `Bearer ${await auth.currentUser.getIdToken()}`, 'Content-Type': 'application/json' },
    ...(payload ? { body: JSON.stringify(payload) } : {}),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.ok) throw new Error(data.error || 'Music Studio is unavailable. No automatic retry was made.');
  return data;
}
export function musicBlob(data) {
  const bytes = Uint8Array.from(atob(data.audio), char => char.charCodeAt(0));
  return new Blob([bytes], { type: 'audio/mpeg' });
}

async function lyricsRequest(assignmentKey, lyrics) {
  if (!auth.currentUser) throw new Error('Sign in to Falowen Admin first.');
  const isSave = typeof lyrics === 'string';
  const endpoint = BASE + '/lyrics' + (!isSave ? '?assignmentKey=' + encodeURIComponent(assignmentKey) : '');
  const response = await fetch(endpoint, {
    method: isSave ? 'POST' : 'GET', cache: 'no-store',
    headers: {
      Authorization: 'Bearer ' + await auth.currentUser.getIdToken(),
      'Content-Type': 'application/json',
    },
    ...(isSave ? {body:JSON.stringify({assignmentKey,lyrics})} : {}),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.ok) throw new Error(data.error || 'Could not load or save lyrics.');
  return data;
}
export const loadSavedMusicLyrics = assignmentKey => lyricsRequest(assignmentKey);
export const overwriteSavedMusicLyrics = (assignmentKey, lyrics) => lyricsRequest(assignmentKey, lyrics);
