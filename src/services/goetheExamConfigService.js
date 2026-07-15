import { auth } from "../firebase.js";

export const GOETHE_EXAM_CONFIG_URL = String(
  import.meta.env.VITE_GOETHE_EXAM_CONFIG_URL
    || "https://us-central1-falowen-examiner-trainer.cloudfunctions.net/api/exam-file/config",
).trim();

async function responseJson(response) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok || data?.ok === false) {
    throw new Error(String(data?.error || data?.message || `Request failed with HTTP ${response.status}`));
  }
  return data;
}

export async function loadGoetheExamConfig() {
  const response = await fetch(GOETHE_EXAM_CONFIG_URL, {
    method: "GET",
    headers: { Accept: "application/json" },
    cache: "no-store",
  });
  return responseJson(response);
}

export async function saveGoetheExamConfig(config) {
  const user = auth?.currentUser;
  if (!user) throw new Error("You must be signed in to save Goethe exam settings.");
  const token = await user.getIdToken();
  const response = await fetch(GOETHE_EXAM_CONFIG_URL, {
    method: "PUT",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ config }),
  });
  return responseJson(response);
}
