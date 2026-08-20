import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function write(relativePath, content) {
  fs.writeFileSync(path.join(root, relativePath), content, "utf8");
}

function replaceRequired(content, before, after, label) {
  if (content.includes(after)) return content;
  if (!content.includes(before)) throw new Error(`Payment-driven upgrade patch could not find ${label}.`);
  return content.replace(before, after);
}

function replaceBetween(content, startMarker, endMarker, replacement, label) {
  const start = content.indexOf(startMarker);
  if (start < 0) throw new Error(`Payment-driven upgrade patch could not find ${label} start.`);
  const end = content.indexOf(endMarker, start + startMarker.length);
  if (end < 0) throw new Error(`Payment-driven upgrade patch could not find ${label} end.`);
  return `${content.slice(0, start)}${replacement}${content.slice(end)}`;
}

function patchFunctions() {
  const file = "functions/index.js";
  let content = read(file);

  content = replaceRequired(
    content,
    'if (!["pending", "expired"].includes(upgradeStatus)) return res.status(409).json({ ok: false, error: "This student has no payable level upgrade." });',
    'if (!["awaiting_payment", "pending", "expired"].includes(upgradeStatus)) return res.status(409).json({ ok: false, error: "This student has no payable level upgrade." });',
    "upgrade payment-link status guard",
  );

  const accountingStart = '    if (paymentPurpose === "level_upgrade") {\n';
  const accountingEnd = '    } else {\n      const currentBalance = resolveStudentCurrentBalance(student);';
  const accountingReplacement = `    if (paymentPurpose === "level_upgrade") {
      const upgradeStatus = String(student.upgradeStatus || "").trim().toLowerCase();
      const targetLevel = normalizeContractLevel(payment.targetLevel || student.upgradeToLevel);
      const expectedTargetLevel = normalizeContractLevel(student.upgradeToLevel);
      if (!["awaiting_payment", "pending", "expired"].includes(upgradeStatus)) throw new Error("Student has no payable level upgrade");
      if (!targetLevel || (expectedTargetLevel && targetLevel !== expectedTargetLevel)) throw new Error("Payment target level does not match the student upgrade");

      const currentUpgradeBalance = roundMoney(student.upgradeBalanceDue);
      if (currentUpgradeBalance <= 0) throw new Error("Student upgrade has no outstanding balance");
      if (tuitionCredit > currentUpgradeBalance + 0.01) throw new Error("Upgrade payment exceeds the remaining balance");

      const nextUpgradePaid = roundMoney(paymentNumber(student.upgradePaid) + tuitionCredit);
      const nextUpgradeBalance = roundMoney(Math.max(0, currentUpgradeBalance - tuitionCredit));
      const upgradeCompleted = nextUpgradeBalance <= 0;
      nextBalance = nextUpgradeBalance;
      paymentStatus = upgradeCompleted ? "Paid" : "Partially Paid";

      studentUpdate = {
        paid: nextPaid,
        upgradePaid: nextUpgradePaid,
        upgradeBalanceDue: nextUpgradeBalance,
        lastPaymentAmount: tuitionCredit,
        lastPaymentProvider: "Paystack",
        lastPaymentReference: reference,
        lastPaymentAt: paymentTimestamp,
        updated_at: admin.firestore.FieldValue.serverTimestamp(),
      };

      if (upgradeCompleted) {
        const extendedContractEnd = computeExtendedContractEnd(student.contractEnd, paidAtDate, CONTRACT_TERM_MONTHS);
        Object.assign(studentUpdate, {
          level: targetLevel,
          paidLevel: targetLevel,
          balanceDue: 0,
          balance: 0,
          paymentStatus: "Paid",
          status: "Paid",
          contractEnd: extendedContractEnd,
          contractTermMonths: String(CONTRACT_TERM_MONTHS),
          upgradeStatus: "completed",
          upgradeCompletedAt: paymentTimestamp,
          paymentReminderLevel: admin.firestore.FieldValue.delete(),
        });
        if (String(student.upgradeTargetClassName || "").trim()) studentUpdate.className = String(student.upgradeTargetClassName).trim();
      } else if (upgradeStatus === "awaiting_payment") {
        const graceEnd = computeUpgradeGraceEnd(paidAtDate);
        Object.assign(studentUpdate, {
          level: targetLevel,
          balanceDue: nextUpgradeBalance,
          balance: nextUpgradeBalance,
          paymentStatus: "Partially Paid",
          status: "Active",
          upgradeStatus: "pending",
          upgradeStartedAt: paymentTimestamp,
          upgradeGraceEnd: graceEnd ? graceEnd.toISOString().slice(0, 10) : "",
          paymentReminderLevel: targetLevel,
        });
        if (String(student.upgradeTargetClassName || "").trim()) studentUpdate.className = String(student.upgradeTargetClassName).trim();
      } else if (upgradeStatus === "pending") {
        Object.assign(studentUpdate, {
          level: targetLevel,
          balanceDue: nextUpgradeBalance,
          balance: nextUpgradeBalance,
          paymentStatus: "Partially Paid",
          status: "Active",
          paymentReminderLevel: targetLevel,
        });
        if (String(student.upgradeTargetClassName || "").trim()) studentUpdate.className = String(student.upgradeTargetClassName).trim();
      }
`;
  content = replaceBetween(content, accountingStart, accountingEnd, accountingReplacement, "level-upgrade accounting");

  const routeStart = 'app.post("/payments/start-upgrade", async (req, res) => {\n';
  const routeEnd = 'app.post("/payments/reconcile-student/:studentId", async (req, res) => {\n';
  const routeReplacement = `app.post("/payments/start-upgrade", async (req, res) => {
  try {
    const user = await requirePaymentAdmin(req);
    const studentId = String(req.body?.studentId || "").trim();
    const requestedTargetLevel = normalizeContractLevel(req.body?.targetLevel);
    const tuitionFee = roundMoney(req.body?.tuitionFee);
    const targetClassName = String(req.body?.targetClassName || "").trim();
    if (!studentId) return res.status(400).json({ ok: false, error: "studentId is required" });
    if (tuitionFee <= 0) return res.status(400).json({ ok: false, error: "A valid full tuition fee is required" });

    const studentRef = db.collection(STUDENTS_COLLECTION).doc(studentId);
    let responseUpdate = null;
    await db.runTransaction(async (transaction) => {
      const snap = await transaction.get(studentRef);
      if (!snap.exists) { const error = new Error("Student not found"); error.statusCode = 404; throw error; }
      const student = snap.data() || {};
      const currentLevel = normalizeContractLevel(student.paidLevel || student.level);
      const expectedTargetLevel = nextContractLevel(currentLevel);
      const targetLevel = requestedTargetLevel || expectedTargetLevel;
      if (!currentLevel || !expectedTargetLevel) { const error = new Error("This student has no next Falowen level to upgrade to"); error.statusCode = 400; throw error; }
      if (targetLevel !== expectedTargetLevel) { const error = new Error("Upgrades must move to the next level: " + expectedTargetLevel); error.statusCode = 400; throw error; }
      if (!contractIsActive(student.contractEnd, new Date())) { const error = new Error("The current paid contract has expired. Renew the current level before preparing a next-level upgrade."); error.statusCode = 409; throw error; }

      const previousBalance = resolveStudentCurrentBalance(student);
      if (previousBalance > 0.01) { const error = new Error("Complete the current level balance before preparing a next-level upgrade."); error.statusCode = 409; throw error; }

      const existingUpgradeStatus = String(student.upgradeStatus || "").trim().toLowerCase();
      if (["awaiting_payment", "pending", "expired"].includes(existingUpgradeStatus)) { const error = new Error("This student already has an unfinished level upgrade."); error.statusCode = 409; throw error; }

      const upgradeId = createUpgradeId(studentId);
      const paidLevel = normalizeContractLevel(student.paidLevel || currentLevel) || currentLevel;
      const update = {
        paidLevel,
        upgradeId,
        upgradeStatus: "awaiting_payment",
        upgradeFromLevel: currentLevel,
        upgradeToLevel: targetLevel,
        upgradeTuitionFee: tuitionFee,
        upgradePaid: 0,
        upgradeBalanceDue: tuitionFee,
        upgradePreviousLevel: currentLevel,
        upgradePreviousClassName: String(student.className || ""),
        upgradePreviousBalanceDue: previousBalance,
        upgradePreviousPaymentStatus: String(student.paymentStatus || "Paid"),
        upgradePreviousStatus: String(student.status || "Paid"),
        upgradeTargetClassName: targetClassName,
        upgradeCreatedBy: user.uid,
        upgradeCreatedAt: admin.firestore.FieldValue.serverTimestamp(),
        upgradeStartedAt: admin.firestore.FieldValue.delete(),
        upgradeGraceEnd: admin.firestore.FieldValue.delete(),
        paymentReminderLevel: admin.firestore.FieldValue.delete(),
        updated_at: admin.firestore.FieldValue.serverTimestamp(),
      };
      transaction.set(studentRef, update, { merge: true });
      responseUpdate = {
        paidLevel,
        upgradeId,
        upgradeStatus: "awaiting_payment",
        upgradeFromLevel: currentLevel,
        upgradeToLevel: targetLevel,
        upgradeTuitionFee: tuitionFee,
        upgradePaid: 0,
        upgradeBalanceDue: tuitionFee,
        upgradePreviousLevel: currentLevel,
        upgradePreviousClassName: String(student.className || ""),
        upgradePreviousBalanceDue: previousBalance,
        upgradePreviousPaymentStatus: String(student.paymentStatus || "Paid"),
        upgradePreviousStatus: String(student.status || "Paid"),
        upgradeTargetClassName: targetClassName,
      };
    });
    return res.json({ ok: true, studentUpdate: responseUpdate });
  } catch (error) {
    return res.status(error?.statusCode || 500).json({ ok: false, error: error?.message || "Could not prepare level upgrade" });
  }
});

`;
  content = replaceBetween(content, routeStart, routeEnd, routeReplacement, "start-upgrade route");

  write(file, content);
}

patchFunctions();
console.log("Payment-driven student upgrade rules applied.");
