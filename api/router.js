/* global process */
import { Buffer } from "node:buffer";
import socialMetricsHandler from "./social-metrics.js";

async function ensureJsonBody(req) {
  if (req.body !== undefined) return req.body;

  if (req.method === "GET" || req.method === "HEAD") {
    req.body = undefined;
    return req.body;
  }

  const chunks = [];

  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  const rawBody = Buffer.concat(chunks).toString("utf8");
  if (!rawBody) {
    req.body = {};
    return req.body;
  }

  const contentType = String(req.headers["content-type"] || "").toLowerCase();
  if (contentType.includes("application/json")) {
    req.body = JSON.parse(rawBody);
    return req.body;
  }

  req.body = rawBody;
  return req.body;
}

const FALOWEN_FUNCTION_BASE_URL =
  process.env.FALOWEN_FUNCTION_BASE_URL ||
  "https://us-central1-falowen-examiner-trainer.cloudfunctions.net/api";

async function proxyToFalowenFunction(req, res, path, url) {
  try {
    const target = new URL(`${FALOWEN_FUNCTION_BASE_URL.replace(/\/+$/, "")}/${path}`);

    for (const [key, value] of url.searchParams.entries()) {
      if (key === "path" || key === "route") continue;
      target.searchParams.append(key, value);
    }

    const headers = {
      "content-type": req.headers["content-type"] || "application/json",
      accept: req.headers.accept || "application/json",
    };

    if (req.headers.authorization) {
      headers.authorization = req.headers.authorization;
    }

    await ensureJsonBody(req);

    const response = await fetch(target.toString(), {
      method: req.method,
      headers,
      body:
        req.method === "GET" || req.method === "HEAD"
          ? undefined
          : JSON.stringify(req.body || {}),
    });

    const text = await response.text();
    res.status(response.status);

    try {
      return res.json(JSON.parse(text));
    } catch {
      return res.send(text);
    }
  } catch (error) {
    console.error("Falowen function proxy failed:", error);
    return res.status(502).json({
      status: "error",
      message: "Falowen function proxy failed",
    });
  }
}

function normalizePath(value) {
  return String(value || "")
    .replace(/^\/+/, "")
    .replace(/^api\//, "")
    .replace(/^router\/?/, "");
}

function getRequestUrl(req) {
  const host = req.headers.host || "localhost";
  return new URL(req.url || "/", `https://${host}`);
}

function getRouterPath(req, url) {
  const queryPath = url.searchParams.get("path") || url.searchParams.get("route");
  if (queryPath) return normalizePath(queryPath);

  return normalizePath(url.pathname);
}

function methodAllowed(req, res, allowedMethods) {
  if (allowedMethods.includes(req.method)) return true;

  res.setHeader("Allow", allowedMethods.join(", "));
  res.status(405).json({ status: "error", message: "Method Not Allowed" });
  return false;
}

const FALOWEN_PROXY_ROUTES = new Set([
  "checkin",
  "checkin-token",
  "checkinStatus",
  "credits",
  "health",
  "member-invite",
  "messages",
  "migrateSessionIds",
  "openSession",
  "self-checkin-token",
  "transaction",
  "transactions",
  "verify-checkin",
]);

export default async function handler(req, res) {
  const url = getRequestUrl(req);
  const path = getRouterPath(req, url);
  const firstSegment = path.split("/")[0];

  if (!path || path === "health") {
    return res.status(200).json({ ok: true, status: "ok", service: "falowenadmin-api-router" });
  }

  if (path === "social-metrics") {
    return socialMetricsHandler(req, res);
  }

  if (FALOWEN_PROXY_ROUTES.has(path) || FALOWEN_PROXY_ROUTES.has(firstSegment)) {
    return proxyToFalowenFunction(req, res, path, url);
  }

  if (
    path.startsWith("holidays/") ||
    path.startsWith("orientation/") ||
    path.startsWith("class-schedule/") ||
    path.startsWith("marking/")
  ) {
    return proxyToFalowenFunction(req, res, path, url);
  }

  if (!methodAllowed(req, res, ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD"])) return undefined;

  return res.status(404).json({ status: "error", message: "API route not found" });
}

export { proxyToFalowenFunction };
