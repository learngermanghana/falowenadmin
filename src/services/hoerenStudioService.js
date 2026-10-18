import { auth } from "../firebaseAuth";

const BASE = "/api/ai-studio";

async function request(endpoint, payload) {
  const user = auth.currentUser;
  if (!user) throw new Error("Sign in to Falowen Admin first.");
  const token = await user.getIdToken();
  const response = await fetch(`${BASE}/${endpoint}`, {
    method: payload == null ? "GET" : "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    ...(payload == null ? {} : { body: JSON.stringify(payload) }),
    cache: "no-store",
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.ok) throw new Error(data.error || `The studio request failed (${response.status}).`);
  return data;
}

export const getStudioStatus = () => request("status");
export const makeListeningScript = ({ topic, type, level }) => request("script", { topic, type, level });
export const makeSpeechClip = ({ text, speaker, engine }) => request("speech", { text, speaker, engine });
