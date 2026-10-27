import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const serviceUrl = new URL("../src/services/liveClassService.js", import.meta.url);

test("live class service includes the shared curriculum fields", async () => {
  const source = await readFile(serviceUrl, "utf8");
  assert.equal(source.includes("topic"), true);
  assert.equal(source.includes("assignmentIds"), true);
  assert.equal(source.includes("chapterIds"), true);
  assert.equal(source.includes("curriculumIds"), true);
  assert.equal(source.includes("syncClassCurriculum"), true);
  assert.equal(source.includes("attendanceSessionRef"), true);
});
