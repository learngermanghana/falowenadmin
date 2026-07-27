import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const functionsPath = path.join(root, "functions/index.js");
let content = fs.readFileSync(functionsPath, "utf8");

const marker = 'app.post("/payments/paystack-webhook", async (req, res) => {';
const route = `app.get("/payments/student/:studentId", async (req, res) => {\n  try {\n    await requireAuth(req);\n    const studentId = String(req.params.studentId || "").trim();\n    if (!studentId) return res.status(400).json({ ok: false, error: "studentId is required" });\n\n    const snapshot = await db.collection("payments").where("studentId", "==", studentId).get();\n    const toIso = (value) => {\n      if (!value) return null;\n      if (typeof value.toDate === "function") return value.toDate().toISOString();\n      const parsed = new Date(value);\n      return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();\n    };\n    const payments = snapshot.docs\n      .map((docSnap) => {\n        const data = docSnap.data() || {};\n        return {\n          id: docSnap.id,\n          ...data,\n          createdAt: toIso(data.createdAt),\n          paidAt: toIso(data.paidAt),\n          updatedAt: toIso(data.updatedAt),\n        };\n      })\n      .sort((a, b) => new Date(b.paidAt || b.createdAt || 0).getTime() - new Date(a.paidAt || a.createdAt || 0).getTime())\n      .slice(0, 50);\n\n    return res.json({ ok: true, payments });\n  } catch (error) {\n    return res.status(error?.statusCode || 401).json({ ok: false, error: error?.message || "Could not load payment history" });\n  }\n});\n\n`;

if (!content.includes('app.get("/payments/student/:studentId"')) {
  if (!content.includes(marker)) throw new Error("Student payment webhook marker not found. Run patchStudentPaymentLinks.mjs first.");
  content = content.replace(marker, `${route}${marker}`);
}

const webhookAnchor = `  const event = req.body || {};\n  if (String(event.event || "") !== "charge.success") return res.status(200).json({ ok: true, ignored: true });\n\n  try {`;
const webhookReplacement = `  const event = req.body || {};\n  if (String(event.event || "") !== "charge.success") return res.status(200).json({ ok: true, ignored: true });\n  const reference = String(event?.data?.reference || "").trim();\n  if (!reference.startsWith("FAL-")) return res.status(200).json({ ok: true, ignored: true, reason: "non_falowen_reference" });\n\n  try {`;

if (!content.includes('reason: "non_falowen_reference"')) {
  if (!content.includes(webhookAnchor)) throw new Error("Student payment webhook event anchor not found.");
  content = content.replace(webhookAnchor, webhookReplacement);
}

fs.writeFileSync(functionsPath, content, "utf8");
console.log("Student payment history API patch applied.");
