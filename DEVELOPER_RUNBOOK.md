# BGV Fashion Developer Runbook

BGV Fashion uses Next.js, React, TypeScript, Drizzle/PostgreSQL and Vercel.

## Payments
BGV uses Paystack and Bachs.

Paystack:
- `src/app/api/checkout/initialize/route.ts`
- `src/app/api/checkout/verify/route.ts`
- `src/app/api/webhooks/paystack/route.ts`

Bachs:
- `src/app/api/checkout/bachs/route.ts`
- `src/app/api/webhooks/bachs/route.ts`

Never mark an order paid from browser state alone. Payment confirmation must be verified server-side.

### Bachs environment variables
```
BACHS_API_KEY=
BACHS_WEBHOOK_SECRET=
BGV_NGN_PER_USD=
```

Keep payment secrets server-only. Never use a `NEXT_PUBLIC_` prefix for secret keys.

## Important files
- `src/app/checkout/page.tsx` — checkout UI
- `src/app/globals.css` — global and Glass UI design
- `src/db/schema.ts` — database schema
- `src/lib/order-email.ts` — order receipts
- `src/lib/bgv-email.ts` — customer emails
- `src/context/StoreContext.tsx` — cart, session and store preferences

## Development
```bash
npm install
npm run dev
npm run build
npm run lint
```

Review database changes before production. Available schema commands include `npm run db:generate` and `npm run db:push`.

## Troubleshooting
For a failed Vercel deployment, inspect the build log first. Keep fixes in small Git commits and avoid changing unrelated working features.

For payment issues, verify environment variables, provider responses, amount/currency checks, callback URLs and webhook signatures. Never commit API keys, passwords, OAuth secrets, email keys or payment credentials.

## Glass UI
Reusable Glass UI classes are in `src/app/globals.css` with `bgv-glass-` and `bgv-payment-` prefixes. Preserve accessible contrast and reduced-motion support.
