import { useCallback, useEffect, useRef, useState } from "react";
import { startVisiblePolling } from "../utils/visiblePolling.js";
import { createAdminRefreshRequest } from "../utils/adminRefreshRequest.js";

export function useAdminRefresh(load, onSuccess) {
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
    const stop = startVisiblePolling(run, 60000);
    return () => {
      controller.dispose();
      refreshRef.current = null;
      stop();
    };
  }, [load]);

  const refresh = useCallback(() => refreshRef.current?.() || Promise.resolve(null), []);
  return { refresh, lastUpdated, refreshing, refreshError };
}
