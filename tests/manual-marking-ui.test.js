import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { build } from "esbuild";
import { JSDOM } from "jsdom";
import React, { act } from "react";
const require = createRequire(import.meta.url);
const bundle = await build({ entryPoints: ["src/components/ManualMarking.jsx"], bundle: true, write: false,
  platform: "node", format: "cjs", jsx: "automatic", packages: "external", loader: { ".css": "empty" },
  plugins: [{ name: "manual-marking-services", setup(b) {
    b.onResolve({ filter: /services\/markingService\.js$/ }, () => ({ path: "service", namespace: "mock" }));
    b.onResolve({ filter: /context\/ToastContext\.jsx$/ }, () => ({ path: "toast", namespace: "mock" }));
    b.onLoad({ filter: /.*/, namespace: "mock" }, ({ path }) => ({ loader: "js", contents: path === "service"
      ? 'export const loadRoster = () => globalThis.manualMocks.loadRoster(); export const fetchSubmissions = (...args) => globalThis.manualMocks.fetchSubmissions(...args); export const saveScoreRow = (...args) => globalThis.manualMocks.saveScoreRow(...args);'
      : 'export const useToast = () => globalThis.manualMocks.toast;' }));
  } }],
});

async function mount({ rows = [], retrievalError = false, duplicate = false, saveError = false } = {}) {
  const dom = new JSDOM('<div id="root"></div>', { url: "https://admin.falowen.app/marking?tab=manual" });
  globalThis.window = dom.window; globalThis.document = dom.window.document; globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  const notices = [], saves = [], retrievals = [];
  globalThis.manualMocks = {
    loadRoster: async () => [{ id: "one", studentCode: "TEST-001", name: "Test Student", level: "B1" }, { id: "two", studentCode: "TEST-002", name: "Other Student", level: "B1" }],
    fetchSubmissions: async (...args) => { retrievals.push(args); if (retrievalError) throw new Error("Retrieval unavailable"); return rows; },
    saveScoreRow: async (payload) => { saves.push(payload); if (saveError) throw new Error("Sheet save failed"); return { duplicateSkipped: duplicate, sheet: { success: true }, firestore: { attempted: true, success: true } }; },
    toast: { success: (message) => notices.push(message), error: (message) => notices.push(message) },
  };
  const module = { exports: {} }; new Function("require", "module", "exports", bundle.outputFiles[0].text)(require, module, module.exports);
  const { createRoot } = await import("react-dom/client");
  const root = createRoot(document.getElementById("root"));
  await act(async () => root.render(React.createElement(module.exports.default)));
  const change = async (selector, value) => { const node = document.querySelector(selector);
    await act(async () => { Object.getOwnPropertyDescriptor(Object.getPrototypeOf(node), "value").set.call(node, value);
      node.dispatchEvent(new window.Event(node.tagName === "SELECT" ? "change" : "input", { bubbles: true })); }); };
  const selectLesson = async (value) => { const nodes = document.querySelectorAll('select'); await change('select', 'one');
    await act(async()=> { const node=nodes[nodes.length-1]; node.value=value; node.dispatchEvent(new window.Event('change',{bubbles:true})); }); };
  const submit = async () => { await act(async () => document.querySelector("form").dispatchEvent(new window.Event("submit", { bubbles: true, cancelable: true }))); };
  return { saves, notices, retrievals, change, selectLesson, submit,
    async retrieve() { await act(async () => [...document.querySelectorAll('button')].find((b) => /Try retrieving/.test(b.textContent)).click()); },
    async close() { await act(async () => root.unmount()); dom.window.close(); },
  };
}

test("manual marking loads the selected day reference without retrieving student work and saves without a submission", async () => {
  const page = await mount(); try {
    await page.selectLesson("B1-6.19");
    assert.match(document.body.textContent, /B1-6.19/);
    assert.equal(page.retrievals.length, 0);
    await page.change('input[type="number"]', "89");
    await page.change('textarea', "Clear ideas and good structure.");
    await page.submit();
    assert.equal(page.saves.length, 1);
    assert.equal(page.saves[0].studentCode, "TEST-001");
    assert.equal(page.saves[0].assignmentId, "B1-6.19");
    assert.equal(page.saves[0].score, 89);
    assert.match(page.notices.join(" "), /Saved 89\/100/);
    await page.change('select', 'two');
    assert.equal(document.querySelector('input[type="number"]').value, "");
    assert.equal(document.querySelector('textarea').value, "");
  } finally { await page.close(); }
});

test("optional retrieval failure leaves manual save available and uses exact student scope", async () => {
  const page = await mount({ retrievalError: true }); try {
    await page.selectLesson("B1-6.19"); await page.retrieve();
    assert.deepEqual(page.retrievals, [["B1", "TEST-001"]]);
    assert.match(document.body.textContent, /Retrieval unavailable/);
    await page.change('input[type="number"]', "82"); await page.change('textarea', "Reviewed the emailed work."); await page.submit();
    assert.equal(page.saves.length, 1);
  } finally { await page.close(); }
});

test("duplicate and failed saves do not show success", async () => {
  for (const options of [{ duplicate: true }, { saveError: true }]) {
    const page = await mount(options); try {
      await page.selectLesson("B1-6.19"); await page.change('input[type="number"]', "82"); await page.change('textarea', "Reviewed work."); await page.submit();
      assert.equal(page.saves.length, 1);
      assert.doesNotMatch(page.notices.join(" "), /Saved 82/);
      assert.equal(document.querySelector('button[type="submit"]').textContent, "Save final score and feedback");
    } finally { await page.close(); }
  }
});
