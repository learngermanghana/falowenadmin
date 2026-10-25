"use strict";

// Admin-only, budget-capped Gemini audio tools. No audio or transcripts are stored
// in Firestore; only daily request counters are persisted.
const MODELS = Object.freeze({
  lite: "gemini-3.8-flash-lite-tts",
  flash: "gemini-3.8-flash-tts",
});
const SCRIPT_MODEL = "gemini-3.5-flash-lite";
const LIMITS = Object.freeze({ script: 20, speech: 72 });
const ALLOWED_LEVELS = new Set(["A1", "A2", "B1", "B2", "C1", "C2"]);
const ALLOWED_TYPES = new Set(["dialogue", "announcement", "telephone", "podcast", "radio", "interview", "discussion", "lecture"]);
const crypto = require("node:crypto");
const { extractLessonDraft, questionInstructions, validateQuestionSet } = require("./hoerenQuestions");
const { EXAM_PROFILES, getExamProfile, buildExamPrompt } = require("./hoerenExamProfiles");
const { validateCourseLessonContext, courseLessonPrompt } = require("./hoerenCurriculumContext");
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
  if (!["A", "B", "C", "D"].includes(speaker)) throw Object.assign(new Error("Choose voice A, B, C or D."), { status: 400 });
  if (!Object.hasOwn(MODELS, engine)) throw Object.assign(new Error("Unsupported voice engine."), { status: 400 });
  if (/\[(?:PAUSE|SILENCE|REPEAT)/i.test(text)) throw Object.assign(new Error("Pause instructions must be separate from spoken lines."), { status: 400 });
  return { text, speaker, engine };
}

// Scenes use one Google request for up to two voices instead of one request per turn.
function validateSceneRequest(body = {}) {
  const engine = String(body.engine || "lite").trim();
  if (!Object.hasOwn(MODELS, engine)) throw Object.assign(new Error("Unsupported voice engine."), { status: 400 });
  const turns = Array.isArray(body.turns) ? body.turns : [{ text: body.text, speaker: body.speaker }];
  if (!turns.length || turns.length > 8) throw Object.assign(new Error("Each scene needs 1–8 speaking turns."), { status: 400 });
  const cleaned = turns.map(turn => {
    const checked = validateSpeechRequest({ text: turn?.text, speaker: turn?.speaker, engine });
    return { text: checked.text, speaker: checked.speaker };
  });
  if (new Set(cleaned.map(turn => turn.speaker)).size > 2) throw Object.assign(new Error("Google allows at most two voices per scene."), { status: 400 });
  if (cleaned.reduce((total, turn) => total + turn.text.length, 0) > 520) {
    throw Object.assign(new Error("Each scene must contain at most 520 spoken characters. Split into smaller scenes."), { status: 400 });
  }
  return { turns: cleaned, engine };
}

// Interactions accepts a list of SpeechConfig entries. Do not send the
// generateContent-style/conversational mode wrapper: it is not in this schema.
function buildSpeechPayload({ turns, engine }) {
  const voices = { A: "Kore", B: "Puck", C: "Charon", D: "Zephyr" };
  const speakers = [...new Set(turns.map(turn => turn.speaker))];
  return {
    model: MODELS[engine],
    store: false,
    input: [{ type: "user_input", content: turns.map(turn => ({
      type: "text", text: turn.text,
      annotations: [{ type: "speech_metadata", ...(speakers.length === 2 ? { speaker: turn.speaker } : {}),
        style: turn.speaker === "A"
          ? "Professional German exam narrator: crisp, deliberate, instructional delivery with calm neutral emphasis."
          : "Natural conversational standard German for an independent task speaker; clear but lifelike intonation, distinct from the exam narrator." }],
    })) }],
    response_format: { type: "audio", mime_type: "audio/wav" },
    generation_config: {
      speech_config: speakers.map(speaker => ({ ...(speakers.length === 2 ? { speaker } : {}), voice: voices[speaker], language: "de-DE" })),
    },
  };
}

