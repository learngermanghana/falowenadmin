import assert from "node:assert/strict";
import test from "node:test";

import { calculatePaystackCharge, calculatePaystackGrossAmount, parseMoneyValue } from "../src/utils/paystackCharges.js";

test("adds only the student share of the Paystack charge to initial payments", () => {
  assert.equal(calculatePaystackGrossAmount(2800), 2828);
  assert.equal(calculatePaystackCharge(2800), 28);
});

test("can still gross up the full Paystack charge when the student share is 100%", () => {
  assert.equal(calculatePaystackGrossAmount(2800, 0.0195, 1), 2856);
  assert.equal(calculatePaystackCharge(2800, 0.0195, 1), 56);
});

test("parses formatted money and ignores empty values", () => {
  assert.equal(parseMoneyValue("GHS 2,800"), 2800);
  assert.equal(calculatePaystackGrossAmount(""), 0);
});
