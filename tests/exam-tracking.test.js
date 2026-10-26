import test from 'node:test';
import assert from 'node:assert/strict';
import {trackingRows,filterTracking} from '../src/utils/examTracking.js';
test('unifies all sources without treating a missing score as zero',()=>{
 const rows=trackingRows([{id:'a',section:'hoeren',level:'A1',percent:0,date:'2026-10-25',name:'Ama'}],
 [{uid:'b',studentName:'Kojo',level:'B1',score:null,startedAt:'2026-10-26'}],
 [{id:'c',uid:'b',level:'B1',overallScore:85,status:'completed',mockId:'mock-01',updatedAt:'2026-10-24'}]);
 assert.deepEqual(rows.map(r=>r.skill),['sprechen','hoeren','mock']);
 assert.equal(rows[0].score,null);
 assert.equal(filterTracking(rows,{followUp:true}).length,2);
 assert.equal(filterTracking(rows,{skill:'hoeren',search:'ama',level:'A1'})[0].score,0);
 assert.equal(filterTracking(rows,{skill:'mock'})[0].score,85);
 assert.ok(!('answers' in rows[0]));
});
