import fs from "fs";

test("information-gap presenter shows a clear teacher flow", () => {
  const presenter = fs.readFileSync("src/components/TeachingSlidePresenter.jsx", "utf8");
  expect(presenter).toMatch(/Teacher flow/);
  expect(presenter).toMatch(/Choose two students: Partner A and Partner B/);
  expect(presenter).toMatch(/Close both cards/);
  expect(presenter).toMatch(/do not let either student read the other role card/);
});
