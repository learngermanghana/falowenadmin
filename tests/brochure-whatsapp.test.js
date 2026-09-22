import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  BROCHURE_WHATSAPP_MESSAGE,
  buildBrochureWhatsappUrl,
  buildClassBrochureMessage,
  buildClassBrochureUrl,
  formatBrochureFee,
  formatBrochureSchedule,
  normalizeGhanaWhatsappNumber,
  upcomingBrochureClasses,
} from "../src/utils/brochureWhatsapp.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), "utf8");

const publicService = read("src/services/publicBrochureClassService.js");

test("normalizes common Ghana phone number formats", () => {
  assert.equal(normalizeGhanaWhatsappNumber("024 123 4567"), "233241234567");
  assert.equal(normalizeGhanaWhatsappNumber("+233 24 123 4567"), "233241234567");
  assert.equal(normalizeGhanaWhatsappNumber("24-123-4567"), "233241234567");
  assert.equal(normalizeGhanaWhatsappNumber("12345"), "");
});

test("builds a WhatsApp deep link", () => {
  const url = buildBrochureWhatsappUrl("0241234567");
  assert.ok(url.startsWith("https://wa.me/233241234567?text="));
  assert.equal(decodeURIComponent(url.split("?text=")[1]), BROCHURE_WHATSAPP_MESSAGE);
});

test("builds a direct public brochure URL for the selected class", () => {
  const url = buildClassBrochureUrl({
    name: "A1 Dortmund Klasse",
    classUrl: "/classes/a1-dortmund-klasse",
  });
  assert.equal(
    url,
    "https://www.falowen.app/classes/?class=a1-dortmund-klasse&open=1",
  );
});

test("selected class message includes current class context and no attachment requirement", () => {
  const message = buildClassBrochureMessage({
    name: "A1 Dortmund Klasse",
    startDate: "2026-10-01",
    tuitionGhs: 2800,
    scheduleRules: [
      { day: "Mon", startTime: "18:00" },
      { day: "Wed", startTime: "18:00" },
    ],
  });

  assert.match(message, /A1 Dortmund Klasse/);
  assert.match(message, /1 October 2026/);
  assert.match(message, /GHS 2,800/);
  assert.match(message, /Monday 18:00/);
  assert.match(message, /class=a1-dortmund-klasse&open=1/);
  assert.match(message, /No PDF attachment is needed/);
});

test("upcoming brochure classes include only open future classes and sort soonest first", () => {
  const rows = upcomingBrochureClasses([
    { name: "A2 Future", startDate: "2026-11-01", registrationOpen: true, publicVisible: true },
    { name: "A1 Soon", startDate: "2026-10-01", registrationOpen: true, publicVisible: true },
    { name: "A1 Closed", startDate: "2026-10-02", registrationOpen: false, publicVisible: true },
    { name: "A1 Draft", startDate: "2026-10-03", registrationOpen: true, publicVisible: true, status: "draft" },
    { name: "A1 Past", startDate: "2026-09-01", registrationOpen: true, publicVisible: true },
  ], new Date("2026-09-18T12:00:00Z"));

  assert.deepEqual(rows.map((item) => item.name), ["A1 Soon", "A2 Future"]);
});

test("formats selected class fee and schedule from class metadata", () => {
  assert.equal(formatBrochureFee({ tuitionGhs: 3000 }), "GHS 3,000");
  assert.equal(
    formatBrochureSchedule({
      scheduleRules: [
        { day: "Thu", startTime: "11:00", endTime: "12:00" },
        { day: "Fri", startTime: "11:00", endTime: "12:00" },
      ],
    }),
    "Thursday 11:00–12:00 · Friday 11:00–12:00",
  );
});

test("brochure panel loads real classes and no longer asks staff to attach a PDF", () => {
  const panel = read("src/components/BrochureWhatsappPanel.jsx");
  const classes = read("src/services/publicBrochureClassService.js");

  assert.match(panel, /loadShareablePublicClasses/);
  assert.match(panel, /Classes currently available for registration/);
  assert.match(panel, /Open brochure/);
  assert.match(panel, /Copy brochure link/);
  assert.match(panel, /No attachment needed/);
  assert.doesNotMatch(panel, /Attach the brochure file/);

  assert.match(classes, /\/api\/public\/classes/);
  assert.doesNotMatch(classes, /https:\/\/www\.falowen\.app\/api\/public\/classes/);
  assert.doesNotMatch(classes, /cloudfunctions\.net\/publicClassesCatalog/);
  assert.match(classes, /no-store/);
});

test("public brochure class service uses the same catalogue as Falowen brochure pages", async () => {
  const requests = [];
  const rows = await (async () => {
    const module = await import("../src/services/publicBrochureClassService.js");
    return module.loadShareablePublicClasses(async (url) => {
      requests.push(url);
      return {
        ok: true,
        async json() {
          return {
            classes: [
              { id: "a2", slug: "a2-future", title: "A2 Future", startDate: "2026-11-01" },
              { id: "a1", slug: "a1-soon", title: "A1 Soon", startDate: "2026-10-01" },
            ],
          };
        },
      };
    });
  })();

  assert.equal(requests.length, 1);
  assert.match(requests[0], /^\/api\/public\/classes\?fresh=/);
  assert.deepEqual(rows.map((row) => row.slug), ["a1-soon", "a2-future"]);
});

test("admin router owns the upstream public catalogue fallback", () => {
  const router = read("api/router.js");
  assert.match(router, /path === "public\/classes"/);
  assert.match(router, /www\.falowen\.app\/api\/public\/classes/);
  assert.match(router, /europe-west1-falowen-examiner-trainer\.cloudfunctions\.net\/publicClassesCatalog/);
  assert.match(router, /proxyPublicClasses/);
});

test("browser catalogue request stays same-origin and avoids CORS preflight headers", () => {
  assert.match(publicService, /"\/api\/public\/classes"/);
  assert.doesNotMatch(publicService, /"cache-control": "no-cache"/);
  assert.doesNotMatch(publicService, /pragma: "no-cache"/);
});

test("does not build a WhatsApp link without a valid number or message", () => {
  assert.equal(buildBrochureWhatsappUrl("12345"), "");
  assert.equal(buildBrochureWhatsappUrl("0241234567", "  "), "");
});
