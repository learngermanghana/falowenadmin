import test from "node:test";
import assert from "node:assert/strict";
import { startVisiblePolling } from "../src/utils/visiblePolling.js";

test("hidden tabs pause polling, focus events coalesce, cleanup stops requests", async () => {
  const listeners = new Map();
  let tick;
  let cleared = false;
  const documentTarget = {
    visibilityState: "hidden",
    addEventListener(name, fn) { listeners.set(name, fn); },
    removeEventListener(name) { listeners.delete(name); },
  };
  const windowTarget = {
    ...documentTarget,
    setInterval(fn) { tick = fn; return 1; },
    clearInterval() { cleared = true; },
  };
  let calls = 0;
  let resolve;
  const stop = startVisiblePolling(() => {
    calls += 1;
    return new Promise(done => { resolve = done; });
  }, 60000, { documentTarget, windowTarget });
  tick();
  assert.equal(calls, 0);
  documentTarget.visibilityState = "visible";
  const pending = listeners.get("visibilitychange")();
  listeners.get("focus")();
  tick();
  assert.equal(calls, 1);
  resolve();
  await pending;
  tick();
  assert.equal(calls, 2);
  resolve();
  stop();
  await Promise.resolve();
  tick();
  assert.equal(calls, 2);
  assert.equal(cleared, true);
  assert.equal(listeners.size, 0);
});
