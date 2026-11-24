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
    // Prefer about ten seconds leading into the evidence line; very early
    // lines can only provide a shorter safe clip without leaking the answer. Never play
    // even a fraction of the answer line before learners choose.
    const MAX_SECONDS = 11;
    const MIN_SECONDS = 4.5;
    const safeEnd = Math.min(end, answerStart - 0.05);
    if (safeEnd <= cues[i].start || safeEnd - cues[i].start > MAX_SECONDS) continue;
    // Ten-second lead-in can begin inside an earlier cue; the stopping boundary
    // remains the verified end of the evidence line, before the answer starts.
    // Do not seek before the first confirmed sung line of this recording.
    const start = Math.max(cues[0].start, safeEnd - 10);
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
  const verified = selected.map((question, correctIndex) => {
    const options = [...question.options];
    options.splice(correctIndex, 0, question.answer);
    // Never render a question unless the immediate next recorded lyric is in
    // its answer choices exactly once, with two distinct wrong alternatives.
    const seen = new Set(options.map(normal));
    if (options.length !== 3 || seen.size !== 3 ||
        options.filter(option => normal(option) === normal(question.answer)).length !== 1 ||
        question.previewRange.end >= question.continuationRange?.start) return null;
    return {...question, options, correctIndex};
  });
  return verified.length === 3 && verified.every(Boolean) ? verified : [];
}

// Listening comprehension: the correct option MUST be audible in the excerpt.
// This is intentionally different from guessing the next, unheard lyric.
export function threeVerifiedHeardLyricQuestions(pack, recording, {minSeconds = 4.5, maxSeconds = 11, targetSeconds = 10, allowFewer = false, ignoreLegacyEndings = false} = {}) {
  if (!pack || !recording || pack.objectKey !== recording.objectKey ||
      typeof pack.lyrics !== 'string' || pack.referenceOnly === true ||
      pack.transcriptionStatus === 'automatic' || pack.timingStatus === 'estimated') return [];
  if (![minSeconds,maxSeconds,targetSeconds].every(Number.isFinite) || minSeconds < 4.5 || maxSeconds > 15 || minSeconds > targetSeconds || targetSeconds > maxSeconds) return [];
  const lines = lyricLines(pack.lyrics);
  const cues = validateLyricCues(pack.cues, lines);
  if (lines.length < (allowFewer ? 3 : 4) || cues.length !== lines.length) return [];
  const normalize = line => String(line).toLocaleLowerCase('de').replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
  const counts = new Map();
  for (const line of lines) counts.set(normalize(line), (counts.get(normalize(line)) || 0) + 1);
  const candidates = [];
  for (let i = ignoreLegacyEndings ? 0 : 1; i < lines.length; i++) {
    // The previous line may be a legacy questionEnding, but today's answer is
    // the line AFTER it, which must be played in its entirety.
    if (!ignoreLegacyEndings && pack.questionEndings && !pack.questionEndings.includes(lines[i - 1])) continue;
    const end = cues[i].end ?? cues[i + 1]?.start;
    if (!Number.isFinite(end) || end <= cues[i].start) continue;
    const start = Math.max(cues[0].start, end - targetSeconds);
    const duration = end - start;
    if (duration < minSeconds || duration > maxSeconds ||
        cues[i].start < start || lines[i].length < (allowFewer ? 3 : 8) ||
        (!allowFewer && counts.get(normalize(lines[i])) !== 1)) continue;
    const heard = new Set();
    for (let j = 0; j < cues.length; j++) {
      const cueEnd = cues[j].end ?? cues[j + 1]?.start ?? Infinity;
      if (cues[j].start < end && cueEnd > start) heard.add(normalize(lines[j]));
    }
    const wrong = [];
    const used = new Set([normalize(lines[i])]);
    for (const line of lines) {
      const key = normalize(line);
      if (line.length >= (allowFewer ? 3 : 8) && key && !heard.has(key) && !used.has(key)) {
        wrong.push(line);
        used.add(key);
      }
      if (wrong.length === 2) break;
    }
    if (wrong.length !== 2) continue;
    const answer = lines[i];
    candidates.push({
      id: 'heard-lyric-' + i,
      type: 'listening',
      prompt: 'Welche Liedzeile hast du gehört?',
      answer, options: wrong,
      previewRange: {start, end},
      heardLyric: true,
    });
  }
  if (!candidates.length || (!allowFewer && candidates.length < 3)) return [];
  const selected = !ignoreLegacyEndings && pack.questionEndings
    ? pack.questionEndings.map(line => candidates.find(candidate =>
        candidate.id === 'heard-lyric-' + (lines.indexOf(line) + 1)))
    : candidates.length <= 3 ? candidates : [candidates[0], candidates[Math.floor((candidates.length - 1) / 2)], candidates.at(-1)];
  if (selected.some(candidate => !candidate)) return [];
  return selected.map((candidate, correctIndex) => {
    const options = [...candidate.options];
    options.splice(correctIndex, 0, candidate.answer);
    return {...candidate, options, correctIndex};
  });
}
