import { getStudioCourseCatalog } from './hoerenCourseCatalog.js';

// Each song must sound natural at the selected CEFR level, not just mention it.
export const MUSIC_STORY_CEFR_GUIDANCE = Object.freeze({
  A1: 'A1: one or two familiar people, simple present tense, basic everyday verbs, short clear German sentences of roughly 3–8 words, easy natural conversational dialogue between adults. Use situations such as a café, work, travelling or friendship when appropriate, not preschool characters. No unexplained idioms, long subordinate clauses, abstract explanations or childish rhyming drills.',
  A2: 'A2: a familiar adult daily-life event with a simple complication and solution; mostly present tense, with a little Perfekt and common connectors such as dann, aber, weil. Use short conversational dialogue, not a nursery singalong.',
  B1: 'B1: a relatable dilemma with a cause, feelings, one decision and its consequence. Use natural Perfekt, weil, dass, wenn or obwohl where appropriate, but keep the lines easy to sing.',
  B2: 'B2: a more developed human situation with contrasting views or choices, authentic vocabulary, subordinate clauses and a meaningful resolution, without dense academic language.',
  C1: 'C1: a nuanced experience, contrasting emotions and vivid imagery, naturally varied syntax and idiomatic German, with a coherent character arc and clear singable phrasing.',
  C2: 'C2: subtle or layered storytelling and sophisticated natural German, precise idioms and stylistic variety; prioritize compelling, comprehensible, singable lines over unnecessarily ornate vocabulary.',
});

function getMusicStoryScene(entry) {
  const level = String(entry.level || '').toUpperCase();
  const title = `${entry.germanTitle || ''} ${entry.englishTitle || ''}`.toLowerCase();
  if (level === 'A1' && (String(entry.assignmentKey || '').toUpperCase() === 'A1-3.5' || /rechnung im café|café.*rechnung/.test(title))) {
    return 'A1 CAFÉ STORY SEED: Two adults are at a café at half past two. Mia must catch a bus at three. The server brings the bill: two teas cost four euros, cake costs three, so seven euros total. A small human complication happens: Mia cannot find her money. Her friend offers to pay, they hurry to the bus stop, and Mia makes the bus. Use a warm repeated refrain about helping a friend, NOT a list of prices and clock phrases. Prices and time must be accurate and embedded in the scene. Do not end with a Falowen advertisement.';
  }
  if (level === 'A1' && (String(entry.assignmentKey || '').toUpperCase() === 'A1-14.1' || /gesundheit|körperteile|health and body/.test(title))) {
    return 'A1 HEALTH STORY SEED: a learner feels unwell and says "Mein Kopf tut weh." A friend asks "Was ist los?" The learner asks "Kannst du mir helfen?" The friend helps them rest, and they finish with "Jetzt geht es mir besser." Work in correct everyday body-part words such as der Kopf, der Arm, das Bein and die Hand only when they naturally fit the scene. Keep the complaint believable: not every body part needs to hurt. Do not turn the lyrics into a glossary.';
  }
  return 'Invent one believable everyday story directly related to the selected dictionary topic. Give it a beginning, a small practical problem or goal, a human response and a positive or thoughtful ending.';
}

export function getMusicDays(level) {
  const groups = new Map();
  for (const entry of getStudioCourseCatalog(level)) {
    if (!groups.has(entry.day)) groups.set(entry.day, []);
    groups.get(entry.day).push(entry);
  }
  return [...groups].sort(([a], [b]) => a - b).map(([day, lessons]) => ({ day, lessons }));
}

