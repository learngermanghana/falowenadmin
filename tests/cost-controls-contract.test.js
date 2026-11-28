import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (name) => readFileSync(new URL("../" + name, import.meta.url), "utf8");

test("Admin automatically refreshes ordinary views every six hours, without focus-driven extra polling", () => {
  const hook = read("src/hooks/useAdminRefresh.js");
  assert.match(hook, /DEFAULT_ADMIN_REFRESH_INTERVAL_MS = 6 \* 60 \* 60 \* 1000/);
  assert.match(hook, /pollIntervalMs = DEFAULT_ADMIN_REFRESH_INTERVAL_MS/);
  assert.match(hook, /minimumGapMs: pollIntervalMs/);
  const marking = read("src/pages/MarkingPage.jsx");
  assert.match(marking, /autoRefreshEvery="6 hours"/);
  assert.match(read("src/components/AdminRefreshStatus.jsx"), /Refresh now/);
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
  // The retired scheduler must not be recreated just to satisfy this contract.
  assert.equal((vercel.crons || []).length, 0);
  for (const rule of vercel.headers || []) {
    if (rule.headers?.some(h => h.key.toLowerCase() === "cache-control" && /\bpublic\b/i.test(h.value))) {
      assert.equal(rule.source, "/(.*).mp3", "Only public audio may be publicly cached");
    }
  }
});
