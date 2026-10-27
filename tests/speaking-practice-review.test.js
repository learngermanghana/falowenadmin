import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const page=readFileSync(new URL("../src/pages/SpeakingPracticeReviewPage.jsx",import.meta.url),"utf8");
const client=readFileSync(new URL("../src/services/speakingPracticeReviewService.js",import.meta.url),"utf8");
const app=readFileSync(new URL("../src/App.jsx",import.meta.url),"utf8");
test("Speaking usage dashboard is a protected Admin route",()=>{
  assert.match(app,/Route path="\/speaking-review" element=\{<ProtectedRoute><SpeakingPracticeReviewPage\s*\/><\/ProtectedRoute>\}/);
  assert.equal((app.match(/to="\/exam-tracking"/g)||[]).length,2);
});
test("Activity is fetched only on staff button click; no periodic checks",()=>{
  assert.match(page,/onClick=\{\(\)=>check\("activity"\)\}/);
  assert.match(page,/onSubmit=\{e=>\{e\.preventDefault\(\);check\("student"\);\}\}/);
  assert.match(client,/getIdToken\(\)/);
  assert.match(client,/cache:"no-store"/);
  assert.doesNotMatch(page,/useEffect\s*\(|setInterval\s*\(|onSnapshot\s*\(/);
});
test("No voice files, transcripts, German answers or dollar estimates in dashboard",()=>{
  assert.match(page,/item.studentName/);
  assert.match(page,/Practice score:/);
  assert.match(page,/Not scored yet/);
  assert.doesNotMatch(page,/Uploaded audio|Student UID:|Reserved AI call units|item\.recordedBytes/);
  assert.doesNotMatch(page,/item\.answers|item\.dialogue|item\.feedback|audioBase64|<audio|MediaRecorder/);
});
