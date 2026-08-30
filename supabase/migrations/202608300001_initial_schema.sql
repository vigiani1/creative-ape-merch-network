create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  platform_role text not null default 'user' check (platform_role in ('user','super_admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  organization_type text not null default 'other' check (organization_type in ('business','school','sports_team','club','nonprofit','event','other')),
  contact_email text,
  contact_phone text,
  logo_url text,
  status text not null default 'active' check (status in ('active','inactive','archived')),
  default_revenue_share_rate numeric(7,4) not null default 0 check (default_revenue_share_rate >= 0 and default_revenue_share_rate <= 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.organization_members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'viewer' check (role in ('admin','viewer')),
  created_at timestamptz not null default now(),
  unique (organization_id, user_id)
);

create table if not exists public.stores (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  slug text not null unique,
  title text,
  description text,
  status text not null default 'draft' check (status in ('draft','published','archived')),
  published_at timestamptz,
  social_links jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.store_themes (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  store_id uuid not null unique references public.stores(id) on delete cascade,
  logo_url text,
  hero_image_url text,
  primary_color text not null default '#111827',
  secondary_color text not null default '#374151',
  accent_color text not null default '#f59e0b',
  background_color text not null default '#ffffff',
  text_color text not null default '#111111',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.store_sections (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  store_id uuid not null references public.stores(id) on delete cascade,
  section_type text not null check (section_type in ('hero','featured_products','product_grid','text_image','video','story','sponsors','announcement','socials','faq')),
  position integer not null default 0,
  is_enabled boolean not null default true,
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.brand_assets (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  store_id uuid references public.stores(id) on delete cascade,
  asset_type text not null check (asset_type in ('logo','artwork','hero','other')),
  storage_path text not null,
  file_name text,
  mime_type text,
  is_public boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.product_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  sku_prefix text,
  description text,
  base_production_cost integer not null default 0 check (base_production_cost >= 0),
  category text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  store_id uuid not null references public.stores(id) on delete cascade,
  product_template_id uuid references public.product_templates(id) on delete set null,
  name text not null,
  slug text not null,
  description text,
  sku text,
  category text,
  status text not null default 'draft' check (status in ('draft','published','archived')),
  retail_price integer not null default 0 check (retail_price >= 0),
  production_cost integer not null default 0 check (production_cost >= 0),
  markup_amount integer generated always as (greatest(retail_price - production_cost, 0)) stored,
  default_revenue_share_rate numeric(7,4) check (default_revenue_share_rate is null or (default_revenue_share_rate >= 0 and default_revenue_share_rate <= 100)),
  featured boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (store_id, slug)
);

create table if not exists public.product_variants (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  size text,
  color text,
  sku text,
  price_override integer check (price_override is null or price_override >= 0),
  production_cost_override integer check (production_cost_override is null or production_cost_override >= 0),
  inventory_quantity integer,
  availability_status text not null default 'available' check (availability_status in ('available','unavailable','discontinued')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.product_media (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  media_type text not null check (media_type in ('image','video')),
  storage_path text,
  external_url text,
  alt_text text,
  display_order integer not null default 0,
  is_primary boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.revenue_share_rules (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  store_id uuid references public.stores(id) on delete cascade,
  product_id uuid references public.products(id) on delete cascade,
  rule_type text not null check (rule_type in ('gross_percent','net_profit_percent','fixed_per_item','custom')),
  rate numeric(7,4) check (rate is null or (rate >= 0 and rate <= 100)),
  fixed_amount integer check (fixed_amount is null or fixed_amount >= 0),
  priority integer not null default 0,
  effective_from timestamptz not null default now(),
  effective_to timestamptz,
  created_at timestamptz not null default now(),
  check (effective_to is null or effective_to > effective_from)
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  store_id uuid not null references public.stores(id) on delete restrict,
  order_number text not null unique,
  customer_email text,
  customer_name text,
  payment_status text not null default 'pending' check (payment_status in ('pending','paid','partially_refunded','refunded','failed','cancelled')),
  fulfillment_status text not null default 'paid' check (fulfillment_status in ('paid','processing','production','ready','shipped','complete','cancelled','refunded')),
  currency text not null default 'usd',
  subtotal integer not null default 0,
  discount_total integer not null default 0,
  shipping_total integer not null default 0,
  tax_total integer not null default 0,
  grand_total integer not null default 0,
  shipping_address jsonb,
  stripe_checkout_session_id text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  order_id uuid not null references public.orders(id) on delete restrict,
  product_id uuid references public.products(id) on delete set null,
  variant_id uuid references public.product_variants(id) on delete set null,
  name_snapshot text not null,
  sku_snapshot text,
  variant_snapshot jsonb not null default '{}'::jsonb,
  quantity integer not null check (quantity > 0),
  unit_price_snapshot integer not null check (unit_price_snapshot >= 0),
  production_cost_snapshot integer not null default 0 check (production_cost_snapshot >= 0),
  discount_snapshot integer not null default 0 check (discount_snapshot >= 0),
  processing_fee_snapshot integer not null default 0 check (processing_fee_snapshot >= 0),
  shipping_allocation_snapshot integer not null default 0 check (shipping_allocation_snapshot >= 0),
  organization_share_snapshot integer not null default 0,
  creative_ape_share_snapshot integer not null default 0,
  revenue_share_rule_snapshot jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  order_id uuid not null references public.orders(id) on delete restrict,
  provider text not null default 'stripe',
  provider_payment_id text,
  amount integer not null check (amount >= 0),
  currency text not null default 'usd',
  status text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ledger_entries (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  order_id uuid references public.orders(id) on delete restrict,
  order_item_id uuid references public.order_items(id) on delete restrict,
  entry_type text not null check (entry_type in ('sale','production_cost','processing_fee','shipping','discount','refund','organization_share','creative_ape_share','payout','adjustment')),
  amount integer not null,
  currency text not null default 'usd',
  memo text,
  created_at timestamptz not null default now()
);

create table if not exists public.payouts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  amount integer not null check (amount >= 0),
  status text not null default 'pending' check (status in ('pending','processing','paid','failed','cancelled')),
  period_start date,
  period_end date,
  paid_at timestamptz,
  provider_reference text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.fulfillment_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  order_id uuid not null references public.orders(id) on delete cascade,
  status text not null check (status in ('paid','processing','production','ready','shipped','complete','cancelled','refunded')),
  notes text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.stripe_webhook_events (
  id uuid primary key default gen_random_uuid(),
  stripe_event_id text not null unique,
  event_type text not null,
  payload_hash text,
  processed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_org_members_user_org on public.organization_members(user_id, organization_id);
create index if not exists idx_stores_org on public.stores(organization_id);
create index if not exists idx_products_store_status on public.products(store_id, status);
create index if not exists idx_products_org on public.products(organization_id);
create index if not exists idx_variants_product on public.product_variants(product_id);
create index if not exists idx_media_product_order on public.product_media(product_id, display_order);
create index if not exists idx_orders_org_created on public.orders(organization_id, created_at desc);
create index if not exists idx_orders_store_created on public.orders(store_id, created_at desc);
create index if not exists idx_order_items_order on public.order_items(order_id);
create index if not exists idx_ledger_org_created on public.ledger_entries(organization_id, created_at desc);
create index if not exists idx_fulfillment_order_created on public.fulfillment_events(order_id, created_at);

create or replace function public.is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists(select 1 from public.profiles p where p.id = auth.uid() and p.platform_role = 'super_admin');
$$;

create or replace function public.is_org_member(org_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists(select 1 from public.organization_members m where m.organization_id = org_id and m.user_id = auth.uid());
$$;

create or replace function public.is_org_admin(org_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists(select 1 from public.organization_members m where m.organization_id = org_id and m.user_id = auth.uid() and m.role = 'admin');
$$;

revoke all on function public.is_super_admin() from public;
revoke all on function public.is_org_member(uuid) from public;
revoke all on function public.is_org_admin(uuid) from public;
grant execute on function public.is_super_admin() to authenticated;
grant execute on function public.is_org_member(uuid) to authenticated;
grant execute on function public.is_org_admin(uuid) to authenticated;

alter table public.profiles enable row level security;
alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;
alter table public.stores enable row level security;
alter table public.store_themes enable row level security;
alter table public.store_sections enable row level security;
alter table public.brand_assets enable row level security;
alter table public.product_templates enable row level security;
alter table public.products enable row level security;
alter table public.product_variants enable row level security;
alter table public.product_media enable row level security;
alter table public.revenue_share_rules enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.payments enable row level security;
alter table public.ledger_entries enable row level security;
alter table public.payouts enable row level security;
alter table public.fulfillment_events enable row level security;
alter table public.stripe_webhook_events enable row level security;

create policy profiles_self_read on public.profiles for select to authenticated using (id = auth.uid() or public.is_super_admin());
create policy profiles_self_update on public.profiles for update to authenticated using (id = auth.uid() or public.is_super_admin()) with check (id = auth.uid() or public.is_super_admin());

create policy organizations_member_read on public.organizations for select to authenticated using (public.is_org_member(id) or public.is_super_admin());
create policy organizations_super_all on public.organizations for all to authenticated using (public.is_super_admin()) with check (public.is_super_admin());

create policy org_members_read on public.organization_members for select to authenticated using (user_id = auth.uid() or public.is_org_admin(organization_id) or public.is_super_admin());
create policy org_members_admin_write on public.organization_members for all to authenticated using (public.is_org_admin(organization_id) or public.is_super_admin()) with check (public.is_org_admin(organization_id) or public.is_super_admin());

create policy stores_public_read on public.stores for select to anon, authenticated using (status = 'published' or public.is_org_member(organization_id) or public.is_super_admin());
create policy stores_admin_write on public.stores for all to authenticated using (public.is_org_admin(organization_id) or public.is_super_admin()) with check (public.is_org_admin(organization_id) or public.is_super_admin());

create policy themes_public_read on public.store_themes for select to anon, authenticated using (exists(select 1 from public.stores s where s.id = store_id and s.status = 'published') or public.is_org_member(organization_id) or public.is_super_admin());
create policy themes_admin_write on public.store_themes for all to authenticated using (public.is_org_admin(organization_id) or public.is_super_admin()) with check (public.is_org_admin(organization_id) or public.is_super_admin());

create policy sections_public_read on public.store_sections for select to anon, authenticated using ((is_enabled and exists(select 1 from public.stores s where s.id = store_id and s.status = 'published')) or public.is_org_member(organization_id) or public.is_super_admin());
create policy sections_admin_write on public.store_sections for all to authenticated using (public.is_org_admin(organization_id) or public.is_super_admin()) with check (public.is_org_admin(organization_id) or public.is_super_admin());

create policy brand_assets_read on public.brand_assets for select to anon, authenticated using (is_public or public.is_org_member(organization_id) or public.is_super_admin());
create policy brand_assets_admin_write on public.brand_assets for all to authenticated using (public.is_org_admin(organization_id) or public.is_super_admin()) with check (public.is_org_admin(organization_id) or public.is_super_admin());

create policy templates_super_all on public.product_templates for all to authenticated using (public.is_super_admin()) with check (public.is_super_admin());
create policy templates_member_read on public.product_templates for select to authenticated using (true);

create policy products_public_read on public.products for select to anon, authenticated using ((status = 'published' and exists(select 1 from public.stores s where s.id = store_id and s.status = 'published')) or public.is_org_member(organization_id) or public.is_super_admin());
create policy products_admin_write on public.products for all to authenticated using (public.is_org_admin(organization_id) or public.is_super_admin()) with check (public.is_org_admin(organization_id) or public.is_super_admin());

create policy variants_public_read on public.product_variants for select to anon, authenticated using (exists(select 1 from public.products p join public.stores s on s.id = p.store_id where p.id = product_id and p.status = 'published' and s.status = 'published') or public.is_org_member(organization_id) or public.is_super_admin());
create policy variants_admin_write on public.product_variants for all to authenticated using (public.is_org_admin(organization_id) or public.is_super_admin()) with check (public.is_org_admin(organization_id) or public.is_super_admin());

create policy media_public_read on public.product_media for select to anon, authenticated using (exists(select 1 from public.products p join public.stores s on s.id = p.store_id where p.id = product_id and p.status = 'published' and s.status = 'published') or public.is_org_member(organization_id) or public.is_super_admin());
create policy media_admin_write on public.product_media for all to authenticated using (public.is_org_admin(organization_id) or public.is_super_admin()) with check (public.is_org_admin(organization_id) or public.is_super_admin());

create policy revenue_rules_super_all on public.revenue_share_rules for all to authenticated using (public.is_super_admin()) with check (public.is_super_admin());
create policy revenue_rules_member_read on public.revenue_share_rules for select to authenticated using (public.is_org_member(organization_id) or public.is_super_admin());

create policy orders_member_read on public.orders for select to authenticated using (public.is_org_member(organization_id) or public.is_super_admin());
create policy orders_super_write on public.orders for all to authenticated using (public.is_super_admin()) with check (public.is_super_admin());

-- Order items contain confidential internal cost snapshots. Organization users do not receive direct SELECT access.
create policy order_items_super_all on public.order_items for all to authenticated using (public.is_super_admin()) with check (public.is_super_admin());
create policy payments_super_all on public.payments for all to authenticated using (public.is_super_admin()) with check (public.is_super_admin());
create policy ledger_super_all on public.ledger_entries for all to authenticated using (public.is_super_admin()) with check (public.is_super_admin());

create policy payouts_member_read on public.payouts for select to authenticated using (public.is_org_member(organization_id) or public.is_super_admin());
create policy payouts_super_write on public.payouts for all to authenticated using (public.is_super_admin()) with check (public.is_super_admin());

create policy fulfillment_member_read on public.fulfillment_events for select to authenticated using (public.is_org_member(organization_id) or public.is_super_admin());
create policy fulfillment_admin_write on public.fulfillment_events for all to authenticated using (public.is_org_admin(organization_id) or public.is_super_admin()) with check (public.is_org_admin(organization_id) or public.is_super_admin());

create policy webhook_super_read on public.stripe_webhook_events for select to authenticated using (public.is_super_admin());

create or replace function public.organization_sales_summary(org_id uuid)
returns table(gross_sales bigint, order_count bigint, organization_share bigint, outstanding_payouts bigint)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not (public.is_org_member(org_id) or public.is_super_admin()) then
    raise exception 'not authorized';
  end if;

  return query
  select
    coalesce((select sum(o.grand_total)::bigint from public.orders o where o.organization_id = org_id and o.payment_status in ('paid','partially_refunded')), 0),
    coalesce((select count(*)::bigint from public.orders o where o.organization_id = org_id and o.payment_status in ('paid','partially_refunded')), 0),
    coalesce((select sum(li.amount)::bigint from public.ledger_entries li where li.organization_id = org_id and li.entry_type = 'organization_share'), 0),
    coalesce((select sum(p.amount)::bigint from public.payouts p where p.organization_id = org_id and p.status in ('pending','processing')), 0);
end;
$$;

grant execute on function public.organization_sales_summary(uuid) to authenticated;
