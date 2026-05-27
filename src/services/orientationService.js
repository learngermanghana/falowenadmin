import { auth } from "../firebase";

function validatePayload(payload = {}) {
  const name = String(payload.name || "").trim();
  const email = String(payload.email || "").trim();
  const level = String(payload.level || "").trim().toUpperCase();
  const startDate = String(payload.startDate || "").trim();
  const studentCode = String(payload.studentCode || "").trim();

  if (!name) throw new Error("Name is required");
  if (!email) throw new Error("Email is required");
  if (!["A1", "A2", "B1"].includes(level)) throw new Error("Level must be A1, A2, or B1");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate)) throw new Error("Start date must be YYYY-MM-DD");

  return { name, email, level, startDate, studentCode };
}

export async function syncOrientationStudent(payload) {
  const body = validatePayload(payload);
  const token = auth?.currentUser ? await auth.currentUser.getIdToken() : "";

  const response = await fetch("/api/orientation/sync", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(String(data?.error || "Failed to sync orientation student"));
  }

  return data;
}
