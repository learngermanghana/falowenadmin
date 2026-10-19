"use strict";

// Admin-only, budget-capped Gemini audio tools. No audio or transcripts are stored
// in Firestore; only daily request counters are persisted.
const MODELS = Object.freeze({
  lite: "gemini-3.8-flash-lite-tts",
  flash: "gemini-3.8-flash-tts",
});
const SCRIPT_MODEL = "gemini-3.5-flash-lite";
const LIMITS = Object.freeze({ script: 5, speech: 36 });
const ALLOWED_LEVELS = new Set(["A1", "A2", "B1", "B2", "C1", "C2"]);
const ALLOWED_TYPES = new Set(["dialogue", "announcement", "telephone", "podcast", "radio", "interview", "discussion", "lecture"]);
const crypto = require("node:crypto");
const { extractLessonDraft, questionInstructions } = require("./hoerenQuestions");
const { EXAM_PROFILES, getExamProfile, buildExamPrompt } = require("./hoerenExamProfiles");
// SHA-256 identifier for the single verified Falowen owner UID. This is not an API secret.
// Using a digest avoids publishing the Firebase account UID in public repository code.
const DEFAULT_OWNER_UID_SHA256 = "e8bc09aac410e86216e384ab4c612d6ac6551273085f8344206b23f4004f90a1";

function ownerUid(runtimeConfig = {}, env = process.env) {
  return String(env.HOEREN_STUDIO_OWNER_UID || runtimeConfig.ai_studio?.owner_uid || "").trim();
}

function isStudioOwner(uid, runtimeConfig = {}, env = process.env) {
  const expected = ownerUid(runtimeConfig, env);
  if (expected) return uid === expected;
  const actualHash = crypto.createHash("sha256").update(String(uid || "")).digest("hex");
  return crypto.timingSafeEqual(
    Buffer.from(actualHash, "hex"),
    Buffer.from(DEFAULT_OWNER_UID_SHA256, "hex")
  );
}

