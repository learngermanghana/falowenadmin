import assert from "node:assert/strict";
import test from "node:test";
import {
  adminLeadNotificationStorageKey,
  leadNotificationSignature,
  markAllLeadNotificationsSeen,
  summarizeLeadNotifications,
} from "../src/services/leadNotificationService.js";

function memoryStorage() {
  const map = new Map();
  return {
    getItem: (key) => map.get(key) ?? null,
    setItem: (key, value) => map.set(key, String(value)),
  };
}

test("lead notification seen state is scoped per admin", () => {
  const storage = memoryStorage();
  const lead = { id: "lead-1", name: "Ama", status: "new", className: "A1" };

  markAllLeadNotificationsSeen({ uid: "admin-a" }, [lead], storage);

  assert.equal(summarizeLeadNotifications([lead], { uid: "admin-a" }, storage).unseenCount, 0);
  assert.equal(summarizeLeadNotifications([lead], { uid: "admin-b" }, storage).unseenCount, 1);
  assert.notEqual(
    adminLeadNotificationStorageKey({ uid: "admin-a" }),
    adminLeadNotificationStorageKey({ uid: "admin-b" }),
  );
});

test("marking lead notifications seen does not require status changes or deletion", () => {
  const storage = memoryStorage();
  const lead = { id: "lead-2", name: "Kojo", status: "contacted", paymentStatus: "unpaid" };

  markAllLeadNotificationsSeen({ email: "owner@example.com" }, [lead], storage);
  const summary = summarizeLeadNotifications([lead], { email: "owner@example.com" }, storage);

  assert.equal(summary.unresolvedCount, 1);
  assert.equal(summary.unseenCount, 0);
});

test("new updates to unresolved leads become unseen again", () => {
  const storage = memoryStorage();
  const admin = { uid: "admin-a" };
  const lead = { id: "lead-3", name: "Efua", status: "contacted", lastFollowUpAt: "2026-07-20" };

  markAllLeadNotificationsSeen(admin, [lead], storage);
  assert.equal(summarizeLeadNotifications([lead], admin, storage).unseenCount, 0);

  const updated = { ...lead, lastFollowUpAt: "2026-07-22" };
  assert.notEqual(leadNotificationSignature(lead), leadNotificationSignature(updated));
  assert.equal(summarizeLeadNotifications([updated], admin, storage).unseenCount, 1);
});
