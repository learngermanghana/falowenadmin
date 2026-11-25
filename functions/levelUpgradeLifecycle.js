"use strict";
const LEVELS=["A1","A2","B1","B2","C1"];
const FEES={A1:3000,A2:3000,B1:3000,B2:3000,C1:3000};
const MODE="payment_driven_upgrade_v1";
const dateOnly=value=>typeof value==="string"&&/^\d{4}-\d{2}-\d{2}$/.test(value)&&Number.isFinite(Date.parse(value))&&new Date(value).toISOString().slice(0,10)===value;
function addMonths(date,months){
 if(!dateOnly(date))throw Error("Invalid payment or contract date");
 const d=new Date(date+"T00:00:00Z"),day=d.getUTCDate();
 d.setUTCDate(1);d.setUTCMonth(d.getUTCMonth()+months);
 const last=new Date(Date.UTC(d.getUTCFullYear(),d.getUTCMonth()+1,0)).getUTCDate();
 d.setUTCDate(Math.min(day,last));return d.toISOString().slice(0,10);
}
const cents=n=>typeof n==="number"&&Number.isFinite(n)&&n>=0&&Number.isSafeInteger(Math.round(n*100))&&Math.abs(n*100-Math.round(n*100))<0.000001?Math.round(n*100):null;
const reconciled=r=>[r?.tuitionFee,r?.paid,r?.balanceDue].every(n=>cents(n)!==null)&&cents(r.tuitionFee)===cents(r.paid)+cents(r.balanceDue);
const isManagedUpgrade=r=>r?.accountingMode===MODE;
const activePaid=(r,today)=>["active","completed"].includes(r?.status)&&reconciled(r)&&r.balanceDue===0&&dateOnly(r.contractStart)&&dateOnly(r.contractEnd)&&r.contractStart<=today&&r.contractEnd>=today;
function preparePlan({student,rows,targetLevel,today}){
 if(!dateOnly(today))throw Error("Invalid date");
 if(String(student?.program||student?.language||"german").toLowerCase()!=="german"||student?.isSecondaryCourse===true||student?.accountType==="exam_only")throw Error("This upgrade is not available for this programme.");
 if(["awaiting_payment","pending","expired"].includes(String(student?.upgradeStatus||"").toLowerCase()))throw Error("An earlier upgrade needs to be reconciled first.");
 const german=rows.filter(r=>r.program==="german");
 const paid=german.filter(r=>activePaid(r,today)&&LEVELS.includes(r.level)).sort((a,b)=>LEVELS.indexOf(b.level)-LEVELS.indexOf(a.level))[0];
 if(!paid)throw Error("An active, fully paid course is required.");
 const expected=LEVELS[LEVELS.indexOf(paid.level)+1];
 if(!expected||targetLevel!==expected)throw Error("Select the next eligible level.");
 const target=german.find(r=>r.level===expected);
 if(target){if(isManagedUpgrade(target)&&target.upgradeFromLevel===paid.level&&target.status==="planned"&&target.paid===0&&reconciled(target))return {source:paid,existing:target};throw Error("A record for this level already exists; review it in Billing.");}
 if(german.some(r=>LEVELS.indexOf(r.level)>LEVELS.indexOf(paid.level)&&r.status!=="cancelled"))throw Error("Review your existing higher-level enrollment before upgrading.");
 return {source:paid,row:{program:"german",level:expected,tuitionFee:FEES[expected],paid:0,balanceDue:FEES[expected],paymentStatus:"Unpaid",status:"planned",contractStart:"",contractEnd:"",paymentDeadline:"",className:"",accountingMode:MODE,upgradeFromLevel:paid.level,upgradeBaseContractEnd:paid.contractEnd,upgradePreparedDate:today,openingBalanceImported:false,sheetVersion:1,sheetSyncStatus:"pending"}};
}
function paymentLifecycle(row,remaining,date){
 if(!isManagedUpgrade(row))return {};
 if(!dateOnly(date)||!dateOnly(row.upgradeBaseContractEnd)||!Number.isFinite(remaining)||remaining<0||!reconciled(row)||!["planned","active","expired"].includes(row.status))throw Error("Upgrade contract needs review");
 if(remaining===0){
  const base=row.upgradeBaseContractEnd>date?row.upgradeBaseContractEnd:date;
  const start=dateOnly(row.contractStart)&&row.contractStart<=date?row.contractStart:date;
  return {status:"active",contractStart:start,contractEnd:addMonths(base,6),paymentDeadline:"",upgradeCompletedDate:date};
 }
 if(row.paid===0&&row.status==="planned"){
  const end=addMonths(date,1);
  return {status:"active",contractStart:date,contractEnd:end,paymentDeadline:end,upgradeFirstPaidDate:date};
 }
 if(!dateOnly(row.paymentDeadline)||!dateOnly(row.contractStart)||!dateOnly(row.contractEnd))throw Error("Temporary access dates need review");
 return date>row.paymentDeadline?{status:"expired"}:{};
}
function payableStatus(row){return ["active","expired","completed"].includes(row?.status)||(isManagedUpgrade(row)&&row.status==="planned"&&row.paid===0);}
module.exports={MODE,FEES,LEVELS,dateOnly,addMonths,reconciled,isManagedUpgrade,activePaid,preparePlan,paymentLifecycle,payableStatus};
