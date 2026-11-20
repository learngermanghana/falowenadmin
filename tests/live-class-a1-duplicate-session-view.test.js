import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { getCourseSessionGroups } from "../src/data/courseSessionGroups.js";
import { groupA1OfficialAndRepeatSessions } from "../src/utils/liveClassWorkspace.js";
import { resolveOfficialSessionNumber } from "../src/utils/liveClassLessonOrder.js";

const groups = getCourseSessionGroups("A1");
const meeting = (day, date, extra = {}) => {
  const group = groups.find(item => Number(item.day) === day);
  return {
    id: `day-${day}-${date}`,
    curriculumDay: day,
    curriculumIndex: day + 1,
    topic: group.topic,
    assignmentIds: group.assignmentIds,
    startsAt: `${date}T18:00:00.000Z`,
    status: "scheduled",
    ...extra,
  };
};

test("A1 Hamburg: repeated Day 16/17 meetings are not shown as extra official lessons", () => {
  assert.equal(groups.length, 24);
  assert.deepEqual(groups.slice(-3).map(group => [group.day, group.assignmentIds[0]]), [
    [21, "A1-13"], [22, "A1-14.1"], [23, "A1-5.10"],
  ]);
  const records = [
    meeting(15, "2026-11-03"),
    meeting(16, "2026-11-05", { status: "completed", completionSource: "automatic" }),
    meeting(16, "2026-11-07", { status: "completed", completionSource: "automatic" }),
    meeting(16, "2026-11-12", { status: "completed", completionSource: "automatic" }),
    meeting(17, "2026-11-19", { status: "completed", completionSource: "automatic" }),
    meeting(17, "2026-11-20", { status: "completed", completionSource: "automatic" }),
  ];
  const before = structuredClone(records);
  const result = groupA1OfficialAndRepeatSessions(records);

  assert.equal(result.primary.length, 3);
  assert.equal(result.repeats.length, 3);
  assert.deepEqual(result.repeatedDays.map(row => [row.day, row.repeatCount]), [[16, 2], [17, 1]]);
  assert.deepEqual(result.primary.map(row => row.id), [records[0].id, records[1].id, records[4].id]);
  assert.deepEqual([...result.primary, ...result.repeats].map(row => row.id).sort(), records.map(row => row.id).sort());
  assert.deepEqual(records, before, "History and attendance records must never be mutated by the display grouping");
});

test("attended or manually completed records win over automatic aliases", () => {
  const automatic = meeting(16, "2026-11-05", { status: "completed", completionSource: "automatic" });
  const attended = meeting(16, "2026-11-12", { status: "completed", attendanceCount: 8, completionSource: "manual" });
  const { primary, repeats } = groupA1OfficialAndRepeatSessions([automatic, attended]);
  assert.equal(primary[0].id, attended.id);
  assert.equal(repeats[0].id, automatic.id);
});

test("unmapped meeting records remain accessible rather than being silently discarded", () => {
  const unmapped = { id: "historical-unmapped", startsAt: "2026-11-20T18:00:00Z", status: "completed", topic: "" };
  const { primary, repeats } = groupA1OfficialAndRepeatSessions([meeting(16, "2026-11-05"), unmapped]);
  assert.equal(primary.length, 2);
  assert.equal(repeats.length, 0);
});

test("six absent A1 curriculum positions are reported as missing despite 25 saved meetings", () => {
  const base = groups.slice(0, 18).map(group => meeting(group.day, "2026-10-05"));
  const repeated = Array.from({ length: 7 }, (_, index) => ({
    ...meeting(index % 2 ? 16 : 17, "2026-11-05"),
    id: `repeat-${index}`,
    status: "completed",
    completionSource: "automatic",
  }));
  const records = [...base, ...repeated];
  const mapped = new Set(records.map(session => resolveOfficialSessionNumber(session, groups, "A1")).filter(Boolean));
  const absent = groups.filter(group => !mapped.has(group.index + 1));
  assert.equal(records.length, 25);
  assert.equal(absent.length, 6);
  assert.deepEqual(absent.map(group => group.day), [18, 19, 20, 21, 22, 23]);
});

test("Live Classes and timetable repair expose history and official counts separately", async () => {
  const [page, repair] = await Promise.all([
    readFile(new URL("../src/pages/LiveClassesPageV2.jsx", import.meta.url), "utf8"),
    readFile(new URL("../src/components/LiveClassLessonDateRepair.jsx", import.meta.url), "utf8"),
  ]);
  assert.match(page, /Show all meeting records/);
  assert.match(page, /Show official lessons only/);
  assert.match(page, /mappedA1LessonNumbers/);
  assert.match(repair, /Matched positions/);
  assert.match(repair, /Repeated day records/);
  assert.match(repair, /Additional meeting records require review/);
});
