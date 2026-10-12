import test from "node:test";
import assert from "node:assert/strict";
import { tryStoreMarkingDraft } from "../src/utils/markingDraftStorage.js";
test("denied draft writes identify their collection without discarding the generated mark", async () => {
  assert.equal(await tryStoreMarkingDraft(async () => { throw Object.assign(new Error("denied"), { code: "permission-denied" }); }, "aiMarkingAudit"), "Firestore denied access to aiMarkingAudit.");
  assert.equal(await tryStoreMarkingDraft(async () => {}, "markingResults"), null);
  await assert.rejects(tryStoreMarkingDraft(async () => { throw new Error("network failed"); }, "markingResults"), /network failed/);
});
