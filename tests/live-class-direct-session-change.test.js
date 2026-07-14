import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const directServicePath = new URL("../src/services/liveClassSessionDirectService.js", import.meta.url);
const serviceIndexPath = new URL("../src/services/liveClassService.js", import.meta.url);
const reschedulePlanPath = new URL("../src/utils/liveClassReschedulePlan.js", import.meta.url);

async function source(path) {
  return readFile(path, "utf8");
}

test("move and cancel use the direct session mutation service", async () => {
  const serviceIndex = await source(serviceIndexPath);
  assert.match(serviceIndex, /liveClassSessionDirectService\.js/);
  assert.doesNotMatch(serviceIndex, /liveClassCancelService\.js/);
  assert.doesNotMatch(serviceIndex, /liveClassRescheduleService\.js/);
});

test("session, attendance, class, calendar and audit records commit atomically", async () => {
  const directService = await source(directServicePath);
  assert.match(directService, /runTransaction/);
  assert.match(directService, /preparedChanges\.forEach/);
  assert.match(directService, /transaction\.update\(change\.sessionRef, change\.patch\)/);
  assert.match(directService, /transaction\.set\(change\.attendanceRef,[\s\S]*?\{ merge: true \}\)/);
  assert.match(directService, /transaction\.set\(classRef, changeMetadata, \{ merge: true \}\)/);
  assert.match(directService, /transaction\.set\(calendarRef,[\s\S]*?\{ merge: true \}\)/);
  assert.match(directService, /transaction\.set\(auditRef,/);
  assert.match(directService, /affectedSessionIds/);
  assert.match(directService, /reminderScheduleVersion/);
  assert.match(directService, /atomicWrite: true/);
  assert.doesNotMatch(directService, /await updateDoc\(sessionRef, patch\)/);
  assert.doesNotMatch(directService, /syncOptionalReferences/);
  assert.doesNotMatch(directService, /Promise\.allSettled\(writes\)/);
  assert.doesNotMatch(directService, /saveAnnouncementRow/);
  assert.doesNotMatch(directService, /emailQueue/);
  assert.doesNotMatch(directService, /studentNotifications/);
});

test("atomic session changes reject stale concurrent edits", async () => {
  const directService = await source(directServicePath);
  assert.match(directService, /latestSequence !== change\.expectedSequence/);
  assert.match(directService, /latestClassVersion !== expectedClassVersion/);
  assert.match(directService, /live-class\/stale-session/);
  assert.match(directService, /Refresh Live Classes and try again/);
});

test("rescheduling detects partial overlaps and supports shifting following lessons", async () => {
  const [directService, reschedulePlan] = await Promise.all([
    source(directServicePath),
    source(reschedulePlanPath),
  ]);
  assert.match(directService, /buildSessionReschedulePlan/);
  assert.match(directService, /mode: payload\.moveMode/);
  assert.match(directService, /commitSessionChangesAtomically/);
  assert.match(directService, /movedSessions: reschedulePlan\.affectedCount/);
  assert.match(reschedulePlan, /left\.start\.getTime\(\) < right\.end\.getTime\(\)/);
  assert.match(reschedulePlan, /left\.end\.getTime\(\) > right\.start\.getTime\(\)/);
  assert.match(reschedulePlan, /live-class\/time-overlap/);
  assert.match(reschedulePlan, /live-class\/curriculum-order/);
  assert.match(reschedulePlan, /Move this and all following sessions/);
  assert.match(reschedulePlan, /ordered\.slice\(selectedIndex\)/);
});
