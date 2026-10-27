import { presenterSessionKey } from "../utils/presenterSessionIdentity.js";
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
const EMPTY_URL_IDENTITY = Object.freeze({
  classId: "",
  classRecordId: "",
  sessionId: "",
  assignmentId: "",
  curriculumDay: 0,
  sessionDate: "",
  sessionKey: "",
});

function normalize(value) {
  return String(value || "").trim();
}

function presenterUrlIdentity() {
  if (typeof window === "undefined") {
    return EMPTY_URL_IDENTITY;
  }
  const params = new URLSearchParams(window.location.search);
  return {
    classId: normalize(params.get("classId")),
    classRecordId: normalize(params.get("classRecordId")),
    sessionId: normalize(params.get("sessionId")),
    assignmentId: normalize(params.get("assignmentId")),
    curriculumDay: Number(params.get("curriculumDay") || 0),
    sessionDate: normalize(params.get("sessionDate")),
    sessionKey: normalize(params.get("sessionKey")) || (params.get("sessionDate") && params.get("sessionId") && params.get("assignmentId")
      ? presenterSessionKey({ sessionDate: params.get("sessionDate"), sessionId: params.get("sessionId"), assignmentId: params.get("assignmentId") })
      : ""),
  };
}

function mergePresenterContext(base = {}, urlIdentity = {}) {
  const baseClassId = normalize(base.classId);
  const urlClassId = normalize(urlIdentity.classId);
  const sameClass = !urlClassId || !baseClassId || urlClassId === baseClassId;

  return {
    classId: urlClassId || baseClassId,
    classRecordId: normalize(urlIdentity.classRecordId)
      || (sameClass ? normalize(base.classRecordId) : ""),
    sessionKey: normalize(urlIdentity.sessionKey) || normalize(base.sessionKey),
  };
}

export default function usePresenterLiveSession(slide = {}) {
  const rawUrlIdentity = useMemo(() => presenterUrlIdentity(), []);
  const slideIds = [
    normalize(slide?.assignmentId).toLowerCase(),
    normalize(slide?.id).toLowerCase(),
  ].filter(Boolean);
  const urlAssignmentId = normalize(rawUrlIdentity.assignmentId).toLowerCase();
  const urlIdentityMatchesSlide = !urlAssignmentId || slideIds.includes(urlAssignmentId);
  const urlIdentity = urlIdentityMatchesSlide ? rawUrlIdentity : EMPTY_URL_IDENTITY;
  const [classContext, setClassContext] = useState(
    () => mergePresenterContext(getPresenterClassContext(), urlIdentity),
  );
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
  const curriculumDay = Number(
    slide?.dayNumber
      || String(slide?.day || "").match(/\d+/)?.[0]
      || urlIdentity.curriculumDay
      || 0,
  );
  const expectedClassId = normalize(urlIdentity.classId || classContext.classId);
  const expectedSessionDate = normalize(urlIdentity.sessionDate || sessionDate);
  const sessionKey = normalize(liveState?.sessionKey || classContext.sessionKey);

  useEffect(() => {
    if (!normalize(urlIdentity.sessionKey)) return undefined;
    const next = mergePresenterContext(getPresenterClassContext(), urlIdentity);
    setPresenterClassContext(next);
    setClassContext(next);
    return undefined;
  }, [urlIdentity]);

  useEffect(() => subscribePresenterClassContext((next) => {
    setClassContext(mergePresenterContext(next, urlIdentity));
  }), [urlIdentity]);

  const requestedSessionKey = normalize(urlIdentity.sessionKey || classContext.sessionKey);
  const subscriptionSessionKey = normalize(urlIdentity.sessionKey) || (requestedSessionKey.startsWith(`${expectedSessionDate}__`)
    ? requestedSessionKey
    : "");

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
      subscriptionSessionKey,
    );
  }, [classRecordId, subscriptionSessionKey]);

  useEffect(() => {
    const nextSessionKey = normalize(liveState?.sessionKey);
    if (!nextSessionKey || nextSessionKey === normalize(classContext.sessionKey)) return;
    if (normalize(urlIdentity.sessionKey) && nextSessionKey !== normalize(urlIdentity.sessionKey)) return;
    setPresenterClassContext({
      classId: normalize(urlIdentity.classId || classContext.classId),
      classRecordId: normalize(urlIdentity.classRecordId || classRecordId),
      sessionKey: nextSessionKey,
    });
  }, [
    liveState?.sessionKey,
    classContext.classId,
    classContext.sessionKey,
    classRecordId,
    urlIdentity.classId,
    urlIdentity.classRecordId,
    urlIdentity.sessionKey,
  ]);

  const publish = useCallback(async (patch = {}) => {
    if (!classRecordId) return { ok: false, reason: "missing-class-record" };
    const targetSessionKey = normalize(
      urlIdentity.sessionKey || liveState?.sessionKey || classContext.sessionKey,
    );
    try {
      const result = await publishPresenterLiveSession(classRecordId, {
        sessionDate: expectedSessionDate,
        classId: expectedClassId,
        curriculumDay,
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
    curriculumDay,
    expectedClassId,
    expectedSessionDate,
    urlIdentity.sessionKey,
  ]);

  const isRemoteState = Boolean(liveState?.updatedBy && liveState.updatedBy !== deviceId);
  const isToday = normalize(liveState?.sessionDate) === expectedSessionDate;

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
    expectedClassId,
    expectedCurriculumDay: curriculumDay,
    expectedSessionDate,
    isToday,
    sessionDate: expectedSessionDate,
  };
}
