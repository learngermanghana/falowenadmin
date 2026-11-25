export async function attendanceRequest(user, endpoint, body, signal) {
  const token = await user.getIdToken();
  const response = await fetch(`/api/${endpoint}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal,
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.ok) throw new Error(data.error || "Attendance service is unavailable.");
  return data;
}

/** Complete the canonical lesson and close QR check-in via the existing authenticated transaction. */
export async function completeAttendanceSession(user, { classId, sessionId, date }, {
  env = import.meta.env || {}, fetchImpl = fetch,
} = {}) {
  if (!user) throw new Error("Sign in as a teacher or administrator to complete the class.");
  if (!classId || !sessionId) throw new Error("The exact class and session are required.");
  const explicit = String(env.VITE_OPEN_SESSION_API_URL || "").trim();
  const base = String(env.VITE_API_BASE_URL || "").trim().replace(/\/+$/, "");
  const url = explicit || (base ? `${base}/openSession` : "");
  if (!url) throw new Error("Missing check-in API configuration.");
  const token = await user.getIdToken();
  const response = await fetchImpl(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ classId, sessionId, date, action: "end" }),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok || !result.ok || result.status !== "completed" || result.opened !== false) {
    throw new Error(result.error || "The server did not confirm class completion and closed check-in.");
  }
  return result;
}
