import test from "node:test";
import assert from "node:assert/strict";
import {isLevelPaymentOverdue} from "../src/utils/levelPaymentOverdue.js";
test("payment is overdue only after the deadline and only with an outstanding balance",()=>{const row={status:"active",balanceDue:1000,paymentDeadline:"2026-12-02"};assert.equal(isLevelPaymentOverdue(row,"2026-12-02"),false);assert.equal(isLevelPaymentOverdue(row,"2026-12-03"),true);assert.equal(isLevelPaymentOverdue({...row,balanceDue:0},"2026-12-03"),false);assert.equal(isLevelPaymentOverdue({...row,status:"planned"},"2026-12-03"),false);assert.equal(isLevelPaymentOverdue({...row,paymentDeadline:""},"2026-12-03"),false);});
