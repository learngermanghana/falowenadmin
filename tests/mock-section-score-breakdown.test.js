import {test} from 'node:test';import assert from 'node:assert/strict';import {mockScoreBreakdown} from '../src/utils/mockAttemptMonitoring.js';
test('shows four skill scores and lowest section including zero',()=>{
 const rows=mockScoreBreakdown({sectionScores:{lesen:0,hoeren:20,schreiben:12,sprechen:25}});
 assert.equal(rows.length,4);assert.equal(rows[0].score,0);assert.equal(rows[0].weakest,true);assert.equal(rows[1].weakest,false);
});
test('missing scores are unavailable, not zero or a fabricated weakest skill',()=>{
 const rows=mockScoreBreakdown({sectionScores:{lesen:10}});assert.equal(rows[1].score,null);assert.ok(rows.every(row=>!row.weakest));
});
