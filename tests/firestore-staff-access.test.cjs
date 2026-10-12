const { test, before, after } = require('node:test');
const fs = require('node:fs');
const { initializeTestEnvironment, assertSucceeds, assertFails } = require('@firebase/rules-unit-testing');
const { collection, collectionGroup, doc, getDoc, getDocs, setDoc } = require('firebase/firestore');
let env;
before(async () => {
  env = await initializeTestEnvironment({
    projectId: 'demo-falowen-staff',
    firestore: { host: '127.0.0.1', port: 8080, rules: fs.readFileSync('firestore.rules', 'utf8') },
  });
  await env.withSecurityRulesDisabled(async context => {
    const db = context.firestore();
    for (const path of ['examTutorReviewQueue/review', 'ai_issue_reports/report', 'submissions/flat', 'submissions/A1/posts/nested', 'courses/A1/submissions/legacy', 'answerKeyRegistry/key', 'markingJobs/job']) {
      await setDoc(doc(db, path), { studentId: 'student-owner', userId: 'student-owner', status: 'pending' });
    }
  });
});
after(async () => { await env?.cleanup(); });

for (const [label, token] of [
  ['admin email', { email: 'moxflex@gmail.com' }],
  ['staff email', { email: 'staff@falowen.app' }],
  ['admin claim', { admin: true }],
  ['staff claim', { staff: true }],
  ['admin role', { role: 'admin' }],
  ['staff role', { role: 'staff' }],
]) {
  test(`${label} can load dashboard panels and all submission shapes`, async () => {
    const db = env.authenticatedContext(`operator-${label.replace(/ /g, '-')}`, token).firestore();
    for (const name of ['examTutorReviewQueue', 'ai_issue_reports', 'answerKeyRegistry', 'markingJobs']) await assertSucceeds(getDocs(collection(db, name)));
    await assertSucceeds(getDocs(collectionGroup(db, 'submissions')));
    await assertSucceeds(getDocs(collectionGroup(db, 'posts')));
    await assertSucceeds(setDoc(doc(db, 'markingJobs/new-job'), { studentId: 'student-owner' }));
  });
}

test('ordinary student and signed-out accounts cannot access staff panels or other students submissions', async () => {
  for (const context of [env.authenticatedContext('other-student', { email: 'student@example.com', role: 'student' }), env.unauthenticatedContext()]) {
    const db = context.firestore();
    for (const name of ['examTutorReviewQueue', 'ai_issue_reports', 'answerKeyRegistry', 'markingJobs']) await assertFails(getDocs(collection(db, name)));
    await assertFails(getDoc(doc(db, 'submissions/flat')));
    await assertFails(getDocs(collectionGroup(db, 'posts')));
    await assertFails(setDoc(doc(db, 'markingJobs/forbidden'), { studentId: 'student-owner' }));
  }
});

test('student submission ownership access is preserved', async () => {
  const db = env.authenticatedContext('student-owner', { email: 'owner@example.com' }).firestore();
  await assertSucceeds(getDoc(doc(db, 'submissions/flat')));
});
