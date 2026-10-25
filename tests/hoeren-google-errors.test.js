import test from "node:test";
import assert from "node:assert/strict";
import {createRequire} from "node:module";
const require=createRequire(import.meta.url);
const {describeGoogleRejection}=require("../functions/hoerenStudioApi.js");
test("Google validation errors have useful category without echoing private content",()=>{
  const x=describeGoogleRejection({error:{status:"INVALID_ARGUMENT",message:"Invalid speech_config speaker name. Transcript: SECRET_STUDENT_TEXT api_key=TOPSECRET"}});
  assert.equal(x.category,"invalid_argument");
  assert.equal(x.code,"INVALID_ARGUMENT");
  assert.doesNotMatch(JSON.stringify(x),/SECRET_STUDENT_TEXT|TOPSECRET/);
});
test("unsupported models get an actionable diagnosis",()=>{
  const x=describeGoogleRejection({error:{message:"Model is not supported for speech generation"}});
  assert.equal(x.category,"model_unavailable");
});
test("non-JSON and unexpected provider errors never leak text",()=>{
  assert.doesNotThrow(()=>describeGoogleRejection({error:{message:"Private content: learner data"}}));
  assert.doesNotMatch(JSON.stringify(describeGoogleRejection({error:{message:"Private content: learner data"}})),/learner data/);
});
