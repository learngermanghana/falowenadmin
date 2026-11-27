const test=require("node:test");
const assert=require("node:assert/strict");
const {recoveryDates,paidContractDates,phase,rootCandidate,matchesRoot,otherCourseRisk}=require("./partialTuitionLifecycle");
const {paymentPatch}=require("./studentLevelEnrollments");
const row={id:"german-A1",program:"german",level:"A1",accessType:"paid",status:"active",tuitionFee:3000,paid:2000,balanceDue:1000,contractStart:"2026-11-05",contractEnd:"2026-12-05",paymentDeadline:"2026-12-05"};
const root={...row,effectiveEnrollmentId:row.id};
test("one month access then 30 full days of recovery",()=>{
 assert.deepEqual(recoveryDates(row),{lastAccess:"2026-12-05",recoveryEnd:"2027-01-04",terminateOn:"2027-01-05"});
 assert.equal(phase(row,"2026-12-05"),"active");
 assert.equal(phase(row,"2026-12-06"),"recovery");
 assert.equal(phase({...row,status:"expired"},"2027-01-04"),"recovery");
 assert.equal(phase({...row,status:"expired"},"2027-01-05"),"terminate");
});
test("only consistent partial tuition is eligible, no reset by partial instalment",()=>{
 assert.equal(recoveryDates({...row,paid:3000,balanceDue:0}),null);
 assert.equal(recoveryDates({...row,paid:1000}),null);
 assert.equal(recoveryDates({...row,paid:0,balanceDue:3000}),null);
 assert.equal(recoveryDates({...row,paymentDeadline:""}),null);
 assert.equal(rootCandidate(root,"2026-12-06"),true);
 assert.equal(rootCandidate({...root,partialTuitionRecoveryEnd:"2027-01-04"},"2026-12-07"),false);
 assert.equal(rootCandidate({...root,partialTuitionRecoveryEnd:"2027-01-04"},"2027-01-05"),true);
 assert.equal(matchesRoot(root,row),true);
 assert.equal(matchesRoot({...root,paid:3000,balanceDue:0},row),false);
 assert.equal(rootCandidate({...root,effectiveEnrollmentId:"",status:"active"},"2027-01-05"),true);
 assert.equal(rootCandidate({...root,effectiveEnrollmentId:"",paymentDeadline:"",contractTermMonths:"6"},"2027-01-05"),false);
});
test("active, future, institutional or additional uncertain contracts protect the account",()=>{
 assert.equal(otherCourseRisk(root,[row],row,"2027-01-05"),false);
 assert.equal(otherCourseRisk(root,[row,{...row,id:"german-A2",level:"A2",paid:3000,balanceDue:0,contractEnd:"2027-06-05"}],row,"2027-01-05"),true);
 assert.equal(otherCourseRisk({...root,institutionId:"university"},[row],row,"2027-01-05"),true);
});
test("payment in recovery settles the original term; after recovery and after cancellation payments rejected",()=>{
 const expired={...row,status:"expired"};
 const settled=paymentPatch(expired,1000,"2027-01-04");
 assert.equal(settled.status,"active");assert.equal(settled.contractEnd,"2027-05-05");assert.equal(settled.balanceDue,0);
 assert.throws(()=>paymentPatch(expired,1000,"2027-01-05"),/recovery period ended/);
 assert.throws(()=>paymentPatch({...expired,status:"cancelled"},1000,"2027-01-04"),/new registration/);
});

test("fully paid contracts have no additional recovery period",()=>{
 const paid={...row,paid:3000,balanceDue:0,contractEnd:"2027-05-05",paymentDeadline:"",status:"completed"};
 assert.deepEqual(paidContractDates(paid),{lastAccess:"2027-05-05",recoveryEnd:"",terminateOn:"2027-05-06"});
 assert.equal(phase(paid,"2027-05-05"),"active");
 assert.equal(phase(paid,"2027-05-06"),"terminate");
 assert.equal(rootCandidate({...paid,effectiveEnrollmentId:paid.id},"2027-06-01"),true);
 assert.equal(rootCandidate({...paid,effectiveEnrollmentId:""},"2027-06-01"),true);
 assert.equal(rootCandidate({...paid,effectiveEnrollmentId:paid.id},"2027-05-01"),false);
 assert.equal(paidContractDates({...paid,accessType:"complimentary"}),null);
 assert.equal(paidContractDates({...paid,balanceDue:500}),null);
 const previous={...paid,id:"german-A2",level:"A2",status:"active",contractEnd:"2027-04-05"};
 assert.equal(otherCourseRisk(paid,[paid,previous],paid,"2027-06-01"),false);
 assert.equal(otherCourseRisk(paid,[paid,{...previous,contractEnd:"2027-07-05"}],paid,"2027-06-01"),true);
});
