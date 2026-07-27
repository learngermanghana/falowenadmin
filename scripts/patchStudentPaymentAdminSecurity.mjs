import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const functionsPath = path.join(root, "functions/index.js");
let content = fs.readFileSync(functionsPath, "utf8");

const blockStart = "// BEGIN STUDENT PAYMENT LINKS";
const blockEnd = "// END STUDENT PAYMENT LINKS";
const startIndex = content.indexOf(blockStart);
const endIndex = content.indexOf(blockEnd);

if (startIndex < 0 || endIndex < 0 || endIndex <= startIndex) {
  throw new Error("Student payment block not found. Run payment link/history patches first.");
}

let before = content.slice(0, startIndex);
let paymentBlock = content.slice(startIndex, endIndex + blockEnd.length);
let after = content.slice(endIndex + blockEnd.length);

const helperAnchor = "async function initializePaystackPayment({ email, checkoutAmount, reference, metadata }) {";
const helper = `function paymentAdminEmailSet() {
  const paymentConfig = runtimeConfig.payments || {};
  const configuredEmails = [
    paymentConfig.admin_emails,
    process.env.PAYMENT_ADMIN_EMAILS,
  ]
    .flatMap((value) => String(value || "").split(","))
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);

  return new Set([
    "moxflex@gmail.com",
    ...teacherAllowlist,
    ...configuredEmails,
  ]);
}

async function requirePaymentAdmin(req) {
  const header = String(req.headers.authorization || "");
  const match = header.match(/^Bearer (.+)$/);
  if (!match) {
    const error = new Error("Missing Authorization Bearer token");
    error.statusCode = 401;
    throw error;
  }

  const decoded = await admin.auth().verifyIdToken(match[1]);
  const email = String(decoded.email || "").trim().toLowerCase();
  const role = String(decoded.role || decoded.user_role || "").trim().toLowerCase();
  const claimAllowed = decoded.admin === true || decoded.staff === true || role === "admin" || role === "staff";
  const emailAllowed = email && paymentAdminEmailSet().has(email);

  if (!claimAllowed && !emailAllowed) {
    console.warn("payment_admin_auth_failure", { uid: decoded.uid, email });
    const error = new Error("Admin or staff access required");
    error.statusCode = 403;
    throw error;
  }

  return decoded;
}

`;

if (!paymentBlock.includes("async function requirePaymentAdmin(req)")) {
  if (!paymentBlock.includes(helperAnchor)) throw new Error("Payment admin helper anchor not found.");
  paymentBlock = paymentBlock.replace(helperAnchor, `${helper}${helperAnchor}`);
}

paymentBlock = paymentBlock.replace(
  "const user = await requireAuth(req);",
  "const user = await requirePaymentAdmin(req);",
);
paymentBlock = paymentBlock.replace(
  "await requireAuth(req);\n    const studentId = String(req.params.studentId || \"\").trim();",
  "await requirePaymentAdmin(req);\n    const studentId = String(req.params.studentId || \"\").trim();",
);

content = `${before}${paymentBlock}${after}`;
fs.writeFileSync(functionsPath, content, "utf8");
console.log("Student payment admin authorization patch applied.");
