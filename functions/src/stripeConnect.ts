import * as crypto from "crypto";
import * as admin from "firebase-admin";
import { onRequest } from "firebase-functions/v2/https";
import { defineString } from "firebase-functions/params";

if (admin.apps.length === 0) {
  admin.initializeApp();
}

const db = admin.firestore();
const serverTimestamp = admin.firestore.FieldValue.serverTimestamp;

export const STRIPE_SECRET_KEY = defineString("STRIPE_SECRET_KEY");
export const STRIPE_WEBHOOK_SECRET = defineString("STRIPE_WEBHOOK_SECRET");

export type PaymentProvider = "paystack" | "stripe" | "manual";

type UnknownRecord = Record<string, unknown>;

type StripeCheckoutInput = {
  amountMinor: number;
  currency: string;
  productName: string;
  successUrl: string;
  cancelUrl: string;
  reference: string;
  paymentReference?: string;
  sedifexOrderId?: string;
  customerEmail?: string;
  storeId?: string;
  merchantId?: string;
  sourceChannel?: string;
  sourceLabel?: string;
  stripeConnectedAccountId: string;
  platformFeePercent: number;
  platformFeeMinor: number;
};

type StripeSession = {
  id: string;
  url: string | null;
  payment_intent?: string | null;
  client_reference_id?: string | null;
  metadata?: UnknownRecord | null;
};

export function clean<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((item) => clean(item)).filter((item) => item !== undefined) as T;
  }

  if (value && typeof value === "object") {
    const output: UnknownRecord = {};
    for (const [key, nestedValue] of Object.entries(value as UnknownRecord)) {
      if (nestedValue === undefined) continue;
      const cleaned = clean(nestedValue);
      if (cleaned !== undefined) output[key] = cleaned;
    }
    return output as T;
  }

  return value;
}

function asRecord(value: unknown): UnknownRecord {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as UnknownRecord) : {};
}

function optionalString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function optionalNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

export async function getRecord(reference: string, storeId?: string) {
  const normalizedReference = String(reference || "").trim();
  const normalizedStoreId = String(storeId || "").trim();

  if (!normalizedReference) {
    return { reference: "", rootRef: null, rootSnap: null, storeRef: null, storeSnap: null, data: null };
  }

  const rootRef = db.collection("integrationOrders").doc(normalizedReference);
  const rootSnap = await rootRef.get();
  const storeRef = normalizedStoreId
    ? db.collection("stores").doc(normalizedStoreId).collection("integrationOrders").doc(normalizedReference)
    : null;
  const storeSnap = storeRef ? await storeRef.get() : null;

  return {
    reference: normalizedReference,
    rootRef,
    rootSnap,
    storeRef,
    storeSnap,
    data: rootSnap.exists ? rootSnap.data() : storeSnap?.exists ? storeSnap.data() : null,
  };
}

export function getPaymentProvider(body: UnknownRecord, currency: string): PaymentProvider {
  const paymentRouting = asRecord(body.paymentRouting);
  const candidates = [
    body.paymentProvider,
    body.payment_provider,
    body.provider,
    paymentRouting.paymentProvider,
  ];

  for (const candidate of candidates) {
    const provider = String(candidate || "").trim().toLowerCase();
    if (["paystack", "stripe", "manual"].includes(provider)) return provider as PaymentProvider;
  }

  return ["EUR", "GBP", "USD"].includes(String(currency || "").trim().toUpperCase()) ? "stripe" : "paystack";
}

export function getStripeConnectedAccount(body: UnknownRecord): string {
  const paymentRouting = asRecord(body.paymentRouting);
  const splitPayment = asRecord(body.splitPayment);
  return (
    optionalString(body.stripeConnectedAccountId) ||
    optionalString(body.stripe_connected_account_id) ||
    optionalString(body.connectedAccountId) ||
    optionalString(body.connected_account_id) ||
    optionalString(paymentRouting.stripeConnectedAccountId) ||
    optionalString(paymentRouting.connectedAccountId) ||
    optionalString(splitPayment.stripeConnectedAccountId)
  );
}

export function getPlatformFeePercent(body: UnknownRecord): number {
  const paymentRouting = asRecord(body.paymentRouting);
  const marketplaceFees = asRecord(body.marketplaceFees);
  const splitPayment = asRecord(body.splitPayment);
  const candidates = [
    body.platformFeePercent,
    body.platform_fee_percent,
    paymentRouting.platformFeePercent,
    marketplaceFees.platformFeePercent,
    splitPayment.platformFeePercent,
  ];

  const value = candidates.map(optionalNumber).find((candidate) => candidate !== null) ?? 3;
  return Math.min(25, Math.max(0, value));
}

export function calculatePlatformFeeMinor(amountMinor: number, percent: number): number {
  return Math.round(amountMinor * percent / 100);
}

function metadataValue(value: unknown): string {
  if (value === undefined || value === null) return "";
  return String(value);
}

function appendMetadata(params: URLSearchParams, prefix: string, metadata: UnknownRecord) {
  for (const [key, value] of Object.entries(metadata)) {
    params.append(`${prefix}[${key}]`, metadataValue(value));
  }
}

