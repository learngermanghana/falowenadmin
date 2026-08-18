import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const vercel = JSON.parse(fs.readFileSync(new URL("../vercel.json", import.meta.url), "utf8"));

test("class calendar feed is proxied to Firebase before the local API catch-all", () => {
  const calendarIndex = vercel.rewrites.findIndex((rewrite) => rewrite.source === "/api/calendar/(.*)");
  const catchAllIndex = vercel.rewrites.findIndex((rewrite) => rewrite.source === "/api/(.*)");

  assert.ok(calendarIndex >= 0, "calendar proxy rewrite is missing");
  assert.ok(catchAllIndex >= 0, "local API catch-all rewrite is missing");
  assert.ok(calendarIndex < catchAllIndex, "calendar proxy must run before the local API catch-all");
  assert.equal(
    vercel.rewrites[calendarIndex].destination,
    "https://us-central1-falowen-examiner-trainer.cloudfunctions.net/api/calendar/$1",
  );
});
