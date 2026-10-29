import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { getMusicDays, musicLessonContext, MUSIC_STORY_CEFR_GUIDANCE } from "../src/utils/musicCourseContext.js";
import { buildFalowenMusicPrompt } from "../src/utils/musicGenerationPrompt.js";

const health = getMusicDays("A1").flatMap(group => group.lessons)
  .find(entry => entry.assignmentKey === "A1-14.1");

test("A1 chapter 14.1 uses real dictionary entry and writes a believable health conversation", () => {
  assert.ok(health, "health chapter must exist in the Falowen course dictionary");
  const context = musicLessonContext(health, "bilingual", "der Kopf, der Arm, das Bein", {
    songStyle: "story", storyIdea: "A classmate asks how the sick learner feels",
  });
  assert.match(context, /A1-14\.1/);
  assert.match(context, /Gesundheit und Körperteile/);
  assert.match(context, /Mein Kopf tut weh/);
  assert.match(context, /Was ist los\?/);
  assert.match(context, /Kannst du mir helfen\?/);
  assert.match(context, /Jetzt geht es mir besser/);
  assert.match(context, /simple present tense/);
  assert.match(context, /NOT A VOCABULARY LIST/);
  assert.match(context, /Teacher's preferred story situation/);
  assert.match(context, /not every body part needs to hurt/);
  assert.match(context, /at most one brief|only occasional short/);
});

test("music storytelling instructions progress by CEFR level without using A1's health plot elsewhere", () => {
  for (const level of ["A1", "A2", "B1", "B2", "C1", "C2"]) {
    assert.ok(MUSIC_STORY_CEFR_GUIDANCE[level], `missing ${level} language guardrails`);
    const entry = { level, assignmentKey: `${level}-1`, chapter: "1", day: 1, germanTitle: "Alltag", englishTitle: "Daily life" };
    const context = musicLessonContext(entry, "german", "", { songStyle: "story" });
    assert.match(context, /STORYTELLING SONG/);
    assert.ok(context.includes(MUSIC_STORY_CEFR_GUIDANCE[level]));
    assert.match(context, /Sing in German only/);
    assert.doesNotMatch(context, /A1 HEALTH STORY SEED/);
  }
});

test("existing teacher lyrics are preserved by default; source-reference rewrite is explicitly opted in", () => {
  const oldLyrics = "[[A0]]\n[[B1]]\n[:] Der Kopf. (The head.)\n[:] Mein Kopf tut weh. (My head hurts.)";
  const exactContext = musicLessonContext(health, "bilingual", "", {
    songStyle: "story", teacherLyricsProvided: true, rewriteFromLyrics: false,
  });
  assert.doesNotMatch(exactContext, /STORYTELLING SONG — NOT A VOCABULARY LIST/);
  const exact = buildFalowenMusicPrompt({ brief: "German acoustic song", context: exactContext,
    mode: "song", durationSeconds: 150, lyrics: oldLyrics });
  assert.match(exact, /USER-SUPPLIED LYRICS/);
  assert.ok(exact.includes(oldLyrics));

  const storyContext = musicLessonContext(health, "bilingual", "", {
    songStyle: "story", teacherLyricsProvided: true, rewriteFromLyrics: true,
  });
  assert.match(storyContext, /STORYTELLING SONG/);
  const adaptation = buildFalowenMusicPrompt({ brief: "German acoustic song", context: storyContext,
    mode: "song", durationSeconds: 150, lyrics: oldLyrics, lyricTreatment: "story-source" });
  assert.match(adaptation, /TEACHER VOCABULARY \/ OLD LYRICS TO ADAPT INTO A NEW STORY/);
  assert.match(adaptation, /do not sing control markers such as \[\[A0\]\]/);
  assert.match(adaptation, /final sustained chord/);
  assert.doesNotMatch(adaptation, /USER-SUPPLIED LYRICS/);
  assert.throws(() => buildFalowenMusicPrompt({ brief: "x", lyricTreatment: "auto-replace" }), /Invalid lyrics treatment/);
});

test("vocabulary-review and instrumental options still work, and story UI does not trigger paid generation", () => {
  const context = musicLessonContext(health, "german", "", { songStyle: "vocabulary" });
  assert.match(context, /VOCABULARY-REVIEW STYLE/);
  assert.doesNotMatch(context, /STORYTELLING SONG/);
  const instrumental = buildFalowenMusicPrompt({ brief: "Soft guitar", mode: "clip", vocalMode: "instrumental" });
  assert.match(instrumental, /no singer/);
  const page = readFileSync(new URL("../src/pages/MusicStudioPage.jsx", import.meta.url), "utf8");
  assert.match(page, /useState\('story'\)/);
  assert.match(page, /Source vocabulary — rewrite into a story/);
  assert.match(page, /Exact lyrics — keep my words/);
  assert.match(page, /musicLessonContext\(lesson, language, focus/);
});

test("A1 adult-learner context keeps language easy without childish songwriting", () => {
  const context = musicLessonContext(health, "bilingual", "", { songStyle: "story" });
  assert.match(context, /adult German learners/i);
  assert.match(context, /natural German word stress/);
  assert.match(context, /Never force couplet rhymes/);
  assert.match(context, /not preschool characters/i);
  assert.match(context, /simple present tense/);
});

test("instrumental guitar lesson context never asks Google to sing German lyrics", () => {
  const context = musicLessonContext(health, "german", "", { instrumentalOnly: true, teacherLyricsProvided: true });
  assert.match(context, /INSTRUMENTAL-ONLY ADULT SONG/);
  assert.match(context, /No vocals, spoken language/);
  assert.doesNotMatch(context, /Sing in German only/);
  assert.doesNotMatch(context, /STORYTELLING SONG — NOT A VOCABULARY LIST/);
});
