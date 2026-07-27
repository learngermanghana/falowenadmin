import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function write(relativePath, content) {
  fs.writeFileSync(path.join(root, relativePath), content, "utf8");
}

function requireNeedle(content, needle, label) {
  if (!content.includes(needle)) throw new Error(`Student payment patch could not find ${label}.`);
}

function insertAfter(content, needle, addition, label) {
  if (content.includes(addition.trim())) return content;
  requireNeedle(content, needle, label);
  return content.replace(needle, `${needle}${addition}`);
}

function insertBefore(content, needle, addition, label) {
  if (content.includes(addition.trim())) return content;
  requireNeedle(content, needle, label);
  return content.replace(needle, `${addition}${needle}`);
}

function replaceOnce(content, needle, replacement, label) {
  if (content.includes(replacement)) return content;
  requireNeedle(content, needle, label);
  return content.replace(needle, replacement);
}

function patchStudentDirectory() {
  const file = "src/pages/StudentDirectoryPage.jsx";
  let content = read(file);

  content = insertAfter(
    content,
    'import StudentSupportTools from "../components/StudentSupportTools";\n',
    'import StudentPaymentTools from "../components/StudentPaymentTools";\n',
    "StudentSupportTools import",
  );

  const supportBlock = `                        <StudentSupportTools\n                          student={selectedStudent}\n                          draft={getDraft(selectedStudent)}\n                          onStudentDeleted={handleSupportStudentDeleted}\n                          onStudentUpdated={handleSupportStudentUpdated}\n                          pushToast={pushToast}\n                        />\n`;
  const paymentBlock = `\n                        <StudentPaymentTools\n                          student={selectedStudent}\n                          draft={getDraft(selectedStudent)}\n                          onStudentUpdated={handleSupportStudentUpdated}\n                          pushToast={pushToast}\n                        />\n`;
  content = insertAfter(content, supportBlock, paymentBlock, "StudentSupportTools component block");
  write(file, content);
}

function patchApiRouter() {
  const file = "api/router.js";
  let content = read(file);
  const oldRoutes = `    path.startsWith("students/") ||\n    path.startsWith("marking/")`;
  const newRoutes = `    path.startsWith("students/") ||\n    path.startsWith("payments/") ||\n    path.startsWith("marking/")`;
  content = replaceOnce(content, oldRoutes, newRoutes, "API proxy route list");
  write(file, content);
}

