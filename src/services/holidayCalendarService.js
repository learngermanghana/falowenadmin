import { auth } from "../firebase";

async function getAuthHeaders() {
  const user = auth?.currentUser;
  if (!user) throw new Error("You must be logged in to manage holidays.");
  const token = await user.getIdToken();
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

export async function importHolidays({ year, countryCode = "GH" }) {
  const response = await fetch("/api/holidays/import", {
    method: "POST",
    headers: await getAuthHeaders(),
    body: JSON.stringify({ year, countryCode }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(String(data?.error || "Failed to import holidays"));
  }

  return data;
}

export async function getUpcomingHolidays({ year, countryCode = "GH" }) {
  const query = new URLSearchParams({ year: String(year), countryCode }).toString();
  const response = await fetch(`/api/holidays/upcoming?${query}`, {
    method: "GET",
    headers: await getAuthHeaders(),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(String(data?.error || "Failed to load holidays"));
  }

  return Array.isArray(data?.holidays) ? data.holidays : [];
}

export async function syncHolidaysToSheet(year) {
  const response = await fetch("/api/holidays/sync-sheet", {
    method: "POST",
    headers: await getAuthHeaders(),
    body: JSON.stringify({ year, countryCode: "GH" }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const details = data?.details?.error || data?.details?.message || data?.error;
    throw new Error(String(details || "Failed to sync holidays to Google Sheet"));
  }

  return data;
}

export async function updateHoliday({ date, countryCode = "GH", schoolClosed, adminNote, studentMessage }) {
  const response = await fetch(`/api/holidays/${date}/update`, {
    method: "PATCH",
    headers: await getAuthHeaders(),
    body: JSON.stringify({ countryCode, schoolClosed, adminNote, studentMessage }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(String(data?.error || "Failed to update holiday"));
  }

  return data;
}
