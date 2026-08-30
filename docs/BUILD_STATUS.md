# Build status

## Completed in repository foundation
- Project architecture and product specification
- Current Next.js/React/Tailwind package foundation
- Supabase SSR browser/server/admin clients
- Supabase session proxy foundation
- Admin navigation shell and placeholder sections
- Organization portal shell and placeholder sections
- Public store route backed by published Supabase data
- Public product-detail route with variants
- Stripe Checkout route foundation using server-side product pricing
- Stripe webhook signature verification/idempotency-record foundation
- Initial multi-tenant SQL schema and RLS migration
- Environment variable template
- Security and roadmap documentation

## Needs validation in Codex/runtime
- `npm install`
- lint
- TypeScript typecheck
- production build
- package compatibility corrections if current package APIs changed

## Next milestone
- Apply migration to the actual Supabase project
- Configure environment variables
- Implement Supabase Auth sign-in flow and role guards
- Implement organization/store/product CRUD
- Implement Supabase Storage upload policies and UI
- Add real cart/order creation before enabling checkout

## Not yet production-complete
Checkout currently creates a Stripe Checkout Session from authoritative published product prices, but it does not yet create the complete immutable order/ledger record before redirect. That is intentionally left for the commerce milestone so money movement is not enabled until the transaction model is tested end to end.
