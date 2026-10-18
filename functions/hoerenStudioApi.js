"use strict";

// Admin-only, budget-capped Gemini audio tools. No audio or transcripts are stored
// in Firestore; only daily request counters are persisted.
const MODELS = Object.freeze({
  lite: "gemini-3.8-flash-lite-tts",
  flash: "gemini-3.8-flash-tts",
});
const SCRIPT_MODEL = "gemini-3.5-flash-lite";
const LIMITS = Object.freeze({ script: 5, speech: 36 });
const ALLOWED_LEVELS = new Set(["A1", "A2", "B1", "B2"]);
const ALLOWED_TYPES = new Set(["dialogue", "announcement", "telephone"]);

function ownerUid(runtimeConfig = {}, env = process.env) {
  return String(env.HOEREN_STUDIO_OWNER_UID || runtimeConfig.ai_studio?.owner_uid || "").trim();
}

function validateSpeechRequest(body = {}) {
  const text = String(body.text || "").trim();
  const speaker = String(body.speaker || "A").trim().toUpperCase();
  const engine = String(body.engine || "lite").trim();
  if (!text || text.length > 320) throw Object.assign(new Error("Each spoken line must contain 1–320 characters."), { status: 400 });
  if (!["A", "B"].includes(speaker)) throw Object.assign(new Error("Choose voice A or B."), { status: 400 });
  if (!Object.hasOwn(MODELS, engine)) throw Object.assign(new Error("Unsupported voice engine."), { status: 400 });
  if (/\[(?:PAUSE|SILENCE|REPEAT)/i.test(text)) throw Object.assign(new Error("Pause instructions must be separate from spoken lines."), { status: 400 });
  return { text, speaker, engine };
}

function validateScriptRequest(body = {}) {
  const level = String(body.level || "A1").toUpperCase();
  const type = String(body.type || "dialogue").toLowerCase();
  const topic = String(body.topic || "").trim();
  if (!ALLOWED_LEVELS.has(level) || !ALLOWED_TYPES.has(type)) throw Object.assign(new Error("Unsupported exam level or recording type."), { status: 400 });
  if (topic.length < 4 || topic.length > 240) throw Object.assign(new Error("Enter a topic (4–240 characters)."), { status: 400 });
  return { level, type, topic };
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
      const targetUid = ownerUid(runtimeConfig);
      if (!targetUid) return res.status(503).json({ ok: false, error: "Hören Studio owner UID is not configured." });
      if (user.uid !== targetUid) return res.status(403).json({ ok: false, error: "This is a private owner-only studio." });
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
        limits: LIMITS, models: MODELS,
      });
    } catch (error) { return handleError(res, error); }
  });

  app.post("/ai-studio/script", guard, async (req, res) => {
    try {
      const { level, type, topic } = validateScriptRequest(req.body);
      const key = String(geminiKey.value() || "").trim();
      if (!key) return res.status(503).json({ ok: false, error: "Gemini API key is not configured." });
      const remaining = await reserveUsage(db, req.hoerenOwnerUid, "script");
      const result = await postGemini(
        `https://generativelanguage.googleapis.com/v1beta/models/${SCRIPT_MODEL}:generateContent`,
        key,
        { contents: [{ role: "user", parts: [{ text:
          `Create an ORIGINAL Goethe-style German listening practice transcript, not an official Goethe recording. Level: ${level}. Type: ${type}. Topic: ${topic}.\n` +
          "Write only the transcript in natural, grammatically correct standard German. Use short realistic sentences and varied everyday details. " +
          "Use EXACTLY one spoken turn per line prefixed 'A: ' or 'B: '. For an announcement or telephone message use only A. " +
          "For dialogue use A and B and 8–12 turns; for other types use 3–5 lines. Do not include questions/answers, sound effects, Markdown or stage directions. " +
          "Do not invent an affiliation with Goethe-Institut. Aim for about 80–130 spoken words."
        }] }],
          generationConfig: { temperature: 0.6, maxOutputTokens: 550 } },
      );
      return res.json({ ok: true, script: extractScript(result), remaining });
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
          generation_config: { speech_config: [{ voice: speaker === "A" ? "Kore" : "Puck" }] },
        },
        45_000,
      );
      res.set("Cache-Control", "no-store");
      return res.json({ ok: true, ...extractAudio(result), remaining });
    } catch (error) { return handleError(res, error); }
  });
}

module.exports = {
  MODELS, LIMITS, ownerUid, validateSpeechRequest, validateScriptRequest,
  extractAudio, extractScript, registerHoerenStudioRoutes,
};
