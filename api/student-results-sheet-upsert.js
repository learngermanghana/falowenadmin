import { Buffer } from "node:buffer";

const STAFF_ACCOUNT_EMAIL = "staff@falowen.app";

function envValue(...names) {
  for (const name of names) {
    const value = String(process.env[name] || "").trim();
    if (value) return value;
  }
  return "";
}

async function readJsonBody(req) {
  if (req.body !== undefined) {
    if (typeof req.body === "string") return req.body ? JSON.parse(req.body) : {};
    return req.body || {};
  }

  const chunks = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  const raw = Buffer.concat(chunks).toString("utf8");
  return raw ? JSON.parse(raw) : {};
}

function bearerToken(req) {
  const header = String(req.headers.authorization || "").trim();
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() || "";
}

async function verifyFirebaseUser(idToken) {
  const apiKey = envValue("FIREBASE_API_KEY", "VITE_FIREBASE_API_KEY");
  if (!apiKey) throw Object.assign(new Error("Firebase API key is not configured on the server."), { statusCode: 503 });
  if (!idToken) throw Object.assign(new Error("Authentication is required."), { statusCode: 401 });

  const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(apiKey)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken }),
  });
  const body = await response.json().catch(() => ({}));
  const account = Array.isArray(body.users) ? body.users[0] : null;

  if (!response.ok || !account?.localId) {
    throw Object.assign(new Error("Your Falowen session is invalid or expired."), { statusCode: 401 });
  }

  const email = String(account.email || "").trim().toLowerCase();
  if (!email) throw Object.assign(new Error("The signed-in account has no verified email identity."), { statusCode: 403 });
  if (email === STAFF_ACCOUNT_EMAIL) {
    throw Object.assign(new Error("Staff accounts cannot update Student Results."), { statusCode: 403 });
  }

  return { uid: account.localId, email };
}

function validateRows(rows) {
  if (!Array.isArray(rows) || !rows.length) {
    throw Object.assign(new Error("No score rows were supplied."), { statusCode: 400 });
  }
  if (rows.length > 100) {
    throw Object.assign(new Error("A maximum of 100 results can be updated at once."), { statusCode: 400 });
  }

  return rows.map((row) => {
    if (!row || typeof row !== "object" || Array.isArray(row)) {
      throw Object.assign(new Error("Every score row must be an object."), { statusCode: 400 });
    }
    const studentCode = String(row.studentcode || row.studentCode || "").trim();
    const assignmentId = String(row.assignment_id || row.assignmentId || "").trim();
    const dedupeId = String(row.dedupe_id || row.dedupeId || "").trim();
    if (!studentCode || !assignmentId || !dedupeId) {
      throw Object.assign(new Error("Every score row needs a student code, assignment ID and dedupe ID."), { statusCode: 400 });
    }
    return row;
  });
}

function verifiedUpsertReceipt(body = {}) {
  return body?.ok === true && (
    body.action === "upsertScoreRows"
    || body.mode === "upsert"
    || body.upsert === true
  );
}

export default async function studentResultsSheetUpsertHandler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "Method Not Allowed" });
  }

  try {
    const user = await verifyFirebaseUser(bearerToken(req));
    const requestBody = await readJsonBody(req);
    const rows = validateRows(requestBody.rows);

    const webhookUrl = envValue("SCORES_WEBHOOK_URL", "VITE_SCORES_WEBHOOK_URL");
    const token = envValue("SCORES_WEBHOOK_TOKEN", "VITE_SCORES_WEBHOOK_TOKEN");
    const sheetName = envValue("SCORES_WEBHOOK_SHEET_NAME", "VITE_SCORES_WEBHOOK_SHEET_NAME");
    const sheetGid = envValue("SCORES_WEBHOOK_SHEET_GID", "VITE_SCORES_WEBHOOK_SHEET_GID");
    if (!webhookUrl) throw Object.assign(new Error("The score-sheet webhook is not configured on the server."), { statusCode: 503 });

    const upstreamPayload = {
      ...(token ? { token } : {}),
      ...(sheetName ? { sheet_name: sheetName } : {}),
      ...(sheetGid ? { sheet_gid: sheetGid } : {}),
      action: "upsertScoreRows",
      mode: "upsert",
      dedupe_columns: ["studentcode", "assignment_id"],
      remove_duplicate_rows: true,
      create_missing_columns: true,
      requested_by: user.email,
      rows,
    };

    const upstream = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=UTF-8" },
      body: JSON.stringify(upstreamPayload),
      redirect: "follow",
    });
    const upstreamText = await upstream.text();
    const upstreamBody = JSON.parse(upstreamText || "{}");

    if (!upstream.ok || upstreamBody?.ok === false) {
      return res.status(502).json({
        ok: false,
        error: upstreamBody?.error || `The score-sheet webhook failed (${upstream.status}).`,
      });
    }
    if (!verifiedUpsertReceipt(upstreamBody)) {
      return res.status(409).json({
        ok: false,
        error: "The deployed score-sheet webhook is still append-only. Upgrade and redeploy its Apps Script before updating results.",
      });
    }

    return res.status(200).json({
      ...upstreamBody,
      ok: true,
      verified: true,
    });
  } catch (error) {
    const statusCode = Number(error?.statusCode) || 500;
    console.error("student_result_sheet_upsert_failed", {
      statusCode,
      message: error?.message || String(error),
    });
    return res.status(statusCode).json({
      ok: false,
      error: error?.message || "Could not update the score sheet.",
    });
  }
}

export { bearerToken, validateRows, verifiedUpsertReceipt, verifyFirebaseUser };
