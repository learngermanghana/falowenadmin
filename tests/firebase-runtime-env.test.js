import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

test("Firebase runtime env writer preserves CLOUD_RUNTIME_CONFIG JSON", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "falowen-runtime-env-"));
  const target = path.join(dir, ".env");
  const runtimeConfig = JSON.stringify({
    communication: {
      announcement_webhook_url: "https://script.google.com/macros/s/shared/exec",
      announcement_webhook_token: "shared-token",
      announcement_sheet_name: "Announcement",
    },
  });

  const result = spawnSync(
    process.execPath,
    ["scripts/writeFirebaseRuntimeEnv.mjs", target],
    {
      cwd: process.cwd(),
      env: { ...process.env, CLOUD_RUNTIME_CONFIG: runtimeConfig },
      encoding: "utf8",
    },
  );

  assert.equal(result.status, 0, result.stderr);
  const written = fs.readFileSync(target, "utf8").trim();
  assert.ok(written.startsWith("CLOUD_RUNTIME_CONFIG="));

  const dotenvValue = written.slice("CLOUD_RUNTIME_CONFIG=".length);
  assert.equal(JSON.parse(dotenvValue), runtimeConfig);
  assert.deepEqual(JSON.parse(runtimeConfig).communication, {
    announcement_webhook_url: "https://script.google.com/macros/s/shared/exec",
    announcement_webhook_token: "shared-token",
    announcement_sheet_name: "Announcement",
  });
});
