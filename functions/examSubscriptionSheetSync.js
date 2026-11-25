"use strict";
const {resolveEnrollmentSyncConfig}=require("./levelEnrollmentSheetSync");
const HEADERS=["Subscription ID","Student ID","Student Code","Student Name","Email","Language","Exam Level","Product Type","Base Subscription Amount","Transaction Fees","Gross Amount Paid","Currency","Payment Reference","Payment Date","Subscription Start","Subscription Expiry","Status","Last Synchronized Time"];
const validReference=v=>typeof v==="string"&&/^[A-Za-z0-9._-]{1,150}$/.test(v);
const iso=v=>typeof v==="number"&&Number.isFinite(v)&&v>0?new Date(v).toISOString():"";
const money=v=>typeof v==="number"&&Number.isFinite(v)&&v>=0;
function examSubscriptionRow({reference,purchase,order,student,now=Date.now()}){
 // Only an existing verified, paid order and its matching purchase may be exported.
 if(!validReference(reference)||purchase.reference!==reference||
    (order.reference&&order.reference!==reference)||order.status!=="paid"||
    !purchase.uid||!purchase.studentId||purchase.uid!==order.uid||purchase.studentId!==order.studentId||
    purchase.level!==order.level||purchase.scope!=="level"||order.scope!=="level"||
    purchase.packageId!==order.packageId||!["A1","A2","B1","B2","C1","C2"].includes(purchase.level)||
    student.uid!==purchase.uid||!money(purchase.priceGhs)||purchase.priceGhs!==order.amountGhs||
    !Number.isSafeInteger(order.checkoutPesewas)||order.checkoutPesewas<Math.round(purchase.priceGhs*100)||
    !iso(purchase.startsAtMs)||!iso(purchase.expiresAtMs)||purchase.expiresAtMs<=purchase.startsAtMs)
  throw Error("Exam purchase, paid order or student identity requires reconciliation");
 const gross=order.checkoutPesewas/100;
 if(purchase.grossAmountGhs!=null&&purchase.grossAmountGhs!==gross)throw Error("Exam gross amount mismatch");
 if(purchase.currency&&purchase.currency!=="GHS")throw Error("Exam currency mismatch");
 const fee=money(purchase.gatewayFeeGhs)?purchase.gatewayFeeGhs:"";
 const paymentDate=typeof purchase.paymentDate==="string"&&Number.isFinite(Date.parse(purchase.paymentDate))?new Date(purchase.paymentDate).toISOString():"";
 const program=purchase.program||"german";
 if(program!=="german")throw Error("Unrecognized exam product language");
 const state=purchase.status==="active"?(purchase.expiresAtMs<=now?"expired":purchase.startsAtMs>now?"scheduled":"active"):String(purchase.status||"review");
 // One row per verified paid term (not one row per student's current aggregate subscription).
 // Gross less base is the student contribution, never an inferred gateway processing fee.
 return ["exam:"+reference,purchase.studentId,student.studentCode||student.studentcode||purchase.studentId,
   student.name||student.fullName||"",order.email||"",program,purchase.level,"exam_preparation",
   purchase.priceGhs,fee,gross,"GHS",reference,paymentDate,iso(purchase.startsAtMs),iso(purchase.expiresAtMs),state,iso(now)];
}
async function syncExamPurchase({db,reference,expectedStudentId,fetchImpl=fetch,config=resolveEnrollmentSyncConfig()}){
 if(!validReference(reference))throw Error("Invalid exam reference");
 if(!config.url||!config.secret)return {status:"not_configured"};
 const purchaseRef=db.collection("mockPurchases").doc(reference);
 const [p,o]=await Promise.all([purchaseRef.get(),db.collection("mockOrders").doc(reference).get()]);
 if(!p.exists||!o.exists)return {status:"missing"};
 const purchase=p.data(),order=o.data();
 if(expectedStudentId&&purchase.studentId!==expectedStudentId)return {status:"missing"};
 if(typeof purchase.studentId!=="string"||!purchase.studentId||purchase.studentId.includes("/"))throw Error("Invalid student identity");
 const student=await db.collection("students").doc(purchase.studentId).get();
 if(!student.exists)throw Error("Exam purchase student missing");
 const row=examSubscriptionRow({reference,purchase,order,student:student.data()});
 const response=await fetchImpl(config.url,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"upsertExamSubscription",secret:config.secret,row})});
 const result=await response.json().catch(()=>({}));
 if(!response.ok||result.ok!==true||result.action!=="upsertExamSubscription")throw Error("Exam subscription sheet did not acknowledge update");
 return {status:"synced",reference,feeVerified:row[9]!=="",paymentDateVerified:row[13]!==""};
}
module.exports={HEADERS,examSubscriptionRow,syncExamPurchase,validReference};
