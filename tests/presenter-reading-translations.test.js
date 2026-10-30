import test from 'node:test';
import assert from 'node:assert/strict';
import {PRESENTER_READING_TRANSLATIONS} from '../src/data/presenterReadingTranslations.js';
import {savedReadingTranslation} from '../src/utils/presenterReadingTranslation.js';
import {getSlidesByCourse} from '../src/data/teachingSlides.js';
import {buildTeachingPresenterStages} from '../src/utils/teachingPresenter.js';
import {splitPresenterSentences} from '../src/utils/presenterSentenceNumbering.js';

test('every current A2/B1 reading sentence has saved English matching the exact German source',()=>{
 let sentences=0;
 assert.equal(Object.keys(PRESENTER_READING_TRANSLATIONS).length,56);
 for(const level of ['A2','B1']){
  const slides=getSlidesByCourse(level);assert.equal(slides.length,28);
  for(const slide of slides){
   const reading=buildTeachingPresenterStages(slide).find(s=>s.variant==='lesson-reading');assert.ok(reading,slide.assignmentId);
   const german=splitPresenterSentences(reading.textDe);
   const saved=PRESENTER_READING_TRANSLATIONS[slide.assignmentId].reading;
   assert.deepEqual(saved.map(row=>row.de),german,slide.assignmentId+' requires translation review after a text edit');
   for(const row of saved){assert.ok(row.en.length>=12);assert.notEqual(row.en,row.de);assert.equal(savedReadingTranslation(slide.assignmentId,'reading',row.de),row.en);sentences++;}
  }
 }
 assert.equal(sentences,280);
 assert.ok(Object.keys(PRESENTER_READING_TRANSLATIONS).every(key=>/^(A2|B1)-/.test(key)),'B2 content is outside scope');
});
test('changed German or wrong lesson cannot receive a stale translation',()=>{
 const source=PRESENTER_READING_TRANSLATIONS['A2-1.1'].reading[0];
 assert.equal(savedReadingTranslation('A2-1.1','reading',source.de+' Changed.'),'');
 assert.equal(savedReadingTranslation('B1-1.1','reading',source.de),'');
 assert.equal(savedReadingTranslation('B2-1.1','reading',source.de),'');
 assert.equal(savedReadingTranslation('A2-1.1','answers',source.de),'');
});
