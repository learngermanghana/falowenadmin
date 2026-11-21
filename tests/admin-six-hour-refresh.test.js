import test from "node:test";
import assert from "node:assert/strict";
import { startVisiblePolling } from "../src/utils/visiblePolling.js";
import { createAdminRefreshRequest } from "../src/utils/adminRefreshRequest.js";

const SIX_HOURS_MS = 6 * 60 * 60 * 1000;

test("Admin queue checks on opening and at six hours, not on frequent tab focus", async () => {
  let time = 0;
  let tick = () => {};
  const handlers = new Map();
  const doc = {
    visibilityState: "visible",
    addEventListener(name, callback) { handlers.set("doc:" + name, callback); },
    removeEventListener(name) { handlers.delete("doc:" + name); },
  };
  const win = {
    setInterval(callback, interval) { assert.equal(interval, SIX_HOURS_MS); tick = callback; return 1; },
    clearInterval() {},
    addEventListener(name, callback) { handlers.set("win:" + name, callback); },
    removeEventListener(name) { handlers.delete("win:" + name); },
  };

  let calls = 0;
  const controller = createAdminRefreshRequest(async () => ++calls, {
    onStart() {}, onSuccess() {}, onError() {}, onFinish() {},
  });
  const stop = startVisiblePolling(() => controller.run(), SIX_HOURS_MS, {
    documentTarget: doc, windowTarget: win, minimumGapMs: SIX_HOURS_MS, now: () => time,
  });
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(calls, 1, "initial load happens immediately");

  time += 60 * 60 * 1000;
  handlers.get("win:focus")();
  tick();
  await Promise.resolve();
  assert.equal(calls, 1, "one-hour refocus does not create extra requests");

  // Refresh now is immediate and independent of the automatic clock.
  await controller.run();
  assert.equal(calls, 2);

  time = SIX_HOURS_MS;
  await handlers.get("doc:visibilitychange")();
  tick();
  await Promise.resolve();
  assert.equal(calls, 3, "after six hours one new automatic check runs");

  time += 60 * 1000;
  handlers.get("win:focus")();
  tick();
  await Promise.resolve();
  assert.equal(calls, 3);

  stop();
  controller.dispose();
  assert.equal(handlers.size, 0);
});

test("hidden tabs do not use their six-hour refresh until visible again", async () => {
  let now = 0;
  let callback = () => {};
  let visibility = () => {};
  const doc = {
    visibilityState: "hidden",
    addEventListener(_, handler) { visibility = handler; },
    removeEventListener() {},
  };
  const win = {
    setInterval(handler) { callback = handler; return 1; },
    clearInterval() {},
    addEventListener() {},
    removeEventListener() {},
  };
  let calls = 0;
  const stop = startVisiblePolling(async () => { calls++; }, SIX_HOURS_MS, {
    documentTarget: doc, windowTarget: win, minimumGapMs: SIX_HOURS_MS, now: () => now,
  });
  now = SIX_HOURS_MS;
  callback();
  await Promise.resolve();
  assert.equal(calls, 0);
  doc.visibilityState = "visible";
  visibility();
  await Promise.resolve();
  assert.equal(calls, 1);
  stop();
});

test("visibility refresh at hour 7 resets the next automatic tick to hour 13, not hour 18", async () => {
  let currentTime = 0;
  let sequence = 0;
  const timers = new Map();
  const listeners = new Map();
  const doc = {
    visibilityState: "visible",
    addEventListener(event, handler) { listeners.set("document:" + event, handler); },
    removeEventListener(event) { listeners.delete("document:" + event); },
  };
  const win = {
    setInterval(callback, ms) {
      assert.equal(ms, SIX_HOURS_MS);
      const id = ++sequence;
      timers.set(id, { callback, dueAt: currentTime + ms });
      return id;
    },
    clearInterval(id) { timers.delete(id); },
    addEventListener(event, handler) { listeners.set("window:" + event, handler); },
    removeEventListener(event) { listeners.delete("window:" + event); },
  };
  const requests = [];
  const stop = startVisiblePolling(async () => { requests.push(currentTime); }, SIX_HOURS_MS, {
    documentTarget: doc, windowTarget: win,
    minimumGapMs: SIX_HOURS_MS, now: () => currentTime,
  });
  await Promise.resolve();
  assert.deepEqual(requests, [0]);

  const fireDueTimersAt = async (time) => {
    currentTime = time;
    for (const [id, timer] of [...timers]) {
      if (timers.has(id) && timer.dueAt <= time) {
        timer.callback();
        // Native setInterval keeps ticking if the callback didn't replace it.
        if (timers.has(id)) timer.dueAt = time + SIX_HOURS_MS;
      }
    }
    await Promise.resolve();
  };

  // The hour-6 tick is skipped because the tab is hidden.
  doc.visibilityState = "hidden";
  await fireDueTimersAt(SIX_HOURS_MS);
  assert.deepEqual(requests, [0]);

  // At hour 7 it becomes visible: refresh once and restart the six-hour clock.
  currentTime = 7 * 60 * 60 * 1000;
  doc.visibilityState = "visible";
  await listeners.get("document:visibilitychange")();
  await listeners.get("window:focus")();
  assert.deepEqual(requests, [0, currentTime]);

  await fireDueTimersAt(12 * 60 * 60 * 1000);
  assert.equal(requests.length, 2, "old hour-12 interval was cancelled");

  await fireDueTimersAt(13 * 60 * 60 * 1000);
  assert.deepEqual(requests, [0, 7 * 60 * 60 * 1000, 13 * 60 * 60 * 1000]);
  await fireDueTimersAt(13 * 60 * 60 * 1000 + 30_000);
  assert.equal(requests.length, 3, "quick refocus/interval must not duplicate requests");

  await fireDueTimersAt(19 * 60 * 60 * 1000);
  assert.equal(requests.length, 4, "six-hour cadence stays anchored to the latest automatic request");

  stop();
  assert.equal(timers.size, 0, "unmount clears the active timer");
  assert.equal(listeners.size, 0, "unmount unregisters visibility/focus listeners");
});
