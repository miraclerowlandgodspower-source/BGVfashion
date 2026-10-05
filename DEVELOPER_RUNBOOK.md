# BGV Fashion Developer Runbook

This document is the handover guide for developers maintaining BGV Fashion. Keep secrets in Vercel environment variables; never commit live keys or bank credentials.

## Architecture

- Next.js App Router + React + TypeScript
- Drizzle ORM + PostgreSQL
- Vercel hosting
- Paystack hosted checkout
- Resend-compatible email API
- Google Identity sign-in plus verified email/password signup
- Admin portal under /admin

Key areas:
- `src/app/api/checkout/initialize/route.ts` — Paystack order creation
- `src/app/api/checkout/verify/route.ts` — Paystack verification
- `src/app/api/webhooks/paystack/route.ts` — Paystack webhook
- `src/app/api/checkout/bank-transfer/route.ts` — Bacs GBP and international USD transfer orders
- `src/app/checkout/page.tsx` — checkout UI
- `src/lib/order-email.ts` — paid-order receipts
- `src/lib/bgv-email.ts` — OTP, welcome and customer email
- `src/db/schema.ts` — database schema
- `src/context/StoreContext.tsx` — customer session/cart/preferences
- `src/app/globals.css` — global/minimal/glass design system

## Payment rules

Paystack remains the instant/automatically verified payment path. The server calculates product totals and shipping; never trust totals sent by the browser.

Bacs is a UK domestic GBP bank-payment rail. It is not the USD/international rail. BGV exposes:
1. Paystack.
2. Bacs GBP for customers paying from a UK bank account.
3. International USD bank transfer using SWIFT/BIC details.

Bank-transfer orders remain PAYMENT PENDING until an administrator confirms cleared funds. Never mark an order paid merely because a customer says they transferred money or uploads a screenshot.

### Required Vercel variables for Bacs

```
BGV_BACS_ACCOUNT_NAME=
BGV_BACS_BANK_NAME=
BGV_BACS_ACCOUNT_NUMBER=
BGV_BACS_SORT_CODE=
BGV_NGN_PER_GBP=
```

### Required Vercel variables for USD international transfer

```
BGV_USD_ACCOUNT_NAME=
BGV_USD_BANK_NAME=
BGV_USD_ACCOUNT_NUMBER=
BGV_USD_SWIFT_BIC=
BGV_USD_ROUTING_NUMBER=
BGV_USD_BANK_ADDRESS=
BGV_NGN_PER_USD=
```

The NGN-per-currency values are explicit merchant rates used to calculate the exact transfer request. Update them deliberately. Do not hard-code a live exchange rate in source code.

## Existing core environment variables

```
DATABASE_URL=
AUTH_SECRET=
JWT_SECRET=
NEXT_PUBLIC_APP_URL=https://bgvfashion.shop
NEXT_PUBLIC_SITE_URL=https://bgvfashion.shop
ENABLE_ADMIN_PORTAL=true
NEXT_PUBLIC_GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_ID=
EMAIL_API_KEY=
ADMIN_NOTIFICATION_EMAIL=
PAYSTACK_SECRET_KEY=
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

Never prefix a server secret with `NEXT_PUBLIC_`.

## Local development

```bash
npm install
npm run dev
```

Before deploying:

```bash
npm run build
npm run lint
```

If the database schema changes, review the generated migration before applying it. The project exposes `npm run db:generate` and `npm run db:push`; production schema changes should be backed up and reviewed first.

## Payment incident checklist

If Paystack fails:
1. Check the Vercel build/runtime log.
2. Confirm `PAYSTACK_SECRET_KEY` is set for the correct environment.
3. Check the initialize response and Paystack verification response.
4. Confirm the webhook endpoint and signature verification still work.
5. Do not mark an order paid until server-side verification succeeds.

If Bacs/USD transfer fails:
1. Confirm all variables for that rail exist in Vercel.
2. Confirm `BGV_NGN_PER_GBP` or `BGV_NGN_PER_USD` is a positive number.
3. Confirm the bank details belong to BGV before enabling the method.
4. Find the pending order in admin and verify cleared funds against its unique BANK-BGV reference before setting payment status to paid.

## Email safety

Customer emails must not expose the private admin mailbox. Order receipts send the admin copy by BCC. Customer support may intentionally expose the public support address as Reply-To. Never BCC OTP/security codes to admin.

## Glass UI

Reusable classes start with `bgv-glass-` / `bgv-payment-` in `src/app/globals.css`. They use translucent surfaces, blur, subtle borders and shadows. Keep text contrast readable and preserve `prefers-reduced-motion`.

## Recovery

Every production change should be a small Git commit with a descriptive message. If a deployment fails, inspect Vercel build logs before changing code. Revert only the offending commit rather than rewriting unrelated features.

Do not store passwords, API keys, OAuth secrets, SMTP keys or bank credentials in this file or anywhere committed to Git.
