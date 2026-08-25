import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const pagePath = new URL("../src/pages/CanonicalAttendancePageV3.jsx", import.meta.url);
const patchPath = new URL("../scripts/patchCanonicalAttendanceRequestedSession.mjs", import.meta.url);
const prebuildPath = new URL("../scripts/patchFollowingRestoreAnchorCollisions.mjs", import.meta.url);

test("a direct Attendance session link stays authoritative before and after prebuild patching", async () => {
  const [page, patch, prebuild] = await Promise.all([
    readFile(pagePath, "utf8"),
    readFile(patchPath, "utf8"),
    readFile(prebuildPath, "utf8"),
  ]);

  assert.match(prebuild, /patchCanonicalAttendanceRequestedSession\.mjs/);
  assert.match(patch, /if \(requested\) return requested;/);

  if (page.includes("if (requested) return requested;")) {
    const requestedIndex = page.indexOf("if (requested) return requested;");
    const todayIndex = page.indexOf("const today = localDate(new Date(), timezone);", requestedIndex);
    assert.ok(todayIndex > requestedIndex, "requested session must win before today/next fallback selection");
  } else {
    assert.match(page, /if \(requested && localDate\(requested\.startsAt, timezone\) === today\) return requested;/);
  }
});
