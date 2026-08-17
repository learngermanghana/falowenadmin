import test from "node:test";
import assert from "node:assert/strict";

import {
  BROCHURE_WHATSAPP_MESSAGE,
  buildBrochureWhatsappUrl,
  normalizeGhanaWhatsappNumber,
} from "../src/utils/brochureWhatsapp.js";

test("normalizes common Ghana phone number formats", () => {
  assert.equal(normalizeGhanaWhatsappNumber("024 123 4567"), "233241234567");
  assert.equal(normalizeGhanaWhatsappNumber("+233 24 123 4567"), "233241234567");
  assert.equal(normalizeGhanaWhatsappNumber("24-123-4567"), "233241234567");
  assert.equal(normalizeGhanaWhatsappNumber("12345"), "");
});

test("builds a WhatsApp deep link with the brochure follow-up message", () => {
  const url = buildBrochureWhatsappUrl("0241234567");
  assert.ok(url.startsWith("https://wa.me/233241234567?text="));
  assert.equal(decodeURIComponent(url.split("?text=")[1]), BROCHURE_WHATSAPP_MESSAGE);
  assert.match(BROCHURE_WHATSAPP_MESSAGE, /https:\/\/www\.falowen\.app/);
  assert.match(BROCHURE_WHATSAPP_MESSAGE, /https:\/\/www\.youtube\.com\/@LLEAGhana/);
});

test("does not build a link without a valid number or message", () => {
  assert.equal(buildBrochureWhatsappUrl("12345"), "");
  assert.equal(buildBrochureWhatsappUrl("0241234567", "  "), "");
});
