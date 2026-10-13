import test from "node:test";
import assert from "node:assert/strict";
import { leadForPlacement, placementConversionStage, placementStatus, normalizePlacementResults } from "../src/services/placementAttemptService.js";

test("does not mistake an anonymous attempt for a registered student",()=>{
  const row={id:"pt_12345678-12345678",startedAt:"2026-10-13T12:00:00.000Z",completedAt:null};
  assert.equal(placementStatus(row,Date.parse("2026-10-13T12:10:00Z")),"in_progress");
  assert.equal(placementStatus(row,Date.parse("2026-10-13T12:21:00Z")),"expired");
  assert.equal(placementConversionStage(row,null),"Anonymous result");
  assert.equal(leadForPlacement(row,[{email:"learner@example.com"}]),null);
});

test("matches consented placement contact to existing lead, registration, payment",()=>{
  const row={id:"pt_12345678-12345678",consent:true,email:"LEARNER@example.com",score:{level:"A2"}};
  const leads=[{id:"lead-1",email:"learner@example.com",status:"student_registered",paymentStatus:"paid",studentCode:"A2-101"}];
  assert.equal(leadForPlacement(row,leads),leads[0]);
  assert.equal(placementConversionStage(row,leads[0]),"Active / paid student");
  assert.equal(normalizePlacementResults([row],leads)[0].conversionStage,"Active / paid student");
});

test("lead identification can use phone, but no consent means no matching",()=>{
  const row={id:"pt_12345678-12345678",consent:true,phone:"024 000 0000"};
  const leads=[{number:"233240000000",status:"placement_completed"}];
  assert.equal(leadForPlacement(row,leads),leads[0]);
  assert.equal(placementConversionStage(row,leads[0]),"Follow up");
});
