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
  // A2 Day 21 already has a teacher-approved uploaded song. If several MP3s
  // exist for the day, select the exact known R2 recording rather than leaving
  // the presenter without music or playing another song.
  const knownObjectKey = normalized === 'A2' && Number(day) === 1
    ? 'music/a2/day-01/Ein nettes Gespräch.mp3'
    : normalized === 'A2' && Number(day) === 3
      ? 'music/a2/day-03/Zwei Städte.mp3'
    : normalized === 'A2' && Number(day) === 21
      ? 'music/a2/day-21/Endlich Wochenende.mp3'
      : normalized === 'A2' && Number(day) === 23
        ? 'music/a2/day-23/Fahrrad zur Schule.mp3'
        : normalized === 'B1' && Number(day) === 27
          ? 'music/b1/day-27/Vor unserer Tür.mp3' : '';
  if (knownObjectKey) {
    const pinned = rows.filter(row => row.objectKey === knownObjectKey);
    if (pinned.length === 1) {
      const approved = waitingRoomDiscoveredMusicTrack(
        { tracks: pinned }, { level: normalized, day, assignmentKey: '' });
      if (approved) return approved;
    }
    // The teacher supplied the exact uploaded Day-3 object. Never pick a
    // different Day-3 MP3 just because it is the only catalog match.
    if (normalized === 'A2' && Number(day) === 3) return null;
  }
  if (normalized === 'B1' && Number(day) === 27) return null;
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
  return {objectKey:track.objectKey,lyrics:pack.lyrics,cues,
    englishTranslation:pack.englishTranslation,
    ...(pack.referenceOnly ? {referenceOnly:true} : {}),
    ...(pack.transcriptionStatus==='automatic' ? {transcriptionStatus:'automatic'} : {}),
    ...(pack.timingStatus==='estimated' ? {timingStatus:'estimated'} : {})};
}

// Return a playable range only when the evidence can be mapped to the exact
// recorded lyric lines and their matching timing cues. A line preview ends at
// its published end cue, or at the next line's start when no end is supplied.
export function recordedEvidenceRange(lyrics, cues, evidence) {
  const lines=lyricLines(lyrics);
  const checked=validateLyricCues(cues,lines);
  const normalize=value=>String(value||'').toLocaleLowerCase('de')
    .replace(/[^\p{L}\p{N}]+/gu,' ').trim().replace(/\s+/g,' ');
  const evidenceLines=String(evidence||'').replaceAll(' / ','\n').split(/\r?\n/)
    .map(normalize).filter(Boolean);
  if (!evidenceLines.length || checked.length!==lines.length) return null;
  const matched=[];
  for (const part of evidenceLines) {
    const index=lines.findIndex(line=>normalize(line)===part);
    if (index<0) return null;
    matched.push(index);
  }
  const first=Math.min(...matched), last=Math.max(...matched);
  const start=checked[first]?.start;
  const end=checked[last]?.end ?? checked[last+1]?.start;
  if (!Number.isFinite(start) || !Number.isFinite(end) || end<=start) return null;
  return {start,end};
}

