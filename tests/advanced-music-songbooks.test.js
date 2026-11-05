import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { getStudioCourseCatalog } from "../src/utils/hoerenCourseCatalog.js";
import { getReusableSongDrafts, getReusableSongDraft, countReusableSongDrafts } from "../src/data/reusableMusicSongbook.js";
import { musicSongTeachingPackText, getReusableMusicQuestions } from "../src/data/reusableMusicQuestions.js";
import { musicLessonContext } from "../src/utils/musicCourseContext.js";

test("every canonical B2, C1 and C2 lesson has its own drafted song", () => {
  assert.equal(countReusableSongDrafts(), 168);
  const titles = new Set();
  const endings = new Set();
  for (const level of ["B2", "C1", "C2"]) {
    const lessons = getStudioCourseCatalog(level);
    const drafts = getReusableSongDrafts(level);
    assert.equal(lessons.length, 28, level + " course missing lessons");
    assert.equal(drafts.length, 28, level + " has missing song lyrics");
    assert.deepEqual(new Set(drafts.map(x => x.assignmentKey)), new Set(lessons.map(x => x.assignmentKey)), level + " assignment mismatch");
    assert.ok(new Set(drafts.map(x => x.genre)).size >= 17, level + " music genres lack range");
    for (const song of drafts) {
      assert.equal(getReusableSongDraft(song.assignmentKey), song);
      assert.ok(song.title.length > 6);
      assert.ok(song.musicStyle.startsWith(song.genre + ", "), song.assignmentKey);
      assert.match(song.lyrics, /^\[Verse 1\][\s\S]*\[Chorus\][\s\S]*\[Verse 2\][\s\S]*\[Outro\][\s\S]+\S$/);
      assert.doesNotMatch(song.lyrics, /falowen|\[\[.*\]\]/i, song.assignmentKey);
      assert.doesNotMatch(song.genre, /jazz|reggae/i);
      const words = song.lyrics.trim().split(/\s+/);
      assert.ok(words.length >= 80 && words.length <= 130, song.assignmentKey + " should sing in 2-minute mode");
      const lastLine = song.lyrics.trim().split("\n").at(-1);
      assert.ok(lastLine.length >= 15 && lastLine.length <= 100);
      assert.ok(!endings.has(lastLine), "reused generic outro: " + lastLine);
      endings.add(lastLine);
      assert.ok(!titles.has(song.title), "reused title: " + song.title);
      titles.add(song.title);
    }
  }
  assert.equal(titles.size, 84);
});
test("advanced song packs have complete words and style but no fictitious answer key", () => {
  const lesson = getStudioCourseCatalog("C2").find(row => row.assignmentKey === "C2-1.4");
  const song = getReusableSongDraft(lesson.assignmentKey);
  assert.equal(getReusableMusicQuestions(lesson.assignmentKey), null);
  const pack = musicSongTeachingPackText(song, lesson);
  assert.match(pack, /Der Rand der Nachricht/);
  assert.ok(pack.includes(song.lyrics));
  assert.ok(pack.includes(song.musicStyle));
  assert.doesNotMatch(pack, /Answer key above|Erwartete Antwort/);
});
test("advanced story prompting does not force a happy-ending A1 structure or insert the brand", () => {
  const c2 = getStudioCourseCatalog("C2")[0];
  const context = musicLessonContext(c2, "german", "", { songStyle:"story", teacherLyricsProvided:false });
  assert.match(context, /ADVANCED ARTISTIC SONG/);
  assert.match(context, /Do not insert the brand name/);
  assert.match(context, /bittersweet ending/);
  assert.ok(!context.includes("a small practical problem and natural dialogue"));
});
test("Music Studio exposes all six levels and advanced standalone songbook downloads", () => {
  const page = readFileSync(new URL("../src/pages/MusicStudioPage.jsx", import.meta.url), "utf8");
  assert.match(page, /STUDIO_COURSE_LEVELS\.includes\(level\)/);
  assert.match(page, /falowen-a1-to-c2-168-song-lyrics-and-music-styles\.txt/);
  assert.match(page, /Download complete A1–C2 songbook/);
  const book = readFileSync(new URL("../src/data/reusableMusicSongbook.js", import.meta.url), "utf8");
  for (const level of ["B2", "C1", "C2"]) assert.match(book, new RegExp(level + ": Object"));
});
