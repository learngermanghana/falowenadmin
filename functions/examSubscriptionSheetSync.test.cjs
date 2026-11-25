const {test}=require("node:test");
const assert=require("node:assert/strict");
const {HEADERS,examSubscriptionRow,syncExamPurchase}=require("./examSubscriptionSheetSync");
const reference="synthetic-99";
const start=Date.UTC(2026,10,25,11,32),end=start+30*86400000;
const student={uid:"u",name:"Synthetic A2",studentCode:"S1",balanceDue:3000,paid:0,status:"trial_active",trialEndsAt:"2026-11-30"};
const purchase={reference,studentId:"s",uid:"u",level:"A2",scope:"level",packageId:"monthly",priceGhs:99,status:"active",startsAtMs:start,expiresAtMs:end,grossAmountGhs:99.97,gatewayFeeGhs:1.94,studentFeeContributionGhs:0.97,currency:"GHS",paymentDate:new Date(start).toISOString(),program:"german"};
const order={reference,studentId:"s",uid:"u",level:"A2",scope:"level",packageId:"monthly",status:"paid",amountGhs:99,checkoutPesewas:9997,email:"synthetic@example.test"};
const input={reference,purchase,order,student,now:start+100};
test("exports exact existing 18 headers, gateway fee, gross and unique payment reference",()=>{
 const row=examSubscriptionRow(input);
 assert.equal(row.length,HEADERS.length);assert.equal(row[0],"exam:"+reference);assert.equal(row[8],99);assert.equal(row[9],1.94);assert.equal(row[10],99.97);assert.equal(row[12],reference);assert.equal(row[16],"active");
 assert.equal(student.balanceDue,3000);assert.equal(student.paid,0);
});
test("legacy purchase never guesses unknown provider fee or actual payment date",()=>{
 const row=examSubscriptionRow({...input,purchase:{...purchase,gatewayFeeGhs:null,paymentDate:null,grossAmountGhs:undefined}});
 assert.equal(row[9],"");assert.equal(row[10],99.97);assert.equal(row[13],"");
});
test("identity, amount, order status and verified term are required",()=>{
 for(const change of [{student:{...student,uid:"other"}},{order:{...order,status:"pending"}},{order:{...order,checkoutPesewas:10000}},{purchase:{...purchase,reference:"other"}},{purchase:{...purchase,expiresAtMs:start}}])assert.throws(()=>examSubscriptionRow({...input,...change}));
});
test("expired and future terms are identified without affecting course status",()=>{
 assert.equal(examSubscriptionRow({...input,now:end})[16],"expired");assert.equal(examSubscriptionRow({...input,now:start-1})[16],"scheduled");
});
function dbFor(values){
 return {collection:name=>({doc:id=>({get:async()=>({exists:Object.hasOwn(values,name+"/"+id),data:()=>values[name+"/"+id]})})})};
}
test("manual sync and retry both use the same key, never create a payment or update a student",async()=>{
 const db=dbFor({["mockPurchases/"+reference]:purchase,["mockOrders/"+reference]:order,"students/s":student});
 const rows=new Map();let requests=0;
 const config={url:"https://example.test",secret:"test"};
 const fetchImpl=async(url,{body})=>{requests++;const parsed=JSON.parse(body);assert.equal(parsed.action,"upsertExamSubscription");rows.set(parsed.row[0],parsed.row);return {ok:true,json:async()=>({ok:true,action:parsed.action})};};
 for(let i=0;i<2;i++)assert.equal((await syncExamPurchase({db,reference,expectedStudentId:"s",fetchImpl,config})).status,"synced");
 assert.equal(requests,2);assert.equal(rows.size,1);assert.equal(student.status,"trial_active");
 assert.equal((await syncExamPurchase({db,reference,expectedStudentId:"other",fetchImpl,config})).status,"missing");assert.equal(requests,2);
});
test("unconfigured or missing purchase does not send a sheet write",async()=>{
 const db=dbFor({});const fetchImpl=()=>{throw Error("Unexpected request");};
 assert.equal((await syncExamPurchase({db,reference,fetchImpl,config:{}})).status,"not_configured");
 assert.equal((await syncExamPurchase({db,reference,fetchImpl,config:{url:"https://example.test",secret:"test"}})).status,"missing");
});
