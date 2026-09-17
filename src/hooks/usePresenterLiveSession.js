import { useCallback, useEffect, useMemo, useState } from "react";
import {
  getPresenterClassContext,
  getPresenterDeviceId,
  presenterLocalDateKey,
  publishPresenterLiveSession,
  subscribePresenterClassContext,
  subscribePresenterLiveSession,
} from "../services/presenterLiveSessionService.js";

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
  const level = normalize(slide?.course).toUpperCase();
  const lessonId = normalize(slide?.id || slide?.assignmentId);
  const assignmentId = normalize(slide?.assignmentId || slide?.id);

  useEffect(() => subscribePresenterClassContext((next) => {
    setClassContext({
      classId: normalize(next?.classId),
      classRecordId: normalize(next?.classRecordId),
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

  const publish = useCallback(async (patch = {}) => {
    if (!classRecordId) return { ok: false, reason: "missing-class-record" };
    try {
      const result = await publishPresenterLiveSession(classRecordId, {
        sessionDate,
        level,
        lessonId,
        assignmentId,
        ...patch,
      });
      setSyncState("live");
      return result;
    } catch (error) {
      console.error("presenter live-session publish failed", error);
      setSyncState("offline");
      return { ok: false, reason: "publish-failed", error };
    }
  }, [classRecordId, sessionDate, level, lessonId, assignmentId]);

  const isRemoteState = Boolean(liveState?.updatedBy && liveState.updatedBy !== deviceId);
  const isToday = normalize(liveState?.sessionDate) === sessionDate;

  return {
    classContext,
    classRecordId,
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
