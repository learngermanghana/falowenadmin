// Owner-controlled public Google reviews publisher. No token is ever sent to the browser.
// A publish action proposes a GitHub PR; the production JSON changes only after checks and merge.
import { createHash, createVerify, randomUUID } from "node:crypto";

const REPO = "learngermanghana/falowenexamtrainer";
const FILE = "web/public/reviews.json";
const OWNER = "moxflex@gmail.com";
const RATINGS = { 1: "ONE", 2: "TWO", 3: "THREE", 4: "FOUR", 5: "FIVE" };
let certificateCache = { expires: 0, certificates: {} };

function error(status, message) {
  return Object.assign(new Error(message), { status });
}

function clean(value, limit = 4000) {
  return String(value == null ? "" : value).trim().slice(0, limit);
}

export function isGoogleReviewLink(value) {
  try {
    const url = new URL(value);
    const hostname = url.hostname.toLowerCase();
    return url.protocol === "https:" && (
      (["google.com", "www.google.com"].includes(hostname) && url.pathname.startsWith("/maps/"))
      || (hostname === "maps.app.goo.gl" && url.pathname.length > 1)
    );
  } catch {
    return false;
  }
}

export function normalizeSubmission(raw = {}) {
  const studentName = clean(raw.studentName, 101);
  const review = clean(raw.review, 6001);
  const sourceUrl = clean(raw.sourceUrl, 2000);
  const status = clean(raw.status, 30);
  const rawRating = raw.rating;
  const rating = rawRating === "" || rawRating == null || Number(rawRating) === 0
    ? null : Number(rawRating);
  const date = clean(raw.date, 25);
  const publicId = clean(raw.publicId, 400);

  if (!studentName || studentName.length > 100) throw error(400, "Enter a reviewer name of up to 100 characters.");
  if (!review || review.length > 6000) throw error(400, "Enter the review text (up to 6000 characters).");
  if (clean(raw.source) !== "Google Review") throw error(400, "Only verified public Google reviews may be added to the website JSON.");
  if (!isGoogleReviewLink(sourceUrl)) throw error(400, "Enter the Google Maps link to the public review.");
  if (!["Approved", "Published"].includes(status)) throw error(400, "Approve the review before submitting it to GitHub.");
  if (rating !== null && (!Number.isInteger(rating) || !(rating in RATINGS))) {
    throw error(400, "Choose a rating from one to five, or leave it unverified.");
  }
  if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) throw error(400, "Use an ISO date (YYYY-MM-DD), or leave the date blank.");
  if (date && Number.isNaN(Date.parse(date + "T00:00:00Z"))) throw error(400, "Review date is invalid.");
  return { studentName, review, sourceUrl, rating, date, publicId };
}

const compare = (value) => clean(value, 10000).toLowerCase().replace(/\s+/g, " ");
export function mergePublishedReview(existing, input) {
  if (!existing || !Array.isArray(existing.reviews)) throw error(502, "GitHub reviews.json format is invalid.");
  const reviews = [...existing.reviews];
  const priorIndex = input.publicId
    ? reviews.findIndex(item => (item.name || item.importId) === input.publicId)
    : -1;
  const duplicateIndex = reviews.findIndex(item =>
    compare(item?.reviewer?.displayName) === compare(input.studentName)
    && compare(item?.comment) === compare(input.review));
  if (duplicateIndex >= 0 && duplicateIndex !== priorIndex) throw error(409, "This Google review is already in the Falowen website JSON.");
  if (input.publicId && priorIndex === -1) throw error(409, "This review has changed. Reload the public review list before editing it.");

  const original = priorIndex >= 0 ? reviews[priorIndex] : {};
  const record = {
    ...original,
    reviewer: { ...(original.reviewer || {}), displayName: input.studentName },
    comment: input.review,
    sourceUrl: input.sourceUrl,
  };
  if (!record.name && !record.importId) {
    const digest = createHash("sha256").update(input.sourceUrl + "\n" + input.studentName + "\n" + input.review).digest("hex").slice(0, 24);
    record.importId = "admin-google-" + digest;
  }
  if (input.date) record.createTime = input.date;
  if (input.rating !== null) {
    record.starRating = RATINGS[input.rating];
    delete record.ratingStatus;
  } else {
    delete record.starRating;
    record.ratingStatus = "not_verified";
  }

  if (priorIndex < 0) reviews.unshift(record);
  else reviews[priorIndex] = record;
  return { ...existing, reviews };
}

function parseJwtSegment(value) {
  try { return JSON.parse(Buffer.from(value, "base64url").toString("utf8")); }
  catch { throw error(401, "Invalid Firebase session token."); }
}

async function certificates() {
  if (Date.now() < certificateCache.expires) return certificateCache.certificates;
  const response = await fetch(
    "https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com",
    { signal: AbortSignal.timeout(8000) },
  );
  if (!response.ok) throw error(503, "Firebase token verification is temporarily unavailable.");
  const entries = await response.json();
  certificateCache = { certificates: entries, expires: Date.now() + 30 * 60 * 1000 };
  return entries;
}

