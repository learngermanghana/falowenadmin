import test from "node:test";
import assert from "node:assert/strict";
import {paymentProgress} from "../src/utils/levelPaymentProgress.js";
test("progress uses level totals, not account-wide balances or double counted transactions",()=>{assert.deepEqual(paymentProgress({tuitionFee:3000,paid:2000,balanceDue:1000},[{amount:500}]),{percent:67,tracked:500,openingOrAdjustment:1500,valid:true});assert.equal(paymentProgress({tuitionFee:3000,paid:3000,balanceDue:0}).percent,100);assert.equal(paymentProgress({tuitionFee:3000,paid:0,balanceDue:3000}).percent,0);assert.equal(paymentProgress({tuitionFee:null,paid:0,balanceDue:null}).percent,null);assert.equal(paymentProgress({tuitionFee:3000,paid:2000,balanceDue:0}).percent,null);});
