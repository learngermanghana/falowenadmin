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
  if (!response.ok || !data.ok) {
    const fallback = response.status === 502
      ? "AI Studio could not complete this request (502). The AI provider or server may be temporarily unavailable; your existing transcript and questions are unchanged."
      : response.status === 504
        ? "AI Studio timed out. Keep your current draft and retry later."
        : `The studio request failed (${response.status}).`;
    const error = new Error(data.error || fallback);
    error.httpStatus = response.status;
    if (data.providerQuota) error.providerQuota = data.providerQuota;
    throw error;
  }
  return data;
}

export const getStudioStatus = () => request("status");
export const makeListeningScript = ({ topic, type, level, part, mode, kind, lessonContext }) => request("script", { topic, type, level, part, mode, kind, lessonContext });
export const makeSpeechClip = ({ turns, text, speaker, engine }) => request("speech", turns ? { turns, engine } : { text, speaker, engine });
export const makeListeningQuestions = ({ script, kind, level, part, mode, lessonContext }) => request("questions", { script, kind, level, part, mode, lessonContext });

// Student API already owns the Cloudflare R2 credentials, Firestore storage and learner access checks.
// Do not pass R2 credentials or Gemini secrets through the browser.
const COURSE_API_BASE = (import.meta.env.VITE_FALOWEN_COURSE_API_URL || "https://www.falowen.app/api").replace(/\/+$/, "");
export async function getHoerenPublishCatalog() {
  const user = auth.currentUser;
  if (!user) throw new Error("Sign in with your Falowen owner account.");
  const response = await fetch(`${COURSE_API_BASE}/course-media/studio/assignments`, {
    headers: { Authorization: `Bearer ${await user.getIdToken()}` }, cache: "no-store",
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.ok || !Array.isArray(data.lessons)) {
    throw new Error(data.error || "Falowen's Course Book lesson catalogue is unavailable.");
  }
  return data.lessons;
}

export async function publishListeningLesson({ metadata, mp3 }) {
  const user = auth.currentUser;
  if (!user) throw new Error("Sign in with your Falowen owner account.");
  const token = await user.getIdToken();
  if (!(mp3 instanceof Blob) || !mp3.size) throw new Error("Generate MP3 audio first.");
  const data = new FormData();
  data.append("metadata", JSON.stringify(metadata));
  data.append("audio", mp3, "hoeren-studio.mp3");
  const response = await fetch(`${COURSE_API_BASE}/course-media/studio/publish`, {
    method: "POST", headers: { Authorization: `Bearer ${token}` }, body: data,
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok || !result.ok) throw new Error(result.error || `Publish failed (${response.status}).`);
  return result;
}

