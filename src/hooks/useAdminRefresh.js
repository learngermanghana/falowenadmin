import { useCallback, useEffect, useRef, useState } from "react";
import { startVisiblePolling } from "../utils/visiblePolling.js";
import { createAdminRefreshRequest } from "../utils/adminRefreshRequest.js";

// Ordinary Admin views refresh only every five minutes while visible.
 // Explicit refresh buttons bypass this interval and remain immediate.
export function useAdminRefresh(load, onSuccess, { pollIntervalMs = 5 * 60 * 1000 } = {}) {
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
      minimumGapMs: 60 * 1000,
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
