import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
const page=fs.readFileSync(new URL("../src/pages/StudentDirectoryPage.jsx",import.meta.url),"utf8");
const queue=fs.readFileSync(new URL("../src/components/SignupRegistrationReviews.jsx",import.meta.url),"utf8");
test("network registration review loads only on Needs attention and for admin",()=>{
 assert.match(page,/directoryView === "attention" && <SignupRegistrationReviews/);
 assert.match(queue,/role !== "admin"/);
 assert.match(queue,/getDocs\(query\(collection\(db,"signupRegistrationReviews"\)/);
 assert.doesNotMatch(queue,/onSnapshot|setInterval/);
 assert.match(queue,/limit\(50\)/);
});
test("held signup approvals and IP-only acknowledgements are separate",()=>{
 assert.match(queue,/row.status==="pending"\?/);
 for(const state of ["approved","rejected","acknowledged"]) assert.ok(queue.includes('decide(row,"'+state+'")'));
 assert.match(queue,/reviewedBy:user.uid,reviewedAt:serverTimestamp\(\)/);
});
