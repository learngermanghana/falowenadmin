import fs from "node:fs";

const target = new URL("../src/components/PresenterSessionTimer.jsx", import.meta.url);
let source = fs.readFileSync(target, "utf8");

const oldGuard = "    if (!presenterLive.hasSnapshot || !presenterLive.isToday || !presenterLive.isRemoteState || !remoteStamp) return;";
const newGuard = "    if (!presenterLive.hasSnapshot || !presenterLive.isToday || !remoteStamp) return;";
if (!source.includes(newGuard)) {
  if (!source.includes(oldGuard)) throw new Error("Presenter timer remote guard anchor changed");
  source = source.replace(oldGuard, newGuard);
}

const oldInitialPublish = "      timerExpired: remaining <= 0,\n      timerUpdatedAtMs: Date.now(),";
const newInitialPublish = "      timerExpired: remaining <= 0,\n      timerUpdatedBy: presenterLive.deviceId,\n      timerUpdatedAtMs: Date.now(),";
if (!source.includes(newInitialPublish)) {
  if (!source.includes(oldInitialPublish)) throw new Error("Presenter timer initial publish anchor changed");
  source = source.replace(oldInitialPublish, newInitialPublish);
}

const oldPublishHelper = "      timerDurationSeconds: durationSeconds,\n      timerWarned: warnedMilestones,\n      timerUpdatedAtMs: Date.now(),";
const newPublishHelper = "      timerDurationSeconds: durationSeconds,\n      timerWarned: warnedMilestones,\n      timerUpdatedBy: presenterLive.deviceId,\n      timerUpdatedAtMs: Date.now(),";
if (!source.includes(newPublishHelper)) {
  if (!source.includes(oldPublishHelper)) throw new Error("Presenter timer publish helper anchor changed");
  source = source.replace(oldPublishHelper, newPublishHelper);
}

source = source.replace(
  "presenterLive.hasSnapshot, presenterLive.isToday, presenterLive.isRemoteState, level, durationSeconds",
  "presenterLive.hasSnapshot, presenterLive.isToday, level, durationSeconds",
);

fs.writeFileSync(target, source, "utf8");
console.log("Presenter class timer now consumes the newest shared timer snapshot regardless of unrelated presenter ownership changes.");
