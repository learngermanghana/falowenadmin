// Deliberately selected classroom music days. Music is NOT a default for
// every course day. Public playback is restricted to teacher-approved keys.
// Future days are planned only: never show an unuploaded MP3 as playable.
export const CURATED_MUSIC_DAYS = Object.freeze([
  {"assignmentKey": "A1-0.2", "level": "A1", "day": 2, "title": "Ich heiße Bina – B-I-N-A!", "status": "published", "trackId": "r2-a1-day-02-b64_SWNoIGhlacOfZSBCaW5hLm1wMw", "audioUrl": "https://www.falowen.app/api/music?track=r2-a1-day-02-b64_SWNoIGhlacOfZSBCaW5hLm1wMw", "objectKey": "music/a1/day-02/Ich heiße Bina.mp3"},
  {"assignmentKey": "A1-1.1", "level": "A1", "day": 3, "title": "Wer bist du? Sag es mir!", "status": "published", "trackId": "r2-a1-day-03-b64_V2VyIGJpc3QgZHVfIFNhZyBlcyBtaXIhLm1wMw", "audioUrl": "https://www.falowen.app/api/music?track=r2-a1-day-03-b64_V2VyIGJpc3QgZHVfIFNhZyBlcyBtaXIhLm1wMw", "objectKey": "music/a1/day-03/Wer bist du_ Sag es mir!.mp3"},
  { assignmentKey:'B1-4.12', level:'B1', day:12, title:'Ein Umweg zum Ziel', introQuestion:'Wie finden die Wanderer den richtigen Weg?', status:'published', trackId:'r2-b1-day-12-b64_RWluIFVtd2VnIHp1bSBaaWVsLm1wMw', audioUrl:'https://www.falowen.app/api/music?track=r2-b1-day-12-b64_RWluIFVtd2VnIHp1bSBaaWVsLm1wMw', objectKey:'music/b1/day-12/Ein Umweg zum Ziel.mp3' },
  { assignmentKey:'B1-4.10', level:'B1', day:10, title:'Einen Moment weg', introQuestion:'Was macht die Person, nachdem sie das Handy weggelegt hat?', status:'published', trackId:'r2-b1-day-10-b64_RWluZW4gTW9tZW50IFdlZy5tcDM', audioUrl:'https://www.falowen.app/api/music?track=r2-b1-day-10-b64_RWluZW4gTW9tZW50IFdlZy5tcDM', objectKey:'music/b1/day-10/Einen Moment Weg.mp3' },
  { assignmentKey:'B1-6.19', level:'B1', day:19, title:'Nicht perfekt klingen', introQuestion:'Was fragt die Chefin im Vorstellungsgespräch?', status:'published', trackId:'r2-b1-day-19-b64_TmljaHQgUGVyZmVrdCBrbGluZ2VuLm1wMw', audioUrl:'https://www.falowen.app/api/music?track=r2-b1-day-19-b64_TmljaHQgUGVyZmVrdCBrbGluZ2VuLm1wMw', objectKey:'music/b1/day-19/Nicht Perfekt klingen.mp3' },
  { assignmentKey:'A1-2', level:'A1', day:4, title:'Das ist meine Nummer', introQuestion:'Wie alt ist Daniel und in welcher Stadt wohnt er?', status:'published', trackId:'r2-a1-day-04-b64_RGFzIGlzdCBtZWluZSBOdW1tZXIubXAz', audioUrl:'https://www.falowen.app/api/music?track=r2-a1-day-04-b64_RGFzIGlzdCBtZWluZSBOdW1tZXIubXAz', objectKey:'music/a1/day-04/Das ist meine Nummer.mp3' },
  // Day 13 is published, but the actual MP3 filename comes from the on-demand R2 discovery feed. Never guess the object key or track ID.
  { assignmentKey:'A1-3.5', level:'A1', day:13, title:'Zwei Tees, vier Euro', introQuestion:'Wie viele Tees stehen auf dem Tisch, und wie viel bezahlen sie zusammen?', status:'published', discover:true },
  { assignmentKey:'A1-3.6', level:'A1', day:14, title:'Einsteigen – Wir fahren los', introQuestion:'Wo müssen Mia und Ben umsteigen?', status:'published', trackId:'r2-a1-day-14-b64_RWluc3RlaWdlbiDigJMgV2lyIGZhaHJlbiBsb3MubXAz', audioUrl:'https://www.falowen.app/api/music?track=r2-a1-day-14-b64_RWluc3RlaWdlbiDigJMgV2lyIGZhaHJlbiBsb3MubXAz', objectKey:'music/a1/day-14/Einsteigen – Wir fahren los.mp3' },
  // Day 15 was uploaded to R2; discover its real published MP3 by level/day at runtime.
  // No invented filename or reversible track ID. A missing/ambiguous upload stays unplayable.
  { assignmentKey:'A1-4.7', level:'A1', day:15, title:'Ich bin bereit zu sprechen', introQuestion:'Wie fühlt sich die Person vor der A1-Sprechprüfung?', status:'published', discover:true },
  {"assignmentKey": "A1-9", "level": "A1", "day": 16, "title": "So bestelle ich mein Essen", "status": "published", "trackId": "r2-a1-day-16-b64_SWNoIG3DtmNodGUgU3VwcGUubXAz", "audioUrl": "https://www.falowen.app/api/music?track=r2-a1-day-16-b64_SWNoIG3DtmNodGUgU3VwcGUubXAz", "objectKey": "music/a1/day-16/Ich möchte Suppe.mp3"},
  { assignmentKey:'A1-13', level:'A1', day:21, title:'Bina, tut mir leid', introQuestion:'Warum sagt die Sängerin das Treffen mit Bina ab?', status:'published', trackId:'r2-a1-day-21-b64_QmluYSwgdHV0IG1pciBsZWlkLm1wMw', audioUrl:'https://www.falowen.app/api/music?track=r2-a1-day-21-b64_QmluYSwgdHV0IG1pciBsZWlkLm1wMw', objectKey:'music/a1/day-21/Bina, tut mir leid.mp3' },
  { assignmentKey:'A1-14.1', level:'A1', day:22, title:'Arzttermin', status:'published', trackId:'r2-a1-day-22-b64_QXJ6dHRlcm1pbi5tcDM', audioUrl:'https://www.falowen.app/api/music?track=r2-a1-day-22-b64_QXJ6dHRlcm1pbi5tcDM', objectKey:'music/a1/day-22/Arzttermin.mp3' },
  { assignmentKey:'A2-3.8', level:'A2', day:8, title:'Ein Abend zu zweit', introQuestion:'Was bestellt Mia, und welches falsche Gericht bekommt die andere Person?', status:'published', trackId:'r2-a2-day-08-b64_RWluIEFiZW5kIHp1IHp3ZWl0Lm1wMw', audioUrl:'https://www.falowen.app/api/music?track=r2-a2-day-08-b64_RWluIEFiZW5kIHp1IHp3ZWl0Lm1wMw', objectKey:'music/a2/day-08/Ein Abend zu zweit.mp3' },
  { assignmentKey:'A2-4.10', level:'A2', day:10, title:'Die Welt entdecken – The Traveller', introQuestion:'Wohin fliegt die Person morgen, und welches Land bleibt ihr immer nah?', status:'published', trackId:'r2-a2-day-10-b64_RGllIFdlbHQgZW50ZGVja2VuLm1wMw', audioUrl:'https://www.falowen.app/api/music?track=r2-a2-day-10-b64_RGllIFdlbHQgZW50ZGVja2VuLm1wMw', objectKey:'music/a2/day-10/Die Welt entdecken.mp3' },
  { assignmentKey:'A2-4.11', level:'A2', day:11, title:'Mit dem Rad, mit dem Zug', introQuestion:'Welche Verkehrsmittel benutzt die Person am Morgen und am Nachmittag?', status:'published', trackId:'r2-a2-day-11-b64_TWl0IGRlbSBSYWQsIG1pdCBkZW0gWnVnLm1wMw', audioUrl:'https://www.falowen.app/api/music?track=r2-a2-day-11-b64_TWl0IGRlbSBSYWQsIG1pdCBkZW0gWnVnLm1wMw', objectKey:'music/a2/day-11/Mit dem Rad, mit dem Zug.mp3' },
  { assignmentKey:'A2-9.23', level:'A2', day:23, title:'Fahrrad zur Schule', introQuestion:'Warum fährt die Person mit dem Fahrrad zur Schule?', status:'published', trackId:'r2-a2-day-23-b64_RmFocnJhZCB6dXIgU2NodWxlLm1wMw', audioUrl:'https://www.falowen.app/api/music?track=r2-a2-day-23-b64_RmFocnJhZCB6dXIgU2NodWxlLm1wMw', objectKey:'music/a2/day-23/Fahrrad zur Schule.mp3' },
  { assignmentKey:'A2-9.24', level:'A2', day:24, title:'Endlich Urlaub', introQuestion:'Wohin fährt die Person, und um wie viel Uhr fährt der Zug ab?', status:'published', trackId:'r2-a2-day-24-b64_RW5kbGljaCBVcmxhdWIubXAz', audioUrl:'https://www.falowen.app/api/music?track=r2-a2-day-24-b64_RW5kbGljaCBVcmxhdWIubXAz', objectKey:'music/a2/day-24/Endlich Urlaub.mp3' },
  { assignmentKey:'A2-10.27', level:'A2', day:27, title:'Handy weg', introQuestion:'Was zeigt die Person auf TikTok?', status:'published', trackId:'r2-a2-day-27-b64_SGFuZHkgd2VnLm1wMw', audioUrl:'https://www.falowen.app/api/music?track=r2-a2-day-27-b64_SGFuZHkgd2VnLm1wMw', objectKey:'music/a2/day-27/Handy weg.mp3' },
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
