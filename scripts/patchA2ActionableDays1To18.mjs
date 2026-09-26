import fs from "node:fs";

const presenterPath = new URL("../src/utils/teachingPresenter.js", import.meta.url);
const source = fs.readFileSync(presenterPath, "utf8");

if (!source.includes('id: "knowledge"') || !source.includes('getA2FocusedPractice')) {
  throw new Error("A2 teaching spine is missing; legacy actionable patches must not rebuild the old drill stack.");
}

if (source.includes("A2_ACTIONABLE_PRACTICE")) {
  throw new Error("Legacy A2 actionable practice bank detected.");
}

console.log("A2 legacy actionable patch: legacy multi-stage drill injection disabled; A2 teaching spine preserved.");
