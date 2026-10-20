const { test } = require("node:test");
const assert = require("node:assert/strict");
const { filterDates, listDraftHistory, readDraftHistoryDetail, PAGE_LIMIT } = require("./draftHistory.js");

const DAY = Date.UTC(2026, 9, 19);
const ts = n => ({ toMillis: () => n });
const draftRecords = (count = 56) => Object.fromEntries(Array.from({ length: count }, (_, n) =>
  ["d" + String(n).padStart(3, "0"), {
    studentId: "uid" + (n % 3), studentEmail: "student" + (n % 3) + "@example.com",
    studentName: "Learner " + n, assignmentKey: n % 2 ? "A1-14.1" : "A1-10",
    status: "draft", submissionText: "Student draft " + n,
    updatedAt: ts(DAY + 1000 + (n < 4 ? 0 : n * 60000)),
  }]));
function fakeDatabase(records = draftRecords()) {
  const metrics = { queries: 0, getDocs: 0 };
  const api = {
    firestore: { Timestamp: { fromMillis: ts } },
  };
  const db = { collection(name) {
    if (name !== "submissionDrafts") return {
      doc: id => ({ id, async get() { metrics.getDocs++; return { exists: false, id, data: () => undefined }; },
        collection: () => ({ where: () => ({ limit: () => ({ get: async () => ({ size: 0, docs: [] }) }) }) }) }),
      where: () => ({ limit: () => ({ get: async () => ({ size: 0, docs: [] }) }) }),
    };
    const read = id => ({
      id, ref: { id }, exists: Boolean(records[id]), data: () => records[id],
    });
    function query(filters = [], opts = {}) {
      return {
        where(field, op, value) { return query([...filters, { field, op, value }], opts); },
        orderBy(field, direction) { return query(filters, { ...opts, sort: { field, direction } }); },
        startAfter(cursor) { return query(filters, { ...opts, cursor: cursor.id }); },
        limit(limit) { return query(filters, { ...opts, limit }); },
        async get() {
          metrics.queries += 1;
          let rows = Object.keys(records).sort().map(read).filter(doc => filters.every(({ field, op, value }) => {
            const a = doc.data()[field], av = a?.toMillis?.() ?? a;
            const bv = value?.toMillis?.() ?? value;
            return op === "==" ? av === bv : op === ">=" ? av >= bv : op === "<" ? av < bv : false;
          }));
          if (opts.sort) rows = rows.sort((a,b) => {
            const av = a.data()[opts.sort.field].toMillis();
            const bv = b.data()[opts.sort.field].toMillis();
            return opts.sort.direction === "desc" ? (bv - av || b.id.localeCompare(a.id)) : av - bv || a.id.localeCompare(b.id);
          });
          if (opts.cursor) rows = rows.slice(rows.findIndex(row => row.id === opts.cursor) + 1);
          rows = rows.slice(0, opts.limit || rows.length);
          metrics.getDocs += rows.length;
          return { docs: rows, size: rows.length };
        },
      };
    }
    return {
      doc: id => ({ id, async get() { metrics.getDocs++; return read(id); } }),
      where: (field, op, value) => query([{ field, op, value }]),
    };
  }};
  return { db, admin: api, metrics };
}
test("only valid date windows up to 31 days are allowed", () => {
  assert.deepEqual(filterDates({ from: "2026-10-19", to: "2026-10-19" }),
    { start: DAY, end: DAY + 86400000 });
  assert.throws(() => filterDates({ from: "2026-10-19", to: "2026-09-19" }), /range/);
  assert.throws(() => filterDates({ from: "2026-10-01", to: "2026-11-02" }), /1–31/);
  assert.throws(() => filterDates({ from: "2026-02-30", to: "2026-02-30" }), /Invalid/);
});
test("all-student scan fetches only 26 records and returns 25, with stable next-page cursor", async () => {
  const { db, admin, metrics } = fakeDatabase();
  const p1 = await listDraftHistory({ db, admin, from: "2026-10-19", to: "2026-10-19" });
  assert.equal(p1.rows.length, PAGE_LIMIT);
  assert.equal(metrics.queries, 1);
  assert.equal(metrics.getDocs, PAGE_LIMIT + 1);
  assert.ok(p1.nextCursor);
  assert.equal("submissionText" in p1.rows[0], false);
  const p2 = await listDraftHistory({ db, admin, from: "2026-10-19", to: "2026-10-19", cursor: p1.nextCursor });
  assert.equal(p2.rows.length, 25);
  assert.equal(metrics.queries, 2);
  assert.equal(metrics.getDocs, (PAGE_LIMIT + 1) * 2 + 1);
  assert.equal(new Set([...p1.rows, ...p2.rows].map(row => row.id)).size, 50);
});
test("history reads work even when assignment has no timer, and previews load only on demand", async () => {
  const { db, admin, metrics } = fakeDatabase(draftRecords(4));
  const page = await listDraftHistory({ db, admin, from: "2026-10-19", to: "2026-10-19" });
  assert.equal(metrics.getDocs, 4);
  const detail = await readDraftHistoryDetail({ db, draftId: page.rows[0].id });
  assert.equal(detail.draft.studentEmail.endsWith("@example.com"), true);
  assert.match(detail.answer, /Student draft/);
  assert.equal(detail.assessment.state, "not-checked");
  assert.equal(detail.submission.status, "not-submitted");
});
test("email search is bounded, includes original date filtering, and reports incomplete scans", async () => {
  const all = Object.fromEntries(Object.entries(draftRecords(180)).map(([key, row]) => [key,
    { ...row, studentEmail: "same@example.com" }]));
  const { db, admin, metrics } = fakeDatabase(all);
  const result = await listDraftHistory({ db, admin, from: "2026-10-19", to: "2026-10-19", studentEmail: "same@example.com" });
  assert.equal(result.incomplete, true);
  assert.equal(metrics.getDocs, 151);
  assert.equal(result.examined, 151);
  assert.ok(result.rows.length <= 151);
});
test("non-email searches are rejected before scanning", async () => {
  const { db, admin, metrics } = fakeDatabase();
  await assert.rejects(() => listDraftHistory({ db, admin, from: "2026-10-19", to: "2026-10-19", studentEmail: "uid123" }), /email/);
  assert.equal(metrics.queries, 0);
});