function validateSpeechRequest(body = {}) {
  const text = String(body.text || "").trim();
  const speaker = String(body.speaker || "A").trim().toUpperCase();
  const engine = String(body.engine || "lite").trim();
  if (!text || text.length > 320) throw Object.assign(new Error("Each spoken line must contain 1–320 characters."), { status: 400 });
  if (!["A", "B", "C"].includes(speaker)) throw Object.assign(new Error("Choose voice A, B or C."), { status: 400 });
  if (!Object.hasOwn(MODELS, engine)) throw Object.assign(new Error("Unsupported voice engine."), { status: 400 });
  if (/\[(?:PAUSE|SILENCE|REPEAT)/i.test(text)) throw Object.assign(new Error("Pause instructions must be separate from spoken lines."), { status: 400 });
  return { text, speaker, engine };
}

function validateScriptRequest(body = {}) {
  const level = String(body.level || "A1").toUpperCase();
  const type = String(body.type || "dialogue").toLowerCase();
  const topic = String(body.topic || "").trim();
  const part = String(body.part || "").trim();
  const profile = getExamProfile(level, part);
  if (level !== "A1" && !profile) throw Object.assign(new Error("Select a supported Hören Teil/Aufgabe for this level."), { status: 400 });
  if (profile && type !== profile.type) throw Object.assign(new Error("Recording type does not match this exam Teil."), { status: 400 });
  if (!ALLOWED_LEVELS.has(level) || !ALLOWED_TYPES.has(type)) throw Object.assign(new Error("Unsupported exam level or recording type."), { status: 400 });
  if (topic.length < 4 || topic.length > 240) throw Object.assign(new Error("Enter a topic (4–240 characters)."), { status: 400 });
  return { level, type, topic, part, profile };
}

function extractAudio(result = {}) {
  const blocks = (result.steps || []).filter((step) => step.type === "model_output").flatMap((step) => step.content || []);
  const audio = blocks.filter((block) => block.type === "audio").at(-1);
  if (!audio?.data || typeof audio.data !== "string") throw new Error("Google did not return audio.");
  const bytes = Buffer.from(audio.data, "base64");
  if (bytes.length < 44 || bytes.length > 2_600_000 ||
      bytes.toString("ascii", 0, 4) !== "RIFF" || bytes.toString("ascii", 8, 12) !== "WAVE") {
    throw new Error("Google returned unsupported or oversized WAV audio.");
  }
  return { mimeType: "audio/wav", audioBase64: bytes.toString("base64"), size: bytes.length };
}

function extractScript(result = {}) {
  const text = (result.candidates?.[0]?.content?.parts || [])
    .map((part) => part.text || "").join("\n").trim()
    .replace(/^\`\`\`(?:text)?\s*|\`\`\`$/g, "").trim();
  if (!text || text.length > 6000) throw new Error("Google returned an empty or overly long script.");
  return text;
}

async function postGemini(url, key, payload, timeoutMs = 38_000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "x-goog-api-key": key, "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    if (!response.ok) {
      if (response.status === 429) throw Object.assign(new Error("Google's free API quota is exhausted. Try again later."), { status: 429 });
      if (response.status === 402 || response.status === 403) throw Object.assign(new Error("The Gemini API key or billing access needs attention."), { status: 503 });
      throw Object.assign(new Error("Google audio service is temporarily unavailable."), { status: 502 });
    }
    return await response.json();
  } finally {
    clearTimeout(timeout);
  }
}

function usageRef(db, uid, date = new Date()) {
  const day = date.toISOString().slice(0, 10);
  return db.collection("hoerenStudioDailyUsage").doc(`${day}_${uid}`);
}

async function readUsage(db, uid) {
  const snapshot = await usageRef(db, uid).get();
  const data = snapshot.data() || {};
  return { script: Number(data.script || 0), speech: Number(data.speech || 0) };
}

// Reserve before sending to Google; a failed API call may still incur a bill.
// Firestore transactions ensure overlapping requests cannot bypass daily caps.
async function reserveUsage(db, uid, kind) {
  const ref = usageRef(db, uid);
  return db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(ref);
    const used = Number(snapshot.data()?.[kind] || 0);
    if (used >= LIMITS[kind]) throw Object.assign(new Error(`Daily ${kind} limit reached. Try again tomorrow.`), { status: 429 });
    transaction.set(ref, { [kind]: used + 1, updatedAt: new Date().toISOString() }, { merge: true });
    return LIMITS[kind] - used - 1;
  });
}

function registerHoerenStudioRoutes({ app, db, requireAuth, geminiKey, runtimeConfig }) {
  async function guard(req, res, next) {
    try {
      const user = await requireAuth(req);
      if (!isStudioOwner(user.uid, runtimeConfig)) return res.status(403).json({ ok: false, error: "This is a private owner-only studio." });
      req.hoerenOwnerUid = user.uid;
      next();
    } catch {
      return res.status(401).json({ ok: false, error: "Please sign in with your Falowen owner account." });
    }
  }

  async function handleError(res, error) {
    const status = Number(error?.status) || 502;
    console.warn("hoeren_studio_error", { status, message: error?.message || "unknown" });
    return res.status(status).json({ ok: false, error: error?.message || "Audio generation failed." });
  }

  app.get("/ai-studio/status", guard, async (req, res) => {
    try {
      const usage = await readUsage(db, req.hoerenOwnerUid);
      return res.json({
        ok: true, ready: Boolean(String(geminiKey.value() || "").trim()),
        remaining: { script: Math.max(0, LIMITS.script - usage.script), speech: Math.max(0, LIMITS.speech - usage.speech) },
        limits: LIMITS, models: MODELS, profiles: EXAM_PROFILES,
      });
    } catch (error) { return handleError(res, error); }
  });

  app.post("/ai-studio/script", guard, async (req, res) => {
    try {
      const { level, type, topic, profile } = validateScriptRequest(req.body);
      const key = String(geminiKey.value() || "").trim();
      if (!key) return res.status(503).json({ ok: false, error: "Gemini API key is not configured." });
      const remaining = await reserveUsage(db, req.hoerenOwnerUid, "script");
      const result = await postGemini(
        `https://generativelanguage.googleapis.com/v1beta/models/${SCRIPT_MODEL}:generateContent`,
        key,
        { contents: [{ role: "user", parts: [{ text:
          profile ? buildExamPrompt(profile, topic, questionInstructions(profile.kind, profile.questionCount)) :
          (`Create an original German listening dialogue. Level ${level}. Type ${type}. Topic ${topic}.\n` +
          "Use realistic grammatically correct German, 8–12 alternating A:/B: turns (or A: only for announcements), around 80–130 spoken words. No stage directions or official Goethe affiliation. " +
          questionInstructions("richtig-falsch"))
        }] }], generationConfig: { temperature: 0.4, responseMimeType: "application/json", maxOutputTokens: profile ? 6000 : 1750 } },
      );
      const draft = extractLessonDraft(result, profile?.questionCount || 5);
      if (profile && draft.kind !== profile.kind) throw new Error("Google returned the wrong answer format.");
      return res.json({ ok: true, ...draft, remaining });
    } catch (error) { return handleError(res, error); }
  });

  // Optional separate generation; spends one of the same five daily script requests.
  app.post("/ai-studio/questions", guard, async (req, res) => {
    try {
      const script = String(req.body?.script || "").trim();
      const kind = String(req.body?.kind || "richtig-falsch");
      if (script.length < 35 || script.length > 7500 || !["richtig-falsch", "multiple-choice"].includes(kind)) {
        return res.status(400).json({ ok: false, error: "Enter a complete script and a supported question type." });
      }
      const profile = getExamProfile(req.body?.level, req.body?.part);
      if (req.body?.level && req.body.level !== "A1" && !profile) return res.status(400).json({ ok: false, error: "Choose a valid exam level and Teil." });
      if (profile && kind !== profile.kind) return res.status(400).json({ ok: false, error: "Question type must match the selected Teil." });
      const key = String(geminiKey.value() || "").trim();
      if (!key) return res.status(503).json({ ok: false, error: "Gemini API key is not configured." });
      const remaining = await reserveUsage(db, req.hoerenOwnerUid, "script");
      const result = await postGemini(
        `https://generativelanguage.googleapis.com/v1beta/models/${SCRIPT_MODEL}:generateContent`, key,
        { contents: [{ role: "user", parts: [{ text:
          `Create ${profile?.questionCount || 5} accurate listening questions from this exact German transcript. Preserve the transcript completely. ` +
          questionInstructions(kind, profile?.questionCount || 5) + (profile ? "\nSelected format: " + profile.structure : "") + "\nTranscript:\n" + script
        }] }], generationConfig: { temperature: 0.2, responseMimeType: "application/json", maxOutputTokens: profile ? 5500 : 1700 } },
      );
      const draft = extractLessonDraft(result, profile?.questionCount || 5);
      if (draft.script !== script || draft.kind !== kind) throw Object.assign(
        new Error("Google modified the supplied script or question type. Please retry."), { status: 502 });
      return res.json({ ok: true, questions: draft.questions, kind, remaining });
    } catch (error) { return handleError(res, error); }
  });

  app.post("/ai-studio/speech", guard, async (req, res) => {
    try {
      const { text, speaker, engine } = validateSpeechRequest(req.body);
      const key = String(geminiKey.value() || "").trim();
      if (!key) return res.status(503).json({ ok: false, error: "Gemini API key is not configured." });
      const remaining = await reserveUsage(db, req.hoerenOwnerUid, "speech");
      const result = await postGemini(
        "https://generativelanguage.googleapis.com/v1beta/interactions",
        key,
        {
          model: MODELS[engine],
          input: [{
            type: "user_input",
            content: [{
              type: "text", text,
              annotations: [{ type: "speech_metadata", style: "Clear, natural standard German pronunciation, realistic Goethe-style exam practice, neutral speaking pace." }],
            }],
          }],
          response_format: { type: "audio", mime_type: "audio/wav" },
          generation_config: { speech_config: [{ voice: speaker === "A" ? "Kore" : speaker === "B" ? "Puck" : "Charon" }] },
        },
        45_000,
      );
      res.set("Cache-Control", "no-store");
      return res.json({ ok: true, ...extractAudio(result), remaining });
    } catch (error) { return handleError(res, error); }
  });
}

module.exports = {
  MODELS, LIMITS, ownerUid, isStudioOwner, validateSpeechRequest, validateScriptRequest,
  extractAudio, extractScript, registerHoerenStudioRoutes,
};
