import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const source=fs.readFileSync(new URL('../src/pages/DashboardPage.jsx',import.meta.url),'utf8');
test('homepage removes requested panels and their marking/grammar readers',()=>{
 assert.doesNotMatch(source,/Top active class groups|Tutor review workflow|title="Student records"|Learning attention|Incoming work|<h2>Issue reports/);
 assert.doesNotMatch(source,/loadSubmissions|loadPendingTutorReviews|loadGrammarIssueReports|summarizeStudentAttention|groupTopClasses/);
 assert.match(source, /<AdminActionInbox user=\{user\} classes=\{liveClasses\}/);
 assert.doesNotMatch(source, /label="Open Marking"|label="Open Grammar Issues"|title="Today’s teaching"|title="Marking workspace"|title="Grammar workspace"/);
 assert.doesNotMatch(source, /Paid \/ active|Balance due|Payment focus|Largest balances/);
});
