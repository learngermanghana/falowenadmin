import test from 'node:test';
import assert from 'node:assert/strict';
import {validatePublishedTiming} from '../src/hooks/useSongTiming.js';
const song={id:'sample',objectKey:'music/a2/day-19/song.mp3',lyrics:'[Verse]\nHallo\nHallo'};
const cues=[{start:4,text:'Hallo'},{start:10,text:'Hallo'}];
test('shared published timing matches the exact recording and repeated lyric lines',()=>{
 assert.deepEqual(validatePublishedTiming({objectKey:song.objectKey,cues},song),cues);
 assert.deepEqual(validatePublishedTiming({objectKey:'wrong',cues},song),[]);
 assert.deepEqual(validatePublishedTiming({objectKey:song.objectKey,cues:cues.slice(0,1)},song),[]);
 assert.deepEqual(validatePublishedTiming({objectKey:song.objectKey,cues:[{start:10,text:'Hallo'},{start:4,text:'Hallo'}]},song),[]);
});

test('line end times clear highlighting during instrumental breaks and survive validation',async()=>{
 const {validateLyricCues,activeLyricIndex}=await import('../src/utils/songLyrics.js');
 const cues=[{start:10,end:14,text:'Hallo'},{start:25,end:28,text:'Hallo'}];
 const checked=validateLyricCues(cues,['Hallo','Hallo']);
 assert.deepEqual(checked,cues);
 assert.equal(activeLyricIndex(checked,11),0);
 assert.equal(activeLyricIndex(checked,20),-1);
 assert.equal(activeLyricIndex(checked,26),1);
 assert.equal(activeLyricIndex(checked,29),-1);
 assert.deepEqual(validateLyricCues([{start:10,end:9,text:'Hallo'}],['Hallo']),[]);
});
