import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const indexPath = path.join(repoRoot, "functions", "index.js");

let source = fs.readFileSync(indexPath, "utf8");
const requireLine = 'const { DEFAULT_GOETHE_EXAM_CONFIG, normalizeGoetheExamConfig } = require("./goetheExamConfig.js");';
const requireAnchor = 'const { defineSecret } = require("firebase-functions/params");';

if (!source.includes(requireLine)) {
  if (!source.includes(requireAnchor)) throw new Error("Could not find Firebase params import for Goethe config patch.");
  source = source.replace(requireAnchor, `${requireAnchor}\n${requireLine}`);
}

const routeMarker = 'app.get("/exam-file/config"';
const routeAnchor = "function safeRegistryId(value) {";
const routeBlock = `const GOETHE_EXAM_CONFIG_REF = db.collection("publicConfig").doc("goetheExamFile");

function goetheConfigMetadata(data = {}) {
  const updatedAt = data.updatedAt && typeof data.updatedAt.toDate === "function"
    ? data.updatedAt.toDate().toISOString()
    : String(data.updatedAt || "");
  return {
    updatedAt,
    updatedBy: String(data.updatedBy || ""),
  };
}

async function loadPublishedGoetheExamConfig() {
  const snap = await GOETHE_EXAM_CONFIG_REF.get();
  if (!snap.exists) {
    return {
      config: normalizeGoetheExamConfig(DEFAULT_GOETHE_EXAM_CONFIG),
      source: "default",
      updatedAt: "",
      updatedBy: "",
    };
  }
  const data = snap.data() || {};
  return {
    config: normalizeGoetheExamConfig(data.config || data),
    source: "firestore",
    ...goetheConfigMetadata(data),
  };
}

app.get("/exam-file/config", async (_req, res) => {
  try {
    const published = await loadPublishedGoetheExamConfig();
    res.set("Cache-Control", "public, max-age=60, stale-while-revalidate=300");
    return res.json({ ok: true, ...published });
  } catch (error) {
    console.error("goethe_exam_config_load_failed", error);
    return res.status(500).json({ ok: false, error: error?.message || "Could not load Goethe exam configuration." });
  }
});

app.put("/exam-file/config", async (req, res) => {
  try {
    const user = await requireAuth(req);
    const current = await loadPublishedGoetheExamConfig();
    const normalized = normalizeGoetheExamConfig(req.body?.config || req.body || {});
    normalized.version = Math.max(Number(current.config.version || 1) + 1, Number(normalized.version || 1));
    const payload = {
      config: normalized,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedBy: String(user.email || user.uid || ""),
    };
    await GOETHE_EXAM_CONFIG_REF.set(payload, { merge: false });
    return res.json({
      ok: true,
      config: normalized,
      source: "firestore",
      updatedAt: new Date().toISOString(),
      updatedBy: payload.updatedBy,
    });
  } catch (error) {
    const unauthorized = /Authorization|Not allowed|token/i.test(String(error?.message || ""));
    return res.status(unauthorized ? 401 : 400).json({
      ok: false,
      error: error?.message || "Could not save Goethe exam configuration.",
    });
  }
});

`;

if (!source.includes(routeMarker)) {
  if (!source.includes(routeAnchor)) throw new Error("Could not find Goethe config route anchor.");
  source = source.replace(routeAnchor, `${routeBlock}${routeAnchor}`);
}

fs.writeFileSync(indexPath, source);

const patched = fs.readFileSync(indexPath, "utf8");
const checks = [
  [patched.includes(requireLine), "Goethe config module import is missing."],
  [patched.includes(routeMarker), "Public Goethe config route is missing."],
  [patched.includes('app.put("/exam-file/config"'), "Admin Goethe config save route is missing."],
  [patched.includes("normalizeGoetheExamConfig"), "Goethe config validation is missing."],
  [patched.includes("await requireAuth(req)"), "Goethe config save route is not protected."],
];
for (const [passed, message] of checks) {
  if (!passed) throw new Error(message);
}

console.log("Shared Goethe Exam File configuration routes verified.");
