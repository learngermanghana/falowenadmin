function normalize(value) {
  return String(value || "").trim();
}

function isOfficialRepairGeneratedMove(session = {}) {
  const reason = normalize(session.rescheduleReason || session.manualDateOverrideReason).toLowerCase();
  const source = normalize(session.scheduleAnchorSource || session.manualDateOverrideSource).toLowerCase();
  return /official.*timetable.*repair|timetable repaired atomically/.test(reason)
    || source === "official-schedule-repair";
}

export function isDeliberateManualReschedule(session = {}) {
  if (!session || isOfficialRepairGeneratedMove(session)) return false;
  const status = normalize(session.status || "scheduled").toLowerCase();
  return session.manualDateOverride === true
    || status === "rescheduled"
    || Boolean(session.rescheduledAt)
    || Boolean(session.previousStartsAt);
}

export function partitionRepairPlanItems(items = []) {
  const automaticItems = [];
  const preservedItems = [];

  (items || []).forEach((item) => {
    if (!item?.changed) return;
    if (isDeliberateManualReschedule(item.session)) preservedItems.push(item);
    else automaticItems.push(item);
  });

  return { automaticItems, preservedItems };
}
