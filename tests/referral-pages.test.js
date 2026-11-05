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
test("programme links to the existing group form and submits a separate application", async () => {
  const unmount = await render(PublicPage, "/partnerships");
  try {
    assert.ok(document.querySelector('a[href="/organisation-enrolment"]'));
    let request;
    global.fetch = async (path, opts) => {
      request = { path, body: JSON.parse(opts.body) };
      return Response.json({ ok: true });
    };
    const form = document.querySelector("form");
    form.elements.name.value = "Example school";
    form.elements.email.value = "school@example.org";
    form.elements.consent.checked = true;
    await act(() => form.dispatchEvent(new window.Event("submit", { bubbles: true, cancelable: true })));
    assert.equal(request.path, "/api/referrals/apply");
    assert.equal(request.body.consent, true);
    assert.match(document.body.textContent, /Application received/);
  } finally { await unmount(); }
});
test("learner invitation retains email on failure, retries, then offers Campus signup", async () => {
  const code = "a".repeat(32);
  const unmount = await render(PublicPage, "/partnerships?ref=" + code);
  try {
    const form = document.querySelector("form");
    form.elements.email.value = "learner@example.org";
    form.elements.consent.checked = true;
    let calls = 0;
    global.fetch = async (path, opts) => {
      assert.equal(path, "/api/referrals/claim");
      assert.equal(JSON.parse(opts.body).code, code);
      if (++calls === 1) throw new Error("offline");
      return Response.json({ ok: true });
    };
    const submit = () => act(() => form.dispatchEvent(new window.Event("submit", { bubbles: true, cancelable: true })));
    await submit();
    assert.equal(form.elements.email.value, "learner@example.org");
    assert.ok(document.querySelector('[role="alert"]'));
    await submit();
    assert.ok(document.querySelector('[role="status"] a[href="https://www.falowen.app/signup?program=german"]'));
  } finally { await unmount(); }
});
test("owner review opens without fetching either queue", async () => {
  let calls = 0;
  global.fetch = async () => { calls++; throw new Error("Unexpected request"); };
  const unmount = await render(ReviewPage, "/referral-review");
  try {
    assert.match(document.body.textContent, /Partner applications/);
    assert.match(document.body.textContent, /Referrals and commissions/);
    assert.equal(calls, 0);
  } finally { await unmount(); }
});