export function musicLessonContext(entry, language = 'bilingual', focus = '', options = {}) {
  if (!entry) return '';
  const { songStyle = 'story', storyIdea = '', teacherLyricsProvided = false, rewriteFromLyrics = false, instrumentalOnly = false } = options || {};
  const makeNewStory = !instrumentalOnly && songStyle === 'story' && (!teacherLyricsProvided || rewriteFromLyrics);
  const bilingual = language !== 'german';
  return [
    'Falowen course song — use this selected lesson as the learning focus:',
    `CEFR level: ${entry.level}. Course day: ${entry.day}. Assignment: ${entry.assignmentKey}. Chapter: ${entry.chapter}.`,
    `Dictionary topic: ${entry.germanTitle} / ${entry.englishTitle}.`,
    instrumentalOnly
      ? 'No vocals, spoken language, choir or sung syllables in any language; convey the chosen scene with melody and chords only.'
      : bilingual
        ? 'Write primarily in German, with only occasional short, naturally sung English support. Do not add word-for-word English translations in parentheses after every German vocabulary item.'
        : 'Sing in German only, without English translations.',
    instrumentalOnly ? 'Express the topic musically rather than using vocabulary or speech.' : `Use vocabulary, grammar and clear pronunciation appropriate to ${entry.level}.`,
    'This is music for adult German learners, not a children’s nursery classroom. Prefer believable human emotion, everyday conversations, natural German word stress and a memorable melodic hook. Never force couplet rhymes, chanted vocabulary lists, artificial question-answer jingles or babyish singalong melodies. Keep the German simple at A1/A2 without making the music juvenile. If exact teacher lyrics are supplied, do not alter them: apply the mature direction to melody, chords and arrangement instead.',
    instrumentalOnly
      ? 'INSTRUMENTAL-ONLY ADULT SONG: express the lesson situation with a strong melodic motif, moving chord progression, organic guitar/piano dynamics and a thoughtful emotional arc; do not produce any lyrics, dialogue, speech, chanting, choir or humming.'
      : makeNewStory ? [
      'STORYTELLING SONG — NOT A VOCABULARY LIST:',
      'Build one coherent five-step adult story, not merely a list of thematic facts: [Verse 1] introduce a named person, concrete place and a goal with stakes; [Chorus] express the emotional hook or decision, not a vocabulary list; [Verse 2] reveal an obstacle or change and let the people act; [Bridge] optional short turning point showing a choice or kind action; [Chorus] return to the same hook with deeper meaning; [Outro] show what happened, including the consequence. One story with continuity from the first line to the last.',
      'Include one or two short everyday dialogue turns. Each detail (time, money, clothing, route or grammar) must matter to the same real-life goal or dilemma; never assemble disconnected flashcards, dictionary translations or lists. The chorus should change the listener’s feeling, not just count or recite lesson vocabulary. No obligatory rhyme, no self-referential learning slogan, no brand advertisement in the sung outro unless the teacher specifically asks for a promotional song.',
      MUSIC_STORY_CEFR_GUIDANCE[String(entry.level || '').toUpperCase()] || MUSIC_STORY_CEFR_GUIDANCE.A1,
      getMusicStoryScene(entry),
      String(storyIdea || '').trim() ? `Teacher's preferred story situation: ${String(storyIdea).trim()}` : '',
      'Keep the story short enough for the chosen music duration and preserve at least 20 seconds for the complete ending. Do not sing timing markers or section labels aloud.',
    ].filter(Boolean).join('\n') : songStyle === 'vocabulary'
      ? 'VOCABULARY-REVIEW STYLE: embed a few useful short phrases in a realistic adult situation, with clear pronunciation, the selected CEFR level and a completed outro. Avoid nursery-rhyme delivery, rote lists, forced rhymes and endless copies of the same verse.'
      : 'Follow the teacher-supplied lyrics verbatim; keep pronunciation and phrasing correct without inventing a new story.',
    focus.trim() ? `Teacher-selected words or grammar to practise: ${focus.trim()}` : '',
    'The dictionary provides lesson titles, not a verbatim vocabulary list. Do not claim invented examples are quotations from the course.',
    !instrumentalOnly ? 'Preserve teacher-supplied exact lyrics unless the teacher explicitly chooses to rewrite them into a new storytelling song.' : '',
  ].filter(Boolean).join('\n');
}
