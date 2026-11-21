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
  let timer = null;
  const hasInterval = Number.isFinite(intervalMs) && intervalMs > 0;

  // Keep the next tick anchored to the last automatic request, not page open.
  // Otherwise, a visibility refresh at hour 7 can cause the hour-12 tick to
  // be rejected by the six-hour minimum gap and delay the next check to hour 18.
  const scheduleNext = () => {
    if (!hasInterval || stopped) return;
    if (timer !== null) windowTarget.clearInterval(timer);
    timer = windowTarget.setInterval(() => { void refresh(); }, intervalMs);
  };
  const refresh = async () => {
    if (stopped || running || documentTarget.visibilityState === "hidden") return;
    const time = now();
    if (time - lastStartedAt < minimumGapMs) return;
    running = true;
    lastStartedAt = time;
    scheduleNext();
    try { await load(); } finally { running = false; }
  };
  void refresh();
  // A hidden tab has no initial request; retain a paused interval so returning
  // to a visible tab still schedules its following check relative to that return.
  if (timer === null) scheduleNext();
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
