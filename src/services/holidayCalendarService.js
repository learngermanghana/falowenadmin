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

export async function updateHoliday({ date, countryCode = "GH", schoolClosed, notes }) {
  const response = await fetch(`/api/holidays/${date}/update`, {
    method: "PATCH",
    headers: await getAuthHeaders(),
    body: JSON.stringify({ countryCode, schoolClosed, notes }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(String(data?.error || "Failed to update holiday"));
  }

  return data;
}
