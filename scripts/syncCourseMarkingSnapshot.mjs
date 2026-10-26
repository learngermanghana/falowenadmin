// Pin both marking contracts to one learner repository revision per build.
import { readFileSync, writeFileSync } from 'node:fs';
import assert from 'node:assert/strict';
const repository = 'learngermanghana/falowenexamtrainer';
const target = new URL('../src/data/courseMarkingSnapshot.json', import.meta.url);
async function json(url) {
  const response = await fetch(url, { signal: AbortSignal.timeout(30000), headers: { 'User-Agent': 'Falowen-marking-sync' } });
  if (!response.ok) throw new Error(`Coursebook contract unavailable: ${response.status}`);
  return response.json();
}
const { sha: revision } = await json(`https://api.github.com/repos/${repository}/commits/main`);
assert.match(revision, /^[a-f0-9]{40}$/);
const root = `https://raw.githubusercontent.com/${repository}/${revision}/functions/data/`;
const [manifest, writingTasks, b1WritingTasks] = await Promise.all([
  json(root + 'answerKeyManifest.json'), json(root + 'a2GoetheWritingTasks.json'), json(root + 'b1WritingTasks.json'),
]);
const answerKeys = Object.fromEntries(Object.entries(manifest).filter(([, row]) => /^(A1|A2|B1)-/.test(row.assignment_id || '')));
const ids = Object.values(answerKeys).map(row => row.assignment_id);
assert.equal(new Set(ids).size, ids.length, 'Duplicate learner assignment keys');
for (const level of ['A1', 'A2', 'B1']) assert.ok(ids.filter(id => id.startsWith(level + '-')).length >= 19, `Incomplete ${level} contract`);
assert.equal(Object.keys(writingTasks).length, 28, 'Incomplete A2 writing contract');
assert.equal(Object.keys(b1WritingTasks).length, 28, 'Incomplete B1 writing contract');
const snapshot = { repository, revision, answerKeys, writingTasks, b1WritingTasks };
const expected = JSON.stringify(snapshot, null, 2) + '\n';
if (process.argv.includes('--check')) {
  const current = JSON.parse(readFileSync(target, 'utf8'));
  assert.deepEqual(current.answerKeys, answerKeys, 'Coursebook answer snapshot is stale');
  assert.deepEqual(current.writingTasks, writingTasks, 'Coursebook writing snapshot is stale');
  assert.deepEqual(current.b1WritingTasks, b1WritingTasks, 'B1 writing snapshot is stale');
} else writeFileSync(target, expected);
console.log(`Current coursebook marking contract: ${ids.length} assignments, 56 A2/B1 writing tasks, ${revision}`);
