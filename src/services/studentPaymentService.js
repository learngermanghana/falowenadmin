import { auth } from "../firebase.js";

async function authHeaders() {
  const token = auth?.currentUser ? await auth.currentUser.getIdToken() : "";
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function parseJsonResponse(response) {
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
    throw new Error(String(data?.error || data?.message || safeText || `Payment request failed (${response.status}).`));
  }

  return data;
}

export async function createStudentPaymentLink({ studentId, amount, email = "", purpose = "balance" } = {}) {
  const normalizedId = String(studentId || "").trim();
  const numericAmount = Number(amount);
  if (!normalizedId) throw new Error("Student ID is required.");
  if (!Number.isFinite(numericAmount) || numericAmount <= 0) throw new Error("Enter a valid payment amount.");

  const response = await fetch("/api/payments/create-link", {
    method: "POST",
    headers: await authHeaders(),
    body: JSON.stringify({
      studentId: normalizedId,
      amount: numericAmount,
      email: String(email || "").trim(),
      purpose: String(purpose || "balance").trim() || "balance",
    }),
  });

  return parseJsonResponse(response);
}

export async function listStudentPayments(studentId) {
  const normalizedId = String(studentId || "").trim();
  if (!normalizedId) return [];

  const response = await fetch(`/api/payments/student/${encodeURIComponent(normalizedId)}`, {
    method: "GET",
    headers: await authHeaders(),
  });
  const data = await parseJsonResponse(response);
  return Array.isArray(data?.payments) ? data.payments : [];
}
