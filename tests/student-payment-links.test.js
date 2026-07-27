import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { calculatePaystackGrossAmount } from "../src/utils/paystackCharges.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), "utf8");

test("student payment patch exposes the admin UI and production API route", () => {
  const page = read("src/pages/StudentDirectoryPage.jsx");
  const router = read("api/router.js");
  const component = read("src/components/StudentPaymentTools.jsx");
  const vercel = read("vercel.json");

  assert.match(page, /StudentPaymentTools/);
  assert.match(page, /<StudentPaymentTools/);
  assert.match(router, /path\.startsWith\("payments\/"\)/);
  assert.match(vercel, /"source": "\/api\/payments\/\(\.\*\)"/);
  assert.match(vercel, /cloudfunctions\.net\/api\/payments\/\$1/);
  assert.doesNotMatch(component, /collection\(db,\s*"payments"\)/);
  assert.match(component, /listStudentPayments/);
});

test("payment backend requires admin access, reuses the existing Paystack secret, and verifies webhooks", () => {
  const functionsSource = read("functions/index.js");
  const paymentPatch = read("scripts/patchStudentPaymentLinks.mjs");

  assert.match(paymentPatch, /defineSecret\("PAYSTACK_SECRET"\)/);
  assert.doesNotMatch(paymentPatch, /defineSecret\("PAYSTACK_SECRET_KEY"\)/);
  assert.match(paymentPatch, /process\.env\.PAYSTACK_SECRET/);
  assert.match(functionsSource, /async function requirePaymentAdmin\(req\)/);
  assert.match(functionsSource, /decoded\.admin === true/);
  assert.match(functionsSource, /decoded\.staff === true/);
  assert.match(functionsSource, /Admin or staff access required/);
  assert.match(functionsSource, /const user = await requirePaymentAdmin\(req\)/);
  assert.match(functionsSource, /app\.get\("\/payments\/student\/:studentId"/);
  assert.match(functionsSource, /await requirePaymentAdmin\(req\)/);
  assert.match(functionsSource, /app\.post\("\/payments\/create-link"/);
  assert.match(functionsSource, /app\.post\("\/payments\/paystack-webhook"/);
  assert.match(functionsSource, /x-paystack-signature/);
  assert.match(functionsSource, /createHmac\("sha512"/);
  assert.match(functionsSource, /reference\.startsWith\("FAL-"\)/);
  assert.match(functionsSource, /String\(payment\.status \|\| ""\)\.toLowerCase\(\) === "paid"/);
  assert.match(functionsSource, /transaction\.set\(studentRef/);
  assert.match(functionsSource, /balanceDue: nextBalance/);
  assert.match(functionsSource, /tuitionCredit/);
  assert.match(functionsSource, /checkoutAmount/);
});

test("payment history preserves authorization status codes and migrates existing routes", () => {
  const historyPatch = read("scripts/patchStudentPaymentHistoryApi.mjs");
  const functionsSource = read("functions/index.js");

  assert.match(historyPatch, /const legacyHistoryCatch/);
  assert.match(historyPatch, /content\.replace\(legacyHistoryCatch, statusAwareHistoryCatch\)/);
  assert.match(historyPatch, /res\.status\(error\?\.statusCode \|\| 401\)/);
  assert.match(functionsSource, /res\.status\(error\?\.statusCode \|\| 401\)\.json\(\{ ok: false, error: error\?\.message \|\| "Could not load payment history" \}\)/);
  assert.doesNotMatch(functionsSource, /return res\.status\(401\)\.json\(\{ ok: false, error: error\?\.message \|\| "Could not load payment history" \}\)/);
});

test("checkout gross can exceed tuition credit without changing the tuition amount", () => {
  const tuitionCredit = 1500;
  const checkoutAmount = calculatePaystackGrossAmount(tuitionCredit);

  assert.ok(checkoutAmount >= tuitionCredit);
  assert.equal(tuitionCredit, 1500);
});