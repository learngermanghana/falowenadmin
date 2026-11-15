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
