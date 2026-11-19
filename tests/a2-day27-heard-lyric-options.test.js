import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {getCuratedMusicByAssignment} from '../src/data/curatedLessonMusic.js';
import {getReusableSongDraft} from '../src/data/reusableMusicSongbook.js';
import {threeVerifiedHeardLyricQuestions} from '../src/utils/nextLyricQuestions.js';

test('Day 27 uses heard-lyric mode and keeps approved Handy weg recording',()=>{
 const stage=readFileSync(new URL('../src/components/MusicTeachingStages.jsx',import.meta.url),'utf8');
 assert.match(stage,/nextLyricOnly=\{music.assignmentKey === 'A2-10.27'\}/);
 const rec=getCuratedMusicByAssignment('A2-10.27');
 const song=getReusableSongDraft('A2-10.27');
 assert.equal(rec.title,'Handy weg');
 assert.equal(song.title,'Handy weg');
 assert.ok(rec.audioUrl.startsWith('https://'));
});
test('Day 27 teacher fallback allows 12-second playback and three choices without claiming verified answers',()=>{
 const ui=readFileSync(new URL('../src/components/PublishedSongLessonStage.jsx',import.meta.url),'utf8');
 assert.match(ui,/teacherLyricLines.length >= 3/);
 assert.match(ui,/end: start \+ 12/);
 assert.match(ui,/Welche Liedzeile hast du gehört\?/);
 assert.match(ui,/\[0,1,2\]\.map/);
 assert.match(ui,/nicht automatisch verifiziert/);
 const wrongPack={objectKey:'wrong-recording.mp3',lyrics:'some lyrics',cues:[]};
 assert.deepEqual(threeVerifiedHeardLyricQuestions(wrongPack,getCuratedMusicByAssignment('A2-10.27')),[]);
});
