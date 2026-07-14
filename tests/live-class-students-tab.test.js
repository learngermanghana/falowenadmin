import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const pagePath = new URL("../src/pages/LiveClassesPageV2.jsx", import.meta.url);
const panelPath = new URL("../src/components/LiveClassStudentsPanel.jsx", import.meta.url);

async function source(path) {
  return readFile(path, "utf8");
}

test("Live Classes replaces the Curriculum tab with Students", async () => {
  const page = await source(pagePath);
  assert.match(page, /\{ id: "students", label: "Students" \}/);
  assert.doesNotMatch(page, /\{ id: "curriculum", label: "Curriculum" \}/);
  assert.match(page, /activeTab === "students"/);
  assert.match(page, /<LiveClassStudentsPanel/);
  assert.match(page, /classId=\{dashboard\.klass\.id \|\| selectedClassId\}/);
  assert.match(page, /className=\{dashboard\.klass\.name \|\| dashboard\.klass\.className \|\| selectedClassId\}/);
});

test("the Students tab loads only the selected class roster", async () => {
  const panel = await source(panelPath);
  assert.match(panel, /listStudentsByClass\(classId, \{ className \}\)/);
  assert.match(panel, /Search class roster/);
  assert.match(panel, /Select one student/);
  assert.match(panel, /Student code/);
  assert.match(panel, /Payment status/);
  assert.match(panel, /Balance due/);
  assert.match(panel, /Contract end/);
});

test("curriculum assignment controls remain available inside Sessions", async () => {
  const page = await source(pagePath);
  assert.match(page, /<SessionDictionaryPicker/);
  assert.match(page, /saveDictionarySelection/);
  assert.match(page, /Complete dictionary selection/);
});