function validateScriptRequest(body = {}) {
  const level = String(body.level || "A1").toUpperCase();
  const type = String(body.type || "dialogue").toLowerCase();
  const topic = String(body.topic || "").trim();
  const part = String(body.part || "").trim();
  const mode = String(body.mode || (part ? "goethe" : "course")).toLowerCase();
  const kind = String(body.kind || "richtig-falsch");
  if (!["course", "goethe"].includes(mode)) throw Object.assign(new Error("Select Course Book or Goethe exam mode."), { status: 400 });
  if (!ALLOWED_LEVELS.has(level) || !ALLOWED_TYPES.has(type)) throw Object.assign(new Error("Unsupported exam level or recording type."), { status: 400 });
  if (topic.length < 4 || topic.length > 240) throw Object.assign(new Error("Enter a topic (4–240 characters)."), { status: 400 });
  if (!["richtig-falsch", "multiple-choice"].includes(kind)) throw Object.assign(new Error("Unsupported question format."), { status: 400 });
  const profile = mode === "goethe" ? getExamProfile(level, part) : null;
  if (mode === "goethe" && !profile) throw Object.assign(new Error("Select a supported Hören Teil/Aufgabe for this level."), { status: 400 });
  if (profile && type !== profile.type) throw Object.assign(new Error("Recording type does not match this exam Teil."), { status: 400 });
  const lessonContext = mode === "course" ? validateCourseLessonContext(body.lessonContext, level) : null;
  return { level, type, topic, part, profile, mode, kind: profile?.kind || kind, lessonContext };
}

