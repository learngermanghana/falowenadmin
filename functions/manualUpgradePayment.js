const crypto = require("node:crypto");
const { normalizeLevel, computeUpgradeGraceEnd, computeExtendedContractEnd, isoDate, asDate } = require("./studentContractLifecycle");
const fail = (message,statusCode=409) => { throw Object.assign(new Error(message),{statusCode}); };
function cents(value) {
  const raw = String(value ?? "").trim();
  if (!/^\d+(\.\d{1,2})?$/.test(raw) || !Number.isSafeInteger(Math.round(Number(raw)*100))) fail("Invalid payment amount",400);
  return Math.round(Number(raw)*100);
}
function buildManualUpgradePatch(student, amount, receivedDate, alreadyIncluded, now=new Date()) {
  const status=String(student.upgradeStatus || "").toLowerCase();
  if (!["awaiting_payment","pending","expired"].includes(status)) fail("No unfinished upgrade");
  const target=normalizeLevel(student.upgradeToLevel);
  if (!target || !student.upgradeId) fail("Upgrade identity missing");
  const credit=cents(amount), remaining=cents(student.upgradeBalanceDue), previous=cents(student.upgradePaid ?? 0);
  if (!credit || credit>remaining || previous+remaining!==cents(student.upgradeTuitionFee)) fail("Payment exceeds balance or upgrade ledger needs review");
  const date=asDate(receivedDate);
  if (!date || isoDate(date)!==receivedDate || receivedDate>isoDate(now)) fail("Enter the actual payment date",400);
  const created=asDate(student.upgradeCreatedAt);
  if (created && receivedDate<isoDate(created)) fail("Payment predates this upgrade; review historical allocation first");
  const total=cents(student.paid ?? 0);
  if (alreadyIncluded && credit>total) fail("Existing paid total is smaller than the claimed credit");
  const due=(remaining-credit)/100, paid=(previous+credit)/100;
  const patch={paid:(total+(alreadyIncluded?0:credit))/100, upgradePaid:paid, upgradeBalanceDue:due};
  if (!due) return {...patch,level:target,paidLevel:target,balance:0,balanceDue:0,paymentStatus:"Paid",status:"Paid",upgradeStatus:"completed",upgradeCompletedAt:date.toISOString(),contractEnd:computeExtendedContractEnd(student.contractEnd,date),contractTermMonths:"6",paymentReminderLevel:"",...(student.upgradeTargetClassName?{className:student.upgradeTargetClassName}:{})};
  const first=status==="awaiting_payment";
  const grace=first?isoDate(computeUpgradeGraceEnd(date)):isoDate(student.upgradeGraceEnd);
  if (!grace) fail("Missing original upgrade grace date");
  if (grace<=isoDate(now)) {
    if (status==="pending") fail("Grace period expired; restore paid contract before recording another partial payment");
    const oldLevel=normalizeLevel(student.paidLevel || student.upgradeFromLevel);
    if (!oldLevel) fail("Previous paid level missing");
    const oldDue=cents(student.upgradePreviousBalanceDue ?? 0)/100;
    return {...patch,level:oldLevel,balance:oldDue,balanceDue:oldDue,paymentStatus:student.upgradePreviousPaymentStatus || "Paid",status:student.upgradePreviousStatus || "Paid",upgradeStatus:"expired",upgradeGraceEnd:grace,paymentReminderLevel:"",...(first?{upgradeStartedAt:date.toISOString()}:{}),...(student.upgradePreviousClassName?{className:student.upgradePreviousClassName}:{})};
  }
  return {...patch,level:target,balance:due,balanceDue:due,paymentStatus:"Partially Paid",status:"Active",upgradeStatus:"pending",upgradeGraceEnd:grace,paymentReminderLevel:target,...(first?{upgradeStartedAt:date.toISOString()}:{}),...(student.upgradeTargetClassName?{className:student.upgradeTargetClassName}:{})};
}
function registerManualUpgradePayment({app,db,admin,requirePaymentAdmin,studentsCollection}) {
  app.post("/payments/manual-upgrade",async(req,res)=>{
    try {
      const user=await requirePaymentAdmin(req);
      const {studentId,upgradeId,amount,receivedDate,method,reference,verified,alreadyIncluded,existingPaymentReference}=req.body || {};
      const ref=String(reference || "").trim();
      if(typeof studentId!=="string" || !studentId || studentId.includes("/") || !upgradeId || verified!==true || typeof alreadyIncluded!=="boolean" || !["momo","bank","cash"].includes(method) || ref.length<3 || ref.length>150) fail("Verified payment, method, reference and upgrade are required",400);
      const existingRef=String(existingPaymentReference || "").trim();
      if(existingRef.includes("/") || existingRef.length>200 || (alreadyIncluded && !existingRef)) fail("Select the existing payment reference when reallocating recorded money",400);
      if(!alreadyIncluded && existingRef) fail("Existing payment requires reallocation mode",400);
      const key=crypto.createHash("sha256").update(method+":"+ref.toLowerCase().replace(/\s+/g,"")).digest("hex");
      const paymentRef=db.collection("manualUpgradePayments").doc(key);
      const studentRef=db.collection(studentsCollection).doc(studentId);
      const result=await db.runTransaction(async tx=>{
        const [snap,duplicate]=await Promise.all([tx.get(studentRef),tx.get(paymentRef)]);
        if(!snap.exists) fail("Student not found",404);
        if(duplicate.exists) fail("This manual payment reference has already been recorded");
        const student=snap.data();
        if(student.upgradeId!==upgradeId) fail("Upgrade changed. Reload the student.");
        let source=null;
        if(alreadyIncluded){
          source=db.collection("payments").doc(existingRef);
          const old=await tx.get(source);
          const record=old.data() || {};
          if(!old.exists || record.studentId!==studentId || String(record.status).toLowerCase()!=="paid" || String(record.purpose).toLowerCase()==="level_upgrade" || record.manualUpgradeAllocation || cents(record.tuitionCredit ?? record.amount)!==cents(amount)) fail("Existing verified payment cannot be safely reallocated");
        }
        const patch=buildManualUpgradePatch(student,amount,receivedDate,alreadyIncluded);
        const timestamp=admin.firestore.FieldValue.serverTimestamp();
        const record={studentId,upgradeId,targetLevel:student.upgradeToLevel,amount:cents(amount)/100,receivedDate,method,reference:ref,alreadyIncluded,existingPaymentReference:existingRef,actorId:user.uid,createdAt:timestamp};
        tx.set(paymentRef,record);
        if(source) tx.update(source,{manualUpgradeAllocation:key});
        tx.update(studentRef,{...patch,updated_at:timestamp});
        tx.set(db.collection("auditLogs").doc(),{...record,type:"studentUpgrade.manualPayment",before:{paid:student.paid ?? null,upgradePaid:student.upgradePaid ?? null,upgradeBalanceDue:student.upgradeBalanceDue,upgradeStatus:student.upgradeStatus},after:patch});
        return patch;
      });
      return res.json({ok:true,studentUpdate:result});
    } catch(error){return res.status(error.statusCode || 500).json({ok:false,error:error.message || "Could not record manual payment"});}
  });
}
module.exports={buildManualUpgradePatch,registerManualUpgradePayment};
