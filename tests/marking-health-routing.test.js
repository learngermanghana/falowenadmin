import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

test("owner-only marking health goes to Firebase before the generic Vercel API rewrite", () => {
  const config = JSON.parse(fs.readFileSync(new URL("../vercel.json", import.meta.url), "utf8"));
  const exact = config.rewrites.findIndex(entry => entry.source === "/api/admin/marking-health");
  const catchAll = config.rewrites.findIndex(entry => entry.source === "/api/(.*)");
  assert.ok(exact >= 0 && exact < catchAll, "Protected marking health must not be routed to the generic API handler");
  assert.equal(config.rewrites[exact].destination,
    "https://us-central1-falowen-examiner-trainer.cloudfunctions.net/api/admin/marking-health");
  const backend = fs.readFileSync(new URL("../functions/markingHealth.js", import.meta.url), "utf8");
  assert.match(backend, /app\.get\("\/admin\/marking-health"/);
  assert.match(backend, /verifyIdToken\(match\[1\], true\)/);
  assert.match(backend, /Owner access is required/);
  assert.match(backend, /Cache-Control/);
});
