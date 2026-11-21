import { useCallback, useEffect, useRef, useState } from "react";
import { startVisiblePolling } from "../utils/visiblePolling.js";
import { createAdminRefreshRequest } from "../utils/adminRefreshRequest.js";

// Ordinary Admin lists refresh every six hours while visible. Each panel loads
// immediately on opening; Refresh now always bypasses the automatic cadence.
// Time-sensitive actions and realtime subscriptions use their own data flows.
export const DEFAULT_ADMIN_REFRESH_INTERVAL_MS = 6 * 60 * 60 * 1000;

export function useAdminRefresh(load, onSuccess, { pollIntervalMs = DEFAULT_ADMIN_REFRESH_INTERVAL_MS } = {}) {
  const onSuccessRef = useRef(onSuccess);
  onSuccessRef.current = onSuccess;
  const refreshRef = useRef(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshError, setRefreshError] = useState("");

  useEffect(() => {
    setLastUpdated(null);
    setRefreshError("");
    setRefreshing(false);
    const controller = createAdminRefreshRequest(load, {
      onStart: () => setRefreshing(true),
      onSuccess: (data, updatedAt) => {
        onSuccessRef.current(data);
        setLastUpdated(updatedAt);
        setRefreshError("");
      },
      onError: error => setRefreshError(error?.message || "Refresh failed. Please try again."),
      onFinish: () => setRefreshing(false),
    });
    const run = () => controller.run();
    refreshRef.current = run;
    const stop = startVisiblePolling(run, pollIntervalMs, {
      // A tab focus must not quietly turn a six-hour schedule into minute polling.
      minimumGapMs: pollIntervalMs,
      refreshOnFocus: pollIntervalMs > 0,
    });
    return () => {
      controller.dispose();
      refreshRef.current = null;
      stop();
    };
  }, [load, pollIntervalMs]);

  const refresh = useCallback(() => refreshRef.current?.() || Promise.resolve(null), []);
  return { refresh, lastUpdated, refreshing, refreshError };
}
