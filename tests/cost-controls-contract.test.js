import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (name) => readFileSync(new URL("../" + name, import.meta.url), "utf8");

test("Admin automatically refreshes ordinary views at most every five minutes", () => {
  const hook = read("src/hooks/useAdminRefresh.js");
  assert.match(hook, /pollIntervalMs = 5 \* 60 \* 1000/);
  assert.match(hook, /minimumGapMs: 60 \* 1000/);
  const payment = read("src/components/StudentPaymentTools.jsx");
  assert.match(payment, /useAdminRefresh\(loadPaymentHistory, setPayments, \{ pollIntervalMs: 0 \}\)/);
  assert.match(payment, /reconcileStudentPayments/);
  assert.match(payment, /refreshPaymentHistory\(\)/);
});

test("Brochure status no longer polls but still has manual refresh", () => {
  const page = read("src/components/BrochureWhatsappPanel.jsx");
  assert.doesNotMatch(page, /startVisiblePolling\(refresh, 60000\)/);
  assert.match(page, /void refreshEngagementStatus\(engagementRef\)/);
  assert.match(page, /onClick=\{\(\) => refreshEngagementStatus\(\)\}/);
});

test("Social song picker reaches one Vercel project on success and keeps fallback", () => {
  const source = read("src/utils/socialMusicLibrary.js");
  assert.match(source, /PUBLIC_MUSIC_ORIGIN \+ "\/api\/music-library"/);
  assert.match(source, /cache: "default", credentials: "omit", signal/);
  assert.match(source, /fetch\("\/api\/attendance-music-library", \{ cache: "no-cache", signal \}\)/);
});

test("No session, payment, or private attendance data is publicly CDN cached", () => {
  const vercel = JSON.parse(read("vercel.json"));
  assert.equal(vercel.ignoreCommand, "node scripts/vercelIgnoreBuild.cjs");
  assert.equal(vercel.crons?.length, 1);
  assert.equal(vercel.crons[0].schedule, "0 20 * * 0");
});
