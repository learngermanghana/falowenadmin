import { auth } from "../firebase";

function normalizeMeetingDays(meetingDays) {
  if (!Array.isArray(meetingDays)) return [];
  return meetingDays.map((day) => String(day || "").trim()).filter(Boolean);
}

async function authHeaders() {
  const token = auth?.currentUser ? await auth.currentUser.getIdToken() : "";
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

function validatePayload(payload = {}) {
  const className = String(payload.className || "").trim();
  const startDate = String(payload.startDate || "").trim();
  const endDate = String(payload.endDate || "").trim();
  const time = String(payload.time || "").trim();
  const meetingDays = normalizeMeetingDays(payload.meetingDays);

  const monTime = String(payload.monTime || "").trim();
  const tueTime = String(payload.tueTime || "").trim();
  const wedTime = String(payload.wedTime || "").trim();
  const thuTime = String(payload.thuTime || "").trim();
  const friTime = String(payload.friTime || "").trim();
  const satTime = String(payload.satTime || "").trim();
  const sunTime = String(payload.sunTime || "").trim();

  if (!className) throw new Error("Class name is required");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate)) throw new Error("Start date must be YYYY-MM-DD");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(endDate)) throw new Error("End date must be YYYY-MM-DD");
  if (endDate < startDate) throw new Error("End date must be the same day or after start date");
  if (!time) throw new Error("Class time is required");
  if (meetingDays.length === 0) throw new Error("Select at least one meeting day");

  return {
    className,
    startDate,
    endDate,
    time,
    meetingDays,
    monTime,
    tueTime,
    wedTime,
    thuTime,
    friTime,
    satTime,
    sunTime,
  };
}

export async function syncClassSchedule(payload) {
  const body = validatePayload(payload);

  const response = await fetch("/api/class-schedule/sync", {
    method: "POST",
    headers: await authHeaders(),
    body: JSON.stringify(body),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(String(data?.error || "Failed to sync class schedule"));
  }

  return data;
}

export async function removeClassScheduleSheetRow(row = {}) {
  const rowNumber = Number(row.rowNumber || row.sheetRowNumber);
  const className = String(row.values?.Class || row.values?.class || row.values?.ClassName || row.values?.className || row.className || "").trim();

  if (!Number.isInteger(rowNumber) || rowNumber < 2) {
    throw new Error("A valid sheet row number is required before removing.");
  }

  const response = await fetch("/api/class-schedule/remove-row", {
    method: "POST",
    headers: await authHeaders(),
    body: JSON.stringify({ rowNumber, className, row }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok || data?.ok === false) {
    throw new Error(String(data?.error || "Failed to remove class schedule sheet row"));
  }

  return data;
}
