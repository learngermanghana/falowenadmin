import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const directServicePath = new URL("../src/services/liveClassSessionDirectService.js", import.meta.url);
const recoveryServicePath = new URL("../src/services/liveClassRescheduleRecoveryService.js", import.meta.url);
const serviceIndexPath = new URL("../src/services/liveClassService.js", import.meta.url);
const reschedulePlanPath = new URL("../src/utils/liveClassReschedulePlan.js", import.meta.url);
const healthServicePath = new URL("../src/services/liveClassScheduleHealthService.js", import.meta.url);
const healthDashboardPath = new URL("../src/components/ScheduleHealthDashboard.jsx", import.meta.url);
const repairPanelPath = new URL("../src/components/LiveClassLessonDateRepair.jsx", import.meta.url);

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

test("legacy collisions recover the latest moved lesson and all following lessons", async () => {
  const [serviceIndex, recoveryService, reschedulePlan, repairPanel] = await Promise.all([
    source(serviceIndexPath),
    source(recoveryServicePath),
    source(reschedulePlanPath),
    source(repairPanelPath),
  ]);
  assert.match(serviceIndex, /recoverLegacyRescheduleCollision/);
  assert.match(recoveryService, /inspectLegacyRescheduleCollision/);
  assert.match(recoveryService, /moveMode: "following"/);
  assert.match(recoveryService, /previousStartsAt/);
  assert.match(recoveryService, /live-class\/curriculum-order/);
  assert.match(recoveryService, /live-class\/time-overlap/);
  assert.match(reschedulePlan, /recoveryBaseline/);
  assert.match(reschedulePlan, /recoveredFromPreviousStart/);
  assert.match(repairPanel, /recoverLegacyRescheduleCollision/);
  assert.match(repairPanel, /legacy reschedule collision\(s\) repaired/);
});

test("moves and cancellations recalculate all class end-date fields and timetable health", async () => {
  const directService = await source(directServicePath);
  assert.match(directService, /buildClassScheduleHealth/);
  assert.match(directService, /proposedEndDate/);
  assert.match(directService, /scheduleStateClassPatch/);
  assert.match(directService, /configuredEndDate: endDate/);
  assert.match(directService, /holidayAdjustedEndDate: endDate/);
  assert.match(directService, /sessionDerivedEndDate: endDate/);
  assert.match(directService, /changeType: "cancelled"[\s\S]*?classPatch/);
  assert.match(directService, /changeType: "rescheduled"[\s\S]*?classPatch/);
  assert.match(directService, /timetableHealthClassFields/);
});

test("schedule health persistence pauses and restores future reminders", async () => {
  const [healthService, healthDashboard] = await Promise.all([
    source(healthServicePath),
    source(healthDashboardPath),
  ]);
  assert.match(healthService, /validateAndSaveClassScheduleHealth/);
  assert.match(healthService, /scheduleHealthRemindersSuppressed/);
  assert.match(healthService, /reminderSuppressionSource: pauseForHealth \? "schedule-health" : ""/);
  assert.match(healthService, /writeBatch/);
  assert.match(healthDashboard, /ScheduleHealthPanel/);
  assert.match(healthDashboard, /Check every class/);
  assert.match(healthDashboard, /validateAndSaveClassScheduleHealth/);
});
