import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  CAMPAIGN_FORMATS, campaignClassEligibility, daysUntilClass,
  createClassCampaign, classCampaignCaption, classCampaignManifest,
  isSafeCampaignUrl, makeCampaignZip,
} from "../src/utils/socialClassCampaign.js";

const today = "2026-10-16";
const upcoming = {
  id: "class-a1", name: "A1 Berlin Klasse", status: "upcoming",
  publicVisible: true, registrationOpen: true,
  startDate: "2026-10-23", endDate: "2027-01-31",
};
const data = {
  className: upcoming.name, level: "A1", startDate: "23 October 2026",
  schedule: "Mon / Wed", mode: "Online", fee: "GHS 3,000",
  website: "https://www.falowen.app/classes/a1-berlin",
  phone: "0205706589",
};
test("only genuine eligible and publicly visible classes are offered", () => {
  assert.equal(campaignClassEligibility(upcoming, today), true);
  assert.equal(campaignClassEligibility({ ...upcoming, registrationOpen: false }, today), false);
  assert.equal(campaignClassEligibility({ ...upcoming, publicVisible: false }, today), false);
  assert.equal(campaignClassEligibility({ ...upcoming, archived: true }, today), false);
  assert.equal(campaignClassEligibility({ ...upcoming, status: "graduated" }, today), false);
  assert.equal(campaignClassEligibility({ ...upcoming, startDate: "2026-09-30" }, today), false);
});
test("an ongoing class needs explicit registrationOpen=true and a future end date", () => {
  const active = { ...upcoming, status: "active", startDate: "2026-09-01" };
  assert.equal(campaignClassEligibility(active, today), true);
  assert.equal(campaignClassEligibility({ ...active, registrationOpen: undefined }, today), false);
  assert.equal(campaignClassEligibility({ ...active, endDate: "" }, today), false);
  assert.equal(campaignClassEligibility({ ...active, endDate: "2026-10-10" }, today), false);
  assert.equal(campaignClassEligibility({ ...active, status: "completed" }, today), false);
});
test("countdowns are date-based in Accra and never invent urgency", () => {
  assert.equal(daysUntilClass("2026-10-17", today), 1);
  assert.equal(daysUntilClass("2026-10-16", today), 0);
  assert.equal(daysUntilClass("2026-11-20", today), 35);
  assert.equal(daysUntilClass("not a date", today), null);
  const tomorrow = createClassCampaign({ ...upcoming, startDate: "2026-10-17" }, data, today);
  assert.equal(tomorrow[3].data.eyebrow, "STARTS TOMORROW");
  const later = createClassCampaign({ ...upcoming, startDate: "2026-12-20" }, data, today);
  assert.equal(later[3].data.eyebrow, "NEXT GERMAN CLASS");
  assert.ok(!JSON.stringify(later).includes("LIMITED SEATS"));
});
test("five exportable assets use the same canonical source class", () => {
  const slides = createClassCampaign(upcoming, data, today);
  assert.deepEqual(slides.map((s) => s.id), ["registration", "overview", "logistics", "countdown", "whatsapp"]);
  assert.deepEqual(slides.map((s) => s.format), ["portrait", "square", "square", "story", "story"]);
  assert.equal(slides[0].data.className, upcoming.name);
  assert.equal(CAMPAIGN_FORMATS.story.width, 1080);
  assert.equal(CAMPAIGN_FORMATS.story.height, 1920);
  assert.ok(slides.every((s) => s.caption.includes(upcoming.name)));
  assert.match(classCampaignManifest(upcoming, slides), /Carousel order: overview/);
});
test("ongoing class captions do not advertise a future start date", () => {
  const active = { ...upcoming, status: "active", startDate: "2026-09-01" };
  const caption = classCampaignCaption(active, data, "registration", today);
  assert.doesNotMatch(caption, /Start: 23 October/);
});
test("registration links must use safe HTTPS", () => {
  assert.equal(isSafeCampaignUrl("https://www.falowen.app/classes"), true);
  assert.equal(isSafeCampaignUrl("http://www.falowen.app/classes"), false);
  assert.equal(isSafeCampaignUrl("javascript:alert(1)"), false);
  assert.equal(isSafeCampaignUrl("https://user:pass@example.com/"), false);
});
test("ZIP contains a complete local and central entry for every filename", async () => {
  const zip = makeCampaignZip([
    { name: "registration-portrait.png", content: Uint8Array.of(137, 80, 78, 71) },
    { name: "captions-and-review.txt", content: "Hello Falowen" },
  ]);
  const bytes = new Uint8Array(await zip.arrayBuffer());
  const view = new DataView(bytes.buffer);
  assert.equal(view.getUint32(0, true), 0x04034b50);
  assert.equal(view.getUint32(bytes.length - 22, true), 0x06054b50);
  assert.equal(view.getUint16(bytes.length - 14, true), 2);
  assert.equal(view.getUint16(bytes.length - 12, true), 2);
  assert.equal(zip.type, "application/zip");
});
test("page retains original single-poster mode and shows a campaign pack", () => {
  const page = readFileSync(new URL("../src/pages/SocialMediaPage.jsx", import.meta.url), "utf8");
  assert.match(page, /campaignClassEligibility/);
  assert.match(page, /downloadCampaignPack/);
  assert.match(page, /Single poster/);
  assert.match(page, /<QRCodeCanvas/);
  assert.match(page, /downloadBrowserBlob\(makeCampaignZip/);
});
