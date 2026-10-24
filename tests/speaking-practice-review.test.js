import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const page=readFileSync(new URL("../src/pages/SpeakingPracticeReviewPage.jsx",import.meta.url),"utf8");
const client=readFileSync(new URL("../src/services/speakingPracticeReviewService.js",import.meta.url),"utf8");
const app=readFileSync(new URL("../src/App.jsx",import.meta.url),"utf8");
test("Speaking review route is staff protected and visible in both menus",()=>{
  assert.match(app,/Route path="\/speaking-review" element=\{<ProtectedRoute><SpeakingPracticeReviewPage\s*\/><\/ProtectedRoute>\}/);
  assert.equal((app.match(/to="\/speaking-review"/g)||[]).length,2);
});
test("Speaking review stays lazy and fetches only on an explicit student lookup",()=>{
  assert.match(page,/onSubmit=\{run\}/);
  assert.match(page,/loadSpeakingPracticeReview\(\{auth,student,level\}\)/);
  assert.doesNotMatch(page,/useEffect\s*\(|setInterval\s*\(|onSnapshot\s*\(/);
  assert.match(client,/cache:"no-store"/);
  assert.match(client,/getIdToken\(\)/);
  assert.doesNotMatch(client,/setInterval\s*\(|onSnapshot\s*\(|openai|transcribe|MediaRecorder/i);
});
test("Staff UI distinguishes transcripts from replayable original audio",()=>{
  assert.match(page,/microphone recordings were transcribed, not saved as playable files/i);
  assert.match(page,/genuine confirmed transcripts/i);
  assert.match(page,/Course Book/);
  assert.match(page,/Exams Room/);
});
