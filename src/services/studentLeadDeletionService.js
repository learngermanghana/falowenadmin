import { auth } from "../firebase.js";

const STUDENT_LEADS_DELETE_ENDPOINT = "/api/student-leads/delete";

function normalize(value) {
  return String(value || "").trim();
}

function normalizePhone(value) {
  const digits = normalize(value).replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("233")) return digits;
  if (digits.startsWith("0")) return `233${digits.slice(1)}`;
  if (digits.length === 9) return `233${digits}`;
  return digits;
}

async function authHeaders() {
  const token = auth?.currentUser ? await auth.currentUser.getIdToken() : "";
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

function parseResponse(response, responseText = "") {
  const text = normalize(responseText);
  let data = {};

  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = {};
    }
  }

  if (!response.ok || data?.ok === false) {
    const nonHtmlText = text && !/^\s*</.test(text) ? text.slice(0, 500) : "";
    const statusLabel = [response.status, response.statusText].filter(Boolean).join(" ");
    const fallback = response.status === 404
      ? "Lead deletion endpoint is not deployed yet. Deploy the latest Firebase function and retry."
      : `Lead deletion request failed${statusLabel ? ` (${statusLabel})` : ""}.`;
    throw new Error(String(data?.error || data?.message || nonHtmlText || fallback));
  }

  return data;
}

export async function deleteStudentLead(lead = {}) {
  const leadId = normalize(lead.leadId || lead.id);
  const email = normalize(lead.email).toLowerCase();
  const phone = normalizePhone(lead.number || lead.phone);

  if (!leadId && !email && !phone) {
    throw new Error("Lead ID, email, or phone number is required");
  }

  const response = await fetch(STUDENT_LEADS_DELETE_ENDPOINT, {
    method: "POST",
    headers: await authHeaders(),
    body: JSON.stringify({ leadId, email, phone, lead }),
  });

  return parseResponse(response, await response.text());
}
