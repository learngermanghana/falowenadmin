# Student payment links

Falowen Admin can generate a Paystack checkout link from the Student Directory and apply successful payments back to the Firestore student record automatically.

## Flow

1. Admin opens a student in Student Directory.
2. Admin enters the tuition amount to apply and generates a Paystack link.
3. The backend initializes the transaction with Paystack. The Paystack secret key never reaches the browser.
4. A `payments/{reference}` Firestore document is created with both `tuitionCredit` and `checkoutAmount`.
5. Admin can copy the link or open a prefilled WhatsApp message.
6. Paystack sends `charge.success` to the webhook.
7. Falowen verifies the `x-paystack-signature` HMAC-SHA512 signature and validates the reference, amount, and GHS currency.
8. A Firestore transaction marks the payment paid and updates `paid`, `balanceDue`, `balance`, `paymentStatus`, and last-payment fields on the student.
9. The Student Directory keeps the existing student record realtime listener and refreshes payment history through an authenticated backend endpoint every few seconds, so the admin view updates without a manual page refresh.

## Important accounting rule

`tuitionCredit` is the amount applied to the student's tuition balance. `checkoutAmount` is the amount Paystack charges after Falowen's existing processing-fee sharing rule. Never subtract `checkoutAmount` from the tuition balance.

## Required configuration

The production Firebase Functions secret is named exactly `PAYSTACK_SECRET`. If that secret already exists in Google Cloud Secret Manager for `falowen-examiner-trainer`, reuse it; do not create a duplicate `PAYSTACK_SECRET_KEY` secret.

For a fresh project where the secret does not yet exist, create it with:

```bash
firebase functions:secrets:set PAYSTACK_SECRET --project "$FIREBASE_PROJECT_ID"
```

Optional callback URL:

```bash
PAYSTACK_CALLBACK_URL=https://www.falowen.app
```

Configure the Paystack webhook URL to the deployed Firebase function endpoint:

```text
https://us-central1-falowen-examiner-trainer.cloudfunctions.net/api/payments/paystack-webhook
```

The webhook endpoint must point directly to the Firebase function so Paystack's signed request body reaches the signature verifier unchanged.

## Deployment

`npm run build`, `npm test`, `npm run deploy:falowenadmin`, and the Firebase Functions predeploy hook run the payment patches and then run `node --check functions/index.js`. The payment-link patch also migrates previously generated output: it removes the legacy `PAYSTACK_SECRET_KEY` declaration, refreshes any existing `// BEGIN STUDENT PAYMENT LINKS` block in place, and leaves exactly one current payment backend using `PAYSTACK_SECRET`. This keeps long-lived deployment workspaces safe across patch upgrades.

## Firestore rules

The admin UI does not read the `payments` collection directly. Payment history is returned from the authenticated Firebase backend. This avoids depending on the repository's checked-in Firestore rules, which explicitly warn that they may not match the broader live-project rules.

## Safety guarantees

- Admin link creation requires Falowen admin authentication.
- Payment history also requires Falowen admin authentication.
- Paystack secret key is server-side only.
- Webhook signature is verified before processing.
- Currency and amount must match the generated payment record.
- A paid reference cannot be applied twice.
- Student updates and payment updates happen in the same Firestore transaction.
- Payment history remains in the `payments` collection for audit.
