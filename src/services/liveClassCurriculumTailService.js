import { doc, runTransaction, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase.js';
import { planB1CurriculumTail } from '../utils/liveClassCurriculumTail.js';
import { sessionDateInTimezone } from '../utils/liveClassScheduling.js';
import { loadSchoolClosureDates } from './schoolClosureService.js';

export async function restoreB1CurriculumTail(classId, dashboard) {
  const closureDates = await loadSchoolClosureDates({ countryCode: 'GH' });
  const classRef = doc(db, 'classes', String(classId));
  const sessionRefs = dashboard.sessions.map(session => doc(db, 'classSessions', session.id));
  return runTransaction(db, async transaction => {
    const classSnap = await transaction.get(classRef);
    if (!classSnap.exists()) throw new Error('Class not found');
    const savedClass = classSnap.data();
    const klass = { ...savedClass, levelId: savedClass.levelId || dashboard.klass.levelId, id: String(classId), classId: String(classId) };
    const snapshots = await Promise.all(sessionRefs.map(ref => transaction.get(ref)));
    if (snapshots.some(snap => !snap.exists())) throw new Error('The class sessions changed. Reload the class to repair its remaining lessons.');
    const sessions = snapshots.filter(snap => snap.exists()).map(snap => ({ ...snap.data(), id: snap.id }));
    const additions = planB1CurriculumTail({ ...klass, excludedDates: [...(klass.excludedDates || []), ...closureDates] }, sessions);
    // Concurrent dashboard loads use the same deterministic session IDs. Never
    // overwrite a session or its attendance if another load already created it.
    const existing = await Promise.all(additions.map(session => transaction.get(doc(db, 'classSessions', session.id))));
    if (existing.some(snap => snap.exists())) return { repaired: false, created: 0 };
    additions.forEach(session => {
      transaction.set(doc(db, 'classSessions', session.id), {
        ...session, sequence: 0, createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
      });
      transaction.set(doc(db, 'attendance', String(classId), 'sessions', session.id), {
        ...session, className: klass.name || '', classSessionId: session.id,
        title: session.topic, date: sessionDateInTimezone(session.startsAt, klass.timezone || 'Africa/Accra'),
        sessionStatus: session.status, updatedAt: serverTimestamp(),
      }, { merge: true });
    });
    if (additions.length) transaction.update(classRef, {
      sessionDerivedEndDate: sessionDateInTimezone(additions.at(-1).startsAt, klass.timezone || 'Africa/Accra'),
      generatedSessionCount: sessions.length + additions.length,
      curriculumTailRepairAt: serverTimestamp(), updatedAt: serverTimestamp(),
    });
    return { repaired: additions.length > 0, created: additions.length, after: sessions.length + additions.length };
  });
}
