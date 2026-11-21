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
