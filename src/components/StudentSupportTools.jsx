import { useState } from "react";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../firebase.js";
import { updateStudentById } from "../services/studentsService.js";

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

function buildWhatsAppSupportMessage(student, draft = {}) {
  const name = resolveStudentName(student);
  const contractEnd = displayValue(draft.contractEnd, student?.contractEnd);
  const balance = displayValue(draft.balanceDue, student?.balanceDue, student?.balance);
  return `Hello ${name}, this is Learn Language Education Academy / Falowen support. We are checking your student account. Contract end: ${formatDate(contractEnd)}. Balance: ${balance || "not set"}. Please reply here if you need help. Thank you.`;
}

export default function StudentSupportTools({ student, draft = {}, onStudentUpdated, pushToast }) {
  const [busyAction, setBusyAction] = useState("");

  if (!student) return null;

  const studentName = resolveStudentName(student);
  const studentCode = resolveStudentCode(student, draft);
  const email = displayValue(draft.email, student?.email);
  const phone = resolveStudentPhone(student, draft);
  const contractEnd = displayValue(draft.contractEnd, student?.contractEnd);
  const contractDaysLeft = daysUntil(contractEnd);
  const paymentStatus = displayValue(draft.paymentStatus, student?.paymentStatus) || "Not set";
  const balanceDue = displayValue(draft.balanceDue, student?.balanceDue, student?.balance) || "Not set";

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
      const cleanedStatus = window.confirm("Reactivate this student account and set status to Enrolled?") ? "Enrolled" : "";
      if (!cleanedStatus) return;
      await updateStudent({ status: cleanedStatus }, `Account status updated to ${cleanedStatus}.`);
    });

  const sendWhatsappMessage = () => {
    const url = whatsappUrl(phone, buildWhatsAppSupportMessage(student, draft));
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
        <h3 style={{ margin: "0 0 4px" }}>Student support</h3>
        <p style={{ margin: 0, color: "#64748b" }}>
          Main actions only: password, contract, account status, and WhatsApp help.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 8 }}>
        <button type="button" onClick={resetPassword} disabled={busyAction === "reset"}>
          {busyAction === "reset" ? "Sending..." : "Reset password"}
        </button>
        <button type="button" onClick={extendContract} disabled={busyAction === "extend"}>
          Extend contract
        </button>
        <button type="button" onClick={reactivateAccount} disabled={busyAction === "reactivate"}>
          Reactivate account
        </button>
        <button type="button" onClick={sendWhatsappMessage}>
          WhatsApp support
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
    </section>
  );
}
