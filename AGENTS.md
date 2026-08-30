# AGENTS.md

Before making code changes, read README.md and the docs/ project files once they exist.

Non-negotiables:
1. Preserve multi-tenant isolation.
2. Use Supabase RLS for tenant data access.
3. Never expose service-role or Stripe secret keys to the browser.
4. Snapshot financial values on order items so history does not change when product pricing or commission rules change.
5. Treat Stripe webhooks as authoritative for payment completion and make webhook handling idempotent.
6. Keep Creative Ape internal production costs hidden from organization users.
7. Do not create paid resources or commit secrets.
8. Keep modules maintainable and avoid giant monolithic files.

Before considering a development task complete:
- run lint
- run type checking
- run the production build
- fix failures where possible
- update docs/BUILD_STATUS.md
