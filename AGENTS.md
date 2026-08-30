# Creative Ape Merch Network agent guide

Before changing code, read these files in order:
1. README.md
2. docs/PRODUCT_SPEC.md
3. docs/ARCHITECTURE.md
4. docs/DATABASE.md
5. docs/SECURITY.md
6. docs/ROADMAP.md
7. docs/BUILD_STATUS.md

Non-negotiables:
- Preserve multi-tenant isolation.
- Use Supabase RLS for tenant-owned data.
- Never expose service-role or Stripe secret keys to the browser.
- Snapshot financial values on order items so historical results never change when product pricing or revenue-share rules change.
- Treat Stripe webhooks as authoritative for payment completion and make webhook processing idempotent.
- Keep Creative Ape internal production costs and margins hidden from organization users.
- Do not create paid resources or commit secrets.
- Prefer small maintainable modules over monolithic files.
- Public routes may only expose explicitly published store/product data.

Before a development task is considered complete:
- run `npm run lint`
- run `npm run typecheck`
- run `npm run build`
- fix failures where possible
- update docs/BUILD_STATUS.md
