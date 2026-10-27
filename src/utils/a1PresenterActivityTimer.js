// A1 activity timing is separate from the shared class session timer.
export const A1_ACTIVITY_TIMER_PRESETS = Object.freeze([7, 5, 3, 2, 1]);
export const DEFAULT_A1_ACTIVITY_MINUTES = 5;

// Use wall-clock deadlines instead of decrementing an interval counter: a browser
// can throttle intervals while a teacher is screen sharing or switches tabs.
export function a1ActivitySecondsLeft(deadlineMs, nowMs = Date.now()) {
  const deadline = Number(deadlineMs);
  const now = Number(nowMs);
  if (!Number.isFinite(deadline) || !Number.isFinite(now) || deadline <= 0) return 0;
  return Math.max(0, Math.ceil((deadline - now) / 1000));
}

export function a1ActivityDeadline(remainingSeconds, nowMs = Date.now()) {
  const seconds = Number(remainingSeconds);
  const now = Number(nowMs);
  if (!Number.isFinite(seconds) || !Number.isFinite(now) || seconds <= 0) return 0;
  return now + Math.ceil(seconds) * 1000;
}
