const FALOWEN_FUNCTION_BASE_URL =
  process.env.FALOWEN_FUNCTION_BASE_URL ||
  "https://us-central1-falowen-examiner-trainer.cloudfunctions.net/api";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Cache-Control", "no-store, max-age=0");

  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET, OPTIONS");
    return res.status(405).json({ ok: false, error: "Method Not Allowed" });
  }

  const classId = String(req.query?.classId || "").trim();
  if (!classId) return res.status(400).json({ ok: false, error: "classId is required" });

  try {
    const target = new URL(`${FALOWEN_FUNCTION_BASE_URL.replace(/\/+$/, "")}/public-live-class`);
    target.searchParams.set("classId", classId);
    const response = await fetch(target.toString(), {
      method: "GET",
      headers: { accept: "application/json" },
      cache: "no-store",
    });
    const body = await response.text();
    res.status(response.status);
    res.setHeader("content-type", response.headers.get("content-type") || "application/json; charset=utf-8");
    return res.send(body);
  } catch (error) {
    console.error("Public live-class proxy failed", error);
    return res.status(502).json({ ok: false, error: "Public live-class proxy failed" });
  }
}
