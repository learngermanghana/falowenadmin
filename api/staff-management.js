import crypto from "node:crypto";
const env = (name) => String(process.env[name] || "").trim();
const PROJECT = env("FIREBASE_PROJECT_ID") || env("VITE_FIREBASE_PROJECT_ID");
const KEY = env("FIREBASE_API_KEY") || env("VITE_FIREBASE_API_KEY");
const OWNER = "moxflex@gmail.com";
const host = "https://identitytoolkit.googleapis.com/v1";
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function fail(message, status = 400) { throw Object.assign(new Error(message), { status }); }
function base64(value) { return Buffer.from(value).toString("base64url"); }
async function tokenForGoogle() {
  const client = env("GOOGLE_SERVICE_ACCOUNT_EMAIL") || env("GCP_CLIENT_EMAIL");
  const key = (env("GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY") || env("GCP_PRIVATE_KEY")).replace(/\\n/g, "\n");
  if (!client || !key || !PROJECT || !KEY) {
    const missing = [
      ...(!client ? ["GOOGLE_SERVICE_ACCOUNT_EMAIL"] : []),
      ...(!key ? ["GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY"] : []),
      ...(!PROJECT ? ["FIREBASE_PROJECT_ID"] : []),
      ...(!KEY ? ["FIREBASE_API_KEY"] : []),
    ];
    fail("Staff management cannot provision accounts until the Vercel server configuration is complete. Missing: " + missing.join(", ") + ". Existing student search is still available.", 503);
  }
  const now = Math.floor(Date.now() / 1000);
  const header = base64(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claims = base64(JSON.stringify({
    iss: client, aud: "https://oauth2.googleapis.com/token",
    scope: "https://www.googleapis.com/auth/cloud-platform", iat: now, exp: now + 3600,
  }));
  const payload = `${header}.${claims}`;
  const signature = crypto.sign("RSA-SHA256", Buffer.from(payload), key).toString("base64url");
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:jwt-bearer", assertion: `${payload}.${signature}` }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.access_token) fail("Staff service credentials are not authorized.", 503);
  return data.access_token;
}
async function apiFetch(url, method, body, bearer) {
  const response = await fetch(url, {
    method, headers: { Authorization: `Bearer ${bearer}`, ...(body ? { "Content-Type": "application/json" } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const e = data?.error?.message || `Service request failed (${response.status}).`;
    fail(e, response.status === 403 ? 503 : 502);
  }
  return data;
}
const authUrl = (suffix) => `${host}/projects/${encodeURIComponent(PROJECT)}/accounts${suffix}`;
async function accountsLookup(body, accessToken) {
  const result = await apiFetch(authUrl(":lookup"), "POST", body, accessToken);
  return result.users?.[0] || null;
}
async function requireOwner(req, accessToken) {
  const match = String(req.headers.authorization || "").match(/^Bearer\s+(.+)$/i);
  if (!match) fail("Sign in as an administrator.", 401);
  const data = await fetch(`${host}/accounts:lookup?key=${encodeURIComponent(KEY)}`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ idToken: match[1] }),
  });
  const lookup = await data.json().catch(() => ({}));
  const identity = lookup.users?.[0];
  if (!data.ok || !identity?.localId) fail("Your session has expired.", 401);
  if (identity.emailVerified !== true || String(identity.email || "").toLowerCase() !== OWNER) fail("Only the owner may manage staff access.", 403);
  // Confirm account identity against the privileged project as well.
  const privileged = await accountsLookup({ localId: [identity.localId] }, accessToken);
  if (!privileged || String(privileged.email || "").toLowerCase() !== OWNER) fail("Administrator identity mismatch.", 403);
  return identity;
}
function parseAttributes(user) {
  try { return JSON.parse(user?.customAttributes || "{}") || {}; }
  catch { return {}; }
}
async function updateClaims(user, changes, accessToken) {
  const custom = { ...parseAttributes(user), ...changes };
  return apiFetch(authUrl(":update"), "POST", {
    localId: user.localId, customAttributes: JSON.stringify(custom),
  }, accessToken);
}
const docUrl = (uid = "") => `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(PROJECT)}/databases/(default)/documents/falowenStaffAccess${uid ? "/" + encodeURIComponent(uid) : ""}`;
function fieldsToObject(fields = {}) {
  const str = key => fields[key]?.stringValue || "";
  const array = key => (fields[key]?.arrayValue?.values || []).map(v => v.stringValue).filter(Boolean);
  return { uid: str("uid"), email: str("email"), name: str("name"), staffRole: str("staffRole"), languages: array("languages"), active: fields.active?.booleanValue === true };
}
function asFields(input) {
  const str = value => ({ stringValue: value || "" });
  return { uid: str(input.uid), email: str(input.email), name: str(input.name),
    staffRole: str(input.staffRole), languages: { arrayValue: { values: input.languages.map(str) } },
    active: { booleanValue: input.active === true },
    updatedAt: { timestampValue: new Date().toISOString() } };
}
async function writeStaff(info, accessToken) {
  await apiFetch(docUrl(info.uid), "PATCH", { fields: asFields(info) }, accessToken);
}
function allowedLanguages(value) {
  if (!Array.isArray(value) || !value.length || value.some(v => !["german", "swahili"].includes(v))) fail("Choose German, Swahili or both.");
  return [...new Set(value)];
}
async function upsert(body, accessToken) {
  const email = String(body.email || "").toLowerCase().trim();
  if (!emailPattern.test(email) || email.length > 254) fail("Enter a valid email address.");
  if (email === OWNER) fail("Owner permissions cannot be changed here.", 403);
  const name = String(body.name || "").trim().slice(0, 100);
  const staffRole = body.staffRole;
  if (!["teacher", "reviewer"].includes(staffRole)) fail("Invalid staff role.");
  const languages = allowedLanguages(body.languages);
  let account = await accountsLookup({ email: [email] }, accessToken);
  const existing = Boolean(account);
  if (account && (parseAttributes(account).admin === true || parseAttributes(account).role === "admin")) fail("Admin accounts cannot be altered through staff management.", 403);
  if (!account) {
    // High-entropy temporary credential is never shown or emailed. Firebase emails a one-time setup link.
    const password = crypto.randomBytes(48).toString("base64url");
    const created = await apiFetch(`${host}/projects/${encodeURIComponent(PROJECT)}/accounts?key=${encodeURIComponent(KEY)}`, "POST",
      { email, password, displayName: name, emailVerified: false }, accessToken);
    account = { localId: created.localId, email, customAttributes: "{}" };
    if (!account.localId) fail("Account was not created.", 502);
  }
  await updateClaims(account, { staff: true, staffRole, staffLanguages: languages }, accessToken);
  await writeStaff({ uid: account.localId, email, name: name || account.displayName || "", staffRole, languages, active: true }, accessToken);
  if (!existing) {
    const response = await fetch(`${host}/accounts:sendOobCode?key=${encodeURIComponent(KEY)}`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requestType: "PASSWORD_RESET", email }),
    });
    if (!response.ok) fail("Account created, but password setup email failed. Check Firebase email templates before retrying.", 502);
  }
  return { ok: true, existing };
}
async function revoke(body, accessToken) {
  const uid = String(body.uid || "").trim();
  if (!/^[A-Za-z0-9_-]{6,128}$/.test(uid)) fail("Invalid staff account.");
  const user = await accountsLookup({ localId: [uid] }, accessToken);
  if (!user || String(user.email || "").toLowerCase() === OWNER) fail("Staff account not found or protected.", 403);
  const claims = parseAttributes(user);
  if (claims.admin === true || claims.role === "admin") fail("Admin permissions cannot be changed here.", 403);
  await updateClaims(user, { staff: false, role: ["staff", "tutor"].includes(claims.role) ? null : claims.role || null, staffRole: null, staffLanguages: [] }, accessToken);
  const d = await apiFetch(docUrl(uid), "GET", undefined, accessToken).catch(() => null);
  const prior = fieldsToObject(d?.fields);
  await writeStaff({ uid, email: user.email || prior.email, name: prior.name, staffRole: prior.staffRole || "teacher", languages: [], active: false }, accessToken);
  return { ok: true };
}
export default async function staffManagementHandler(req, res) {
  res.setHeader("Cache-Control", "private, no-store");
  if (!["GET", "POST"].includes(req.method)) { res.setHeader("Allow", "GET, POST"); return res.status(405).json({ ok: false, error: "Method not allowed" }); }
  try {
    const accessToken = await tokenForGoogle();
    await requireOwner(req, accessToken);
    if (req.method === "GET") {
      const result = await apiFetch(docUrl() + "?pageSize=100", "GET", undefined, accessToken);
      const staff = (result.documents || []).map(doc => fieldsToObject(doc.fields)).filter(s => s.uid && s.email);
      return res.status(200).json({ ok: true, staff });
    }
    const input = typeof req.body === "string" ? JSON.parse(req.body) : req.body || {};
    const result = input.action === "upsert" ? await upsert(input, accessToken)
      : input.action === "revoke" ? await revoke(input, accessToken)
      : fail("Invalid staff action.");
    return res.status(200).json(result);
  } catch (err) {
    const status = err?.status || 500;
    console.error("staff_management_failed", { status, message: err?.message });
    return res.status(status).json({ ok: false, error: status === 503 ? err.message : status >= 500 ? "Staff management could not reach Firebase. Review server permissions and runtime logs." : err.message });
  }
}
