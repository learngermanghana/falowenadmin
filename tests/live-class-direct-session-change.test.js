import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const directServicePath = new URL("../src/services/liveClassSessionDirectService.js", import.meta.url);
const serviceIndexPath = new URL("../src/services/liveClassService.js", import.meta.url);

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
  assert.match(directService, /transaction\.update\(sessionRef, patch\)/);
  assert.match(directService, /transaction\.set\(attendanceRef,[\s\S]*?\{ merge: true \}\)/);
  assert.match(directService, /transaction\.set\(classRef, changeMetadata, \{ merge: true \}\)/);
  assert.match(directService, /transaction\.set\(calendarRef,[\s\S]*?\{ merge: true \}\)/);
  assert.match(directService, /transaction\.set\(auditRef,/);
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
  assert.match(directService, /latestSessionSequence !== expectedSessionSequence/);
  assert.match(directService, /latestClassVersion !== expectedClassVersion/);
  assert.match(directService, /live-class\/stale-session/);
  assert.match(directService, /Refresh Live Classes and try again/);
});

test("rescheduling cannot create two lessons at the same class time", async () => {
  const directService = await source(directServicePath);
  assert.match(directService, /assertTargetSlotAvailable/);
  assert.match(directService, /live-class\/time-conflict/);
  assert.match(directService, /already used by/);
  assert.match(directService, /Official class timetable repair/);
  assert.match(directService, /await assertTargetSlotAvailable\([\s\S]*?await commitSessionChangeAtomically\(/);
});
