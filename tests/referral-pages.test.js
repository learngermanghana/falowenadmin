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
test("one organisation application has signing but no bank or referral choices", async () => {
  const requests = [];
  global.fetch = async (path, opts) => {
    if (path.includes("agreement-terms")) return Response.json({ ok: true, version: "org-v3", partnerShareRate: 0.1, shareSettlement: "invoice_deduction", terms: ["Organisation agreement"] });
    if (path.endsWith("agreement-copy")) return new Response("PDF", { headers: { "Content-Type": "application/pdf" } });
    requests.push({ path, body: JSON.parse(opts.body) }); return Response.json({ ok: true, reference: "a".repeat(64) });
  };
  const unmount = await render(PublicPage, "/partnerships");
  try {
    assert.equal(document.querySelectorAll('[role="tab"]').length,3);
    assert.match(document.body.textContent, /Grow your offering/);
    assert.doesNotMatch(document.body.textContent, /Clients paying for themselves|Normal student signup|Already submitted your organisation/);
    await act(() => document.getElementById("partner-tab-1").click());
    await act(() => document.getElementById("partner-tab-2").click());
    const form = document.querySelector("form");
    assert.equal(document.querySelectorAll("form").length, 1);
    assert.equal(form.elements.accountNumber, undefined);
    for (const [key, value] of Object.entries({ name: "Example agency", email: "agency@example.org", phone: "0200000000", address: "Accra", signerName: "Example Director", signerRole: "Director" })) form.elements[key].value = value;
    for (const key of ["consent", "signatureConsent"]) form.elements[key].checked = true;
    await act(() => form.dispatchEvent(new window.Event("submit", { bubbles: true, cancelable: true })));
    assert.equal(requests[0].body.kind, "institutional");assert.equal(requests[0].body.billingResponsibility, "organisation");assert.equal(requests[0].body.termsVersion,"org-v3");
    assert.match(document.body.textContent, /Your organisation is registered for review/);
    assert.equal(document.querySelector('a[href*="signup"]'),null);
    assert.ok(document.querySelector('a[href="/organisation-enrolment"]'));
  } finally { await unmount(); }
});
test("query parameters cannot expose an individual signup or a second programme", async () => {
  let calls=0;global.fetch=async()=>{calls++;throw new Error("No request expected before opening agreement");};
  const unmount=await render(PublicPage,"/partnerships?ref="+"a".repeat(32));
  try {assert.equal(document.querySelector('a[href*="signup"]'),null);assert.equal(document.querySelectorAll('[role="tab"]').length,3);assert.equal(calls,0);} finally {await unmount();}
});
test("tabs preserve registration details and support keyboard navigation", async () => {
  global.fetch=async()=>Response.json({ok:true,version:"org-v4",partnerShareRate:0.1,shareSettlement:"invoice_deduction",terms:["Your 10% organisation share — Deducted from the invoice."]});
  const unmount=await render(PublicPage,"/partnerships");
  try {
    await act(()=>document.getElementById("partner-tab-2").click());
    const input=document.querySelector('input[name="name"]');input.value="Agency draft";
    await act(()=>document.getElementById("partner-tab-1").click());
    await act(()=>document.getElementById("partner-tab-2").click());assert.equal(document.querySelector('input[name="name"]').value,"Agency draft");
    await act(()=>document.getElementById("partner-tab-2").dispatchEvent(new window.KeyboardEvent("keydown",{key:"ArrowLeft",bubbles:true})));
    assert.equal(document.activeElement.id,"partner-tab-1");assert.equal(document.getElementById("partner-tab-1").getAttribute("aria-selected"),"true");
  }finally{await unmount();}
});
test("owner sees organisation applications and no commission queue", async () => {
  let calls=0;global.fetch=async path=>{calls++;assert.equal(path,"/api/admin/referrals/signature");return Response.json({ok:true,installed:true});};const unmount=await render(ReviewPage,"/referral-review");
  try {assert.match(document.body.textContent,/Organisation applications/);assert.doesNotMatch(document.body.textContent,/Referrals and commissions/);assert.equal(calls,1);assert.match(document.body.textContent,/Signature is saved and ready/);}finally{await unmount();}
});
