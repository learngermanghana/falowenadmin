import test from "node:test";
import assert from "node:assert/strict";
import { loadPartnerSubmissionFallback } from "../src/utils/partnerSubmissionFallback.js";

test("recovers partner student names beyond the first 50 submissions", async () => {
  const paths = [];
  const pageOne = Array.from({ length: 50 }, (_, index) => ({ id: "other-" + index, students: [] }));
  const pageTwo = [{ id: "older-partner", students: [{ name: "Older student", status: "approved" }] }];
  const pages = [
    { submissions: pageOne, nextCursor: "other-49" },
    { submissions: pageTwo, nextCursor: null },
  ];
  const read = async path => { paths.push(path); return pages[paths.length - 1]; };
  const loaded = [];
  const result = await loadPartnerSubmissionFallback([{ id: "older-partner" }], read, { onPage: rows => loaded.push(...rows) });
  assert.deepEqual(paths, ["admin/organisation-enrolments", "admin/organisation-enrolments?cursor=other-49"]);
  assert.deepEqual(result.missingIds, []);
  assert.equal(result.submissions[0].students[0].name, "Older student");
  assert.equal(loaded[0].id, "older-partner");
});

test("follows multiple pages but stops when all referenced partners batches are found", async () => {
  const paths = [];
  const pages = [
    { submissions: [{ id: "latest", students: [{ name: "First" }] }], nextCursor: "cursor one" },
    { submissions: [{ id: "other" }], nextCursor: "cursor two" },
    { submissions: [{ id: "older", students: [{ name: "Second" }] }], nextCursor: "cursor three" },
  ];
  const result = await loadPartnerSubmissionFallback([{ id: "latest" }, { id: "older" }],
    async path => { paths.push(path); return pages[paths.length - 1]; });
  assert.deepEqual(paths, [
    "admin/organisation-enrolments",
    "admin/organisation-enrolments?cursor=cursor%20one",
    "admin/organisation-enrolments?cursor=cursor%20two",
  ]);
  assert.deepEqual(result.submissions.map(row => row.id), ["latest", "older"]);
  assert.deepEqual(result.missingIds, []);
});

test("does not query history when all batches have embedded rosters", async () => {
  const result = await loadPartnerSubmissionFallback([{ id: "already-loaded", students: [] }],
    () => assert.fail("No fallback needed"));
  assert.deepEqual(result, { submissions: [], missingIds: [] });
});

test("keeps unresolved batches visible when pagination ends without finding them", async () => {
  const result = await loadPartnerSubmissionFallback([{ id: "missing" }, { id: "found" }],
    async () => ({ submissions: [{ id: "found", students: [] }], nextCursor: null }));
  assert.deepEqual(result.missingIds, ["missing"]);
  assert.deepEqual(result.submissions.map(row => row.id), ["found"]);
});

test("rejects a repeated cursor instead of requesting the same page indefinitely", async () => {
  let calls = 0;
  await assert.rejects(
    loadPartnerSubmissionFallback([{ id: "older" }], async () => {
      calls++;
      return { submissions: [], nextCursor: "repeat-cursor" };
    }),
    /repeated page cursor/,
  );
  assert.equal(calls, 2);
});

test("halts after navigation away without showing stale student records", async () => {
  let cancelled = false;
  let pages = 0;
  let shown = 0;
  const result = await loadPartnerSubmissionFallback([{ id: "older" }], async () => {
    pages++;
    cancelled = true;
    return { submissions: [{ id: "older", students: [] }], nextCursor: "more" };
  }, { isCancelled: () => cancelled, onPage: () => shown++ });
  assert.equal(pages, 1);
  assert.equal(shown, 0);
  assert.deepEqual(result.missingIds, ["older"]);
});
