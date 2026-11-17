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
  const candidates = [];
  for (let i=0;i<lines.length-1;i++) {
    const current = lines[i];
    const answer = lines[i + 1];
    const answerStart = cues[i + 1].start;
    const end = cues[i].end ?? answerStart;
    if (end > answerStart || current.length < 8 || answer.length < 8 ||
        counts.get(normal(current)) !== 1 || normal(current) === normal(answer)) continue;
    // Include a preceding line when it fits in the excerpt, so the class
    // hears the lead-in. The continuation starts at the answer's own cue.
    const leadIn = i > 0 && end - cues[i - 1].start <= 12 ? i - 1 : i;
    const start = cues[leadIn].start;
    const continuationEnd = cues[i + 2]?.start ?? cues[i + 1].end;
    const incorrect = new Map();
    for (const line of lines) {
      const key = normal(line);
      if (line.length >= 8 && key !== normal(current) && key !== normal(answer)) incorrect.set(key, line);
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
  const selected = [first, Math.floor((first + candidates.length - 1) / 2), candidates.length - 1];
  return selected.map((index, correctIndex) => {
    const question = candidates[index];
    question.options.splice(correctIndex, 0, question.answer);
    return {...question, correctIndex};
  });
}

// These three excerpts use the word timings for the published Day 2 MP3
// (SHA-256 bff8440f79a18941381e371c2cfdacac4ce0fbbde7aad84c52d0ca8df40740ff).
// Stop before the continuation starts. The choices use the approved lyrics.
export const BINA_RECORDING_KEY = 'music/a1/day-02/Ich heiße Bina.mp3';

export const BINA_NEXT_LYRIC_QUESTIONS = [
  {
    id: 'bina-school', type: 'listening',
    prompt: 'Welche Liedzeile kommt als Nächstes?',
    evidence: 'Wie heißen Sie? Sagen Sie es mir.“',
    options: ['Ich sage: „Hallo, ich heiße Bina,', 'Ich sage: „In Accra, hier bin ich.“', 'Ich buchstabiere langsam dann.'],
    correctIndex: 0,
    answer: 'Ich sage: „Hallo, ich heiße Bina,',
    previewRange: { start: 31.86, end: 39.70 },
    continuationRange: { start: 40.52, end: 46.32 },
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
    previewRange: { start: 90.10, end: 99.88 },
    continuationRange: { start: 100.38, end: 111.00 },
  },
];
