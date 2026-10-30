import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { CURATED_MUSIC_DAYS, getCuratedMusicByAssignment, getCuratedMusicForSession } from '../src/data/curatedLessonMusic.js';
import { getReusableMusicQuestions } from '../src/data/reusableMusicQuestions.js';
import { getReusableSongDraft } from '../src/data/reusableMusicSongbook.js';

test('only selected approved R2 music songs activate in teaching slides and attendance', () => {
  const published=CURATED_MUSIC_DAYS.filter(item=>item.status==='published');
  assert.equal(published.length,8);
  assert.deepEqual(published.map(x=>x.assignmentKey),['A1-0.2','A1-1.1','A1-2','A1-3.5','A1-3.6','A1-13','A1-14.1','A2-7.18']);
  for(const item of published){
    if (item.discover) {
      assert.equal(item.assignmentKey,'A1-3.5');
      assert.equal(item.audioUrl,undefined);
      assert.equal(item.objectKey,undefined);
    } else {
      assert.ok(item.audioUrl.startsWith('https://www.falowen.app/api/music?track='));
      assert.ok(item.objectKey.startsWith('music/'));
    }
    // Approved teacher music isn't required to mention Falowen in its lyrics.
    // The lesson must still have a real, nonempty songbook transcript.
    assert.ok(getReusableSongDraft(item.assignmentKey)?.lyrics?.trim());
    assert.equal(getReusableMusicQuestions(item.assignmentKey).questions.length,3);
    assert.equal(getCuratedMusicForSession({level:item.level,day:item.day}),item);
    assert.equal(getCuratedMusicByAssignment(item.assignmentKey),item);
  }
  assert.equal(getCuratedMusicByAssignment('A2-10.26'),null);
  assert.ok(CURATED_MUSIC_DAYS.some(item=>item.status==='planned'));
});

test('attendance uses R2 for curated lessons without waiting on a catalog or falling back to GitHub', () => {
 const source=readFileSync(new URL('../src/pages/CheckinDisplayPage.jsx',import.meta.url),'utf8');
 assert.match(source,/getCuratedMusicForSession/);
 assert.match(source,/if \(curatedDayMusic\)/);
 assert.match(source,/nativePlayback: true/);
 assert.match(source,/src: curatedDayMusic\.audioUrl, objectKey: curatedDayMusic\.objectKey/);
 assert.doesNotMatch(source,/\[publishedDayMusic\.track, \.\.\.pianoPlaylist\]/);
 const player=readFileSync(new URL('../src/utils/pianoAudio.js',import.meta.url),'utf8');
 assert.match(player,/const nativePlayback = tracks\.every\(track => track\.nativePlayback === true\)/);
 assert.match(player,/if \(!nativePlayback\) audio\.crossOrigin/);
 assert.match(player,/onTimeUpdate/);
 assert.match(player,/player\.source\?\.disconnect\(\)/);
});

test('A1 presenter adds exactly a selected-day music stage and A2 uses approved R2 music', () => {
 const a1=readFileSync(new URL('../src/components/A1GrammarPresenter.jsx',import.meta.url),'utf8');
 const a2=readFileSync(new URL('../src/data/a2Day18BankMusic.js',import.meta.url),'utf8');
 const music=readFileSync(new URL('../src/components/PublishedSongLessonStage.jsx',import.meta.url),'utf8');
 assert.match(a1,/getCuratedMusicByAssignment\(slide\.assignmentId\)/);
 assert.match(a1,/stage\.type === "published-music"/);
 assert.match(a2,/getReusableSongDraft\(assignmentKey\)/);
 assert.match(a2,/getReusableMusicQuestions\(assignmentKey\)/);
 assert.doesNotMatch(a2,/youtubeId:\s*"/);
 assert.match(music,/Hören · Liedtext verstehen · Sprechen/);
 assert.match(music,/view==='lyrics'/);
 assert.match(music,/view==='questions'/);
 assert.match(music,/getReusableMusicQuestions\(assignmentKey\)/);
 assert.match(music,/onError/);
});

test('attendance dynamically matches existing R2 uploads while retaining curated A2 Day 18 and unchanged lyrics', () => {
 const page = readFileSync(new URL('../src/pages/CheckinDisplayPage.jsx', import.meta.url),'utf8');
 assert.match(page,/if \(curatedDayMusic\) return/);
 assert.match(page,/waitingRoomDiscoveredMusicTrack\(data/);
 assert.match(page,/src: curatedDayMusic\.audioUrl, objectKey: curatedDayMusic\.objectKey/);
 assert.match(page,/could not be identified uniquely/);
 assert.doesNotMatch(page,/getReusableSongDraft\('A2-7\.19'\).*lyrics\s*=/);
});

test("curated Day 21 and Day 22 songs use the new uploaded R2 audio instead of obsolete health music",()=>{
  const day21=getCuratedMusicForSession({level:"A1",day:21});
  const day22=getCuratedMusicForSession({level:"A1",day:22});
  assert.equal(day21.assignmentKey,"A1-13");
  assert.equal(day21.title,"Heute kann ich leider nicht");
  assert.equal(day21.objectKey,"music/a1/day-21/Heute kann ich leider nicht.mp3");
  assert.equal(day22.assignmentKey,"A1-14.1");
  assert.equal(day22.title,"Arzttermin");
  assert.equal(day22.objectKey,"music/a1/day-22/Arzttermin.mp3");
  assert.notEqual(day22.trackId,"a1-day-22-health");
  for(const song of [day21,day22]){
    const match=song.trackId.match(/^r2-a1-day-(\d+)-b64_([A-Za-z0-9_-]+)$/);
    assert.ok(match,song.trackId);
    assert.equal(Number(match[1]),song.day);
    assert.equal(Buffer.from(match[2],"base64url").toString("utf8"),song.objectKey.split("/").at(-1));
    assert.equal(song.audioUrl,"https://www.falowen.app/api/music?track="+song.trackId);
  }
});
