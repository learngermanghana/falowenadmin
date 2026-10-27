import test from "node:test";
import assert from "node:assert/strict";
import {
  deliveryFailureMessage,
  historyStatusBlocksDuplicate,
  receiptHasSuccessfulDelivery,
} from "./communicationDelivery.js";

test("failed communication history does not block retry", () => {
  assert.equal(historyStatusBlocksDuplicate({ deliveryStatus: "failed" }), false);
  assert.equal(historyStatusBlocksDuplicate({ deliveryStatus: "sent" }), true);
  assert.equal(historyStatusBlocksDuplicate({ deliveryStatus: "partial" }), true);
});

test("delivery success requires an attempted successful email request", () => {
  assert.equal(receiptHasSuccessfulDelivery({ sheet: { attempted: false, success: true } }), false);
  assert.equal(receiptHasSuccessfulDelivery({ sheet: { attempted: true, success: false } }), false);
  assert.equal(receiptHasSuccessfulDelivery({ sheet: { attempted: true, success: true } }), true);
});

test("delivery failure explains when email was not attempted", () => {
  assert.match(deliveryFailureMessage({ sheet: { attempted: false, message: "Email webhook not configured." } }), /not configured/i);
});
