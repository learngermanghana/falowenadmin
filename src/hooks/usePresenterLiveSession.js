import { useCallback, useEffect, useMemo, useState } from "react";
import { inferPresenterLevel } from "../utils/presenterSessionTiming.js";
import {
  getPresenterClassContext,
  getPresenterDeviceId,
  presenterLocalDateKey,
  publishPresenterLiveSession,
  setPresenterClassContext,
  subscribePresenterClassContext,
  subscribePresenterLiveSession,
} from "../services/presenterLiveSessionService.js";

const PRESENTER_HEARTBEAT_MS = 90 * 1000;

function normalize(value) {
  return String(value || "").trim();
}

export default function usePresenterLiveSession(slide = {}) {
  const [classContext, setClassContext] = useState(getPresenterClassContext);
  const [liveState, setLiveState] = useState({});
  const [syncState, setSyncState] = useState("waiting");
  const [hasSnapshot, setHasSnapshot] = useState(false);
  const deviceId = useMemo(() => getPresenterDeviceId(), []);
  const classRecordId = normalize(classContext.classRecordId);
  const sessionDate = presenterLocalDateKey();
  const level = inferPresenterLevel(
    slide?.course,
    slide?.levelId,
    slide?.assignmentId,
    slide?.id,
    slide?.title,
    slide?.topic,
  );
  const lessonId = normalize(slide?.id || slide?.assignmentId);
  const assignmentId = normalize(slide?.assignmentId || slide?.id);
  const sessionKey = normalize(liveState?.sessionKey || classContext.sessionKey);

  useEffect(() => subscribePresenterClassContext((next) => {
    setClassContext({
      classId: normalize(next?.classId),
      classRecordId: normalize(next?.classRecordId),
      sessionKey: normalize(next?.sessionKey),
    });
  }), []);

  useEffect(() => {
    setLiveState({});
    setHasSnapshot(false);
    if (!classRecordId) {
      setSyncState("waiting");
      return undefined;
    }
    setSyncState("connecting");
    return subscribePresenterLiveSession(
      classRecordId,
      (next) => {
        setLiveState(next || {});
        setHasSnapshot(true);
        setSyncState("live");
      },
      (error) => {
        console.error("presenter live-session subscription failed", error);
        setSyncState("offline");
      },
    );
  }, [classRecordId]);

  useEffect(() => {
    const nextSessionKey = normalize(liveState?.sessionKey);
    if (!nextSessionKey || nextSessionKey === normalize(classContext.sessionKey)) return;
    setPresenterClassContext({
      classId: classContext.classId,
      classRecordId,
      sessionKey: nextSessionKey,
    });
  }, [liveState?.sessionKey, classContext.classId, classContext.sessionKey, classRecordId]);

  const publish = useCallback(async (patch = {}) => {
    if (!classRecordId) return { ok: false, reason: "missing-class-record" };
    const targetSessionKey = normalize(liveState?.sessionKey || classContext.sessionKey);
    try {
      const result = await publishPresenterLiveSession(classRecordId, {
        sessionDate,
        level,
        lessonId,
        assignmentId,
        ...patch,
      }, targetSessionKey);
      setSyncState("live");
      return result;
    } catch (error) {
      console.error("presenter live-session publish failed", error);
      setSyncState("offline");
      return { ok: false, reason: "publish-failed", error };
    }
  }, [
    classRecordId,
    classContext.sessionKey,
    liveState?.sessionKey,
    sessionDate,
    level,
    lessonId,
    assignmentId,
  ]);

  const isRemoteState = Boolean(liveState?.updatedBy && liveState.updatedBy !== deviceId);
  const isToday = normalize(liveState?.sessionDate) === sessionDate;

  useEffect(() => {
    if (!classRecordId || !sessionKey || !hasSnapshot || !isToday || liveState?.classStatus === "ended") return undefined;

    const heartbeat = () => {
      publish({
        presenterHeartbeatAtMs: Date.now(),
        presenterHeartbeatDeviceId: deviceId,
        presenterStatus: "connected",
      });
    };

    heartbeat();
    const timer = window.setInterval(heartbeat, PRESENTER_HEARTBEAT_MS);
    return () => window.clearInterval(timer);
  }, [classRecordId, sessionKey, hasSnapshot, isToday, liveState?.classStatus, deviceId, publish]);

  return {
    classContext,
    classRecordId,
    sessionKey,
    deviceId,
    liveState,
    publish,
    syncState,
    hasSnapshot,
    isRemoteState,
    isToday,
    sessionDate,
  };
}
