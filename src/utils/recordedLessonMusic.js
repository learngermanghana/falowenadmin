import { lyricLines, validateLyricCues } from './songLyrics.js';
import { waitingRoomDiscoveredMusicTrack } from './waitingRoomDayMusic.js';

// Public Falowen Music's actual R2 object key—not an Admin songbook title—
// identifies the recording. Never manufacture a track ID or an R2 filename.
export function selectRecordedLessonTrack(feed, {day, assignmentKey} = {}) {
  const rows = (Array.isArray(feed?.tracks) ? feed.tracks : []).filter(row =>
    row?.level === 'A2' && Number(row.day) === Number(day));
  // The current uploaded Day 19 song is titled "Die richtige Wahl".
  // Prefer it when several uploads exist; otherwise preserve the existing
  // strict single-recording selection shared with attendance.
  if (Number(day) === 19) {
    const matches = rows.filter(row =>
      String(row.title || '').trim().toLowerCase() === 'die richtige wahl');
    if (matches.length === 1) {
      const published = waitingRoomDiscoveredMusicTrack({tracks: matches}, {
        level:'A2',day:19,assignmentKey:'',
      });
      if (published) return published;
    }
  }
  return waitingRoomDiscoveredMusicTrack(feed, {
    level:'A2',day,assignmentKey,
  });
}

export function verifiedRecordedLyrics(pack, track) {
  if (!pack || !track || pack.objectKey !== track.objectKey ||
    typeof pack.lyrics !== 'string' || pack.lyrics.length > 60000) return null;
  const lines = lyricLines(pack.lyrics);
  const cues = validateLyricCues(pack.cues, lines);
  if (!lines.length || cues.length !== lines.length) return null;
  return {objectKey:track.objectKey,lyrics:pack.lyrics,cues};
}

const LESSON_CHECKS = {
  19: [
    {prompt:'Warum gehen Mia und ihre Begleitung zuerst ins Geschäft?',
      options:['Weil Mia ihre Schuhgröße nicht genau kennt.','Weil alle Schuhe online ausverkauft sind.','Weil das Geschäft heute schließt.'],
      correctIndex:0,answer:'Mia kennt ihre Schuhgröße nicht genau.',
      evidence:'Doch sie kennt ihre Größe nicht genau.'},
    {prompt:'Welches Paar kauft Mia schließlich?',
      options:['Das erste Paar, weil es billiger ist.','Das zweite Paar, weil es bequemer ist.','Keines der beiden Paare.'],
      correctIndex:1,answer:'Das zweite, bequemere Paar.',
      evidence:'Das zweite sitzt viel bequemer.'},
  ],
  20: [
    {prompt:'Warum geht die Person mit der Jacke zurück ins Geschäft?',
      options:['Die Jacke ist zu teuer.','Die Jacke ist zu klein.','Die Jacke hat keine Taschen.'],
      correctIndex:1,answer:'Die Jacke ist zu klein.',
      evidence:'Heute merke ich: Sie ist zu klein.'},
    {prompt:'Wie hilft die Verkäuferin?',
      options:['Sie gibt einen Gutschein.','Sie schickt die Person nach Hause.','Sie bringt die Jacke eine Nummer größer.'],
      correctIndex:2,answer:'Sie bringt die Jacke eine Nummer größer.',
      evidence:'Sie bringt die Jacke eine Nummer größer.'},
  ],
};
const SPEAKING = {
  19:{prompt:'Was kaufst du lieber online und was im Geschäft? Warum?',
      answer:'Ich kaufe Kleidung lieber im Geschäft, weil ich sie dort anprobieren kann.'},
  20:{prompt:'Wie reklamierst du höflich ein Kleidungsstück, das nicht passt?',
      answer:'Entschuldigung, diese Jacke ist zu klein. Kann ich sie bitte umtauschen?'},
};

function makeLiteralWordQuestion(line, position) {
  // Safe deterministic alternative for a new recording with different lyrics:
  // each missing word and its evidence must occur in that exact recording.
  const words = String(line).match(/[\p{L}]{4,}/gu) || [];
  const word = words.find(w => !/^(diese|einen|einem|einer|dann|heute|jetzt|nicht|haben|werde|werden|machen|durch|bitte)$/i.test(w));
  if (!word) return null;
  const alternatives = ['Musik','Kino','Wetter','Schule','Sommer','Montag','Garten','Bahnhof']
    .filter(w => w.toLocaleLowerCase('de') !== word.toLocaleLowerCase('de'))
    .slice(0,2);
  const placeholder = String(line).replace(word,'_____');
  const options = position === 0 ? [word,...alternatives] : [alternatives[0],word,alternatives[1]];
  return {type:'listening',prompt:'Welches Wort fehlt in dieser Liedzeile? „'+placeholder+'“',
    options,correctIndex:position === 0 ? 0 : 1,
    answer:word,evidence:line};
}

export function recordedSongQuestions(pack, day) {
  const lines=lyricLines(pack?.lyrics);
  if (!lines.length) return [];
  const checks = LESSON_CHECKS[Number(day)];
  let questions = checks && checks.every(q=>lines.some(line=>line.trim()===q.evidence))
    ? checks.map((q,i)=>({...q,type:'listening',id:'heard-'+i}))
    : [];
  if (!questions.length) {
    const candidates = [...new Set(lines)].filter(line => line.length>=22 && line.length<=125);
    const selected = [candidates[1] || candidates[0], candidates[Math.floor(candidates.length*0.65)] || candidates[2]]
      .filter(Boolean);
    questions = selected.map((line,i)=>makeLiteralWordQuestion(line,i)).filter(Boolean);
  }
  return [...questions.slice(0,2), {type:'speaking',id:'transfer',
    ...(SPEAKING[Number(day)] || SPEAKING[19])}];
}
