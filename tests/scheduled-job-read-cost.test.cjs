const test = require('node:test');
const assert = require('node:assert/strict');
const { runClassSessionReminderEmailJob } = require('../functions/classSessionReminderEmails.js');
const { runAutoCompleteClassSessionsJob } = require('../functions/autoCompleteClassSessions.js');

function emptyBoundedDatabase() {
  const reads = [];
  return { reads, collection(name) {
    assert.equal(name, 'classSessions', 'idle jobs must not read class or student directories');
    const filters = [];
    const query = {
      where(field, op, value) { filters.push({field,op,value}); return query; },
      async get() {
        assert.equal(filters.length,2,'session reads must have lower and upper bounds');
        assert.deepEqual(filters.map(item => item.op),['>=','<=']);
        reads.push(filters);
        return {docs:[],empty:true};
      },
    };
    return query;
  } };
}

test('an idle reminder tick makes bounded session reads and no roster reads', async () => {
  const db = emptyBoundedDatabase();
  const result = await runClassSessionReminderEmailJob({db,now:new Date('2026-11-09T10:00:00Z')});
  assert.equal(result.sent,0);
  assert.equal(result.autoOpen.opened,0);
  assert.equal(db.reads.length,6);
  for (const filters of db.reads) {
    const lower = new Date(filters[0].value).getTime();
    const upper = new Date(filters[1].value).getTime();
    assert.ok(upper-lower <= 252*60000);
  }
});

test('nightly completion uses the recent lookback window, never all session history', async () => {
  const db = emptyBoundedDatabase();
  const result = await runAutoCompleteClassSessionsJob({db,now:new Date('2026-11-09T21:05:00Z')});
  assert.equal(result.completed,0);
  assert.equal(db.reads.length,6);
  for (const filters of db.reads) {
    assert.equal(new Date(filters[1].value)-new Date(filters[0].value),14*86400000);
  }
});
