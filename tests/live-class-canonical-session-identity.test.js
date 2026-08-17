import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const pagePath = new URL("../src/pages/LiveClassesPageV2.jsx", import.meta.url);
const manualPath = new URL("../src/services/liveClassManualRescheduleService.js", import.meta.url);
const directPath = new URL("../src/services/liveClassSessionDirectService.js", import.meta.url);

test("Live Classes prefers the canonical class record when a legacy session classId contains the class name", async () => {
  const [page, manual, direct] = await Promise.all([
    readFile(pagePath, "utf8"),
    readFile(manualPath, "utf8"),
    readFile(directPath, "utf8"),
  ]);

  assert.match(page, /classId: dashboard\?\.klass\?\.id \|\| dashboard\?\.klass\?\.classRecordId \|\| selectedClassId \|\| session\.classRecordId \|\| session\.classId/);
  assert.match(page, /const classId = dashboard\?\.klass\?\.id \|\| dashboard\?\.klass\?\.classRecordId \|\| selectedClassId \|\| sessionChange\.classId/);
  assert.doesNotMatch(page, /classId: session\.classId \|\| session\.classRecordId \|\| dashboard/);

  assert.match(manual, /payload\.classId \|\| session\.classRecordId \|\| session\.classId/);
  assert.doesNotMatch(manual, /payload\.classId \|\| session\.classId \|\| session\.classRecordId/);
  assert.match(direct, /payload\.classId \|\| session\.classRecordId \|\| session\.classId/);
  assert.doesNotMatch(direct, /payload\.classId \|\| session\.classId \|\| session\.classRecordId/);
});
