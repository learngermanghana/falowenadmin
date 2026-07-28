import { useEffect, useMemo, useRef, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../firebase.js";
import { createStudentPaymentLink, listStudentPayments } from "../services/studentPaymentService.js";
import { calculatePaystackCharge, calculatePaystackGrossAmount, parseMoneyValue } from "../utils/paystackCharges.js";

function displayValue(...values) {
  return values.map((value) => String(value ?? "").trim()).find(Boolean) || "";
}

function formatGhs(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "GHS",
    maximumFractionDigits: 2,
  }).format(parseMoneyValue(value));
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

function resolveDefaultAmount(student = {}, draft = {}) {
  const candidates = [draft.balanceDue, student.balanceDue, student.balance, student.outstandingBalance, student.amountDue, draft.initialPaymentAmount, student.initialPaymentAmount, draft.tuitionFee, student.tuitionFee];
  const positive = candidates.map(parseMoneyValue).find((amount) => amount > 0);
  return positive || 0;
}

function timestampMillis(value) {
  if (!value) return 0;
  if (typeof value.toMillis === "function") return value.toMillis();
  if (typeof value.toDate === "function") return value.toDate().getTime();
  const parsed = new Date(value).getTime();
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatPaymentDate(value) {
  const millis = timestampMillis(value);
  if (!millis) return "Pending";
  return new Date(millis).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function buildWhatsappMessage(student = {}, payment = {}) {
  const name = displayValue(student.name, student.studentName, student.studentCode, "Student");
  const tuitionCredit = parseMoneyValue(payment.tuitionCredit);
  const checkoutAmount = parseMoneyValue(payment.checkoutAmount);
  const feeNote = checkoutAmount > tuitionCredit ? ` The checkout amount is ${formatGhs(checkoutAmount)} including the payment processing share.` : "";
  return `Hello ${name}, here is your secure Falowen payment link for ${formatGhs(tuitionCredit)}.${feeNote}\n\n${payment.authorizationUrl}\n\nYour student record will update automatically after Paystack confirms the payment. Thank you.`;
}

export default function StudentPaymentTools({ student, draft = {}, onStudentUpdated, pushToast }) {
  const [amount, setAmount] = useState("");
  const [paymentEmail, setPaymentEmail] = useState("");
  const [purpose, setPurpose] = useState("balance");
  const [generating, setGenerating] = useState(false);
  const [generatedPayment, setGeneratedPayment] = useState(null);
  const [payments, setPayments] = useState([]);
  const onStudentUpdatedRef = useRef(onStudentUpdated);

  const studentId = String(student?.id || student?.studentCode || "").trim();

  useEffect(() => {
    onStudentUpdatedRef.current = onStudentUpdated;
  }, [onStudentUpdated]);

  useEffect(() => {
    setAmount(String(resolveDefaultAmount(student, draft) || ""));
    setPaymentEmail(displayValue(draft.email, student?.email));
    setGeneratedPayment(null);
  }, [studentId]);

  useEffect(() => {
    if (!studentId) return undefined;
    const unsubscribe = onSnapshot(
      doc(db, "students", studentId),
      (snapshot) => {
        if (!snapshot.exists()) return;
        const nextStudent = { id: snapshot.id, ...snapshot.data() };
        const notifyStudentUpdated = onStudentUpdatedRef.current;
        if (typeof notifyStudentUpdated === "function") notifyStudentUpdated(studentId, nextStudent);
      },
      (error) => {
        console.warn("Could not refresh the selected student in real time.", error);
      },
    );
    return unsubscribe;
  }, [studentId]);

  useEffect(() => {
    if (!studentId) {
      setPayments([]);
      return undefined;
    }

    let active = true;
    const loadHistory = async () => {
      try {
        const rows = await listStudentPayments(studentId);
        if (active) setPayments(rows);
      } catch (error) {
        console.warn("Could not refresh student payment history.", error);
      }
    };

    loadHistory();
    const timer = window.setInterval(loadHistory, 5000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [studentId]);

  const numericAmount = parseMoneyValue(amount);
  const checkoutAmount = useMemo(() => calculatePaystackGrossAmount(numericAmount), [numericAmount]);
  const processingShare = useMemo(() => calculatePaystackCharge(numericAmount), [numericAmount]);
  const phone = resolvePhone(student, draft);

  const generateLink = async () => {
    if (!studentId) {
      pushToast?.({ type: "error", message: "Student record is missing an ID." });
      return;
    }
    if (numericAmount <= 0) {
      pushToast?.({ type: "error", message: "Enter the amount you want the student to pay." });
      return;
    }
    if (!paymentEmail.trim()) {
      pushToast?.({ type: "error", message: "Paystack requires an email address. Add the student's email first." });
      return;
    }

    setGenerating(true);
    try {
      const response = await createStudentPaymentLink({
        studentId,
        amount: numericAmount,
        email: paymentEmail,
        purpose,
      });
      const payment = response.payment || response.data || response;
      setGeneratedPayment(payment);
      setPayments((current) => [payment, ...current.filter((row) => row.id !== payment.reference && row.reference !== payment.reference)]);
      pushToast?.({ type: "success", message: "Paystack payment link generated." });
    } catch (error) {
      pushToast?.({ type: "error", message: error?.message || "Could not generate payment link." });
    } finally {
      setGenerating(false);
    }
  };

  const copyLink = async () => {
    const link = generatedPayment?.authorizationUrl;
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      pushToast?.({ type: "success", message: "Payment link copied." });
    } catch {
      pushToast?.({ type: "info", message: "Select and copy the payment link manually." });
    }
  };

  const sendWhatsapp = () => {
    if (!generatedPayment?.authorizationUrl) return;
    const normalizedPhone = normalizePhoneForWhatsapp(phone);
    if (!normalizedPhone) {
      pushToast?.({ type: "error", message: "This student has no valid WhatsApp/phone number." });
      return;
    }
    const message = buildWhatsappMessage(student, generatedPayment);
    window.open(`https://wa.me/${normalizedPhone}?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer");
  };

  return (
    <section style={{ marginTop: 18, border: "1px solid #bbf7d0", borderRadius: 14, padding: 14, background: "linear-gradient(135deg, #f0fdf4, #ffffff)", display: "grid", gap: 12 }}>
      <div>
        <h3 style={{ margin: "0 0 4px" }}>Student payment link</h3>
        <p style={{ margin: 0, color: "#64748b" }}>
          Create a secure Paystack checkout link. Successful payments update this student automatically after webhook confirmation.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10 }}>
        <label style={{ display: "grid", gap: 6 }}>
          <span style={{ fontSize: 13, fontWeight: 700 }}>Tuition amount to apply</span>
          <input type="number" min="1" step="0.01" value={amount} onChange={(event) => setAmount(event.target.value)} style={{ width: "100%", padding: "9px 10px", borderRadius: 8, border: "1px solid #cbd5e1" }} />
        </label>
        <label style={{ display: "grid", gap: 6 }}>
          <span style={{ fontSize: 13, fontWeight: 700 }}>Payment email</span>
          <input type="email" value={paymentEmail} onChange={(event) => setPaymentEmail(event.target.value)} placeholder="student@example.com" style={{ width: "100%", padding: "9px 10px", borderRadius: 8, border: "1px solid #cbd5e1" }} />
        </label>
        <label style={{ display: "grid", gap: 6 }}>
          <span style={{ fontSize: 13, fontWeight: 700 }}>Purpose</span>
          <select value={purpose} onChange={(event) => setPurpose(event.target.value)} style={{ width: "100%", padding: "9px 10px", borderRadius: 8, border: "1px solid #cbd5e1", background: "#fff" }}>
            <option value="balance">Balance payment</option>
            <option value="initial">Initial payment</option>
            <option value="renewal">Renewal</option>
            <option value="other">Other tuition payment</option>
          </select>
        </label>
      </div>

      <div style={{ padding: 10, borderRadius: 10, background: "#fff", border: "1px solid #dcfce7", fontSize: 13 }}>
        <strong>{formatGhs(numericAmount)}</strong> will be credited to tuition. Estimated Paystack checkout: <strong>{formatGhs(checkoutAmount)}</strong>{processingShare > 0 ? ` (${formatGhs(processingShare)} processing share)` : ""}.
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button type="button" onClick={generateLink} disabled={generating || numericAmount <= 0}>
          {generating ? "Generating..." : "Generate payment link"}
        </button>
        {generatedPayment?.authorizationUrl && (
          <>
            <button type="button" onClick={sendWhatsapp}>Send on WhatsApp</button>
            <button type="button" onClick={copyLink} style={{ background: "#fff", color: "#1a2233", border: "1px solid #cbd5e1" }}>Copy link</button>
          </>
        )}
      </div>

      {generatedPayment?.authorizationUrl && (
        <div style={{ padding: 10, borderRadius: 10, background: "#fff", border: "1px solid #bbf7d0", overflowWrap: "anywhere" }}>
          <div style={{ fontSize: 12, color: "#64748b", marginBottom: 4 }}>Latest generated link</div>
          <a href={generatedPayment.authorizationUrl} target="_blank" rel="noreferrer">{generatedPayment.authorizationUrl}</a>
          <div style={{ marginTop: 6, fontSize: 12, color: "#64748b" }}>Reference: {generatedPayment.reference || generatedPayment.id || "—"}</div>
        </div>
      )}

      <div>
        <h4 style={{ margin: "4px 0 8px" }}>Payment history</h4>
        {payments.length === 0 ? (
          <p style={{ margin: 0, color: "#64748b", fontSize: 13 }}>No generated Paystack payments yet.</p>
        ) : (
          <div style={{ display: "grid", gap: 6 }}>
            {payments.slice(0, 8).map((payment) => (
              <div key={payment.id || payment.reference} style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) auto", gap: 10, padding: "8px 10px", border: "1px solid #e2e8f0", borderRadius: 9, background: "#fff" }}>
                <div>
                  <strong>{formatGhs(payment.tuitionCredit)}</strong>
                  <div style={{ fontSize: 12, color: "#64748b" }}>{payment.purpose || "payment"} · {payment.reference || payment.id}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <strong>{String(payment.status || "pending")}</strong>
                  <div style={{ fontSize: 12, color: "#64748b" }}>{formatPaymentDate(payment.paidAt || payment.createdAt)}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
