import { before, after, test } from "node:test";
import assert from "node:assert/strict";
import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import { JSDOM } from "jsdom";
import { createServer } from "vite";

let server, dom, PublicPage, ReviewPage;
const originalFetch = global.fetch;
const originalFormData = global.FormData;
before(async () => {
  server = await createServer({ plugins: [{
    name: "referral-test-auth", enforce: "pre",
    load(id) {
      if (id.endsWith("/src/firebase.js")) return 'export const auth = { currentUser: { getIdToken: async () => "test-owner" } };';
      // Public partnership tests cover the page, not the real Firebase session.
      if (id.endsWith("/src/utils/organisationPartnerAccount.js")) return 'export const partnerAuth = {}; export async function partnerRequest() { throw new Error("Test partner session unavailable"); } export async function downloadPartnerAgreement() {}';
      if (id.endsWith("/src/components/PartnerAccount.jsx")) return 'import React from "react"; export default function PartnerAccount(){return React.createElement("section",{className:"partner-account"},React.createElement("h2",null,"Your organisation partner account"),React.createElement("p",null,"Sign in to register an organisation."));}';
    },
  }], optimizeDeps: { noDiscovery: true, include: [] }, server: { middlewareMode: true, hmr: false, watch: null }, appType: "custom" });
  PublicPage = (await server.ssrLoadModule("/src/pages/PartnershipPage.jsx")).default;
  ReviewPage = (await server.ssrLoadModule("/src/pages/ReferralReviewPage.jsx")).default;
  dom = new JSDOM("<main></main>", { url: "https://example.org" });
  global.window = dom.window;
  global.document = dom.window.document;
  global.FormData = dom.window.FormData;
  dom.window.HTMLAnchorElement.prototype.click = function () {};
  global.IS_REACT_ACT_ENVIRONMENT = true;
});
after(async () => {
  global.fetch = originalFetch;
  global.FormData = originalFormData;
  delete global.window;
  delete global.document;
  delete global.IS_REACT_ACT_ENVIRONMENT;
  dom?.window.close();
  await server?.close();
});
async function render(Page, path) {
  const root = createRoot(document.querySelector("main"));
  await act(() => root.render(React.createElement(MemoryRouter, { initialEntries: [path] }, React.createElement(Page))));
  return () => act(() => root.unmount());
}
test("public partnership explains the agreement and requires an organisation account", async () => {
  global.fetch = async path => {
    if (path.includes("agreement-terms")) return Response.json({ ok: true, version: "org-v3", partnerShareRate: 0.1, shareSettlement: "invoice_deduction", tuitionRefundable: false, classDurationWeeks: 10, accessMonths: 6, accessStartsAt: "account_activation", terms: ["Organisation agreement"] });
    throw new Error("Unexpected request: " + path);
  };
  const unmount = await render(PublicPage, "/partnerships");
  try {
    assert.equal(document.querySelectorAll('[role="tab"]').length, 3);
    assert.match(document.body.textContent, /Grow your offering/);
    assert.doesNotMatch(document.body.textContent, /Clients paying for themselves|Normal student signup/);
    await act(() => document.getElementById("partner-tab-1").click());
    assert.match(document.body.textContent, /Organisation agreement/);
    await act(() => document.getElementById("partner-tab-2").click());
    assert.match(document.body.textContent, /Your organisation partner account/);
    assert.equal(document.querySelector('input[name="accountNumber"]'), null);
    assert.equal(document.querySelector('a[href*="signup"]'), null);
  } finally { await unmount(); }
});
test("query parameters cannot expose an individual signup or a second programme", async () => {
  let calls=0;global.fetch=async()=>{calls++;throw new Error("No request expected before opening agreement");};
  const unmount=await render(PublicPage,"/partnerships?ref="+"a".repeat(32));
  try {assert.equal(document.querySelector('a[href*="signup"]'),null);assert.equal(document.querySelectorAll('[role="tab"]').length,3);assert.equal(calls,0);} finally {await unmount();}
});
test("partnership tabs support keyboard navigation without skipping account verification", async () => {
  global.fetch = async path => {
    if (path.includes("agreement-terms")) return Response.json({ ok: true, version: "org-v4", partnerShareRate: 0.1, shareSettlement: "invoice_deduction", tuitionRefundable: false, classDurationWeeks: 10, accessMonths: 6, accessStartsAt: "account_activation", terms: ["Organisation agreement"] });
    throw new Error("Unexpected request: " + path);
  };
  const unmount = await render(PublicPage, "/partnerships");
  try {
    await act(() => document.getElementById("partner-tab-2").click());
    assert.match(document.body.textContent, /Your organisation partner account/);
    await act(() => document.getElementById("partner-tab-2").dispatchEvent(new window.KeyboardEvent("keydown",{key:"ArrowLeft",bubbles:true})));
    assert.equal(document.activeElement.id, "partner-tab-1");
    assert.equal(document.getElementById("partner-tab-1").getAttribute("aria-selected"), "true");
    await act(() => document.getElementById("partner-tab-1").dispatchEvent(new window.KeyboardEvent("keydown",{key:"ArrowRight",bubbles:true})));
    assert.equal(document.getElementById("partner-tab-2").getAttribute("aria-selected"), "true");
  } finally { await unmount(); }
});
test("owner sees organisation applications and no commission queue", async () => {
  let calls=0;global.fetch=async path=>{calls++;assert.equal(path,"/api/admin/referrals/signature");return Response.json({ok:true,installed:true});};const unmount=await render(ReviewPage,"/referral-review");
  try {assert.match(document.body.textContent,/Organisation applications/);assert.doesNotMatch(document.body.textContent,/Referrals and commissions/);assert.equal(calls,1);assert.match(document.body.textContent,/Signature is saved and ready/);}finally{await unmount();}
});
