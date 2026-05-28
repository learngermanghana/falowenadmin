import { auth } from "../firebase";

async function authHeaders() {
  const token = auth?.currentUser ? await auth.currentUser.getIdToken() : "";
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function importHolidays({ year, countryCode = "GH" }) {
  const response = await fetch("/api/holidays/import", {
    method: "POST",
    headers: await authHeaders(),
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
    headers: await authHeaders(),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(String(data?.error || "Failed to load holidays"));
  }

  return Array.isArray(data?.holidays) ? data.holidays : [];
}

export async function updateHoliday({ date, countryCode = "GH", schoolClosed, notes }) {
  const response = await fetch(`/api/holidays/${date}/update`, {
    method: "POST",
    headers: await authHeaders(),
    body: JSON.stringify({ countryCode, schoolClosed, notes }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(String(data?.error || "Failed to update holiday"));
  }

  return data;
}
