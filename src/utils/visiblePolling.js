// One request at a time. Hidden admin tabs do not need background refreshes.
export function startVisiblePolling(load, intervalMs, {
  documentTarget = document,
  windowTarget = window,
} = {}) {
  let stopped = false;
  let running = false;
  const refresh = async () => {
    if (stopped || running || documentTarget.visibilityState === "hidden") return;
    running = true;
    try { await load(); } finally { running = false; }
  };
  void refresh();
  const timer = windowTarget.setInterval(() => { void refresh(); }, intervalMs);
  documentTarget.addEventListener("visibilitychange", refresh);
  windowTarget.addEventListener("focus", refresh);
  return () => {
    stopped = true;
    windowTarget.clearInterval(timer);
    documentTarget.removeEventListener("visibilitychange", refresh);
    windowTarget.removeEventListener("focus", refresh);
  };
}
