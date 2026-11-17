import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('check-in email webhook carries verified class language to choose the correct join link',()=>{
  const source=readFileSync(new URL('../api/checkin-invitations.js',import.meta.url),'utf8');
  assert.match(source,/program: String\(klass\.program \|\| klass\.language \|\| ""\)\.trim\(\)\.toLowerCase\(\)/);
  assert.match(source,/action: "sendCheckinInvitations"/);
  assert.match(source,/checkinUrl: url\.toString\(\), recipients/);
  assert.doesNotMatch(source,/req\.body\?\.zoomUrl/);
  assert.doesNotMatch(source,/req\.body\?\.recipients/);
});
