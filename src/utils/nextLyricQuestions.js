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
    // Prefer about ten seconds leading into the evidence line. Never play
    // even a fraction of the answer line before learners choose.
    const MAX_SECONDS = 11;
    const MIN_SECONDS = 8;
    const safeEnd = Math.min(end, answerStart - 0.05);
    if (safeEnd <= cues[i].start || safeEnd - cues[i].start > MAX_SECONDS) continue;
    let leadIn = i;
    for (let prior = i - 1; prior >= 0; prior--) {
      const duration = safeEnd - cues[prior].start;
      if (duration > MAX_SECONDS) break;
      leadIn = prior;
    }
    // Target ten seconds while remaining inside verified lyric cues.
    const start = Math.max(cues[leadIn].start, safeEnd - 10);
    if (safeEnd - start < MIN_SECONDS) continue;
    const continuationEnd = cues[i + 1].end ?? cues[i + 2]?.start;
    const heard = new Set(lines.slice(leadIn, i + 1).map(normal));
    heard.add(normal(answer));
    const incorrect = new Map();
    for (const line of lines) {
      const key = normal(line);
      if (line.length >= 8 && !heard.has(key)) incorrect.set(key, line);
      if (incorrect.size === 2) break;
    }
    if (incorrect.size < 2 || safeEnd <= start) continue;
    candidates.push({
      id: 'next-lyric-' + i, type: 'listening',
      prompt: 'Welche Liedzeile kommt als Nächstes?',
      options: [...incorrect.values()], answer, evidence: current,
      previewRange: {start, end: safeEnd},
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
    const options = [...question.options];
    options.splice(correctIndex, 0, question.answer);
    // Never render a question unless the immediate next recorded lyric is in
    // its answer choices exactly once, with two distinct wrong alternatives.
    const seen = new Set(options.map(normal));
    if (options.length !== 3 || seen.size !== 3 ||
        options.filter(option => normal(option) === normal(question.answer)).length !== 1 ||
        question.previewRange.end >= question.continuationRange?.start) return null;
    return {...question, options, correctIndex};
  }).filter(Boolean);
}
