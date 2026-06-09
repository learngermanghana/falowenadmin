import test from "node:test";
import assert from "node:assert/strict";
import { MARKETING_TEMPLATES, renderMarketingMessage } from "../src/data/marketingTemplates.js";

test("provides the requested product and service marketing template groups", () => {
  assert.equal(MARKETING_TEMPLATES.product.length, 6);
  assert.equal(MARKETING_TEMPLATES.service.length, 9);
  assert.equal(MARKETING_TEMPLATES.product[0].name, "New Product Arrival");
  assert.equal(MARKETING_TEMPLATES.service.at(-1).name, "Thank You After Service");
});

test("renders known values while preserving variables that are not filled", () => {
  const output = renderMarketingMessage("Hi {customerName}, book {serviceName} for {price}.", {
    customerName: "Ada",
    serviceName: "Massage",
  });
  assert.equal(output, "Hi Ada, book Massage for {price}.");
});
