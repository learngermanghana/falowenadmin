import test from "node:test";
import assert from "node:assert/strict";
import {matchesPhoneDigits} from "../src/utils/studentPhoneSearch.js";

test("staff can locate formatted Ghana emergency phone by digits",()=>{
  assert.equal(matchesPhoneDigits("233241234567",["+233 24 123 4567"]),true);
  assert.equal(matchesPhoneDigits("+233 24 123 4567",["233241234567"]),true);
  assert.equal(matchesPhoneDigits("0241234567",["024-123-4567"]),true);
});
test("incomplete and unrelated queries do not match phone digits",()=>{
  assert.equal(matchesPhoneDigits("233",["+233 24 123 4567"]),false);
  assert.equal(matchesPhoneDigits("abc",["+233 24 123 4567"]),false);
  assert.equal(matchesPhoneDigits("0249999999",["+233 24 123 4567"]),false);
});
