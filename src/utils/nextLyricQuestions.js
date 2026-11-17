import { lyricLines, validateLyricCues } from './songLyrics.js';

// Only use lyrics from the exact published MP3 with fully checked cue times.
// A classroom challenge must never silently derive questions from a songbook draft.
export function threeVerifiedNextLyricQuestions(pack, recording) {
  if (!pack || !recording || pack.objectKey !== recording.objectKey ||
    typeof pack.lyrics !== 'string' || pack.referenceOnly === true ||
    pack.transcriptionStatus === 'automatic' || pack.timingStatus === 'estimated') return [];
  const lines = lyricLines(pack.lyrics);
  const cues = validateLyricCues(pack.cues, lines);
  if (!lines.length || lines.length !== cues.length) return [];
  const normal = line => String(line).toLocaleLowerCase('de').replace(/[^\p{L}\p{N}]+/gu,' ').trim();
  const counts = new Map();
  for (const line of lines) counts.set(normal(line),(counts.get(normal(line))||0)+1);
  const chosen = [];
  for (let i=0;i<lines.length-1;i++) {
    const current=lines[i], answer=lines[i+1],start=cues[i]?.start,end=cues[i+1]?.start;
    if (!Number.isFinite(start) || !Number.isFinite(end) || end<=start ||
      current.length<8 || answer.length<8 || counts.get(normal(current))!==1 ||
      normal(current)===normal(answer)) continue;
    const incorrect=[...new Set(lines.filter((line,j)=>j!==i && j!==i+1
      && normal(line)!==normal(answer) && normal(line)!==normal(current) && line.length>=8))];
    if (incorrect.length<2)continue;
    const correctIndex=chosen.length%3;
    const options=incorrect.slice(0,2);
    options.splice(correctIndex,0,answer);
    chosen.push({
      id:'next-lyric-'+i,type:'listening',
      prompt:'Welche Zeile kommt nach „'+current+'“?',
      options,correctIndex,answer,
      evidence:current,
      previewRange:{start,end},
    });
    if(chosen.length===3)break;
  }
  return chosen.length===3?chosen:[];
}

// These three excerpts use the word timings for the published Day 2 MP3
// (SHA-256 bff8440f79a18941381e371c2cfdacac4ce0fbbde7aad84c52d0ca8df40740ff).
// Stop before the continuation starts. The choices use the approved lyrics.
export const BINA_RECORDING_KEY = 'music/a1/day-02/Ich heiße Bina.mp3';

export const BINA_NEXT_LYRIC_QUESTIONS = [
  {
    id: 'bina-school', type: 'listening',
    prompt: 'Welche Liedzeile kommt als Nächstes?',
    evidence: 'Ich möchte einen Deutschkurs machen.',
    options: ['Die Frau sagt freundlich: „Guten Tag!', 'Ich komme aus Ghana, das ist mein Land.', 'Ich buchstabiere langsam dann.'],
    correctIndex: 0,
    answer: 'Die Frau sagt freundlich: „Guten Tag!',
    previewRange: { start: 21.80, end: 29.78 },
    continuationRange: { start: 31.82, end: 43.82 },
  },
  {
    id: 'bina-accra', type: 'listening',
    prompt: 'Welche Liedzeile kommt als Nächstes?',
    evidence: 'Sie sagt: „Bitte noch einmal Ihren Namen!“',
    options: ['Ich sage: „In Accra, hier bin ich.“', 'Ich sage langsam: „B – I – N – A.“', 'Sie schreibt meinen Namen auf,'],
    correctIndex: 1,
    answer: 'Ich sage langsam: „B – I – N – A.“',
    previewRange: { start: 82.40, end: 89.86 },
    continuationRange: { start: 90.16, end: 96.84 },
  },
  {
    id: 'bina-monday', type: 'listening',
    prompt: 'Welche Liedzeile kommt als Nächstes?',
    evidence: 'Ihr Deutschkurs beginnt am Montag.“',
    options: ['So schreibt man meinen Namen!', 'Jetzt kennst du meinen Namen!', 'Ich freue mich, ich bin bald da!'],
    correctIndex: 2,
    answer: 'Ich freue mich, ich bin bald da!',
    previewRange: { start: 90.10, end: 99.94 },
    continuationRange: { start: 100.14, end: 111.00 },
  },
];
