# Security

- Supabase RLS is mandatory for tenant-owned data.
- Organization users can access only organizations where they have active membership.
- Public SELECT policies expose only published store/product/media data.
- Super-admin checks are enforced server-side and represented in the database profile role.
- Never expose `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY`, or `STRIPE_WEBHOOK_SECRET` to browser code.
- Verify Stripe webhook signatures and persist processed event IDs for idempotency.
- Never trust totals supplied by the browser. Authoritative product prices and totals are loaded/calculated server-side.
- Snapshot order financial values when the order is created.
- Organization users must not see Creative Ape production cost, internal margin, or confidential platform data.
- Use tenant-scoped storage paths and matching storage policies before enabling uploads.
