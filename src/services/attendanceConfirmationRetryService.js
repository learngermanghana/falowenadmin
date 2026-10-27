import { auth } from "../firebase.js";

async function responseJson(response) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok || data?.ok === false) {
    throw new Error(String(data?.error || data?.message || `Retry failed with HTTP ${response.status}`));
  }
  return data;
}

export async function retryFailedAttendanceEmails(classRecordId) {
  const classId = String(classRecordId || "").trim();
  if (!classId) throw new Error("Select a class before retrying failed emails.");
  const user = auth?.currentUser;
  if (!user) throw new Error("You must be signed in to retry failed attendance emails.");
  const token = await user.getIdToken();
  const response = await fetch("/api/attendance-confirmation-emails/retry-failed", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ classId }),
  });
  return responseJson(response);
}
