import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { getReusableMusicQuestions, formatReusableMusicQuestions } from '../src/data/reusableMusicQuestions.js';
import { getLessonSong } from '../src/data/a1Day22Music.js';

test('A1 Day22 two listening questions have three plausible choices; third is open health speaking', () => {
  const song = getLessonSong({assignmentId:'A1-14.1'});
  const qs = getReusableMusicQuestions('A1-14.1').questions;
  assert.equal(song.questions.length,2);
  assert.deepEqual(song.questions,qs.slice(0,2));
  assert.deepEqual(qs.map(q=>q.type),['listening','listening','speaking']);
  for(const q of qs.slice(0,2)){
    assert.equal(q.options.length,3);
    assert.equal(new Set(q.options).size,3);
    assert.ok(q.correctIndex>=0 && q.correctIndex<q.options.length);
    assert.equal(q.options[q.correctIndex],q.answer);
    assert.ok(song.lyrics.includes(q.evidence));
  }
  assert.equal(qs[2].options,undefined);
  assert.match(qs[2].prompt,/krank/i);
  const student=formatReusableMusicQuestions('A1-14.1');
  assert.match(student,/A\. Der Kopf\./);
  assert.match(student,/B\. Wasser und Tee\./);
  assert.doesNotMatch(student,/Erwartete Antwort:|Lehrerhinweis:|Textbeleg:/);
  const teacher=formatReusableMusicQuestions('A1-14.1',{includeAnswers:true});
  assert.match(teacher,/Erwartete Antwort: Der Kopf/);
});

test('song projectors and music studio reuse selectable answer options but conceal teacher answer',()=>{
  const p=readFileSync(new URL('../src/components/PublishedSongLessonStage.jsx',import.meta.url),'utf8');
  const s=readFileSync(new URL('../src/components/LessonSongStage.jsx',import.meta.url),'utf8');
  const studio=readFileSync(new URL('../src/components/ReusableMusicQuestions.jsx',import.meta.url),'utf8');
  assert.match(p,/question\.options\.map/);
  assert.match(p,/selectedOption/);
  assert.match(p,/showAnswer &&/);
  assert.match(p,/question\.type === 'speaking'/);
  assert.match(s,/item\.options\?\.map/);
  assert.match(s,/selected === item\.correctIndex/);
  assert.match(studio,/question\.options\.map/);
});

test('A1 non-fullscreen header and footer are compact, with teacher notes optional',()=>{
  const a1=readFileSync(new URL('../src/components/A1GrammarPresenter.jsx',import.meta.url),'utf8');
  const css=readFileSync(new URL('../src/components/A1GrammarPresenter.css',import.meta.url),'utf8');
  const controls=readFileSync(new URL('../src/components/PresenterControls.jsx',import.meta.url),'utf8');
  assert.match(a1,/aria-label="A1 teaching presenter"/);
  assert.match(a1,/presenter-a1-activity-disclosure/);
  assert.match(a1,/<details className="presenter-a1-teacher-details"/);
  assert.match(a1,/PresenterControls compact=\{!focusMode\}/);
  assert.match(css,/presenter-question-reveal > h1/);
  assert.match(css,/overflow-y: auto/);
  assert.match(css,/presenter-footer\.is-compact/);
  assert.match(controls,/!compact && <div className="presenter-progress-wrap"/);
  assert.match(controls,/!atEnd && !compact/);
});
