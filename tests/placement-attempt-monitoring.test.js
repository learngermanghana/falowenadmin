import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { leadForPlacement, placementConversionStage, placementStatus, normalizePlacementResults, isSettledPlacementPayment, countRegisteredOrPaidPlacements, fetchPlacementLeads } from "../src/services/placementAttemptService.js";

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


test("positive payment statuses are exact, never substrings of unpaid or negative statuses",()=>{
  for(const value of ["paid","PAID","fully_paid","paid in full","payment_completed","success","successful","payment successful","settled","registered_paid","REGISTERED PAID","registered-paid","complete","COMPLETE"]){
    assert.equal(isSettledPlacementPayment(value),true,value);
  }
  for(const value of ["unpaid","UNPAID","not paid","not_paid","un-paid","partially paid","partial_paid","unpaid - overdue","not completed","incomplete","payment incomplete","payment failed","pending","not_requested","refunded","",null]){
    assert.equal(isSettledPlacementPayment(value),false,String(value));
  }
});

test("unpaid registered leads remain registered, and unpaid unregistered leads need follow-up",()=>{
  const attempt={id:"pt_12345678-12345678",consent:true};
  for(const payment of ["unpaid","not paid","partially_paid","not_requested"]){
    assert.equal(placementConversionStage(attempt,{status:"student_registered",studentCode:"A1-23",paymentStatus:payment}),"Registered",payment);
    assert.equal(placementConversionStage(attempt,{status:"placement_completed",paymentStatus:payment}),"Follow up",payment);
  }
  assert.equal(placementConversionStage(attempt,{status:"placement_completed",paymentStatus:"fully_paid"}),"Paid · registration review");
  for(const payment of ["registered_paid","registered paid","complete"]){
    assert.equal(placementConversionStage(attempt,{status:"student_registered",studentCode:"A1-23",paymentStatus:payment}),"Active / paid student",payment);
    assert.equal(placementConversionStage(attempt,{status:"placement_completed",paymentStatus:payment}),"Paid · registration review",payment);
  }
});

test("paid registration-review leads count towards registered-or-paid total",()=>{
  const attempt={id:"pt_12345678-12345678",consent:true};
  const rows=[
    {conversionStage:placementConversionStage(attempt,{status:"registration_started",paymentStatus:"paid"})},
    {conversionStage:placementConversionStage(attempt,{status:"student_registered",paymentStatus:"unpaid"})},
    {conversionStage:placementConversionStage(attempt,{status:"student_registered",paymentStatus:"paid"})},
    {conversionStage:placementConversionStage(attempt,{status:"placement_completed",paymentStatus:"not paid"})},
  ];
  assert.deepEqual(rows.map(x=>x.conversionStage),[
    "Paid · registration review","Registered","Active / paid student","Follow up"
  ]);
  assert.equal(countRegisteredOrPaidPlacements(rows),3);
  assert.equal(countRegisteredOrPaidPlacements(rows,false),null);
});

test("a missing Leads feed never fabricates a Follow up or a zero conversion count",()=>{
  const attempt={id:"pt_12345678-12345678",consent:true,email:"sample@example.com",score:{level:"A2"}};
  const unavailable=normalizePlacementResults([attempt],null);
  assert.equal(unavailable[0].conversionStage,"Conversion unavailable");
  assert.equal(unavailable[0].lead,null);
  assert.equal(countRegisteredOrPaidPlacements(unavailable,false),null);
  const genuinelyEmpty=normalizePlacementResults([attempt],[]);
  assert.equal(genuinelyEmpty[0].conversionStage,"Follow up");
  assert.equal(normalizePlacementResults([{id:"anonymous"}],null)[0].conversionStage,"Anonymous result");
});

test("lead-fetch failures and invalid responses propagate to the caller",async()=>{
  await assert.rejects(fetchPlacementLeads(async()=>{throw new Error("Google sheet unavailable");}),/Google sheet unavailable/);
  await assert.rejects(fetchPlacementLeads(async()=>({})),/invalid response/);
  assert.deepEqual(await fetchPlacementLeads(async()=>({leads:[]})),[]);
});

test("placement page retains staff-accessible actions and explicitly shows partial-data warnings",()=>{
  const source=readFileSync(new URL("../src/pages/TimedAssignmentAttemptsPage.jsx",import.meta.url),"utf8");
  assert.match(source,/Promise\.allSettled/);
  assert.match(source,/setPlacementLeads\(null\)/);
  assert.match(source,/placementLeadError && <div role="alert"/);
  assert.match(source,/attempt\.consent&&!isStaff&&<a href="\/leads"/);
  assert.match(source,/countRegisteredOrPaidPlacements\(placementRows, Array\.isArray\(placementLeads\)\)/);
});
