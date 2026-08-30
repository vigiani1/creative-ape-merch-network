# Database design

Core tables:
- profiles
- organizations
- organization_members
- stores
- store_themes
- store_sections
- brand_assets
- product_templates
- products
- product_variants
- product_media
- revenue_share_rules
- orders
- order_items
- payments
- ledger_entries
- payouts
- fulfillment_events
- stripe_webhook_events

Money is stored as integer cents in USD for the MVP. Rates are stored as numeric percentages where 10.0000 means 10%.

Order items snapshot all financial inputs needed to preserve history. `ledger_entries` is append-oriented. Tenant-owned tables have RLS enabled.

Organization users do not receive direct read access to internal-cost-bearing order-item financial columns. Safe reports should be exposed through guarded RPCs/views that return organization-facing metrics only.
