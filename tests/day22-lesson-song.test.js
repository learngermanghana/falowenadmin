import test from 'node:test';
import assert from 'node:assert/strict';
import { getReusableMusicQuestions } from '../src/data/reusableMusicQuestions.js';
import { getSlidesByCourse } from '../src/data/teachingSlides.js';
import { buildTeachingPresenterStages } from '../src/utils/teachingPresenter.js';
import { getLessonSong, A1_DAY22_MUSIC } from '../src/data/a1Day22Music.js';
import { lyricLines, validateLyricCues, activeLyricIndex, readSongCues } from '../src/utils/songLyrics.js';
import { startWaitingMusicPlaylist, stopWaitingMusicPlaylist } from '../src/utils/pianoAudio.js';
test('A1-14.1 keeps teaching/practice and replaces repetitive ending with exactly one music finale', () => {
  const slides = getSlidesByCourse('A1');
  const stages = buildTeachingPresenterStages(slides.find(s => s.assignmentId === 'A1-14.1'));
  assert.equal(stages.filter(s => s.type === 'lesson-music').length, 1);
  assert.equal(stages.at(-1).id, 'music-finale');
  assert.equal(stages.at(-1).mode, 'all');
  assert.deepEqual(stages.filter(s => s.type === 'lesson-music').map(s => s.song.assignmentId), ['A1-14.1']);
  for (const id of ['grammar','practice','workbook']) assert.ok(stages.some(s => s.id === id));
  for (const id of ['mistakes','questions','wrapup','lesson-summary']) assert.ok(!stages.some(s => s.id === id));
  assert.ok(!buildTeachingPresenterStages(slides.find(s => s.assignmentId === 'A1-14.2')).some(s => s.type === 'lesson-music'));
  assert.equal(getLessonSong({level:'A1',day:22}).objectKey,'music/a1/day-22/mein-kopf-tut-weh.mp3');
  assert.equal(getLessonSong({level:'A2',day:22}),null);
  assert.equal(getLessonSong({assignmentId:'A1-14.1'}).id,A1_DAY22_MUSIC.id);
});
test('song questions have evidence from the saved lyrics and do not use workbook answers', () => {
  const lines = lyricLines(A1_DAY22_MUSIC.lyrics);
  assert.deepEqual(A1_DAY22_MUSIC.questions,getReusableMusicQuestions('A1-14.1').questions.filter(q=>q.type==='listening'));
  assert.equal(A1_DAY22_MUSIC.questions.length,2);
  for (const q of A1_DAY22_MUSIC.questions) {
    assert.ok(q.answer);
    for (const evidence of lyricLines(q.evidence)) assert.ok(lines.includes(evidence),evidence);
  }
  assert.equal(lines.filter(line => line === "Wie geht's dir? Wie geht's dir?").length,2);
});
test('real audio time handles pause/seek and rejects mismatched or unordered imported lyrics', () => {
  const lines=['Hallo','Noch einmal','Hallo'];
  const cues=[{start:5,text:'Hallo'},{start:10,text:'Noch einmal'},{start:20,text:'Hallo'}];
  assert.deepEqual(validateLyricCues(cues,lines),cues);
  assert.equal(activeLyricIndex(cues,4),-1);
  assert.equal(activeLyricIndex(cues,10),1);
  assert.equal(activeLyricIndex(cues,23),2);
  assert.equal(activeLyricIndex(cues,7),0);
  assert.deepEqual(validateLyricCues([{start:3,text:'Another song'}],lines),[]);
  assert.deepEqual(validateLyricCues([{start:3,text:'Hallo'},{start:2,text:'Noch einmal'}],lines),[]);
  assert.deepEqual(readSongCues(A1_DAY22_MUSIC,{getItem:()=>JSON.stringify({objectKey:'different.mp3',cues})}),[]);
});
test('private attendance song uses native audio, repeats itself and cleans up without public CORS', async () => {
  const oldAudio=globalThis.Audio;
  class FakeAudio {
    events={}; currentTime=0; played=0;
    addEventListener(name,fn){this.events[name]=fn} removeEventListener(name){delete this.events[name]}
    async play(){this.played++} pause(){}
  }
  globalThis.Audio=FakeAudio;
  const context={addEventListener(){},removeEventListener(){},createMediaElementSource(){throw Error('Private audio must not enter Web Audio')}};
  try {
    let position=0;
    const player=await startWaitingMusicPlaylist(context,{gain:{value:.4}},{playlist:[{src:'https://example.com/signed',title:'Day 22',repeat:true,nativePlayback:true}],onTimeUpdate:n=>position=n});
    assert.equal(player.audio.crossOrigin,undefined);
    assert.equal(player.audio.volume,.4);
    player.audio.currentTime=12;player.audio.events.timeupdate();assert.equal(position,12);
    player.audio.events.ended();assert.equal(player.index,0);assert.equal(player.audio.played,2);
    stopWaitingMusicPlaylist(context);assert.equal(player.stopped,true);
    assert.equal(player.audio.events.timeupdate,undefined);
  } finally {globalThis.Audio=oldAudio}
});
