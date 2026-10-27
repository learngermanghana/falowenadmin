import test from "node:test";
import assert from "node:assert/strict";
import { isSuccessfulClassEditorMessage } from "../src/utils/classEditorState.js";

test("session rebuild success messages are recognized as successful", () => {
  assert.equal(isSuccessfulClassEditorMessage("Sessions rebuilt successfully: 3 created, 2 updated, and 1 stale removed."), true);
});

test("session rebuild failures are not recognized as successful", () => {
  assert.equal(isSuccessfulClassEditorMessage("Session rebuild failed: Class not found"), false);
});
