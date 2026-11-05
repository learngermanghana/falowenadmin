import { auth } from "../firebase.js";

async function requestStudentAccount(studentId, method = "GET", path = "") {
  const id = String(studentId || "").trim();
  if (!id) throw new Error("Select a saved student first.");
  if (!auth?.currentUser) throw new Error("Sign in to Falowen Admin first.");

  const token = await auth.currentUser.getIdToken();
  const response = await fetch(
    `/api/admin/student-accounts/${encodeURIComponent(id)}${path}`,
    {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(method === "POST" ? { "Content-Type": "application/json" } : {}),
      },
      ...(method === "POST" ? { body: "{}" } : {}),
      cache: "no-store",
    },
  );
  const raw = await response.text();
  let data = {};
  try { data = raw ? JSON.parse(raw) : {}; } catch { /* unexpected proxy response */ }
  if (!response.ok || data.ok !== true) {
    throw new Error(data.error || `Account request failed (HTTP ${response.status}).`);
  }
  return data;
}

export function getStudentAccountStatus(studentId) {
  return requestStudentAccount(studentId);
}

export function prepareStudentAccount(studentId) {
  return requestStudentAccount(studentId, "POST", "/prepare");
}

export function recordStudentInvitationSent(studentId) {
  return requestStudentAccount(studentId, "POST", "/invitation-sent");
}

export function sendOrganisationEnrolmentConfirmation(studentId) {
  return requestStudentAccount(studentId, "POST", "/organisation-confirmation");
}
