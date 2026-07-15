import { formatAccraDateTime } from "../utils/liveClassCancellationEmail.js";
import { buildRescheduleAnnouncement } from "../utils/liveClassRescheduleEmail.js";
import { saveAnnouncementRow } from "./communicationService.js";

function normalize(value) {
  return String(value || "").trim();
}

function byNewStart(left = {}, right = {}) {
  const leftTime = new Date(left.patch?.startsAt || left.session?.startsAt || 0).getTime();
  const rightTime = new Date(right.patch?.startsAt || right.session?.startsAt || 0).getTime();
  return leftTime - rightTime;
}

function confirmedDelivery(receipt = {}) {
  return Boolean(
    (receipt.sheet?.attempted && receipt.sheet?.success)
      || (receipt.firestore?.attempted && receipt.firestore?.success),
  );
}

function deliveryMessage(receipt = {}) {
  if (receipt.sheet?.attempted) return normalize(receipt.sheet.message);
  if (receipt.firestore?.attempted) return normalize(receipt.firestore.message);
  return "Communication delivery is not configured. Add the announcement webhook in Communication settings.";
}

export async function submitRescheduleCommunication({
  klass = {},
  primarySession = {},
  sessionChanges = [],
  startsAt = "",
  suppressCommunication = false,
} = {}) {
  if (suppressCommunication) {
    return {
      emailSubmitted: true,
      emailMessage: "Automatic recovery completed without sending a student announcement.",
      communicationSuppressed: true,
    };
  }

  const orderedChanges = [...sessionChanges].sort(byNewStart);
  const lastChange = orderedChanges[orderedChanges.length - 1] || null;
  const lastAffectedSession = lastChange?.session || null;
  const lastAffectedStartsAt = lastChange?.patch?.startsAt || lastAffectedSession?.startsAt || "";
  const nextPrimaryStart = startsAt || orderedChanges.find((change) => (
    normalize(change.session?.id) === normalize(primarySession.id)
  ))?.patch?.startsAt || "";

  const emailPayload = buildRescheduleAnnouncement({
    klass,
    session: primarySession,
    previousTime: formatAccraDateTime(primarySession.startsAt),
    newTime: formatAccraDateTime(nextPrimaryStart),
    affectedCount: Math.max(1, orderedChanges.length),
    lastAffectedSession,
    lastAffectedTime: formatAccraDateTime(lastAffectedStartsAt),
  });

  try {
    const receipt = await saveAnnouncementRow({
      announcement: emailPayload.announcement,
      className: emailPayload.className,
      date: String(nextPrimaryStart || new Date().toISOString()).slice(0, 10),
      deliveryMode: "auto",
      link: "",
      topic: emailPayload.topic,
    });
    const emailSubmitted = confirmedDelivery(receipt);
    return {
      emailSubmitted,
      emailMessage: deliveryMessage(receipt),
      communicationSuppressed: false,
      communicationTopic: emailPayload.topic,
      communicationAffectedCount: emailPayload.affectedCount,
      communicationFollowingCount: emailPayload.followingCount,
      communicationLastAffectedLesson: emailPayload.lastAffectedLesson,
    };
  } catch (error) {
    return {
      emailSubmitted: false,
      emailMessage: error?.message || "Could not queue the reschedule announcement.",
      communicationSuppressed: false,
      communicationTopic: emailPayload.topic,
      communicationAffectedCount: emailPayload.affectedCount,
      communicationFollowingCount: emailPayload.followingCount,
      communicationLastAffectedLesson: emailPayload.lastAffectedLesson,
    };
  }
}