export async function initializeStripeConnectCheckout(input: StripeCheckoutInput): Promise<StripeSession> {
  const secretKey = STRIPE_SECRET_KEY.value();
  if (!secretKey) throw new Error("Missing Stripe secret key");
  if (!input.stripeConnectedAccountId) throw new Error("Missing Stripe connected account id");

  const metadata = clean({
    storeId: input.storeId,
    merchantId: input.merchantId,
    reference: input.reference,
    paymentReference: input.paymentReference || input.reference,
    sedifexOrderId: input.sedifexOrderId,
    sourceChannel: input.sourceChannel,
    sourceLabel: input.sourceLabel,
    paymentProvider: "stripe",
    stripeConnectedAccountId: input.stripeConnectedAccountId,
    platformFeePercent: input.platformFeePercent,
    platformFeeMinor: input.platformFeeMinor,
  });

  const params = new URLSearchParams();
  params.append("mode", "payment");
  params.append("line_items[0][price_data][currency]", input.currency.toLowerCase());
  params.append("line_items[0][price_data][unit_amount]", String(input.amountMinor));
  params.append("line_items[0][price_data][product_data][name]", input.productName || "Sedifex order");
  params.append("line_items[0][quantity]", "1");
  params.append("payment_intent_data[application_fee_amount]", String(input.platformFeeMinor));
  params.append("success_url", input.successUrl);
  params.append("cancel_url", input.cancelUrl);
  params.append("client_reference_id", input.reference);
  if (input.customerEmail) params.append("customer_email", input.customerEmail);
  appendMetadata(params, "metadata", metadata as UnknownRecord);
  appendMetadata(params, "payment_intent_data[metadata]", metadata as UnknownRecord);

  const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Stripe-Account": input.stripeConnectedAccountId,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params,
  });

  const payload = await response.json() as StripeSession & { error?: { message?: string } };
  if (!response.ok) {
    throw new Error(payload.error?.message || "Unable to create Stripe Checkout session");
  }
  return payload;
}

function parseStripeSignature(header: string) {
  const parts = header.split(",").map((part) => part.trim()).filter(Boolean);
  const timestamp = parts.find((part) => part.startsWith("t="))?.slice(2) || "";
  const signatures = parts.filter((part) => part.startsWith("v1=")).map((part) => part.slice(3));
  return { timestamp, signatures };
}

function safeEqualHex(a: string, b: string): boolean {
  try {
    const left = Buffer.from(a, "hex");
    const right = Buffer.from(b, "hex");
    return left.length === right.length && crypto.timingSafeEqual(left, right);
  } catch {
    return false;
  }
}

function verifyStripeSignature(rawBody: Buffer, signatureHeader: string, webhookSecret: string): boolean {
  const { timestamp, signatures } = parseStripeSignature(signatureHeader);
  if (!timestamp || signatures.length === 0) return false;

  const signedPayload = Buffer.concat([Buffer.from(`${timestamp}.`, "utf8"), rawBody]);
  const expected = crypto.createHmac("sha256", webhookSecret).update(signedPayload).digest("hex");
  return signatures.some((signature) => safeEqualHex(signature, expected));
}

function extractReference(metadata: UnknownRecord, object: UnknownRecord): string {
  return (
    optionalString(metadata.reference) ||
    optionalString(metadata.paymentReference) ||
    optionalString(metadata.sedifexOrderId) ||
    optionalString(object.client_reference_id)
  );
}

function successUpdateFields(now: FirebaseFirestore.FieldValue) {
  return clean({
    paymentStatus: "paid",
    payment_status: "paid",
    orderStatus: "confirmed",
    order_status: "confirmed",
    status: "confirmed",
    provider: "stripe",
    paymentProvider: "stripe",
    payment_provider: "stripe",
    paymentConfirmedAt: now,
    syncStatus: "pending",
    updatedAt: now,
  });
}

function failureUpdateFields(now: FirebaseFirestore.FieldValue) {
  return clean({
    paymentStatus: "failed",
    payment_status: "failed",
    orderStatus: "payment_failed",
    order_status: "payment_failed",
    status: "payment_failed",
    provider: "stripe",
    paymentProvider: "stripe",
    payment_provider: "stripe",
    paymentFailedAt: now,
    updatedAt: now,
  });
}

async function updateIntegrationOrder(reference: string, storeId: string, fields: UnknownRecord) {
  const record = await getRecord(reference, storeId);
  const writes: Promise<unknown>[] = [];
  if (record.rootRef) writes.push(record.rootRef.set(fields, { merge: true }));
  if (record.storeRef) writes.push(record.storeRef.set(fields, { merge: true }));
  await Promise.all(writes);
}

export const stripeWebhook = onRequest({ secrets: [STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET] }, async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).send("Method Not Allowed");
    return;
  }

  const rawBody = Buffer.isBuffer(req.rawBody) ? req.rawBody : null;
  const signatureHeader = String(req.headers["stripe-signature"] || "");
  const webhookSecret = STRIPE_WEBHOOK_SECRET.value();
  if (!rawBody || !signatureHeader || !webhookSecret || !verifyStripeSignature(rawBody, signatureHeader, webhookSecret)) {
    res.status(400).send("Invalid Stripe signature");
    return;
  }

  let event: UnknownRecord;
  try {
    event = JSON.parse(rawBody.toString("utf8"));
  } catch {
    res.status(400).send("Invalid Stripe payload");
    return;
  }

  const eventType = optionalString(event.type);
  const object = asRecord(asRecord(event.data).object);
  const metadata = asRecord(object.metadata);
  const reference = extractReference(metadata, object);
  const storeId = optionalString(metadata.storeId);

  if (!reference) {
    res.status(200).json({ received: true, skipped: "missing_reference" });
    return;
  }

  const now = serverTimestamp();
  if (["checkout.session.completed", "checkout.session.async_payment_succeeded", "payment_intent.succeeded"].includes(eventType)) {
    await updateIntegrationOrder(reference, storeId, successUpdateFields(now));
  } else if (["checkout.session.async_payment_failed", "payment_intent.payment_failed"].includes(eventType)) {
    await updateIntegrationOrder(reference, storeId, failureUpdateFields(now));
  }

  res.status(200).json({ received: true });
});
