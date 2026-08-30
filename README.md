# Creative Ape Merch Network

A multi-tenant merchandise storefront SaaS for Creative Ape Branding.

Creative Ape creates branded micro-stores for businesses, schools, sports teams, clubs, nonprofits, events, and community groups. Customers buy merchandise through those stores. Creative Ape handles merchandise, printing, production, fulfillment, payments, reporting, and revenue sharing.

## Stack
- Next.js 16 App Router
- React 19
- TypeScript
- Tailwind CSS 4
- Supabase Postgres, Auth, Storage, RLS
- Stripe
- Vercel

## Core architecture
One application serves many organization storefronts. Tenant-owned records are scoped by organization and protected with RLS. Public visitors only read published store/product data. Creative Ape super admins can manage the entire network, while organization admins are restricted to their own organization.

Financial history is snapshot-based. Retail price, production cost, discounts, fee allocations, and revenue-share amounts are stored on order items at the time of sale so later pricing changes never rewrite history.

## Routes
Public:
- `/shop/[slug]`
- `/shop/[slug]/products/[productSlug]`

Creative Ape admin:
- `/admin`
- `/admin/organizations`
- `/admin/stores`
- `/admin/products`
- `/admin/orders`
- `/admin/fulfillment`
- `/admin/reports`
- `/admin/settings`

Organization portal:
- `/portal`
- `/portal/dashboard`
- `/portal/orders`
- `/portal/reports`
- `/portal/payouts`

## Local setup
1. Install Node.js 20.9+.
2. Run `npm install`.
3. Copy `.env.example` to `.env.local`.
4. Create or use a Supabase project.
5. Run the SQL migration in `supabase/migrations/202608300001_initial_schema.sql` in Supabase SQL Editor or with the Supabase CLI.
6. Fill in the Supabase environment values.
7. Add Stripe test keys when you are ready to test checkout.
8. Run `npm run dev`.

## Validation
Run:
- `npm run lint`
- `npm run typecheck`
- `npm run build`

## Project documentation
See `docs/` before making architecture changes. `docs/BUILD_STATUS.md` is the living implementation tracker.
