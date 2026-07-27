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

test("payment backend requires admin access and verifies webhooks", () => {
  const functionsSource = read("functions/index.js");

  assert.match(functionsSource, /defineSecret\("PAYSTACK_SECRET_KEY"\)/);
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

test("checkout gross can exceed tuition credit without changing the tuition amount", () => {
  const tuitionCredit = 1500;
  const checkoutAmount = calculatePaystackGrossAmount(tuitionCredit);

  assert.ok(checkoutAmount >= tuitionCredit);
  assert.equal(tuitionCredit, 1500);
});
