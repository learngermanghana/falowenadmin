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
