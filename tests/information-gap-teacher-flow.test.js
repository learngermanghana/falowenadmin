import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

test("information-gap presenter shows a clear teacher flow", () => {
  const presenter = fs.readFileSync("src/components/TeachingSlidePresenter.jsx", "utf8");
  assert.match(presenter, /Teacher flow/);
  assert.match(presenter, /Choose two students: Partner A and Partner B/);
  assert.match(presenter, /Close both cards/);
  assert.match(presenter, /do not let either student read the other role card/);
});
