import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {getCuratedMusicByAssignment} from '../src/data/curatedLessonMusic.js';
import {getReusableSongDraft} from '../src/data/reusableMusicSongbook.js';
import {threeVerifiedHeardLyricQuestions} from '../src/utils/nextLyricQuestions.js';

test('Day 27 uses the Day 26 linked music player and keeps approved Handy weg recording',()=>{
 const stage=readFileSync(new URL('../src/components/MusicTeachingStages.jsx',import.meta.url),'utf8');
 assert.match(stage,/music\?\.assignmentKey === 'A2-10.27'\)\s*\{\s*return <LinkedPublishedSongLessonStage music=\{music\}/);
 const rec=getCuratedMusicByAssignment('A2-10.27');
 const song=getReusableSongDraft('A2-10.27');
 assert.equal(rec.title,'Handy weg');
 assert.equal(song.title,'Handy weg');
 assert.ok(rec.audioUrl.startsWith('https://'));
});
test('Shared A1 teacher fallback plays a short clip without typed timestamps or invented answers',()=>{
 const ui=readFileSync(new URL('../src/components/PublishedSongLessonStage.jsx',import.meta.url),'utf8');
 assert.match(ui,/Math\.min\(duration, start \+ 12\)/);
 assert.match(ui,/Welche Liedzeile hast du gehört\?/);
 assert.doesNotMatch(ui,/Startzeit in Sekunden/);
 assert.match(ui,/Keine automatische Bewertung/);
 const wrongPack={objectKey:'wrong-recording.mp3',lyrics:'some lyrics',cues:[]};
 assert.deepEqual(threeVerifiedHeardLyricQuestions(wrongPack,getCuratedMusicByAssignment('A2-10.27')),[]);
});
