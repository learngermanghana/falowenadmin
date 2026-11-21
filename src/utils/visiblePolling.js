// One request at a time. Hidden admin tabs do not need background refreshes.
export function startVisiblePolling(load, intervalMs, {
  documentTarget = document,
  windowTarget = window,
  minimumGapMs = 0,
  refreshOnFocus = true,
  now = () => Date.now(),
} = {}) {
  let stopped = false;
  let running = false;
  let lastStartedAt = Number.NEGATIVE_INFINITY;
  const refresh = async () => {
    if (stopped || running || documentTarget.visibilityState === "hidden") return;
    const time = now();
    if (time - lastStartedAt < minimumGapMs) return;
    running = true;
    lastStartedAt = time;
    try { await load(); } finally { running = false; }
  };
  void refresh();
  const timer = Number.isFinite(intervalMs) && intervalMs > 0
    ? windowTarget.setInterval(() => { void refresh(); }, intervalMs)
    : null;
  if (refreshOnFocus) {
    documentTarget.addEventListener("visibilitychange", refresh);
    windowTarget.addEventListener("focus", refresh);
  }
  return () => {
    stopped = true;
    if (timer !== null) windowTarget.clearInterval(timer);
    if (refreshOnFocus) {
      documentTarget.removeEventListener("visibilitychange", refresh);
      windowTarget.removeEventListener("focus", refresh);
    }
  };
}
