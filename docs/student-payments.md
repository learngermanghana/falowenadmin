# Student payment links

Falowen Admin student payment links use Paystack through the Firebase Functions backend.

## Firebase secret

The production Google Cloud / Firebase secret is named exactly:

`PAYSTACK_SECRET`

Do not rename the production dependency to `PAYSTACK_SECRET_KEY` and do not add the Paystack secret to React, Vercel frontend variables, source code, README examples containing a real value, or GitHub Actions plaintext.

The payment patch binds Firebase Functions to `defineSecret("PAYSTACK_SECRET")`. `PAYSTACK_SECRET_KEY` is accepted only as a local/legacy process environment fallback and is not the production Secret Manager resource name.

## Production route

Student Directory calls:

- `POST /api/payments/create-link`
- `GET /api/payments/student/:studentId`

Vercel forwards `/api/payments/*` to the Falowen Firebase API. The Firebase function therefore must be successfully deployed after payment-backend changes; a frontend-only Vercel deployment is not enough.

## Webhook

Configure Paystack to send events to:

`https://us-central1-falowen-examiner-trainer.cloudfunctions.net/api/payments/paystack-webhook`

Only signed Paystack events are accepted, and only Falowen references beginning with `FAL-` are processed.

## Deployment safety

Before deploying, the repository predeploy patches must generate the payment routes and bind `PAYSTACK_SECRET`. The student payment regression test guards the production secret name so a future change does not accidentally switch the function back to a different missing secret name.
