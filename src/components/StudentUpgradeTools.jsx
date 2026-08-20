import { useEffect, useMemo, useRef, useState } from "react";
import { createStudentPaymentLink } from "../services/studentPaymentService.js";
import { reconcileStudentPayments, startStudentUpgrade } from "../services/studentContractService.js";
import { parseMoneyValue } from "../utils/paystackCharges.js";

const LEVELS = ["A1", "A2", "B1", "B2", "C1"];

function displayValue(...values) {
  return values.map((value) => String(value ?? "").trim()).find(Boolean) || "";
}

function normalizeLevel(value) {
  const match = String(value || "").trim().toUpperCase().match(/\b(A1|A2|B1|B2|C1)\b/);
  return match ? match[1] : "";
}

function nextLevel(value) {
  const current = normalizeLevel(value);
  const index = LEVELS.indexOf(current);
  return index >= 0 && index < LEVELS.length - 1 ? LEVELS[index + 1] : "";
}

function formatGhs(value) {
  return new Intl.NumberFormat("en-GH", {
    style: "currency",
    currency: "GHS",
    maximumFractionDigits: 2,
  }).format(parseMoneyValue(value));
}

function timestampDate(value) {
  if (!value) return null;
  if (typeof value?.toDate === "function") return value.toDate();
  if (typeof value?.toMillis === "function") return new Date(value.toMillis());
  if (typeof value === "object" && Number.isFinite(Number(value.seconds))) return new Date(Number(value.seconds) * 1000);
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatDate(value) {
  const date = timestampDate(value);
  if (!date) return "Not set";
  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function normalizePhoneForWhatsapp(phone) {
  const digits = String(phone || "").replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("233")) return digits;
  if (digits.startsWith("0")) return `233${digits.slice(1)}`;
  if (digits.length === 9) return `233${digits}`;
  return digits;
}

function resolvePhone(student = {}, draft = {}) {
  return displayValue(draft.phone, student.phone, student.whatsapp, student.phoneNumber, student.guardianPhone);
}

export default function StudentUpgradeTools({ student, draft = {}, onStudentUpdated, pushToast }) {
  const studentId = String(student?.id || student?.studentCode || "").trim();
  const visibleLevel = normalizeLevel(student?.level || draft.level);
  const paidLevel = normalizeLevel(student?.paidLevel) || visibleLevel;
  const suggestedTarget = nextLevel(paidLevel);
  const upgradeStatus = String(student?.upgradeStatus || "").trim().toLowerCase();
  const hasUpgrade = ["awaiting_payment", "pending", "expired", "completed"].includes(upgradeStatus);
  const remainingUpgradeBalance = parseMoneyValue(student?.upgradeBalanceDue);
  const upgradeTargetLevel = normalizeLevel(student?.upgradeToLevel);
  const effectiveTarget = upgradeTargetLevel || suggestedTarget;

  const [targetLevel, setTargetLevel] = useState(suggestedTarget);
  const [targetClassName, setTargetClassName] = useState("");
  const [tuitionFee, setTuitionFee] = useState("");
  const [paymentAmount, setPaymentAmount] = useState("");
  const [busy, setBusy] = useState("");
  const [generatedPayment, setGeneratedPayment] = useState(null);
  const reconciliationStarted = useRef(false);

  useEffect(() => {
    setTargetLevel(upgradeTargetLevel || suggestedTarget);
    setTargetClassName(displayValue(student?.upgradeTargetClassName));
    const fee = parseMoneyValue(student?.upgradeTuitionFee) || parseMoneyValue(draft.tuitionFee) || parseMoneyValue(student?.tuitionFee);
    setTuitionFee(fee > 0 ? String(fee) : "");
    const remaining = parseMoneyValue(student?.upgradeBalanceDue);
    setPaymentAmount(remaining > 0 ? String(remaining) : "");
    setGeneratedPayment(null);
    reconciliationStarted.current = false;
  }, [studentId, student?.upgradeId, upgradeTargetLevel, suggestedTarget, student?.upgradeTargetClassName, student?.upgradeTuitionFee, student?.upgradeBalanceDue, draft.tuitionFee, student?.tuitionFee]);

  useEffect(() => {
    if (!studentId) return undefined;
    let active = true;

    const reconcile = async () => {
      if (!active) return;
      try {
        const result = await reconcileStudentPayments(studentId);
        if (active && Number(result?.applied || 0) > 0) {
          pushToast?.({ type: "success", message: `${result.applied} Paystack payment(s) reconciled and applied.` });
        }
      } catch (error) {
        if (active) console.warn("Could not reconcile pending Paystack payments.", error);
      }
    };

    if (!reconciliationStarted.current) {
      reconciliationStarted.current = true;
      reconcile();
    }
    const timer = window.setInterval(reconcile, 30000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [studentId, pushToast]);

  const unfinishedUpgrade = ["awaiting_payment", "pending", "expired"].includes(upgradeStatus);
  const canStartUpgrade = Boolean(studentId && suggestedTarget && !unfinishedUpgrade);
  const canGenerateUpgradePayment = Boolean(studentId && unfinishedUpgrade && remainingUpgradeBalance > 0);
  const phone = resolvePhone(student, draft);
  const normalizedPhone = normalizePhoneForWhatsapp(phone);
  const numericPaymentAmount = parseMoneyValue(paymentAmount);

  const statusSummary = useMemo(() => {
    if (upgradeStatus === "awaiting_payment") {
      return `${effectiveTarget} upgrade is prepared. The student stays on ${paidLevel || "the current paid level"} until payment succeeds. A partial payment starts one month of temporary ${effectiveTarget} access; full payment completes the upgrade immediately.`;
    }
    if (upgradeStatus === "pending") {
      return `Temporary ${effectiveTarget} access is active until ${formatDate(student?.upgradeGraceEnd)} because the new-level fee is only partially paid.`;
    }
    if (upgradeStatus === "expired") {
      return `The one-month partial-payment access ended. The student was returned to ${normalizeLevel(student?.level) || student?.upgradeFromLevel || "the previous paid level"}.`;
    }
    if (upgradeStatus === "completed") {
      return `${effectiveTarget} is fully paid. The paid contract now ends ${formatDate(student?.contractEnd)}.`;
    }
    return suggestedTarget
      ? `Next eligible level: ${suggestedTarget}. Prepare the upgrade, then choose whether the student pays part or all of the new-level fee.`
      : "No higher Falowen level is configured after this level.";
  }, [upgradeStatus, effectiveTarget, suggestedTarget, student?.upgradeGraceEnd, student?.contractEnd, student?.level, student?.upgradeFromLevel, paidLevel]);

  const prepareUpgrade = async () => {
    const numericFee = parseMoneyValue(tuitionFee);
    if (!canStartUpgrade) return;
    if (numericFee <= 0) {
      pushToast?.({ type: "error", message: "Enter the full tuition fee for the new level." });
      return;
    }
    setBusy("start");
    try {
      const response = await startStudentUpgrade({
        studentId,
        targetLevel: targetLevel || suggestedTarget,
        tuitionFee: numericFee,
        targetClassName,
      });
      if (response?.studentUpdate && typeof onStudentUpdated === "function") onStudentUpdated(studentId, response.studentUpdate);
      setPaymentAmount(String(numericFee));
      pushToast?.({
        type: "success",
        message: `${targetLevel || suggestedTarget} upgrade prepared. No new-level access is granted until Paystack confirms payment.`,
      });
    } catch (error) {
      pushToast?.({ type: "error", message: error?.message || "Could not prepare the level upgrade." });
    } finally {
      setBusy("");
    }
  };

  const generateUpgradePayment = async () => {
    if (!canGenerateUpgradePayment) return;
    if (numericPaymentAmount <= 0 || numericPaymentAmount > remainingUpgradeBalance + 0.01) {
      pushToast?.({ type: "error", message: `Enter an amount up to the remaining ${formatGhs(remainingUpgradeBalance)} upgrade balance.` });
      return;
    }
    const email = displayValue(draft.email, student?.email, student?.studentEmail);
    if (!email) {
      pushToast?.({ type: "error", message: "A student email is required to generate the Paystack link." });
      return;
    }
    setBusy("payment");
    try {
      const response = await createStudentPaymentLink({
        studentId,
        amount: numericPaymentAmount,
        email,
        purpose: "level_upgrade",
      });
      const payment = response.payment || response.data || response;
      setGeneratedPayment(payment);
      const isFullRemainingPayment = Math.abs(numericPaymentAmount - remainingUpgradeBalance) <= 0.01;
      pushToast?.({
        type: "success",
        message: isFullRemainingPayment
          ? `${effectiveTarget} full-payment link generated. Successful payment will complete the upgrade and add 6 months.`
          : `${effectiveTarget} partial-payment link generated. Successful payment will start one month of temporary access.`,
      });
    } catch (error) {
      pushToast?.({ type: "error", message: error?.message || "Could not generate the upgrade payment link." });
    } finally {
      setBusy("");
    }
  };

  const copyLink = async () => {
    const link = generatedPayment?.authorizationUrl;
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      pushToast?.({ type: "success", message: "Upgrade payment link copied." });
    } catch {
      pushToast?.({ type: "info", message: "Select and copy the payment link manually." });
    }
  };

  const sendWhatsapp = () => {
    if (!generatedPayment?.authorizationUrl) return;
    if (!normalizedPhone) {
      pushToast?.({ type: "error", message: "This student has no valid WhatsApp/phone number." });
      return;
    }
    const name = displayValue(student?.name, student?.studentName, "Student");
    const isFullRemainingPayment = Math.abs(numericPaymentAmount - remainingUpgradeBalance) <= 0.01;
    const accessNote = isFullRemainingPayment
      ? `Once the full payment is confirmed, your ${effectiveTarget} upgrade becomes fully active and 6 months are added to your existing contract.`
      : `Because this is a partial payment, successful payment gives one month of temporary ${effectiveTarget} access while the remaining balance is due.`;
    const message = `Hello ${name}, here is your ${effectiveTarget} Falowen payment link for ${formatGhs(numericPaymentAmount)}. ${accessNote}\n\n${generatedPayment.authorizationUrl}`;
    window.open(`https://wa.me/${normalizedPhone}?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer");
  };

  const reconcileNow = async () => {
    setBusy("reconcile");
    try {
      const result = await reconcileStudentPayments(studentId);
      const applied = Number(result?.applied || 0);
      pushToast?.({
        type: applied > 0 ? "success" : "info",
        message: applied > 0
          ? `${applied} Paystack payment(s) applied to the student.`
          : "No new successful Paystack payment was waiting to be applied.",
      });
    } catch (error) {
      pushToast?.({ type: "error", message: error?.message || "Could not verify pending Paystack payments." });
    } finally {
      setBusy("");
    }
  };

  return (
    <section style={{ marginTop: 18, border: "1px solid #e2e8f0", borderRadius: 14, padding: 14, background: "#fff", display: "grid", gap: 12 }}>
      <div>
        <h3 style={{ margin: "0 0 4px" }}>Level upgrade & contract</h3>
        <p style={{ margin: 0, color: "#64748b" }}>{statusSummary}</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 8 }}>
        <div style={{ border: "1px solid #e2e8f0", borderRadius: 10, padding: 10 }}>
          <strong>Paid contract</strong>
          <div style={{ fontSize: 13, color: "#64748b" }}>Paid level: {paidLevel || "—"}</div>
          <div style={{ fontSize: 13, color: "#64748b" }}>Ends: {formatDate(student?.contractEnd || draft.contractEnd)}</div>
        </div>
        <div style={{ border: "1px solid #e2e8f0", borderRadius: 10, padding: 10 }}>
          <strong>Upgrade</strong>
          <div style={{ fontSize: 13, color: "#64748b" }}>Target: {effectiveTarget || "—"}</div>
          <div style={{ fontSize: 13, color: "#64748b" }}>Status: {upgradeStatus || "none"}</div>
          <div style={{ fontSize: 13, color: "#64748b" }}>Balance: {formatGhs(remainingUpgradeBalance)}</div>
        </div>
      </div>

      {canStartUpgrade && (
        <div style={{ display: "grid", gap: 10 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10 }}>
            <label style={{ display: "grid", gap: 6 }}>
              <span style={{ fontSize: 13, fontWeight: 700 }}>Next level</span>
              <input value={targetLevel || suggestedTarget} readOnly />
            </label>
            <label style={{ display: "grid", gap: 6 }}>
              <span style={{ fontSize: 13, fontWeight: 700 }}>Full tuition for new level</span>
              <input type="number" min="1" step="0.01" value={tuitionFee} onChange={(event) => setTuitionFee(event.target.value)} />
            </label>
            <label style={{ display: "grid", gap: 6 }}>
              <span style={{ fontSize: 13, fontWeight: 700 }}>Target class (optional)</span>
              <input value={targetClassName} onChange={(event) => setTargetClassName(event.target.value)} placeholder={`${suggestedTarget} class name`} />
            </label>
          </div>
          <button type="button" onClick={prepareUpgrade} disabled={busy === "start"}>
            {busy === "start" ? "Preparing..." : `Prepare ${suggestedTarget} upgrade payment`}
          </button>
          <span style={{ fontSize: 12, color: "#64748b" }}>
            Preparing an upgrade does not change access. Access changes only after Paystack confirms a payment.
          </span>
        </div>
      )}

      {canGenerateUpgradePayment && (
        <div style={{ display: "grid", gap: 10, paddingTop: 4, borderTop: "1px solid #e2e8f0" }}>
          <div style={{ display: "grid", gridTemplateColumns: "minmax(180px, 1fr) auto", gap: 10, alignItems: "end" }}>
            <label style={{ display: "grid", gap: 6 }}>
              <span style={{ fontSize: 13, fontWeight: 700 }}>{effectiveTarget} payment amount</span>
              <input type="number" min="1" step="0.01" max={remainingUpgradeBalance || undefined} value={paymentAmount} onChange={(event) => setPaymentAmount(event.target.value)} />
            </label>
            <button type="button" onClick={generateUpgradePayment} disabled={busy === "payment"}>
              {busy === "payment" ? "Generating..." : "Generate upgrade payment link"}
            </button>
          </div>
          <div style={{ fontSize: 12, color: "#64748b" }}>
            Pay less than the remaining fee → one month of temporary {effectiveTarget} access. Pay the full remaining fee → complete the upgrade immediately and add 6 months to the contract.
          </div>
          {generatedPayment?.authorizationUrl && (
            <div style={{ display: "grid", gap: 8, border: "1px solid #e2e8f0", borderRadius: 10, padding: 10, overflowWrap: "anywhere" }}>
              <a href={generatedPayment.authorizationUrl} target="_blank" rel="noreferrer">{generatedPayment.authorizationUrl}</a>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button type="button" onClick={copyLink}>Copy link</button>
                <button type="button" onClick={sendWhatsapp}>Send on WhatsApp</button>
              </div>
            </div>
          )}
        </div>
      )}

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        <button type="button" onClick={reconcileNow} disabled={busy === "reconcile"}>
          {busy === "reconcile" ? "Checking Paystack..." : "Recheck pending Paystack payments"}
        </button>
        <span style={{ fontSize: 12, color: "#64748b" }}>Pending links are also checked automatically while this student page is open.</span>
      </div>

      {hasUpgrade && upgradeStatus === "awaiting_payment" && (
        <p style={{ margin: 0, fontSize: 13, color: "#64748b" }}>
          No grace-period countdown has started yet. The one-month countdown begins only if the first successful new-level payment is less than the full fee.
        </p>
      )}

      {hasUpgrade && upgradeStatus === "pending" && (
        <p style={{ margin: 0, fontSize: 13, color: "#64748b" }}>
          If the remaining balance is not fully paid by {formatDate(student?.upgradeGraceEnd)}, Falowen will return the student to {student?.upgradeFromLevel || "the previous paid level"} without changing the existing paid contract end date.
        </p>
      )}
    </section>
  );
}
