import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('lead deletion uses bound secrets and enforces admin authorization', () => {
  const patch = readFileSync('scripts/patchStudentLeadDeletionRuntime.mjs', 'utf8');
  assert.match(patch, /studentDeleteAppsScriptUrlSecret\.value\(\)/);
  assert.match(patch, /studentDeleteSyncSecret\.value\(\)/);
  assert.match(patch, /if \(!isAdmin\) return res\.status\(403\)/);
  assert.match(patch, /data\?\.error \|\| data\?\.message/);
});
