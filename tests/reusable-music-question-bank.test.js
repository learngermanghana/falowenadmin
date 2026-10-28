import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { getStudioCourseCatalog } from '../src/utils/hoerenCourseCatalog.js';
import { getReusableSongDrafts } from '../src/data/reusableMusicSongbook.js';
import {
  getReusableMusicQuestions, getReusableMusicQuestionCount,
  formatReusableMusicQuestions, musicSongTeachingPackText, MUSIC_QUESTION_SEEDS,
} from '../src/data/reusableMusicQuestions.js';

test('all A1 A2 B1 dictionary songs have exactly two listening checks and one speaking question', () => {
  assert.equal(getReusableMusicQuestionCount(), 252);
  for (const level of ['A1','A2','B1']) {
    const rows = MUSIC_QUESTION_SEEDS[level];
    const catalog = getStudioCourseCatalog(level);
    assert.equal(rows.length, 28);
    assert.equal(new Set(rows.map(x=>x[0])).size, 28);
    assert.deepEqual(new Set(rows.map(row => row[0])), new Set(catalog.map(row => row.assignmentKey)));
    assert.equal(getReusableSongDrafts(level).length, 28);
    for (const row of rows) {
      const set = getReusableMusicQuestions(row[0]);
      assert.equal(set.questions.length, 3, row[0]);
      assert.deepEqual(set.questions.map(x=>x.type), ['listening','listening','speaking']);
      assert.equal(set.questions[0].prompt, row[1]);
      assert.equal(set.questions[0].answer, row[2]);
      assert.equal(set.questions[1].prompt, row[3]);
      assert.equal(set.questions[1].answer, row[4]);
      assert.equal(set.questions[2].prompt, row[5]);
      assert.equal(set.questions[2].answer, null);
      assert.equal(new Set(set.questions.map(x=>x.id)).size, 3);
      assert.ok(set.questions.every(x=>x.prompt.length > (level === 'A1' ? 8 : 20)));
      assert.ok(set.questions.slice(0,2).every(x=>x.answer.length > 2 && x.evidence.length > 30));
      assert.ok(set.questions.slice(0,2).every(x=>getReusableSongDrafts(level)
        .find(song => song.assignmentKey === row[0]).lyrics.includes(x.evidence)));
    }
  }
});

test('presentation export includes questions only, without marking answers or lyric evidence', () => {
  const student = formatReusableMusicQuestions('A1-14.1');
  assert.match(student, /Was tut der Person am Morgen weh/);
  assert.match(student, /Was bringt Mia mit/);
  assert.match(student, /Was sagst du, wenn du krank bist/);
  assert.doesNotMatch(student, /Erwartete Antwort|Textbeleg|Lehrerhinweis/);
  assert.match(student, /A\. Der Kopf\./);
  assert.match(student, /B\. Wasser und Tee\./);
  const day22 = getReusableMusicQuestions('A1-14.1');
  assert.deepEqual(day22.questions.slice(0,2).map(q=>q.correctIndex), [0,1]);
  assert.ok(day22.questions.slice(0,2).every(q=>q.options.length===3));
  assert.equal(day22.questions[2].type,'speaking');
  assert.equal(day22.questions[2].options,undefined);
  const teacher = formatReusableMusicQuestions('A1-14.1', { includeAnswers: true });
  assert.match(teacher, /Erwartete Antwort: Der Kopf/);
  assert.match(teacher, /Erwartete Antwort: Wasser und Tee/);
  assert.match(teacher, /Lehrerhinweis/);
  assert.doesNotMatch(teacher, /Textbeleg/);
});

test('exportable teacher pack includes lyrics, genre, music direction and questions with answers', () => {
  const draft = getReusableSongDrafts('B1').find(x=>x.assignmentKey==='B1-9.26');
  const lesson = getStudioCourseCatalog('B1').find(x=>x.assignmentKey===draft.assignmentKey);
  const pack = musicSongTeachingPackText(draft,lesson);
  assert.ok(pack.includes(draft.lyrics));
  assert.ok(pack.includes(draft.musicStyle));
  assert.match(pack, /HÖRVERSTEHEN/);
  assert.match(pack, /SPRECHEN/);
  assert.match(pack, /Was passiert|Warum können die Freunde/);
  assert.match(pack, /Erwartete Antwort:/);
  assert.match(pack, /Review if the lyrics change/);
});

test('the actual slide page can project song questions without initially showing answers', () => {
  const source = readFileSync(new URL('../src/pages/TeachingSlidesPage.jsx',import.meta.url),'utf8');
  assert.match(source, /getReusableMusicQuestions\(slide\.assignmentId\)/);
  assert.match(source, /<ReusableMusicQuestions assignmentKey=\{slide\.assignmentId\} projector/);
  assert.match(source, /Present song questions/);
  assert.match(source, /songQuestions && !handoutMode/);
  const component = readFileSync(new URL('../src/components/ReusableMusicQuestions.jsx',import.meta.url),'utf8');
  assert.match(component, /useState\(false\)/);
  assert.match(component, /if|Hide answer key/);
  assert.match(component, /Copy questions for slides/);
  assert.match(component, /Copy with answer key/);
  assert.doesNotMatch(component,/musicRequest|fetch\(|\.play\(/);
});

test('Music Studio uses the same question bank, copied without any generation', () => {
  const src=readFileSync(new URL('../src/pages/MusicStudioPage.jsx',import.meta.url),'utf8');
  assert.match(src, /<ReusableMusicQuestions assignmentKey=\{assignmentKey\} lyricsChanged=\{lyrics !== draft\.lyrics\}/);
  assert.match(src, /musicSongTeachingPackText\(/);
  assert.doesNotMatch(src, /musicDraftPackageText\(/);
  assert.equal(getReusableMusicQuestions('C1-10'), null);
});
