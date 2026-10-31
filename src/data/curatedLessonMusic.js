// Deliberately selected classroom music days. Music is NOT a default for
// every course day. Public playback is restricted to teacher-approved keys.
// Future days are planned only: never show an unuploaded MP3 as playable.
export const CURATED_MUSIC_DAYS = Object.freeze([
  {"assignmentKey": "A1-0.2", "level": "A1", "day": 2, "title": "Ich heiße Bina – B-I-N-A!", "status": "published", "trackId": "r2-a1-day-02-b64_SWNoIGhlacOfZSBCaW5hLm1wMw", "audioUrl": "https://www.falowen.app/api/music?track=r2-a1-day-02-b64_SWNoIGhlacOfZSBCaW5hLm1wMw", "objectKey": "music/a1/day-02/Ich heiße Bina.mp3"},
  {"assignmentKey": "A1-1.1", "level": "A1", "day": 3, "title": "Wer bist du? Sag es mir!", "status": "published", "trackId": "r2-a1-day-03-b64_V2VyIGJpc3QgZHVfIFNhZyBlcyBtaXIhLm1wMw", "audioUrl": "https://www.falowen.app/api/music?track=r2-a1-day-03-b64_V2VyIGJpc3QgZHVfIFNhZyBlcyBtaXIhLm1wMw", "objectKey": "music/a1/day-03/Wer bist du_ Sag es mir!.mp3"},
  { assignmentKey:'A1-2', level:'A1', day:4, title:'Meine Nummer, meine Adresse', introQuestion:'Wie alt ist Ben, und wie beginnt seine Telefonnummer?', status:'published', trackId:'r2-a1-day-04-b64_TWVpbmUgTnVtbWVyLCBtZWluZSBBZHJlc3NlLm1wMw', audioUrl:'https://www.falowen.app/api/music?track=r2-a1-day-04-b64_TWVpbmUgTnVtbWVyLCBtZWluZSBBZHJlc3NlLm1wMw', objectKey:'music/a1/day-04/Meine Nummer, meine Adresse.mp3' },
  // Day 13 is published, but the actual MP3 filename comes from the on-demand R2 discovery feed. Never guess the object key or track ID.
  { assignmentKey:'A1-3.5', level:'A1', day:13, title:'Zwei Tees, vier Euro', introQuestion:'Wie viele Tees stehen auf dem Tisch, und wie viel bezahlen sie zusammen?', status:'published', discover:true },
  { assignmentKey:'A1-3.6', level:'A1', day:14, title:'Einsteigen – Wir fahren los', introQuestion:'Wo müssen Mia und Ben umsteigen?', status:'published', trackId:'r2-a1-day-14-b64_RWluc3RlaWdlbiDigJMgV2lyIGZhaHJlbiBsb3MubXAz', audioUrl:'https://www.falowen.app/api/music?track=r2-a1-day-14-b64_RWluc3RlaWdlbiDigJMgV2lyIGZhaHJlbiBsb3MubXAz', objectKey:'music/a1/day-14/Einsteigen – Wir fahren los.mp3' },
  // Day 15 was uploaded to R2; discover its real published MP3 by level/day at runtime.
  // No invented filename or reversible track ID. A missing/ambiguous upload stays unplayable.
  { assignmentKey:'A1-4.7', level:'A1', day:15, title:'Ich bin bereit zu sprechen', introQuestion:'Wie fühlt sich die Person vor der A1-Sprechprüfung?', status:'published', discover:true },
  { assignmentKey:'A1-13', level:'A1', day:21, title:'Heute kann ich leider nicht', status:'published', trackId:'r2-a1-day-21-b64_SGV1dGUga2FubiBpY2ggbGVpZGVyIG5pY2h0Lm1wMw', audioUrl:'https://www.falowen.app/api/music?track=r2-a1-day-21-b64_SGV1dGUga2FubiBpY2ggbGVpZGVyIG5pY2h0Lm1wMw', objectKey:'music/a1/day-21/Heute kann ich leider nicht.mp3' },
  { assignmentKey:'A1-14.1', level:'A1', day:22, title:'Arzttermin', status:'published', trackId:'r2-a1-day-22-b64_QXJ6dHRlcm1pbi5tcDM', audioUrl:'https://www.falowen.app/api/music?track=r2-a1-day-22-b64_QXJ6dHRlcm1pbi5tcDM', objectKey:'music/a1/day-22/Arzttermin.mp3' },
  { assignmentKey:'A2-9.23', level:'A2', day:23, title:'Fahrrad zur Schule', introQuestion:'Warum fährt die Person mit dem Fahrrad zur Schule?', status:'published', trackId:'r2-a2-day-23-b64_RmFocnJhZCB6dXIgU2NodWxlLm1wMw', audioUrl:'https://www.falowen.app/api/music?track=r2-a2-day-23-b64_RmFocnJhZCB6dXIgU2NodWxlLm1wMw', objectKey:'music/a2/day-23/Fahrrad zur Schule.mp3' },
  { assignmentKey:'A2-9.24', level:'A2', day:24, title:'Endlich Urlaub', introQuestion:'Wohin fährt die Person, und um wie viel Uhr fährt der Zug ab?', status:'published', trackId:'r2-a2-day-24-b64_RW5kbGljaCBVcmxhdWIubXAz', audioUrl:'https://www.falowen.app/api/music?track=r2-a2-day-24-b64_RW5kbGljaCBVcmxhdWIubXAz', objectKey:'music/a2/day-24/Endlich Urlaub.mp3' },
  { assignmentKey:'A2-9.25', level:'A2', day:25, title:'Endlich Urlaub', introQuestion:'Wohin reist die Person und wann fährt der Zug ab?', status:'published', trackId:'r2-a2-day-25-b64_RW5kbGljaCBVcmxhdWIubXAz', audioUrl:'https://www.falowen.app/api/music?track=r2-a2-day-25-b64_RW5kbGljaCBVcmxhdWIubXAz', objectKey:'music/a2/day-25/Endlich Urlaub.mp3' },
  { assignmentKey:'A2-7.18', level:'A2', day:18, title:'Die Karte funktioniert nicht', status:'published', trackId:'a2-day-18-bank', audioUrl:'https://www.falowen.app/api/music?track=a2-day-18-bank', objectKey:'music/a2/day-18/die-karte-funktioniert-nicht.mp3' },
  { assignmentKey:'A1-2.3', level:'A1', day:6, title:'Sonntag mit meiner Familie', status:'planned' },
  
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