const backendBlock = `// BEGIN STUDENT PAYMENT LINKS\nconst PAYSTACK_API_BASE_URL = "https://api.paystack.co";\nconst PAYSTACK_CURRENCY = "GHS";\nconst PAYSTACK_CHARGE_RATE_FOR_STUDENTS = 0.0195;\nconst PAYSTACK_STUDENT_CHARGE_SHARE = 0.5;\n\nfunction paymentNumber(value) {\n  const parsed = Number(String(value ?? "").replace(/[^0-9.-]/g, ""));\n  return Number.isFinite(parsed) ? parsed : 0;\n}\n\nfunction roundMoney(value) {\n  return Math.round((paymentNumber(value) + Number.EPSILON) * 100) / 100;\n}\n\nfunction calculateStudentCheckoutAmount(netAmount) {\n  const amount = roundMoney(netAmount);\n  if (amount <= 0) return 0;\n  return Math.ceil(amount / (1 - PAYSTACK_CHARGE_RATE_FOR_STUDENTS * PAYSTACK_STUDENT_CHARGE_SHARE));\n}\n\nfunction paystackSecret() {\n  return String(paystackSecretKeySecret.value() || process.env.PAYSTACK_SECRET_KEY || "").trim();\n}\n\nfunction paystackCallbackUrl() {\n  const paymentConfig = runtimeConfig.payments || {};\n  return String(paymentConfig.callback_url || process.env.PAYSTACK_CALLBACK_URL || "").trim();\n}\n\nfunction safePaymentReferencePart(value) {\n  return String(value || "student").replace(/[^a-zA-Z0-9.-]/g, "-").replace(/-+/g, "-").slice(0, 36) || "student";\n}\n\nfunction createPaymentReference(studentId) {\n  const suffix = crypto.randomBytes(5).toString("hex");\n  return "FAL-" + safePaymentReferencePart(studentId) + "-" + Date.now() + "-" + suffix;\n}\n\nfunction resolveStudentPaymentEmail(student = {}, requestedEmail = "") {\n  return String(requestedEmail || student.email || student.studentEmail || "").trim().toLowerCase();\n}\n\nfunction resolveStudentCurrentBalance(student = {}) {\n  const explicitValues = [student.balanceDue, student.balance, student.outstandingBalance, student.amountDue];\n  for (const value of explicitValues) {\n    const amount = paymentNumber(value);\n    if (amount > 0) return roundMoney(amount);\n  }\n  const tuitionFee = paymentNumber(student.tuitionFee);\n  const paid = paymentNumber(student.paid);\n  return tuitionFee > 0 ? roundMoney(Math.max(0, tuitionFee - paid)) : 0;\n}\n\nasync function initializePaystackPayment({ email, checkoutAmount, reference, metadata }) {\n  const secret = paystackSecret();\n  if (!secret) {\n    const error = new Error("PAYSTACK_SECRET_KEY is not configured");\n    error.statusCode = 503;\n    throw error;\n  }\n\n  const payload = {\n    email,\n    amount: String(Math.round(roundMoney(checkoutAmount) * 100)),\n    currency: PAYSTACK_CURRENCY,\n    reference,\n    metadata: JSON.stringify(metadata),\n  };\n  const callbackUrl = paystackCallbackUrl();\n  if (callbackUrl) payload.callback_url = callbackUrl;\n\n  const response = await fetch(PAYSTACK_API_BASE_URL + "/transaction/initialize", {\n    method: "POST",\n    headers: {\n      Authorization: "Bearer " + secret,\n      "Content-Type": "application/json",\n    },\n    body: JSON.stringify(payload),\n  });\n  const data = await response.json().catch(() => ({}));\n  if (!response.ok || data?.status !== true || !data?.data?.authorization_url) {\n    const error = new Error(data?.message || "Paystack could not initialize this payment");\n    error.statusCode = response.status || 502;\n    throw error;\n  }\n  return data.data;\n}\n\nfunction webhookSignatureIsValid(req) {\n  const secret = paystackSecret();\n  const received = String(req.headers["x-paystack-signature"] || "").trim().toLowerCase();\n  if (!secret || !received) return false;\n  const candidates = [];\n  if (Buffer.isBuffer(req.rawBody) && req.rawBody.length) candidates.push(req.rawBody);\n  candidates.push(Buffer.from(JSON.stringify(req.body || {}), "utf8"));\n  return candidates.some((payload) => crypto.createHmac("sha512", secret).update(payload).digest("hex").toLowerCase() === received);\n}\n\nasync function applySuccessfulPaystackPayment(eventData = {}) {\n  const reference = String(eventData.reference || "").trim();\n  if (!reference) throw new Error("Paystack webhook is missing a transaction reference");\n\n  const paymentRef = db.collection("payments").doc(reference);\n  return db.runTransaction(async (transaction) => {\n    const paymentSnap = await transaction.get(paymentRef);\n    if (!paymentSnap.exists) throw new Error("Unknown Falowen payment reference: " + reference);\n    const payment = paymentSnap.data() || {};\n    if (String(payment.status || "").toLowerCase() === "paid") {\n      return { duplicate: true, studentId: payment.studentId, reference };\n    }\n\n    const expectedSubunit = Math.round(paymentNumber(payment.checkoutAmount) * 100);\n    const receivedSubunit = Number(eventData.amount || 0);\n    const currency = String(eventData.currency || "").trim().toUpperCase();\n    if (!Number.isFinite(receivedSubunit) || receivedSubunit !== expectedSubunit) {\n      throw new Error("Paystack amount does not match the generated payment intent");\n    }\n    if (currency !== PAYSTACK_CURRENCY) throw new Error("Unexpected Paystack currency: " + currency);\n\n    const studentId = String(payment.studentId || "").trim();\n    if (!studentId) throw new Error("Payment intent is missing studentId");\n    const studentRef = db.collection(STUDENTS_COLLECTION).doc(studentId);\n    const studentSnap = await transaction.get(studentRef);\n    if (!studentSnap.exists) throw new Error("Student record not found for payment");\n    const student = studentSnap.data() || {};\n\n    const tuitionCredit = roundMoney(payment.tuitionCredit);\n    const currentPaid = roundMoney(student.paid);\n    const currentBalance = resolveStudentCurrentBalance(student);\n    const nextPaid = roundMoney(currentPaid + tuitionCredit);\n    const nextBalance = roundMoney(Math.max(0, currentBalance - tuitionCredit));\n    const paymentStatus = nextBalance <= 0 ? "Paid" : "Partially Paid";\n    const paidAtValue = eventData.paid_at || eventData.paidAt || null;\n\n    transaction.set(studentRef, {\n      paid: nextPaid,\n      balanceDue: nextBalance,\n      balance: nextBalance,\n      paymentStatus,\n      status: nextBalance <= 0 ? "Paid" : (student.status || "Active"),\n      lastPaymentAmount: tuitionCredit,\n      lastPaymentProvider: "Paystack",\n      lastPaymentReference: reference,\n      lastPaymentAt: paidAtValue ? admin.firestore.Timestamp.fromDate(new Date(paidAtValue)) : admin.firestore.FieldValue.serverTimestamp(),\n      updated_at: admin.firestore.FieldValue.serverTimestamp(),\n    }, { merge: true });\n\n    transaction.set(paymentRef, {\n      status: "paid",\n      paidAt: paidAtValue ? admin.firestore.Timestamp.fromDate(new Date(paidAtValue)) : admin.firestore.FieldValue.serverTimestamp(),\n      paystackTransactionId: eventData.id || null,\n      channel: eventData.channel || "",\n      gatewayResponse: eventData.gateway_response || eventData.gatewayResponse || "",\n      verifiedCurrency: currency,\n      verifiedAmountSubunit: receivedSubunit,\n      updatedAt: admin.firestore.FieldValue.serverTimestamp(),\n    }, { merge: true });\n\n    return { duplicate: false, studentId, reference, nextPaid, nextBalance, paymentStatus };\n  });\n}\n\napp.post("/payments/create-link", async (req, res) => {\n  try {\n    const user = await requireAuth(req);\n    const studentId = String(req.body?.studentId || "").trim();\n    const tuitionCredit = roundMoney(req.body?.amount);\n    const purpose = String(req.body?.purpose || "balance").trim() || "balance";\n    if (!studentId) return res.status(400).json({ ok: false, error: "studentId is required" });\n    if (tuitionCredit <= 0) return res.status(400).json({ ok: false, error: "amount must be greater than zero" });\n\n    const studentRef = db.collection(STUDENTS_COLLECTION).doc(studentId);\n    const studentSnap = await studentRef.get();\n    if (!studentSnap.exists) return res.status(404).json({ ok: false, error: "Student not found" });\n    const student = studentSnap.data() || {};\n    const email = resolveStudentPaymentEmail(student, req.body?.email);\n    if (!email || !email.includes("@")) return res.status(400).json({ ok: false, error: "A valid student email is required by Paystack" });\n\n    const checkoutAmount = calculateStudentCheckoutAmount(tuitionCredit);\n    const processingShare = roundMoney(checkoutAmount - tuitionCredit);\n    const reference = createPaymentReference(studentId);\n    const metadata = {\n      source: "falowen_admin_student_directory",\n      studentId,\n      studentCode: String(student.studentCode || student.studentcode || studentId),\n      studentName: String(student.name || student.studentName || ""),\n      purpose,\n      tuitionCredit,\n      checkoutAmount,\n    };\n\n    const paystack = await initializePaystackPayment({ email, checkoutAmount, reference, metadata });\n    const payment = {\n      reference,\n      studentId,\n      studentCode: metadata.studentCode,\n      studentName: metadata.studentName,\n      email,\n      purpose,\n      currency: PAYSTACK_CURRENCY,\n      tuitionCredit,\n      checkoutAmount,\n      processingShare,\n      amountSubunit: Math.round(checkoutAmount * 100),\n      provider: "Paystack",\n      status: "pending",\n      authorizationUrl: paystack.authorization_url,\n      accessCode: paystack.access_code || "",\n      createdBy: user.uid,\n      createdAt: admin.firestore.FieldValue.serverTimestamp(),\n      updatedAt: admin.firestore.FieldValue.serverTimestamp(),\n    };\n    await db.collection("payments").doc(reference).set(payment, { merge: true });\n\n    return res.json({\n      ok: true,\n      payment: {\n        ...payment,\n        createdAt: new Date().toISOString(),\n      },\n    });\n  } catch (error) {\n    console.error("student_payment_link_failed", { message: error?.message || String(error) });\n    return res.status(error?.statusCode || 500).json({ ok: false, error: error?.message || "Could not generate payment link" });\n  }\n});\n\napp.post("/payments/paystack-webhook", async (req, res) => {\n  if (!webhookSignatureIsValid(req)) {\n    console.warn("paystack_webhook_rejected", { reason: "invalid_signature" });\n    return res.status(401).json({ ok: false, error: "Invalid Paystack signature" });\n  }\n\n  const event = req.body || {};\n  if (String(event.event || "") !== "charge.success") return res.status(200).json({ ok: true, ignored: true });\n\n  try {\n    const result = await applySuccessfulPaystackPayment(event.data || {});\n    console.log("paystack_payment_applied", result);\n    return res.status(200).json({ ok: true, ...result });\n  } catch (error) {\n    console.error("paystack_payment_apply_failed", { message: error?.message || String(error), reference: event?.data?.reference || "" });\n    return res.status(500).json({ ok: false, error: error?.message || "Payment could not be applied" });\n  }\n});\n// END STUDENT PAYMENT LINKS\n\n`;

function patchFunctions() {
  const file = "functions/index.js";
  let content = read(file);

  content = insertAfter(
    content,
    'const studentDeleteSyncSecret = defineSecret("STUDENT_DELETE_SYNC_SECRET");\n',
    'const paystackSecretKeySecret = defineSecret("PAYSTACK_SECRET_KEY");\n',
    "student delete secret declarations",
  );

  content = insertBefore(
    content,
    'app.post("/students/delete-account", async (req, res) => {',
    backendBlock,
    "student delete route",
  );

  content = insertAfter(
    content,
    '    studentDeleteSyncSecret,\n',
    '    paystackSecretKeySecret,\n',
    "Firebase function secret list",
  );

  write(file, content);
}

patchStudentDirectory();
patchApiRouter();
patchFunctions();
console.log("Student payment link patches applied.");
