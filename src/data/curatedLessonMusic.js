// Deliberately selected classroom music days. Music is NOT a default for
// every course day. Public playback is restricted to teacher-approved keys.
// Future days are planned only: never show an unuploaded MP3 as playable.
export const CURATED_MUSIC_DAYS = Object.freeze([
  { assignmentKey:'A1-14.1', level:'A1', day:22, title:'Mein Kopf tut weh', status:'published', trackId:'a1-day-22-health', audioUrl:'https://www.falowen.app/api/music?track=a1-day-22-health', objectKey:'music/a1/day-22/mein-kopf-tut-weh.mp3' },
  { assignmentKey:'A2-7.18', level:'A2', day:18, title:'Die Karte funktioniert nicht', status:'published', trackId:'a2-day-18-bank', audioUrl:'https://www.falowen.app/api/music?track=a2-day-18-bank', objectKey:'music/a2/die-karte-funktioniert-nicht.mp3' },
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
  if(fromAssignment) return fromAssignment;
  const l=String(level||'').trim().toUpperCase(), d=Number(day);
  return CURATED_MUSIC_DAYS.find(item=>item.status==='published' && item.level===l && item.day===d)||null;
}
