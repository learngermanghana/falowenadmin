const { test, before, after } = require('node:test');
const fs = require('node:fs');
const { initializeTestEnvironment, assertSucceeds, assertFails } = require('@firebase/rules-unit-testing');
const { collection, collectionGroup, doc, getDoc, getDocs, setDoc, deleteDoc, updateDoc, serverTimestamp, Timestamp } = require('firebase/firestore');
let env;
before(async () => {
  env = await initializeTestEnvironment({
    projectId: 'demo-falowen-staff',
    firestore: { host: '127.0.0.1', port: 8080, rules: fs.readFileSync('firestore.rules', 'utf8') },
  });
  await env.withSecurityRulesDisabled(async context => {
    const db = context.firestore();
    for (const path of ['examTutorReviewQueue/review', 'ai_issue_reports/report', 'submissions/flat', 'submissions/A1/ST001/attempt-1', 'submissions/A1/posts/nested', 'courses/A1/submissions/legacy', 'answerKeyRegistry/key', 'markingJobs/job']) {
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
    await assertSucceeds(getDocs(collection(db, 'submissions', 'A1', 'ST001')));
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
    await assertFails(getDocs(collection(db, 'submissions', 'A1', 'ST001')));
    await assertFails(getDocs(collectionGroup(db, 'posts')));
    await assertFails(setDoc(doc(db, 'markingJobs/forbidden'), { studentId: 'student-owner' }));
  }
});

test('student submission ownership access is preserved', async () => {
  const db = env.authenticatedContext('student-owner', { email: 'owner@example.com' }).firestore();
  await assertSucceeds(getDoc(doc(db, 'submissions/flat')));
});


test('staff identity, owner email and staff claims can list, create and update private mock drafts', async () => {
  const tokens=[
    {email:'moxflex@gmail.com'},
    {email:'staff@falowen.app'},
    {staff:true},
    {admin:true},
    {role:'staff'},
    {role:'admin'},
  ];
  for(let index=0;index<tokens.length;index++){
    const db=env.authenticatedContext('draft-staff-'+index,tokens[index]).firestore();
    const id='a2-mock-'+String(index+10).padStart(2,'0');
    const ref=doc(db,'mockFactoryDrafts',id);
    const body={id,level:'A2',status:'draft',title:'A2 draft'};
    await assertSucceeds(getDocs(collection(db,'mockFactoryDrafts')));
    await assertSucceeds(setDoc(ref,body));
    await assertSucceeds(getDoc(ref));
    await assertSucceeds(setDoc(ref,{...body,status:'review'}));
    await assertFails(setDoc(ref,{...body,status:'published'}));
    await assertFails(setDoc(ref,{...body,level:'C2'}));
    await assertFails(deleteDoc(ref));
  }
});

test('students and signed-out visitors cannot list, inspect or write private mock drafts',async()=>{
  const teacher=env.authenticatedContext('teacher',{email:'staff@falowen.app'}).firestore();
  await assertSucceeds(setDoc(doc(teacher,'mockFactoryDrafts','a1-mock-19'),{
    id:'a1-mock-19',level:'A1',status:'draft',title:'Protected exam'
  }));
  for (const context of [
    env.authenticatedContext('student',{email:'student@example.com',role:'student'}),
    env.unauthenticatedContext()
  ]){
    const db=context.firestore();
    await assertFails(getDocs(collection(db,'mockFactoryDrafts')));
    await assertFails(getDoc(doc(db,'mockFactoryDrafts','a1-mock-19')));
    await assertFails(setDoc(doc(db,'mockFactoryDrafts','a1-mock-20'),{
      id:'a1-mock-20',level:'A1',status:'draft'
    }));
  }
});

test('Swahili feedback is written by verified teaching staff and read only by its learner', async () => {
  const staff = env.authenticatedContext('swahili-teacher', { role: 'tutor' }).firestore();
  const student = env.authenticatedContext('swahili-student').firestore();
  const other = env.authenticatedContext('other-learner').firestore();
  const unverified = env.authenticatedContext('unverified', { email: 'staff@falowen.app' }).firestore();
  const id = 'swahili-student_day-6';
  const review = { program: 'swahili', lessonId: 'swahili-day-6', studentId: 'swahili-student', status: 'reviewed', feedback: 'Practice requests.' };
  await assertSucceeds(getDocs(collectionGroup(staff, 'swahiliLessons')));
  await assertFails(getDocs(collectionGroup(student, 'swahiliLessons')));
  await assertFails(getDocs(collectionGroup(unverified, 'swahiliLessons')));
  await assertSucceeds(getDoc(doc(student, 'swahiliTeacherReviews', id)));
  await assertFails(setDoc(doc(student, 'swahiliTeacherReviews', id), review));
  await assertFails(setDoc(doc(staff, 'swahiliTeacherReviews', id), { ...review, lessonId: 'swahili-day-1' }));
  await assertSucceeds(setDoc(doc(staff, 'swahiliTeacherReviews', id), review));
  await assertSucceeds(getDoc(doc(student, 'swahiliTeacherReviews', id)));
  await assertFails(getDoc(doc(other, 'swahiliTeacherReviews', id)));
});


test('manual lead deletion lock stops concurrent staff follow-ups and limits owner deletion to closed records', async () => {
  const leadId = 'lock-test-closed';
  const leadPath = 'falowenManualLeads/' + leadId;
  await env.withSecurityRulesDisabled(async context => {
    const db = context.firestore();
    await setDoc(doc(db, 'falowenStaffAccess/staff-lead-test'), {
      active: true, pages: ['leads'], languages: ['german'],
    });
    await setDoc(doc(db, leadPath), {
      name: 'Lead Test', phone: '0244000000', location: 'Accra',
      email: '', language: 'german', level: 'A1', source: 'Phone call',
      notes: '', status: 'not_interested', assignedToUid: '',
      assignedToName: '', nextFollowUpAt: '',
      createdBy: 'lead-admin-test', createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(), lastFollowUpAt: null,
      lastContactNote: '', followUpCount: 0, deleting: false,
    });
  });
  const ownerDb = env.authenticatedContext('lead-admin-test', { admin: true }).firestore();
  const staffDb = env.authenticatedContext('staff-lead-test', {
    staff: true, staffPages: ['leads'], staffLanguages: ['german']
  }).firestore();
  const ownerRef = doc(ownerDb, leadPath);
  const staffRef = doc(staffDb, leadPath);
  const beforeActivity = {
    channel: 'call', status: 'not_interested',
    note: 'Declined to enroll', nextFollowUpAt: '',
    recordedByUid: 'staff-lead-test', recordedByName: 'Staff member',
    createdAt: serverTimestamp(),
  };
  await assertSucceeds(getDoc(staffRef));
  const interestedClass = {
    id: 'test-class', title: 'German A1', startDate: '2027-01-12', tuitionGhs: 3000,
  };
  await assertFails(updateDoc(staffRef, { interestedClass, updatedAt: serverTimestamp() }));
  await assertFails(updateDoc(ownerRef, {
    interestedClass: { ...interestedClass, tuitionGhs: -1 }, updatedAt: serverTimestamp(),
  }));
  await assertSucceeds(updateDoc(ownerRef, { interestedClass, updatedAt: serverTimestamp() }));
  await assertSucceeds(updateDoc(staffRef, { notes: 'Follow-up', updatedAt: serverTimestamp() }));
  await assertSucceeds(updateDoc(ownerRef, { interestedClass: null, updatedAt: serverTimestamp() }));
  await assertFails(deleteDoc(staffRef));
  await assertFails(deleteDoc(ownerRef)); // cannot delete without a lock
  await assertSucceeds(setDoc(doc(staffDb, leadPath, 'activities', 'before-lock'), beforeActivity));
  await assertSucceeds(updateDoc(ownerRef, { deleting: true, updatedAt: serverTimestamp() }));
  await assertFails(updateDoc(staffRef, { status: 'contacted', updatedAt: serverTimestamp() }));
  await assertFails(setDoc(doc(staffDb, leadPath, 'activities', 'after-lock'), beforeActivity));
  await assertFails(updateDoc(ownerRef, { status: 'new', updatedAt: serverTimestamp() }));
  await assertSucceeds(deleteDoc(doc(ownerDb, leadPath, 'activities', 'before-lock')));
  await assertSucceeds(deleteDoc(ownerRef));
  await assertFails(getDoc(staffRef));
});
