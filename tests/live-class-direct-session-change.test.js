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

test("the session save is required while secondary synchronization is best effort", async () => {
  const directService = await source(directServicePath);
  assert.match(directService, /await updateDoc\(sessionRef, patch\);/);
  assert.match(directService, /Promise\.allSettled\(writes\)/);
  assert.doesNotMatch(directService, /saveAnnouncementRow/);
  assert.doesNotMatch(directService, /emailQueue/);
  assert.doesNotMatch(directService, /auditLogs/);
  assert.doesNotMatch(directService, /studentNotifications/);
});

test("rescheduling cannot create two lessons at the same class time", async () => {
  const directService = await source(directServicePath);
  assert.match(directService, /assertTargetSlotAvailable/);
  assert.match(directService, /live-class\/time-conflict/);
  assert.match(directService, /already used by/);
  assert.match(directService, /Official class timetable repair/);
  assert.match(directService, /await assertTargetSlotAvailable\([\s\S]*?await updateDoc\(sessionRef, patch\);/);
});
