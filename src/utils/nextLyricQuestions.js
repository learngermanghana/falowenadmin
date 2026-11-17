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
  const questionEndings = pack.questionEndings;
  const candidates = [];
  for (let i=0;i<lines.length-1;i++) {
    const current = lines[i];
    const answer = lines[i + 1];
    const answerStart = cues[i + 1].start;
    const end = cues[i].end ?? answerStart;
    if (questionEndings && !questionEndings.includes(current)) continue;
    if (end > answerStart || current.length < 8 || answer.length < 8 ||
        counts.get(normal(current)) !== 1 || normal(current) === normal(answer)) continue;
    // Include a preceding line when it fits in the excerpt, so the class
    // hears the lead-in. The continuation starts at the answer's own cue.
    const leadIn = i > 0 && end - cues[i - 1].start <= 12 ? i - 1 : i;
    const start = cues[leadIn].start;
    const continuationEnd = cues[i + 1].end ?? cues[i + 2]?.start;
    const heard = new Set(lines.slice(leadIn, i + 1).map(normal));
    heard.add(normal(answer));
    const incorrect = new Map();
    for (const line of lines) {
      const key = normal(line);
      if (line.length >= 8 && !heard.has(key)) incorrect.set(key, line);
      if (incorrect.size === 2) break;
    }
    if (incorrect.size < 2 || end <= start) continue;
    candidates.push({
      id: 'next-lyric-' + i, type: 'listening',
      prompt: 'Welche Liedzeile kommt als Nächstes?',
      options: [...incorrect.values()], answer, evidence: current,
      previewRange: {start, end},
      ...(continuationEnd > answerStart ? {continuationRange: {start: answerStart, end: continuationEnd}} : {}),
    });
  }
  if (candidates.length < 3) return [];
  const first = candidates.length > 3 && candidates[0].id === 'next-lyric-0' ? 1 : 0;
  const selected = questionEndings
    ? questionEndings.map(ending => candidates.find(question => question.evidence === ending))
    : [candidates[first], candidates[Math.floor((first + candidates.length - 1) / 2)], candidates.at(-1)];
  if (selected.some(question => !question)) return [];
  return selected.map((question, correctIndex) => {
    question.options.splice(correctIndex, 0, question.answer);
    return {...question, correctIndex};
  });
}
