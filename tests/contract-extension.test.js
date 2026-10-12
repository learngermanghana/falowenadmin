import test from "node:test";
import assert from "node:assert/strict";
import { extendContractDate } from "../src/utils/contractExtension.js";
test("contract extensions preserve calendar dates and clamp short months", () => {
  assert.equal(extendContractDate("2026-10-12", 1), "2026-11-12");
  assert.equal(extendContractDate("2026-10-12", 3), "2027-01-12");
  assert.equal(extendContractDate("2026-10-12", 6), "2027-04-12");
  assert.equal(extendContractDate("2026-01-31", 1), "2026-02-28");
  assert.equal(extendContractDate("2028-01-31", 1), "2028-02-29");
  assert.throws(() => extendContractDate("2026-02-30", 1));
  assert.throws(() => extendContractDate("", 1));
});
