import test from "node:test";
import assert from "node:assert/strict";
import { createAdminRefreshRequest } from "../src/utils/adminRefreshRequest.js";

test("manual and automatic refresh share one request and timestamp only successful loads", async () => {
  let resolve;
  let calls = 0;
  const events = [];
  const controller = createAdminRefreshRequest(() => {
    calls += 1;
    return new Promise(done => { resolve = done; });
  }, {
    onStart: () => events.push("start"),
    onSuccess: (data, time) => events.push({ data, time }),
    onError: () => events.push("error"),
    onFinish: () => events.push("finish"),
  });
  const first = controller.run();
  assert.equal(controller.run(), first);
  await Promise.resolve();
  assert.equal(calls, 1);
  resolve(["payment"]);
  await first;
  assert.deepEqual(events[1].data, ["payment"]);
  assert.ok(events[1].time instanceof Date);
  assert.equal(events.at(-1), "finish");
});

test("failed loads retain the previous successful timestamp and disposed requests cannot update another student", async () => {
  let success = 0;
  let errors = 0;
  const callbacks = { onStart() {}, onSuccess() { success += 1; }, onError() { errors += 1; }, onFinish() {} };
  const failed = createAdminRefreshRequest(async () => { throw new Error("Permission denied"); }, callbacks);
  assert.equal(await failed.run(), null);
  assert.equal(success, 0);
  assert.equal(errors, 1);
  let resolve;
  const stale = createAdminRefreshRequest(() => new Promise(done => { resolve = done; }), callbacks);
  const pending = stale.run();
  await Promise.resolve();
  stale.dispose();
  resolve([]);
  await pending;
  assert.equal(success, 0);
  assert.equal(await stale.run(), null);
});
