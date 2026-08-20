import { auth } from "../firebase.js";

async function authHeaders() {
  const token = auth?.currentUser ? await auth.currentUser.getIdToken() : "";
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function parseResponse(response) {
  const text = await response.text();
  let data = {};
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = {};
    }
  }
  if (!response.ok || data?.ok === false) {
    const safeText = text && !/^\s*</.test(text) ? text.slice(0, 500) : "";
    throw new Error(String(data?.error || data?.message || safeText || `Request failed (${response.status}).`));
  }
  return data;
}

export async function startStudentUpgrade({ studentId, targetLevel, tuitionFee, targetClassName = "" } = {}) {
  const normalizedId = String(studentId || "").trim();
  const numericFee = Number(tuitionFee);
  if (!normalizedId) throw new Error("Student ID is required.");
  if (!String(targetLevel || "").trim()) throw new Error("Target level is required.");
  if (!Number.isFinite(numericFee) || numericFee <= 0) throw new Error("Enter a valid tuition fee for the new level.");

  const response = await fetch("/api/payments/start-upgrade", {
    method: "POST",
    headers: await authHeaders(),
    body: JSON.stringify({
      studentId: normalizedId,
      targetLevel: String(targetLevel || "").trim(),
      tuitionFee: numericFee,
      targetClassName: String(targetClassName || "").trim(),
    }),
  });
  return parseResponse(response);
}

export async function reconcileStudentPayments(studentId) {
  const normalizedId = String(studentId || "").trim();
  if (!normalizedId) return { ok: true, checked: 0, applied: 0 };
  const response = await fetch(`/api/payments/reconcile-student/${encodeURIComponent(normalizedId)}`, {
    method: "POST",
    headers: await authHeaders(),
    body: JSON.stringify({}),
  });
  return parseResponse(response);
}