const LESSON_CHECKS = {
  'A1-14': [
    {prompt:'Wo müssen Mia und Ben umsteigen?',options:['In Hannover.','In Berlin.','In Accra.'],correctIndex:0,answer:'In Hannover.',evidence:'Wir müssen in Hannover umsteigen,'},
    {prompt:'Wo möchten sie ankommen?',options:['In Hamburg.','In Berlin.','In München.'],correctIndex:1,answer:'In Berlin.',evidence:'wir möchten in Berlin ankommen.'},
  ],
  'A2-3': [
    {prompt:'Wie lange war die Person in Berlin?',
      options:['Ein Wochenende.','Eine ganze Woche.','Zwei Wochen.'],
      correctIndex:1,answer:'Eine ganze Woche.',
      evidence:'ich blieb dort eine ganze Woche.'},
    {prompt:'Wie ist die Person von Berlin nach Hamburg gefahren?',
      options:['Mit dem Bus.','Mit der U-Bahn.','Mit dem Zug.'],
      correctIndex:2,answer:'Mit dem Zug.',
      evidence:'Danach fuhr ich mit dem Zug nach Hamburg,'},
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
  'A2-3':{prompt:'Welche Stadt ist im Lied lebhafter? Welche würdest du lieber besuchen? Vergleiche die Städte mit als.',
      answer:'Berlin ist lebhafter als Hamburg. Ich würde lieber Hamburg besuchen, weil es dort ruhiger ist.'},
  'A2-19':{prompt:'Was kaufst du lieber online und was im Geschäft? Warum?',
      answer:'Ich kaufe Kleidung lieber im Geschäft, weil ich sie dort anprobieren kann.'},
  'A2-23':{prompt:'Wie kommst du zur Schule oder zur Arbeit? Was machst du bei Regen?',answer:'Ich fahre mit dem Fahrrad zur Schule. Wenn es regnet, nehme ich den Bus.'},
  'A2-20':{prompt:'Wie reklamierst du höflich ein Kleidungsstück, das nicht passt?',
      answer:'Entschuldigung, diese Jacke ist zu klein. Kann ich sie bitte umtauschen?'},
  'B1-24':{prompt:'Wie kannst du bewusst konsumieren? Begründe deinen Vorschlag.',
    answer:'Ich überlege zuerst, ob ich etwas wirklich brauche, und repariere Dinge, wenn das möglich ist.'},
  'B1-25':{prompt:'Wie fragst du höflich nach einer fehlenden Lieferung?',
    answer:'Guten Tag, meine Sendung gilt als zugestellt, aber ich habe das Paket nicht erhalten. Könnten Sie bitte nachforschen?'},
  'B1-26':{prompt:'Was würdest du tun, wenn dein Zug kurzfristig ausfällt?',
    answer:'Ich frage nach einer anderen Verbindung, informiere die betroffenen Personen und bleibe ruhig.'},
};

function lyricComparisonKey(line) {
  return line.toLocaleLowerCase('de').replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
}

function lyricSequenceQuestions(lines, day) {
  const usable = line => line.length >= 15 && line.length <= 125 && lyricComparisonKey(line);
  const rows = lines.map(line => ({ line, key: lyricComparisonKey(line) }));
  const continuations = new Map();
  const optionsByKey = new Map();
  for (const [index, row] of rows.entries()) {
    const next = rows[index + 1];
    if (usable(row.line)) optionsByKey.set(row.key, row.line);
    if (!continuations.has(row.key)) continuations.set(row.key, new Set());
    continuations.get(row.key).add(next?.key);
  }

  const used = new Set();
  const questions = [];
  for (const [index, row] of rows.entries()) {
    const next = rows[index + 1];
    if (!next || !usable(row.line) || !usable(next.line) || row.key === next.key
      || continuations.get(row.key).size !== 1 || used.has(row.key) || used.has(next.key)) continue;
    const alternatives = [...optionsByKey]
      .filter(([key]) => key !== row.key && key !== next.key)
      .map(([, line]) => line)
      .sort((a, b) => Math.abs(a.length - next.line.length) - Math.abs(b.length - next.line.length))
      .slice(0, 2);
    if (alternatives.length < 2) continue;
    const correctIndex = ((Number(day) || 0) + questions.length) % 3;
    alternatives.splice(correctIndex, 0, next.line);
    questions.push({
      type: 'listening', id: 'sequence-' + index,
      prompt: 'Welche Zeile folgt direkt auf „' + row.line + '“?',
      options: alternatives, correctIndex,
      answer: next.line, evidence: row.line + ' / ' + next.line,
    });
    used.add(row.key);
    used.add(next.key);
    if (questions.length === 2) break;
  }
  return questions;
}

export function recordedSongQuestions(pack,day,level='A2') {
  const lines=lyricLines(pack?.lyrics);
  if(!lines.length)return [];
  const key=String(level).toUpperCase()+'-'+Number(day);
  const checks=key === 'A2-3' && pack?.objectKey !== 'music/a2/day-03/Zwei Städte.mp3'
    ? undefined : LESSON_CHECKS[key];
  const reviewed = checks?.every(q=>lines.includes(q.evidence));
  const questions = reviewed
    ? checks.map((q,i)=>({...q,type:'listening',id:'heard-'+i}))
    : lyricSequenceQuestions(lines, day);
  const speaking = key === 'A2-3' && (!reviewed || !lines.includes('Berlin ist größer und lebhafter,'))
    ? undefined : SPEAKING[key];
  return [...questions.slice(0,2), {type:'speaking',id:'transfer',
    ...(speaking || {prompt:'Worum geht es in diesem Lied? Erzähle in deinen eigenen Worten.',answer:'Benutze einen Ausdruck aus dem Lied.'})}];
}
