import { lyricLines, validateLyricCues } from './songLyrics.js';
import { waitingRoomDiscoveredMusicTrack } from './waitingRoomDayMusic.js';

// Public Falowen Music's actual R2 object key—not an Admin songbook title—
// identifies the recording. Never manufacture a track ID or an R2 filename.
export function selectRecordedLessonTrack(feed, {level='A2',day,assignmentKey} = {}) {
  const normalized=String(level||'').toUpperCase();
  const rows=(Array.isArray(feed?.tracks)?feed.tracks:[]).filter(row=>
    String(row?.level||'').toUpperCase()===normalized && Number(row.day)===Number(day));
  // Prefer the teacher-identified recording if the folder has multiple MP3s.
  // Every candidate is still validated by the shared read-only music guard.
  const titles={
    'A2-19':['die richtige wahl'],
    'B1-24':['weniger kaufen','weniger kaufen, mehr erleben'],
    'B1-25':['als kunde habe ich auch rechte','das paket kam nicht an'],
    'B1-26':['der zug fährt nicht'],
  }[normalized+'-'+Number(day)]||[];
  const matches=rows.filter(row=>titles.includes(String(row.title||'').trim().toLocaleLowerCase('de')));
  if(matches.length===1) {
    const track=waitingRoomDiscoveredMusicTrack({tracks:matches},{level:normalized,day,assignmentKey:''});
    if(track)return track;
  }
  return waitingRoomDiscoveredMusicTrack(feed,{level:normalized,day,assignmentKey});
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
  'A1-14': [
    {prompt:'Wo müssen Mia und Ben umsteigen?',options:['In Hannover.','In Berlin.','In Accra.'],correctIndex:0,answer:'In Hannover.',evidence:'Wir müssen in Hannover umsteigen,'},
    {prompt:'Wo möchten sie ankommen?',options:['In Hamburg.','In Berlin.','In München.'],correctIndex:1,answer:'In Berlin.',evidence:'wir möchten in Berlin ankommen.'},
  ],
  'A2-19': [
    {prompt:'Warum gehen Mia und ihre Begleitung zuerst ins Geschäft?',
      options:['Weil Mia ihre Schuhgröße nicht genau kennt.','Weil alle Schuhe online ausverkauft sind.','Weil das Geschäft heute schließt.'],
      correctIndex:0,answer:'Mia kennt ihre Schuhgröße nicht genau.',
      evidence:'Doch sie kennt ihre Größe nicht genau.'},
    {prompt:'Welches Paar kauft Mia schließlich?',
      options:['Das erste Paar, weil es billiger ist.','Das zweite Paar, weil es bequemer ist.','Keines der beiden Paare.'],
      correctIndex:1,answer:'Das zweite, bequemere Paar.',
      evidence:'Das zweite sitzt viel bequemer.'},
  ],
  'A2-20': [
    {prompt:'Warum geht die Person mit der Jacke zurück ins Geschäft?',
      options:['Die Jacke ist zu teuer.','Die Jacke ist zu klein.','Die Jacke hat keine Taschen.'],
      correctIndex:1,answer:'Die Jacke ist zu klein.',
      evidence:'Heute merke ich: Sie ist zu klein.'},
    {prompt:'Wie hilft die Verkäuferin?',
      options:['Sie gibt einen Gutschein.','Sie schickt die Person nach Hause.','Sie bringt die Jacke eine Nummer größer.'],
      correctIndex:2,answer:'Sie bringt die Jacke eine Nummer größer.',
      evidence:'Sie bringt die Jacke eine Nummer größer.'},
  ],
  'B1-24':[
    {prompt:'Warum entscheidet sich die Person, das neue Handy nicht zu kaufen?',
      options:['Das alte Handy funktioniert noch; die Reise wird wichtiger.','Das Geschäft ist heute geschlossen.','Die Werbung nennt keinen Preis.'],
      correctIndex:0,answer:'Das alte Handy funktioniert noch; die Reise ist wichtiger.',
      evidence:'Meins funktioniert eigentlich noch gut.'},
    {prompt:'Wie hilft der Bruder bei der Entscheidung?',
      options:['Er kauft ein neues Handy.','Er zeigt, wie man den Akku schonen kann.','Er schickt die Person zum Reparaturdienst.'],
      correctIndex:1,answer:'Er zeigt, wie der Akku länger hält.',
      evidence:'Er zeigt mir, wie ich den Akku schonen kann.'},
  ],
  'B1-25':[
    {prompt:'Was ist das Problem mit der Lieferung?',
      options:['Das Paket wurde storniert.','Die Sendung gilt als zugestellt, aber das Paket fehlt.','Die Schuhe haben die falsche Größe.'],
      correctIndex:1,answer:'Die Sendung wird als zugestellt angezeigt, obwohl kein Paket da ist.',
      evidence:'obwohl vor meiner Tür kein Paket liegt.'},
    {prompt:'Wo wurde das Paket schließlich abgegeben?',
      options:['Bei einem Nachbarn.','In einem anderen Geschäft.','Bei der Schule.'],
      correctIndex:0,answer:'Bei einem Nachbarn.',
      evidence:'Das Paket wurde beim Nachbarn abgegeben.'},
  ],
};
const SPEAKING = {
  'A1-14':{prompt:'Wohin möchtest du mit dem Zug fahren? Wo musst du umsteigen?',answer:'Ich möchte nach Berlin fahren. Ich muss in Hannover umsteigen.'},
  'A2-19':{prompt:'Was kaufst du lieber online und was im Geschäft? Warum?',
      answer:'Ich kaufe Kleidung lieber im Geschäft, weil ich sie dort anprobieren kann.'},
  'A2-20':{prompt:'Wie reklamierst du höflich ein Kleidungsstück, das nicht passt?',
      answer:'Entschuldigung, diese Jacke ist zu klein. Kann ich sie bitte umtauschen?'},
  'B1-24':{prompt:'Wie kannst du bewusst konsumieren? Begründe deinen Vorschlag.',
    answer:'Ich überlege zuerst, ob ich etwas wirklich brauche, und repariere Dinge, wenn das möglich ist.'},
  'B1-25':{prompt:'Wie fragst du höflich nach einer fehlenden Lieferung?',
    answer:'Guten Tag, meine Sendung gilt als zugestellt, aber ich habe das Paket nicht erhalten. Könnten Sie bitte nachforschen?'},
  'B1-26':{prompt:'Was würdest du tun, wenn dein Zug kurzfristig ausfällt?',
    answer:'Ich frage nach einer anderen Verbindung, informiere die betroffenen Personen und bleibe ruhig.'},
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

export function recordedSongQuestions(pack,day,level='A2') {
  const lines=lyricLines(pack?.lyrics);
  if(!lines.length)return [];
  const key=String(level).toUpperCase()+'-'+Number(day);
  const checks=LESSON_CHECKS[key];
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
    ...(SPEAKING[key] || {prompt:'Worum geht es in diesem Lied? Erzähle in deinen eigenen Worten.',answer:'Benutze einen Ausdruck aus dem Lied.'})}];
}
