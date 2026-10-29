// Deliberately selected classroom music days. Music is NOT a default for
// every course day. Public playback is restricted to teacher-approved keys.
// Future days are planned only: never show an unuploaded MP3 as playable.
export const CURATED_MUSIC_DAYS = Object.freeze([
  { assignmentKey:'A1-2', level:'A1', day:4, title:'Welche Nummer hast du?', introQuestion:'Wie heißen die Personen? Welche Nummer hörst du?', status:'published', trackId:'a1-day-04-numbers', audioUrl:'https://www.falowen.app/api/music?track=a1-day-04-numbers', objectKey:'music/a1/day-04/welche-nummer-hast-du.mp3' },
  // Day 13 is published, but the actual MP3 filename comes from the on-demand R2 discovery feed. Never guess the object key or track ID.
  { assignmentKey:'A1-3.5', level:'A1', day:13, title:'Zwei Tees, vier Euro', introQuestion:'Wie viele Tees stehen auf dem Tisch, und wie viel bezahlen sie zusammen?', status:'published', discover:true },
  { assignmentKey:'A1-14.1', level:'A1', day:22, title:'Mein Kopf tut weh', status:'published', trackId:'a1-day-22-health', audioUrl:'https://www.falowen.app/api/music?track=a1-day-22-health', objectKey:'music/a1/day-22/mein-kopf-tut-weh.mp3' },
  { assignmentKey:'A2-7.18', level:'A2', day:18, title:'Die Karte funktioniert nicht', status:'published', trackId:'a2-day-18-bank', audioUrl:'https://www.falowen.app/api/music?track=a2-day-18-bank', objectKey:'music/a2/day-18/die-karte-funktioniert-nicht.mp3' },
  { assignmentKey:'A1-2.3', level:'A1', day:6, title:'Sonntag mit meiner Familie', status:'planned' },
  { assignmentKey:'A1-13', level:'A1', day:21, title:'Heute regnet es', status:'planned' },
  { assignmentKey:'A2-6.17', level:'A2', day:17, title:'Was hilft gegen Husten?', status:'planned' },
  { assignmentKey:'A2-10.26', level:'A2', day:26, title:'Heute bin ich aufgeregt', status:'planned' },
  { assignmentKey:'B1-8.24', level:'B1', day:24, title:'Weniger kaufen, mehr erleben', status:'planned' },
]);
export function getCuratedMusicByAssignment(assignmentKey) {
  const key=String(assignmentKey || '').trim().toUpperCase();
  return CURATED_MUSIC_DAYS.find(item=>item.assignmentKey.toUpperCase()===key && item.status==='published') || null;
}
export function getCuratedMusicForSession({level,day,assignmentKey}={}) {
  const fromAssignment=getCuratedMusicByAssignment(assignmentKey);
  if(fromAssignment && (!level || fromAssignment.level===String(level).toUpperCase())
    && (!day || fromAssignment.day===Number(day))) return fromAssignment;
  const l=String(level||'').trim().toUpperCase(), d=Number(day);
  return CURATED_MUSIC_DAYS.find(item=>item.status==='published' && item.level===l && item.day===d)||null;
}
