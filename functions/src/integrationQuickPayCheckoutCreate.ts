import * as admin from "firebase-admin";
import { onRequest } from "firebase-functions/v2/https";
import {
  calculatePlatformFeeMinor,
  clean,
  getPaymentProvider,
  getPlatformFeePercent,
  getStripeConnectedAccount,
  initializeStripeConnectCheckout,
} from "./stripeConnect";

if (admin.apps.length === 0) {
  admin.initializeApp();
}

const db = admin.firestore();
const serverTimestamp = admin.firestore.FieldValue.serverTimestamp;

type UnknownRecord = Record<string, unknown>;

function asRecord(value: unknown): UnknownRecord {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as UnknownRecord) : {};
}

function stringFrom(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function numberFrom(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function generateReference(body: UnknownRecord): string {
  return (
    stringFrom(body.reference) ||
    stringFrom(body.paymentReference) ||
    stringFrom(body.payment_reference) ||
    stringFrom(body.sedifexOrderId) ||
    `sfx_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
  );
}

function getCustomerEmail(body: UnknownRecord): string {
  const customer = asRecord(body.customer);
  return stringFrom(body.customerEmail) || stringFrom(body.customer_email) || stringFrom(customer.email);
}

function getAmountMinor(body: UnknownRecord): number {
  const explicitMinor = numberFrom(body.amountMinor) ?? numberFrom(body.amount_minor);
  if (explicitMinor !== null) return Math.round(explicitMinor);

  const amount = numberFrom(body.amount);
  if (amount === null) throw new Error("amount is required");
  return Math.round(amount * 100);
}

function getAmountMajor(body: UnknownRecord, amountMinor: number): number {
  return numberFrom(body.amount) ?? amountMinor / 100;
}

function getUrl(body: UnknownRecord, keys: string[], fallback: string): string {
  for (const key of keys) {
    const value = stringFrom(body[key]);
    if (value) return value;
  }
  return fallback;
}

async function persistOrder(storeId: string, reference: string, record: UnknownRecord) {
  await Promise.all([
    db.collection("integrationOrders").doc(reference).set(record, { merge: true }),
    db.collection("stores").doc(storeId).collection("integrationOrders").doc(reference).set(record, { merge: true }),
  ]);
}

export const integrationQuickPayCheckoutCreate = onRequest(async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).json({ ok: false, error: "Method Not Allowed" });
    return;
  }

  try {
    const body = asRecord(req.body);
    const storeId = stringFrom(body.storeId) || stringFrom(body.store_id);
    const merchantId = stringFrom(body.merchantId) || stringFrom(body.merchant_id);
    const currency = (stringFrom(body.currency) || "GHS").toUpperCase();
    const amountMinor = getAmountMinor(body);
    const amount = getAmountMajor(body, amountMinor);
    const customerEmail = getCustomerEmail(body);
    const reference = generateReference(body);

    if (!storeId) throw new Error("storeId is required");
    if (!currency) throw new Error("currency is required");
    if (!customerEmail) throw new Error("customer email is required");
    if (!Number.isFinite(amountMinor) || amountMinor <= 0) throw new Error("amount must be greater than zero");

    const paymentProvider = getPaymentProvider(body, currency);
    const stripeConnectedAccountId = getStripeConnectedAccount(body);
    const platformFeePercent = getPlatformFeePercent(body);
    const platformFeeMinor = calculatePlatformFeeMinor(amountMinor, platformFeePercent);

    if (paymentProvider === "stripe") {
      if (!stripeConnectedAccountId) throw new Error("stripeConnectedAccountId is required for Stripe checkout");

      const platformFeeMajor = platformFeeMinor / 100;
      const productName = stringFrom(body.productName) || stringFrom(body.itemName) || "Sedifex order";
      const successUrl = getUrl(body, ["successUrl", "success_url", "callbackUrl", "callback_url"], "https://sedifex.com/payment/success?reference={CHECKOUT_SESSION_ID}");
      const cancelUrl = getUrl(body, ["cancelUrl", "cancel_url"], "https://sedifex.com/payment/cancelled");
      const paymentReference = stringFrom(body.paymentReference) || stringFrom(body.payment_reference) || reference;
      const sedifexOrderId = stringFrom(body.sedifexOrderId) || stringFrom(body.sedifex_order_id) || reference;
      const sourceChannel = stringFrom(body.sourceChannel) || stringFrom(body.source_channel);
      const sourceLabel = stringFrom(body.sourceLabel) || stringFrom(body.source_label);

      const stripeSession = await initializeStripeConnectCheckout({
        amountMinor,
        currency,
        productName,
        successUrl,
        cancelUrl,
        reference,
        paymentReference,
        sedifexOrderId,
        customerEmail,
        storeId,
        merchantId,
        sourceChannel,
        sourceLabel,
        stripeConnectedAccountId,
        platformFeePercent,
        platformFeeMinor,
      });

      const checkoutUrl = stripeSession.url || "";
      const now = serverTimestamp();
      const record = clean({
        ...body,
        storeId,
        merchantId,
        reference,
        paymentReference,
        sedifexOrderId,
        amount,
        amountMinor,
        currency,
        customerEmail,
        provider: "stripe",
        paymentProvider: "stripe",
        payment_provider: "stripe",
        stripeSessionId: stripeSession.id,
        stripePaymentIntentId: stripeSession.payment_intent,
        stripeConnectedAccountId,
        sedifexPlatformFeePercent: platformFeePercent,
        sedifexPlatformFeeMinor: platformFeeMinor,
        sedifexPlatformFeeMajor: platformFeeMajor,
        marketplaceFees: {
          provider: "stripe",
          platformFeePercent,
          platformFeeMinor,
          platformFeeMajor,
          feePaidBy: "seller",
        },
        paymentStatus: "pending",
        payment_status: "pending",
        orderStatus: "pending_payment",
        order_status: "pending_payment",
        status: "pending_payment",
        checkoutUrl,
        authorizationUrl: checkoutUrl,
        createdAt: now,
        updatedAt: now,
        syncStatus: "pending",
      });

      await persistOrder(storeId, reference, record);

      res.status(200).json({
        ok: true,
        provider: "stripe",
        paymentProvider: "stripe",
        reference,
        checkoutUrl,
        authorizationUrl: checkoutUrl,
        stripeSessionId: stripeSession.id,
        stripeConnectedAccountId,
        sedifexPlatformFeePercent: platformFeePercent,
        sedifexPlatformFeeMinor: platformFeeMinor,
        payment_status: "pending",
        order_status: "pending_payment",
      });
      return;
    }

    res.status(501).json({
      ok: false,
      provider: paymentProvider,
      paymentProvider,
      error: "Paystack checkout is not implemented in this TypeScript entrypoint; existing Paystack logic remains in the legacy function.",
    });
  } catch (error) {
    res.status(400).json({ ok: false, error: error instanceof Error ? error.message : String(error) });
  }
});
