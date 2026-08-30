# Build status

## Validated baseline (2026-08-30)
- Implemented Supabase email/password sign-in and sign-out with server actions, generic credential errors, safe post-login destinations, and SSR-managed auth cookies.
- Added server-enforced authorization guards to every `/admin` and `/portal` route. Admin access requires the authenticated user's `profiles.platform_role` to be `super_admin`; portal access requires at least one RLS-visible organization membership, and the helper returns only those organization IDs for future scoped queries.
- Added proxy-level unauthenticated redirects to `/login` while retaining the protected layouts as the role/membership authorization boundary. Authenticated users without access receive a safe access-denied screen.
- Installed the pinned dependencies and committed a reproducible npm lockfile.
- Aligned TypeScript with the version range supported by Next.js 16's ESLint toolchain.
- Added explicit public Supabase RPC result types so strict TypeScript validation succeeds without pretending that an ungenerated database schema is type-safe.
- Confirmed the Next.js 16 `proxy.ts` entry point and Supabase SSR cookie adapter use the current request/response cookie-refresh pattern. The server client delegates Server Component cookie-write failures to the proxy, and authentication checks use `getClaims()` rather than trusting `getSession()`.
- Restricted Stripe client initialization to `sk_test_` secret keys, bounded and validated Checkout input, rejected duplicate product lines, continued to load prices from published database data, and stopped returning provider/internal errors to callers.
- Confirmed the webhook route verifies the signature against the unmodified request body and records Stripe event IDs uniquely. Foundation-only events are no longer marked processed before a real handler exists.
- Added database-enforced tenant consistency across store, product, variant, order, item, payment, ledger, and fulfillment relationships, preventing a valid tenant ID from being paired with another tenant's related record.
- Removed anonymous access to storefront base tables. Public access is limited to the explicitly projected, published-store RPCs; authenticated base-table access remains RLS tenant-scoped.
- Confirmed internal product/template costs, order-item financial snapshots, payments, and ledger entries have no organization-member SELECT policy. The organization summary RPC returns only approved aggregate values and now has an explicit authenticated-only execution grant.
- `npm run lint`, `npm run typecheck`, and `npm run build` pass.

## Security and architecture concerns intentionally remaining
- Organization/product CRUD is not implemented. All future portal queries must use the organization IDs returned by the server membership guard and remain protected by RLS; never accept a client-selected organization ID without server validation.
- Checkout is a test-mode foundation, not a complete commerce flow. It does not create immutable orders, order-item snapshots, or ledger entries before redirecting to Stripe. Do not expose the route outside controlled test environments until that transactional write path exists.
- The webhook currently verifies and deduplicates events but does not apply payment, refund, order, or ledger state. A later handler must claim/process events transactionally and set `processed_at` only after successful idempotent processing.
- Storage buckets and tenant-path storage policies have not been created. Do not enable uploads until both exist and have been tested for cross-tenant denial.
- Generated Supabase TypeScript database types are not available until a real project/local database is connected. Replace the narrow handwritten public RPC result types with generated types after migrations are applied.
- The migrations were statically reviewed in this environment but still need execution against a disposable/local Supabase database before the production project is touched.
- Rate limiting and abuse controls are not yet present on public Checkout or webhook endpoints.

## Supabase configuration required next
Create `.env.local` (never commit it) with exactly:
- `NEXT_PUBLIC_SUPABASE_URL`: the project API URL (safe for browser use).
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`: the project's publishable key (safe for browser use; use the legacy anon key only if the project has not migrated to publishable keys).
- `SUPABASE_SERVICE_ROLE_KEY`: the server-only service-role key, used only by trusted webhook/backend code.
- `NEXT_PUBLIC_APP_URL`: the canonical local/deployment origin, for example `http://localhost:3000`.

Then:
1. Apply every migration in `supabase/migrations` in filename order to a disposable/local project first.
2. Configure Supabase Auth Site URL to the canonical app origin and add only required local/preview redirect URLs.
3. Create private `brand-assets` and `product-media` buckets and tenant-prefixed storage RLS policies before adding uploads.
4. Generate checked TypeScript database types from the migrated schema.
5. Create the first super-admin profile through a controlled server/SQL administrative procedure; never expose role assignment to a browser mutation.

## Stripe test-mode configuration required later
Keep Stripe disconnected for this baseline. When the immutable order/ledger milestone is ready, configure only test-mode values in `.env.local`/the server deployment environment:
- `STRIPE_SECRET_KEY=sk_test_...` (server only; live keys are rejected by the application).
- `STRIPE_WEBHOOK_SECRET=whsec_...` from the test webhook endpoint or Stripe CLI listener (server only).
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...` only if a later browser-side Stripe integration actually uses it.
- `NEXT_PUBLIC_APP_URL` set to the exact trusted origin used for Checkout return URLs.

Create a Stripe **test-mode** webhook endpoint for `/api/stripe/webhook`. Subscribe only to events implemented by the future commerce handler (initially Checkout completion/expiration plus payment and refund events selected by that design), verify signatures, and keep webhook processing idempotent. Do not add live keys, enable live payments, or enable automatic payouts during foundation work.

## Recommended next implementation task (do not begin yet)
Exercise authentication and the deployed RLS policies with a test matrix (anonymous, organization member/admin, another tenant, and super admin), then begin the organization/store/product CRUD milestone with server-validated tenant scoping.
