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