async function requireOwner(req) {
  const bearer = String(req.headers?.authorization || "").match(/^Bearer\s+(\S+)$/i)?.[1];
  if (!bearer || bearer.length > 8192) throw error(401, "Sign in to Falowen Admin to publish reviews.");
  const pieces = bearer.split(".");
  if (pieces.length !== 3) throw error(401, "Invalid Firebase session token.");
  const header = parseJwtSegment(pieces[0]);
  const claims = parseJwtSegment(pieces[1]);
  const project = clean(process.env.FIREBASE_PROJECT_ID, 200);
  const now = Math.floor(Date.now() / 1000);

  if (!project) throw error(503, "Firebase project configuration is missing.");
  if (header.alg !== "RS256" || !header.kid
      || claims.aud !== project || claims.iss !== "https://securetoken.google.com/" + project
      || !claims.sub || String(claims.sub).length > 128
      || !Number.isFinite(claims.exp) || claims.exp <= now
      || !Number.isFinite(claims.iat) || claims.iat > now
      || !Number.isFinite(claims.auth_time) || claims.auth_time > now) {
    throw error(401, "Your Firebase sign-in has expired or is invalid.");
  }
  const publicKey = (await certificates())[header.kid];
  if (!publicKey) throw error(401, "Could not verify the Firebase token signature.");
  const verifier = createVerify("RSA-SHA256");
  verifier.update(pieces[0] + "." + pieces[1]);
  verifier.end();
  if (!verifier.verify(publicKey, Buffer.from(pieces[2], "base64url"))) {
    throw error(401, "Could not verify the Firebase token signature.");
  }
  if (claims.email_verified !== true || clean(claims.email).toLowerCase() !== OWNER) {
    throw error(403, "Only the verified Falowen owner can submit public review changes.");
  }
}

async function github(path, { method = "GET", body } = {}) {
  const token = clean(process.env.FALOWEN_REVIEWS_GITHUB_TOKEN, 3000);
  if (!token) throw error(503, "GitHub publishing is not configured. Add FALOWEN_REVIEWS_GITHUB_TOKEN as a server-only variable in the Vercel admin project.");
  const response = await fetch("https://api.github.com/repos/" + REPO + path, {
    method,
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: "Bearer " + token,
      "X-GitHub-Api-Version": "2022-11-28",
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
    signal: AbortSignal.timeout(12000),
  });
  const output = await response.json().catch(() => ({}));
  if (!response.ok) {
    if (response.status === 401 || response.status === 403) throw error(503, "GitHub publishing token is missing access to the learner repository.");
    if (response.status === 409 || response.status === 422) throw error(409, "The reviews repository changed while submitting. Please retry from the latest list.");
    throw error(502, "GitHub rejected the review update (HTTP " + response.status + ").");
  }
  return output;
}

export default async function publicStudentReviewsHandler(req, res) {
  res.setHeader("Cache-Control", "private, no-store");
  if (!["GET", "POST"].includes(req.method)) {
    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ ok: false, error: "Method not allowed." });
  }
  try {
    if (req.method === "GET") {
      const response = await fetch(
        "https://raw.githubusercontent.com/" + REPO + "/main/" + FILE,
        { cache: "no-store", signal: AbortSignal.timeout(12000) },
      );
      if (!response.ok) throw error(502, "Could not load Falowen's public reviews JSON.");
      const payload = await response.json();
      if (!Array.isArray(payload.reviews)) throw error(502, "The public reviews file has an invalid format.");
      return res.status(200).json({ ok: true, reviews: payload.reviews, count: payload.reviews.length });
    }

    await requireOwner(req);
    const raw = typeof req.body === "object" && req.body !== null
      ? req.body : JSON.parse(String(req.body || "{}"));
    const submission = normalizeSubmission(raw);
    const main = await github("/git/ref/heads/main");
    const head = main?.object?.sha;
    if (!/^[a-f0-9]{40}$/.test(head || "")) throw error(502, "GitHub did not return a valid main branch revision.");

    const file = await github("/contents/" + FILE + "?ref=main");
    const original = JSON.parse(Buffer.from(String(file.content || "").replace(/\s+/g, ""), "base64").toString("utf8"));
    const merged = mergePublishedReview(original, submission);
    const branch = "social-google-review-" + Date.now() + "-" + randomUUID().slice(0, 8);
    await github("/git/refs", { method: "POST", body: { ref: "refs/heads/" + branch, sha: head } });
    await github("/contents/" + FILE, {
      method: "PUT",
      body: {
        message: "Add publicly shared Google review from " + submission.studentName,
        branch, sha: file.sha,
        content: Buffer.from(JSON.stringify(merged, null, 2) + "\n", "utf8").toString("base64"),
      },
    });
    const pr = await github("/pulls", {
      method: "POST",
      body: {
        title: "Publish Google review: " + submission.studentName,
        head: branch, base: "main",
        body: "Owner-approved public Google Maps review update via Falowen Admin Social Media Studio.\n\nSource: "
          + submission.sourceUrl
          + "\n\nExisting reviews were preserved. The JSON count will update after CI checks and merge. "
          + "No unverified star rating is assigned.",
      },
    });
    return res.status(201).json({
      ok: true, state: "pull_request_created", number: pr.number,
      url: pr.html_url, countAfterMerge: merged.reviews.length,
    });
  } catch (cause) {
    const status = Number(cause.status) || 500;
    if (status >= 500) console.error("public_review_publish_error", { status, message: cause.message });
    return res.status(status).json({ ok: false, error: cause.message || "Could not submit review update." });
  }
}
