import test from 'node:test';
import assert from 'node:assert/strict';
import { verifiedRecordedLyrics, recordedSongQuestions, selectRecordedLessonTrack } from '../src/utils/recordedLessonMusic.js';
const key='music/a2/day-19/lieber-online-oder-im-laden.mp3';
const id='r2-a2-day-19-lieber-online-oder-im-laden';
const track={id,title:'Lieber online oder im Laden',src:'https://www.falowen.app/api/music?track='+id,
  objectKey:key,nativePlayback:true};
const lyrics=['Mia braucht neue Schuhe für den Winter.','Doch sie kennt ihre Größe nicht genau.',
  'Das zweite sitzt viel bequemer.','Mia kauft es gleich und ist zufrieden.'].join('\n');
const cues=lyrics.split('\n').map((text,i)=>({start:i*6+1,text}));
test('exact matching recording text produces synchronized in-slide lyrics and two reviewed MCQs',()=>{
 const pack=verifiedRecordedLyrics({objectKey:key,lyrics,cues},track);
 assert.ok(pack);
 const questions=recordedSongQuestions(pack,19);
 assert.equal(questions.length,3);
 assert.ok(questions[0].options.length===3);
 assert.equal(questions[0].evidence,'Doch sie kennt ihre Größe nicht genau.');
 assert.equal(questions[1].correctIndex,1);
 assert.equal(questions[2].type,'speaking');
 assert.equal(verifiedRecordedLyrics({...pack,objectKey:'music/a2/day-19/different.mp3'},track),null);
 assert.equal(verifiedRecordedLyrics({...pack,cues:[...cues].reverse()},track),null);
});
test('a new recording with different lyrics receives only literal evidence-backed cloze MCQs',()=>{
 const newPack={lyrics:['Heute gehe ich in das Geschäft und suche eine Tasche.','Der Verkäufer möchte mir ein anderes Modell zeigen.',
 'Am Ende kaufe ich einen guten Koffer für meine Reise.','Morgen treffen wir uns an der Haltestelle.'].join('\n')};
 const questions=recordedSongQuestions(newPack,19);
 assert.equal(questions.length,3);
 assert.ok(questions.slice(0,2).every(q=>q.evidence.includes(q.answer)));
 assert.ok(questions.slice(0,2).every(q=>q.options[q.correctIndex]===q.answer));
});
test('Day 19 chooses the uploaded Die richtige Wahl when uniquely published',()=>{
 const row={id:'r2-a2-day-19-die-richtige-wahl',title:'Die richtige Wahl',level:'A2',day:19,
  objectKey:'music/a2/day-19/die-richtige-wahl.mp3',
  audioUrl:'https://www.falowen.app/api/music?track=r2-a2-day-19-die-richtige-wahl',
  autoDiscovered:true,coursebook:true};
 const other={...row,id:'r2-a2-day-19-other',title:'Other',objectKey:'music/a2/day-19/other.mp3',
 audioUrl:'https://www.falowen.app/api/music?track=r2-a2-day-19-other'};
 const selected=selectRecordedLessonTrack({tracks:[other,row]},{day:19,assignmentKey:'A2-7.19'});
 assert.equal(selected.objectKey,row.objectKey);
 assert.equal(selected.repeat,true);
});
