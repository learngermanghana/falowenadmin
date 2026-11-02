import test from 'node:test';
import assert from 'node:assert/strict';
import {publishedVideoEnglish,lyricScenes,videoEnglishLines,videoLyricLines} from '../src/utils/musicLyricsVideo.js';
const key='music/b1/day-02/Freundschaft am Fluss.mp3';
const lyrics='[Verse]\nHallo\nNoch einmal\nHallo';
const data={objectKey:key,englishTranslation:{source:'course-draft',lines:[{de:'Hallo',en:'Hello'},{de:'Noch einmal',en:'Once more'},{de:'Hallo',en:'Hello'}]}};
test('video translation follows the exact path, preserving repeated lines without a title',()=>{
 const text=publishedVideoEnglish(data,key,lyrics);
 assert.equal(text,'Hello\nOnce more\nHello');
 const scenes=lyricScenes(lyrics,20,[],[],videoEnglishLines(text,videoLyricLines(lyrics)));
 assert.deepEqual(scenes[0].englishLines,['Hello','Once more','Hello']);
 assert.equal(publishedVideoEnglish(data,'music/b1/day-15/Freundschaft am Fluss.mp3',lyrics),'');
 assert.equal(publishedVideoEnglish(data,key,lyrics.replace('Noch einmal','Andere Worte')),'');
 assert.equal(publishedVideoEnglish(null,key,lyrics),'');
 assert.equal(publishedVideoEnglish(data,'',lyrics),'');
 assert.equal(publishedVideoEnglish({...data,englishTranslation:{lines:data.englishTranslation.lines.slice(0,2)}},key,lyrics),'');
});

test('published audio uses the readable download mode while uploaded audio remains local',async()=>{
 const {musicVideoAudioUrl}=await import('../src/utils/musicLyricsVideo.js');
 const track={id:'b1'};
 assert.equal(musicVideoAudioUrl('https://www.falowen.app/api/music?track=b1',track),'https://www.falowen.app/api/music?track=b1&download=1');
 assert.equal(musicVideoAudioUrl('blob:local-mp3',track),'blob:local-mp3');
});
