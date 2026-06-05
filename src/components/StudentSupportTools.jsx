import { useMemo, useState } from "react";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../firebase.js";
import { fetchSubmissions } from "../services/markingService.js";
import { updateStudentById } from "../services/studentsService.js";

const ACTIVE_STATUSES = ["active", "paid", "partial", "pending", "enrolled", "registered", "ongoing", "current"];
const BLOCKED_PAYMENT_STATUSES = ["failed", "overdue", "rejected", "cancelled", "canceled"];

function displayValue(...values) {
  return values.map((value) => String(value ?? "").trim()).find(Boolean) || "";
}

function normalizeDateValue(value) {
  const raw = String(value ?? "").trim();
  if (!raw) return "";
  const asDate = new Date(raw);
  if (Number.isNaN(asDate.getTime())) return raw;
  const year = asDate.getUTCFullYear();
  const month = String(asDate.getUTCMonth() + 1).padStart(2, "0");
  const day = String(asDate.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDate(value) {
  const normalized = normalizeDateValue(value);
  if (!normalized) return "Not set";
  const date = new Date(`${normalized}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return normalized;
  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function addMonthsToDate(value, months) {
  const normalized = normalizeDateValue(value);
  const start = normalized ? new Date(`${normalized}T00:00:00Z`) : new Date();
  const base = Number.isNaN(start.getTime()) ? new Date() : start;
  const today = new Date();
  const todayUtc = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
  const date = base.getTime() < todayUtc.getTime() ? todayUtc : base;
  date.setUTCMonth(date.getUTCMonth() + months);
  return date.toISOString().slice(0, 10);
}

function daysUntil(value) {
  const normalized = normalizeDateValue(value);
  if (!normalized) return null;
  const target = new Date(`${normalized}T00:00:00Z`);
  if (Number.isNaN(target.getTime())) return null;
  const now = new Date();
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  return Math.ceil((target.getTime() - today.getTime()) / 86400000);
}

function toNumber(value) {
  const parsed = Number(String(value ?? "").replace(/[^0-9.-]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizePhoneForWhatsapp(phone) {
  const digits = String(phone || "").replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("233")) return digits;
  if (digits.startsWith("0")) return `233${digits.slice(1)}`;
  if (digits.length === 9) return `233${digits}`;
  return digits;
}

function whatsappUrl(phone, message) {
  const normalizedPhone = normalizePhoneForWhatsapp(phone);
  if (!normalizedPhone) return "";
  return `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(message)}`;
}

function resolveStudentCode(student, draft = {}) {
  return displayValue(draft.studentCode, student?.studentCode, student?.studentcode, student?.id);
}

function resolveStudentName(student) {
  return displayValue(student?.name, student?.displayName, student?.fullName, student?.email, student?.id) || "Student";
}

function resolveStudentPhone(student, draft = {}) {
  return displayValue(draft.phone, student?.phone, student?.whatsapp, student?.phoneNumber, student?.guardianPhone);
}

function resolveLevel(student, draft = {}) {
  return displayValue(draft.level, student?.level, student?.className, student?.program);
}

function buildLoginProblemSummary(student, draft = {}) {
  const status = displayValue(draft.status, student?.status) || "Not set";
  const paymentStatus = displayValue(draft.paymentStatus, student?.paymentStatus) || "Not set";
  const contractEnd = displayValue(draft.contractEnd, student?.contractEnd);
  const contractDaysLeft = daysUntil(contractEnd);
  const normalizedStatus = status.toLowerCase();
  const normalizedPaymentStatus = paymentStatus.toLowerCase();

  let allowed = true;
  let reason = "Login should be allowed based on status, contract, and payment fields.";

  if (normalizedStatus && status !== "Not set" && !ACTIVE_STATUSES.includes(normalizedStatus)) {
    allowed = false;
    reason = `Login blocked because account status is ${status}.`;
  } else if (contractDaysLeft !== null && contractDaysLeft < 0) {
    allowed = false;
    reason = `Login blocked because contract ended on ${formatDate(contractEnd)}.`;
  } else if (BLOCKED_PAYMENT_STATUSES.includes(normalizedPaymentStatus)) {
    allowed = false;
    reason = `Login blocked because payment status is ${paymentStatus}.`;
  }

  return [
    `Login allowed: ${allowed ? "YES" : "NO"}`,
    `Reason: ${reason}`,
    `Student: ${resolveStudentName(student)}`,
    `Student code: ${resolveStudentCode(student, draft) || "Not set"}`,
    `Email: ${displayValue(draft.email, student?.email) || "Not set"}`,
    `Status: ${status}`,
    `Contract start: ${formatDate(displayValue(draft.contractStart, student?.contractStart))}`,
    `Contract end: ${formatDate(contractEnd)}`,
    `Days left: ${contractDaysLeft === null ? "Unknown" : contractDaysLeft}`,
    `Payment status: ${paymentStatus}`,
    `Balance due: ${displayValue(draft.balanceDue, student?.balanceDue, student?.balance) || "Not set"}`,
  ].join("\n");
}

function buildWhatsAppSupportMessage(student, draft = {}) {
  const name = resolveStudentName(student);
  const contractEnd = displayValue(draft.contractEnd, student?.contractEnd);
  const balance = displayValue(draft.balanceDue, student?.balanceDue, student?.balance);
  return `Hello ${name}, this is Learn Language Education Academy / Falowen support. We are checking your student account. Contract end: ${formatDate(contractEnd)}. Balance: ${balance || "not set"}. Please reply here if you still cannot log in or need help. Thank you.`;
}

export default function StudentSupportTools({ student, draft = {}, onStudentUpdated, pushToast }) {
  const [busyAction, setBusyAction] = useState("");
  const [supportSummary, setSupportSummary] = useState("");
  const [latestSubmissions, setLatestSubmissions] = useState([]);
  const [showSubmissions, setShowSubmissions] = useState(false);

  const studentName = resolveStudentName(student);
  const studentCode = resolveStudentCode(student, draft);
  const email = displayValue(draft.email, student?.email);
  const phone = resolveStudentPhone(student, draft);
  const contractEnd = displayValue(draft.contractEnd, student?.contractEnd);
  const contractDaysLeft = daysUntil(contractEnd);
  const paymentStatus = displayValue(draft.paymentStatus, student?.paymentStatus) || "Not set";
  const balanceDue = displayValue(draft.balanceDue, student?.balanceDue, student?.balance) || "Not set";

  const paymentCardText = useMemo(
    () => [`Payment status: ${paymentStatus}`, `Balance due: ${balanceDue}`, `Paid: ${displayValue(student?.paid, student?.initialPaymentAmount) || "Not set"}`].join("\n"),
    [balanceDue, paymentStatus, student],
  );

  if (!student) return null;

  const notify = (type, message) => {
    if (typeof pushToast === "function") pushToast({ type, message });
  };

  const runAction = async (key, handler) => {
    setBusyAction(key);
    try {
      await handler();
    } finally {
      setBusyAction("");
    }
  };

  const updateStudent = async (payload, successMessage) => {
    await updateStudentById(student.id, payload);
    onStudentUpdated?.(student.id, payload);
    notify("success", successMessage);
  };

  const resetPassword = () =>
    runAction("reset", async () => {
      if (!email) {
        notify("error", "This student has no email address for password reset.");
        return;
      }
      if (!auth) {
        notify("error", "Firebase Auth is not configured in this admin app.");
        return;
      }
      await sendPasswordResetEmail(auth, email.trim().toLowerCase());
      notify("success", `Password reset email sent to ${email}.`);
    });

  const extendContract = () =>
    runAction("extend", async () => {
      const monthsInput = window.prompt("Extend contract by how many months?", "1");
      if (monthsInput === null) return;
      const months = Number(monthsInput);
      if (!Number.isFinite(months) || months <= 0) {
        notify("error", "Enter a valid number of months.");
        return;
      }
      const nextEnd = addMonthsToDate(contractEnd, months);
      await updateStudent({ contractEnd: nextEnd, status: draft.status || student.status || "Enrolled" }, `Contract extended to ${formatDate(nextEnd)}.`);
    });

  const reactivateAccount = () =>
    runAction("reactivate", async () => {
      const nextStatus = window.prompt("Set student status to:", "Enrolled");
      if (nextStatus === null) return;
      const cleanedStatus = nextStatus.trim() || "Enrolled";
      await updateStudent({ status: cleanedStatus }, `Account status updated to ${cleanedStatus}.`);
    });

  const viewLoginProblem = async () => {
    const summary = buildLoginProblemSummary(student, draft);
    setSupportSummary(summary);
    try {
      await navigator.clipboard.writeText(summary);
      notify("success", "Login problem summary copied for support.");
    } catch {
      notify("info", "Login problem summary shown below.");
    }
  };

  const viewLatestSubmissions = () =>
    runAction("submissions", async () => {
      const rows = await fetchSubmissions(resolveLevel(student, draft), studentCode);
      setLatestSubmissions(rows.slice(0, 5));
      setShowSubmissions(true);
      notify("success", `Loaded ${Math.min(rows.length, 5)} latest submission(s).`);
    });

  const viewPaymentStatus = async () => {
    setSupportSummary(paymentCardText);
    try {
      await navigator.clipboard.writeText(paymentCardText);
      notify("success", "Payment status copied.");
    } catch {
      notify("info", "Payment status shown below.");
    }
  };

  const sendWhatsappMessage = () => {
    const message = buildWhatsAppSupportMessage(student, draft);
    const url = whatsappUrl(phone, message);
    if (!url) {
      notify("error", "This student has no valid WhatsApp/phone number.");
      return;
    }
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <section
      style={{
        marginTop: 18,
        border: "1px solid #bae6fd",
        borderRadius: 14,
        padding: 14,
        background: "linear-gradient(135deg, #f0f9ff, #ffffff)",
        display: "grid",
        gap: 12,
      }}
    >
      <div>
        <h3 style={{ margin: "0 0 4px" }}>Student support tools</h3>
        <p style={{ margin: 0, color: "#64748b" }}>
          Quick actions for login help, contract updates, payment checks, submissions, and WhatsApp support.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 8 }}>
        <button type="button" onClick={resetPassword} disabled={busyAction === "reset"}>
          {busyAction === "reset" ? "Sending..." : "Reset password"}
        </button>
        <button type="button" onClick={extendContract} disabled={busyAction === "extend"}>
          Extend contract
        </button>
        <button type="button" onClick={reactivateAccount} disabled={busyAction === "reactivate"}>
          Reactivate account
        </button>
        <button type="button" onClick={viewLoginProblem}>
          View login problem
        </button>
        <button type="button" onClick={viewLatestSubmissions} disabled={busyAction === "submissions"}>
          {busyAction === "submissions" ? "Loading..." : "View latest submissions"}
        </button>
        <button type="button" onClick={viewPaymentStatus}>
          View payment status
        </button>
        <button type="button" onClick={sendWhatsappMessage}>
          Send WhatsApp message
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 8 }}>
        <div style={{ border: "1px solid #e2e8f0", borderRadius: 12, padding: 10, background: "#fff" }}>
          <strong>{studentName}</strong>
          <div style={{ color: "#64748b", fontSize: 13 }}>{studentCode || "No student code"}</div>
        </div>
        <div style={{ border: "1px solid #e2e8f0", borderRadius: 12, padding: 10, background: "#fff" }}>
          <strong>Contract</strong>
          <div style={{ color: "#64748b", fontSize: 13 }}>
            Ends: {formatDate(contractEnd)} {contractDaysLeft === null ? "" : `(${contractDaysLeft} day(s) left)`}
          </div>
        </div>
        <div style={{ border: "1px solid #e2e8f0", borderRadius: 12, padding: 10, background: "#fff" }}>
          <strong>Payment</strong>
          <div style={{ color: "#64748b", fontSize: 13 }}>{paymentStatus} · Balance: {balanceDue}</div>
        </div>
      </div>

      {supportSummary && (
        <pre
          style={{
            margin: 0,
            whiteSpace: "pre-wrap",
            border: "1px solid #cbd5e1",
            borderRadius: 12,
            padding: 12,
            background: "#fff",
            color: "#0f172a",
            fontFamily: "inherit",
            fontSize: 13,
          }}
        >
          {supportSummary}
        </pre>
      )}

      {showSubmissions && (
        <div style={{ display: "grid", gap: 8 }}>
          <strong>Latest submissions</strong>
          {latestSubmissions.length === 0 ? (
            <p style={{ margin: 0, color: "#64748b" }}>No submissions found for this student code.</p>
          ) : (
            latestSubmissions.map((submission) => (
              <div key={submission.path || submission.id} style={{ border: "1px solid #e2e8f0", borderRadius: 12, padding: 10, background: "#fff" }}>
                <div style={{ fontWeight: 700 }}>{submission.assignment || submission.assignmentId || "Untitled submission"}</div>
                <div style={{ color: "#64748b", fontSize: 13 }}>
                  {submission.createdAt ? submission.createdAt.toLocaleString() : "No date"} · {submission.markingStatus || submission.status || "submitted"}
                  {submission.finalScore !== null && typeof submission.finalScore !== "undefined" ? ` · Score: ${submission.finalScore}` : ""}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </section>
  );
}
