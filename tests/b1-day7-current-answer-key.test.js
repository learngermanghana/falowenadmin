import test from 'node:test';
import assert from 'node:assert/strict';
import {canonicalCourseReference} from '../src/utils/canonicalCourseReference.js';
import {computeObjectiveScore} from '../src/utils/objectiveMarking.js';
import {exactObjectiveFeedback} from '../src/utils/markingQuality.js';
const submitted='TEIL 3 1. A 2. B 3. B 4. B 5. B 6. C 7. A 8. F 9. B 10. C 11. D 12. E  TEIL 4 1. B 2. B 3. A 4. A 5. B';
test('reported B1 Day 7 submission scores all 17 current questions correctly in direct and canonical marking',()=>{
 for(const reference of [null,canonicalCourseReference('B1-3.7')]){
  const result=computeObjectiveScore('B1-3.7',submitted,reference);
  assert.equal(result.totalCount,17);assert.equal(result.correctCount,17);
  assert.equal(Object.values(result.details).filter(r=>r.partId==='teil3').length,12);
  assert.equal(Object.values(result.details).filter(r=>r.partId==='teil4').length,5);
  assert.ok(Object.values(result.details).every(r=>r.correct));
  assert.equal(exactObjectiveFeedback(result),'Teil 3: 12/12 correct. Teil 4: 5/5 correct. All objective answers are correct.');
 }
});
test('wrong or absent listening answers still lose marks instead of being shifted or ignored',()=>{
 const wrong=computeObjectiveScore('B1-3.7',submitted.replace('TEIL 4 1. B','TEIL 4 1. A'),canonicalCourseReference('B1-3.7'));
 assert.equal(wrong.correctCount,16);assert.equal(wrong.totalCount,17);assert.equal(wrong.details['teil4.1'].correct,false);
 const missing=computeObjectiveScore('B1-3.7',submitted.slice(0,submitted.lastIndexOf('5. B')),canonicalCourseReference('B1-3.7'));
 assert.equal(missing.correctCount,16);assert.equal(missing.totalCount,17);assert.equal(missing.details['teil4.5'].student,'');
});