function extractAudio(result = {}) {
  const blocks = (result.steps || []).filter((step) => step.type === "model_output").flatMap((step) => step.content || []);
  const audio = blocks.filter((block) => block.type === "audio").at(-1);
  if (!audio?.data || typeof audio.data !== "string") throw new Error("Google did not return audio.");
  const bytes = Buffer.from(audio.data, "base64");
  if (bytes.length < 44 || bytes.length > 4_000_000 ||
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

// Do not echo provider messages verbatim: they can contain request text or credentials.
// Recognize only safe field names and common validation categories.
function describeGoogleRejection(body) {
  const raw = String(body?.error?.message || "").slice(0, 4000);
  const code = String(body?.error?.status || "").replace(/[^A-Z_]/g, "").slice(0, 40);
  const field = ["generation_config","speech_config","response_format","speech_metadata","mime_type","annotations","speaker","voice","model","input","store"].find(name => new RegExp("\\b" + name + "\\b", "i").test(raw)) || "";
  const category = /not found|not supported|unknown model|not available/i.test(raw) ? "model_unavailable"
    : /invalid|unsupported|unknown field|unrecognized|unexpected|malformed|missing|required|schema/i.test(raw) ? "invalid_argument"
    : /voice|speaker|speech_config|speech_metadata/i.test(raw) ? "voice_configuration"
    : /quota|rate limit/i.test(raw) ? "quota"
    : "provider_rejected";
  const explanation = {
    model_unavailable: "Google does not recognize or support the selected speech model.",
    invalid_argument: "Google rejected a request parameter or format.",
    voice_configuration: "Google rejected the speaker or voice configuration.",
    quota: "Google rejected the request because of a quota or rate limit.",
    provider_rejected: "Google rejected the speech request; inspect the safe server diagnostic."
  }[category];
  return { category, code, field, explanation };
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
      // Keep the provider's status (not its raw body, which can contain details
      // inappropriate for the teacher UI) so 502/503/429 have distinct remedies.
      let diagnostic = describeGoogleRejection({});
      try {
        diagnostic = describeGoogleRejection(await response.json());
      } catch { /* Non-JSON provider response: never log raw content. */ }
      console.warn("hoeren_studio_google_upstream", {
        httpStatus: response.status, providerCode: diagnostic.code,
        category: diagnostic.category, field: diagnostic.field,
        endpoint: url.endsWith("/interactions") ? "speech" : "content",
        // Never log prompts, text, audio, full provider messages or credentials.
      });
      if (response.status === 429) throw Object.assign(new Error("Google rate limit (429) for this project/model. Falowen's quota is separate from Google's limits. Completed voice scenes remain saved in this browser; check the Google AI Studio rate limits before resuming."), { status: 429 });
      if ([401,402,403].includes(response.status)) throw Object.assign(new Error("Gemini credentials or billing are not authorized for this request. Check the key and its model access."), { status: 503 });
      if ([400,404].includes(response.status)) throw Object.assign(new Error(`Google rejected the AI Studio request (upstream ${response.status}): ${diagnostic.explanation}${diagnostic.field ? " Field: " + diagnostic.field + "." : ""} No generation was saved. Avoid repeated retries until the request configuration is corrected.`), { status: 502, providerCategory: diagnostic.category });
      if ([500,502,503,504].includes(response.status)) throw Object.assign(new Error(`Google Gemini is temporarily unavailable (upstream ${response.status}). Your successful parts and cached scenes are safe; resume this Teil later.`), { status: 503 });
      throw Object.assign(new Error(`Google service error (upstream ${response.status}). Your saved parts remain unchanged.`), { status: 502 });
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

// Reserve atomically before calling Google. Release an unsuccessful reservation
// exactly once, even when cleanup is retried after a transient Firestore failure.
// Google may still bill for a failed/timeout response; our owner-only limits
// count only completed, usable Studio outputs.
async function reserveUsage(db, uid, kind) {
  const ref = usageRef(db, uid);
  const reservation = ref.collection("attempts").doc();
  const remaining = await db.runTransaction(async transaction => {
    const snapshot = await transaction.get(ref);
    const used = Number(snapshot.data()?.[kind] || 0);
    if (used >= LIMITS[kind]) throw Object.assign(new Error(`Daily ${kind} limit reached. Try again tomorrow.`), { status: 429 });
    transaction.set(ref, { [kind]: used + 1, updatedAt: new Date().toISOString() }, { merge: true });
    transaction.create(reservation, { kind, status: "reserved", createdAt: new Date().toISOString() });
    return LIMITS[kind] - used - 1;
  });
  return { remaining, reservation, usage: ref, kind };
}
async function settleUsage(db, slot, succeeded) {
  if (!slot) return;
  await db.runTransaction(async transaction => {
    const marker = await transaction.get(slot.reservation);
    if (!marker.exists || marker.data()?.status !== "reserved") return;
    if (!succeeded) {
      const usage = await transaction.get(slot.usage);
      const used = Number(usage.data()?.[slot.kind] || 0);
      transaction.set(slot.usage, { [slot.kind]: Math.max(0, used - 1), updatedAt: new Date().toISOString() }, { merge: true });
    }
    transaction.update(slot.reservation, { status: succeeded ? "succeeded" : "refunded", settledAt: new Date().toISOString() });
  });
}
async function refundFailedRequest(db, slot) {
  if (!slot) return;
  try { await settleUsage(db, slot, false); }
  catch (refundError) {
    console.error("hoeren_studio_quota_refund_failed", { kind: slot.kind, reservationId: slot.reservation.id, message: refundError?.message });
  }
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
    const status = Number(error?.status) || (error?.name === "AbortError" ? 504 : 502);
    console.warn("hoeren_studio_error", { status, message: error?.message || "unknown" });
    return res.status(status).json({ ok: false, error: error?.name === "AbortError" ? "Gemini took too long to respond. Keep your existing draft and retry later." : (error?.message || "Audio generation failed.") });
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
    let slot;
    try {
      const { level, type, topic, profile, kind, lessonContext } = validateScriptRequest(req.body);
      const key = String(geminiKey.value() || "").trim();
      if (!key) return res.status(503).json({ ok: false, error: "Gemini API key is not configured." });
      slot = await reserveUsage(db, req.hoerenOwnerUid, "script");
      const remaining = slot.remaining;
      const result = await postGemini(
        `https://generativelanguage.googleapis.com/v1beta/models/${SCRIPT_MODEL}:generateContent`,
        key,
        { contents: [{ role: "user", parts: [{ text:
          profile ? buildExamPrompt(profile, topic, questionInstructions(profile.kind, profile.questionCount)) :
          courseLessonPrompt({ level, type, topic, kind, lessonContext })
        }] }], generationConfig: { temperature: 0.4, responseMimeType: "application/json", maxOutputTokens: profile ? 6000 : 1750 } },
      );
      const draft = extractLessonDraft(result, profile?.questionCount || 5);
      if (draft.kind !== kind) throw new Error("Google returned the wrong answer format.");
      await settleUsage(db, slot, true);
      return res.json({ ok: true, ...draft, remaining });
    } catch (error) { await refundFailedRequest(db, slot); return handleError(res, error); }
  });

  // Optional separate generation; spends one of the same five daily script requests.
  app.post("/ai-studio/questions", guard, async (req, res) => {
    let slot;
    try {
      const script = String(req.body?.script || "").trim();
      const kind = String(req.body?.kind || "richtig-falsch");
      if (script.length < 35 || script.length > 7500 || !["richtig-falsch", "multiple-choice"].includes(kind)) {
        return res.status(400).json({ ok: false, error: "Enter a complete script and a supported question type." });
      }
      const mode = String(req.body?.mode || (req.body?.part ? "goethe" : "course")).toLowerCase();
      if (!["goethe", "course"].includes(mode)) return res.status(400).json({ ok: false, error: "Choose a valid production mode." });
      const profile = mode === "goethe" ? getExamProfile(req.body?.level, req.body?.part) : null;
      const lessonContext = mode === "course" ? validateCourseLessonContext(req.body?.lessonContext, String(req.body?.level || "A1").toUpperCase()) : null;
      if (mode === "goethe" && !profile) return res.status(400).json({ ok: false, error: "Choose a valid exam level and Teil." });
      if (profile && kind !== profile.kind) return res.status(400).json({ ok: false, error: "Question type must match the selected Teil." });
      const key = String(geminiKey.value() || "").trim();
      if (!key) return res.status(503).json({ ok: false, error: "Gemini API key is not configured." });
      slot = await reserveUsage(db, req.hoerenOwnerUid, "script");
      const remaining = slot.remaining;
      const result = await postGemini(
        `https://generativelanguage.googleapis.com/v1beta/models/${SCRIPT_MODEL}:generateContent`, key,
        { contents: [{ role: "user", parts: [{ text:
          `Create ${profile?.questionCount || 5} accurate listening questions from this exact German transcript. The teacher transcript is immutable: NEVER rewrite, normalize, or include a revised transcript. Return questions for the original words. ` +
          questionInstructions(kind, profile?.questionCount || 5) + (profile ? "\nSelected format: " + profile.structure : "") +
          (lessonContext ? "\nCourse lesson: " + lessonContext.assignmentKey + ", chapter " + lessonContext.chapter + ", German title: " + lessonContext.title + ". Keep questions aligned to this lesson. " : "") + "\nTranscript:\n" + script
        }] }], generationConfig: { temperature: 0.2, responseMimeType: "application/json", maxOutputTokens: profile ? 5500 : 1700 } },
      );
      // The teacher's transcript is authoritative. Gemini often reprints it with
      // harmless formatting differences; do not reject valid questions for that.
      const raw = (result.candidates?.[0]?.content?.parts || []).map(part => part.text || "").join("").trim()
        .replace(/^```(?:json)?\s*|\s*```$/g, "").trim();
      let generated;
      try { generated = JSON.parse(raw); }
      catch { throw Object.assign(new Error("Gemini returned incomplete question data. No changes were saved; please retry later."), { status: 502 }); }
      if (generated.kind && generated.kind !== kind) throw Object.assign(new Error("Gemini returned the wrong question type. Please retry."), { status: 502 });
      // Evidence must match the original script, never a rewritten version.
      const questions = validateQuestionSet({ script, kind, questions: generated.questions, expectedCount: profile?.questionCount || 5 });
      await settleUsage(db, slot, true);
      return res.json({ ok: true, questions, kind, remaining });
    } catch (error) { await refundFailedRequest(db, slot); return handleError(res, error); }
  });

  app.post("/ai-studio/speech", guard, async (req, res) => {
    let slot;
    try {
      const { turns, engine } = validateSceneRequest(req.body);
      const key = String(geminiKey.value() || "").trim();
      if (!key) return res.status(503).json({ ok: false, error: "Gemini API key is not configured." });
      slot = await reserveUsage(db, req.hoerenOwnerUid, "speech");
      const remaining = slot.remaining;
      const result = await postGemini(
        "https://generativelanguage.googleapis.com/v1beta/interactions",
        key,
        buildSpeechPayload({ turns, engine }),
        60_000,
      );
      res.set("Cache-Control", "no-store");
      const audio = extractAudio(result);
      await settleUsage(db, slot, true);
      return res.json({ ok: true, ...audio, remaining });
    } catch (error) { await refundFailedRequest(db, slot); return handleError(res, error); }
  });
}

module.exports = {
  MODELS, LIMITS, ownerUid, isStudioOwner, validateSpeechRequest, validateSceneRequest, validateScriptRequest,
  extractAudio, extractScript, describeGoogleRejection, buildSpeechPayload, registerHoerenStudioRoutes, reserveUsage, settleUsage,
};
