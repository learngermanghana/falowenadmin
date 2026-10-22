const { test } = require('node:test');
const assert = require('node:assert/strict');
const { markingHealth, STATUS_LIMIT } = require('./markingHealth');

function fakeDb(data) {
  return { collection: collection => ({
    where: (_field, _operator, state) => ({
      limit: count => ({ get: async () => ({
        docs: (data[collection] || []).filter(row => row.data.status === state)
          .slice(0, count).map(row => ({ id: row.id, data: () => row.data })),
      }) }),
    }),
  }) };
}

test('marking health is explicitly bounded and reports delayed jobs and Sheet failures', async () => {
  const now = Date.parse('2026-10-22T12:00:00Z');
  const jobs = Array.from({ length: STATUS_LIMIT + 3 }, (_, i) => ({
    id: 'j' + i, data: { automatic: true, status: 'pending',
      assignmentKey: 'A1-1.1', createdAt: new Date(now - 3600000).toISOString() },
  }));
  jobs.push({ id: 'review', data: { automatic: true, status: 'needs_review',
    error: 'Missing reference', assignmentKey: 'B1-2.5' } });
  jobs.push({ id: 'active', data: { automatic: true, status: 'marking',
    assignmentKey: 'A2-1.1', leaseUntil: now + 60000 } });
  const state = await markingHealth(fakeDb({
    markingJobs: jobs,
    automaticScoreSync: [{ id: 'sync', data: { status: 'needs_review' } }],
  }), now);
  assert.equal(state.samples.pending.sampled, STATUS_LIMIT);
  assert.equal(state.samples.pending.capped, true);
  assert.equal(state.samples.needs_review.sampled, 1);
  assert.equal(state.sheetSync.needs_review.sampled, 1);
  assert.equal(state.rows.filter(row => row.overdue).length, STATUS_LIMIT);
  assert.equal(state.rows.find(row => row.id === 'active').overdue, false);
  assert.ok(state.rows.every(row => !('submissionText' in row)));
});

test('missing timestamps are unknown, never silently treated as overdue', async () => {
  const health = await markingHealth(fakeDb({
    markingJobs: [{ id: 'j', data: { automatic: true, status: 'pending' } }],
  }), 1000000000000);
  assert.equal(health.rows[0].overdue, false);
});
