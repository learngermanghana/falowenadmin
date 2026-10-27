import { test } from 'node:test';
import assert from 'node:assert/strict';
import { assignmentTitle } from '../src/utils/assignmentTitle.js';

test('legacy assignment flags never replace the title', () => {
  for (const flag of [true, false, 'true', 'TRUE', ' false ', {}, 1]) {
    assert.equal(assignmentTitle(flag, 'A1 · Day 1 · Grüße'), 'A1 · Day 1 · Grüße');
    assert.equal(assignmentTitle(flag, undefined, 'A1-1.1'), 'A1-1.1');
  }
  assert.equal(assignmentTitle('  A2 · Mein Alltag  ', 'A2-1.1'), 'A2 · Mein Alltag');
  assert.equal(assignmentTitle(true), '');
});
