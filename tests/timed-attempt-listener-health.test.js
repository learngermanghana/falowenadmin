import test from "node:test";
import assert from "node:assert/strict";
import { createTimedAttemptListenerHealth } from "../src/utils/timedAttemptListenerHealth.js";

test("a healthy listener never clears the other listener's terminal error", () => {
  const health = createTimedAttemptListenerHealth(2);
  assert.deepEqual(health.snapshot(0), { loading: true, error: "" });
  assert.deepEqual(health.snapshot(1), { loading: false, error: "" });
  assert.deepEqual(health.failure(0, new Error("Permission denied")), {
    loading: false, error: "Permission denied",
  });
  assert.deepEqual(health.snapshot(1), { loading: false, error: "Permission denied" });
  assert.deepEqual(health.snapshot(1), { loading: false, error: "Permission denied" });
});

test("initial failure remains visible and each source can only clear its own error", () => {
  const health = createTimedAttemptListenerHealth(2);
  assert.deepEqual(health.failure(1, {}), {
    loading: false, error: "Could not load timed assignments.",
  });
  assert.equal(health.snapshot(0).error, "Could not load timed assignments.");
  health.failure(0, new Error("Unavailable"));
  assert.deepEqual(health.snapshot(1), { loading: false, error: "Unavailable" });
  assert.deepEqual(health.snapshot(0), { loading: false, error: "" });
});
