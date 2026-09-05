import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import vm from "node:vm";

const html = fs.readFileSync(new URL("../index.html", import.meta.url), "utf8");

function safari14PolyfillSource() {
  const match = html.match(/<script data-safari14-polyfills>([\s\S]*?)<\/script>/);
  assert.ok(match, "Safari 14 runtime polyfill script is missing from index.html");
  return match[1];
}

test("Safari 14 runtime polyfill loads before the Vite module entry", () => {
  const polyfillIndex = html.indexOf("data-safari14-polyfills");
  const moduleIndex = html.indexOf('<script type="module" src="/src/main.jsx"></script>');

  assert.ok(polyfillIndex >= 0, "Safari 14 polyfill marker is missing");
  assert.ok(moduleIndex >= 0, "Vite module entry is missing");
  assert.ok(polyfillIndex < moduleIndex, "Safari 14 polyfill must execute before the Vite module graph");
});

test("Safari 14 runtime polyfill restores negative .at() indexing", () => {
  const context = vm.createContext({});
  vm.runInContext("delete Array.prototype.at; delete String.prototype.at;", context);
  vm.runInContext(safari14PolyfillSource(), context);

  assert.equal(vm.runInContext("['first', 'last'].at(-1)", context), "last");
  assert.equal(vm.runInContext("'Falowen'.at(-1)", context), "n");
  assert.equal(vm.runInContext("['first', 'last'].at(9)", context), undefined);
});
