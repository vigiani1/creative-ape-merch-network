-- Enforce tenant ownership through foreign keys, not only caller-supplied organization_id values.
-- Composite unique constraints provide referenced keys for tenant-consistent relationships.
alter table public.stores add constraint stores_id_organization_unique unique (id, organization_id);
alter table public.products add constraint products_id_organization_unique unique (id, organization_id);
alter table public.product_variants add constraint variants_id_product_organization_unique unique (id, product_id, organization_id);
alter table public.orders add constraint orders_id_organization_unique unique (id, organization_id);
alter table public.order_items add constraint order_items_id_order_organization_unique unique (id, order_id, organization_id);

alter table public.store_themes
  add constraint store_themes_store_tenant_fk foreign key (store_id, organization_id)
  references public.stores (id, organization_id);
alter table public.store_sections
  add constraint store_sections_store_tenant_fk foreign key (store_id, organization_id)
  references public.stores (id, organization_id);
alter table public.brand_assets
  add constraint brand_assets_store_tenant_fk foreign key (store_id, organization_id)
  references public.stores (id, organization_id);
alter table public.products
  add constraint products_store_tenant_fk foreign key (store_id, organization_id)
  references public.stores (id, organization_id);
alter table public.product_variants
  add constraint variants_product_tenant_fk foreign key (product_id, organization_id)
  references public.products (id, organization_id);
alter table public.product_media
  add constraint product_media_product_tenant_fk foreign key (product_id, organization_id)
  references public.products (id, organization_id);
alter table public.revenue_share_rules
  add constraint revenue_rules_store_tenant_fk foreign key (store_id, organization_id)
  references public.stores (id, organization_id),
  add constraint revenue_rules_product_tenant_fk foreign key (product_id, organization_id)
  references public.products (id, organization_id);
alter table public.orders
  add constraint orders_store_tenant_fk foreign key (store_id, organization_id)
  references public.stores (id, organization_id);
alter table public.order_items
  add constraint order_items_order_tenant_fk foreign key (order_id, organization_id)
  references public.orders (id, organization_id),
  add constraint order_items_product_tenant_fk foreign key (product_id, organization_id)
  references public.products (id, organization_id),
  add constraint order_items_variant_product_tenant_fk foreign key (variant_id, product_id, organization_id)
  references public.product_variants (id, product_id, organization_id),
  add constraint order_items_variant_requires_product check (variant_id is null or product_id is not null);
alter table public.payments
  add constraint payments_order_tenant_fk foreign key (order_id, organization_id)
  references public.orders (id, organization_id);
alter table public.ledger_entries
  add constraint ledger_order_tenant_fk foreign key (order_id, organization_id)
  references public.orders (id, organization_id),
  add constraint ledger_order_item_tenant_fk foreign key (order_item_id, order_id, organization_id)
  references public.order_items (id, order_id, organization_id),
  add constraint ledger_item_requires_order check (order_item_id is null or order_id is not null);
alter table public.fulfillment_events
  add constraint fulfillment_order_tenant_fk foreign key (order_id, organization_id)
  references public.orders (id, organization_id);

-- Public storefront reads go exclusively through the narrow SECURITY DEFINER RPCs.
-- Base-table access is authenticated and tenant-scoped so adding a column cannot
-- accidentally expose it to storefront visitors.
drop policy if exists stores_public_read on public.stores;
create policy stores_member_read on public.stores for select to authenticated
using (public.is_org_member(organization_id) or public.is_super_admin());

drop policy if exists themes_public_read on public.store_themes;
create policy themes_member_read on public.store_themes for select to authenticated
using (public.is_org_member(organization_id) or public.is_super_admin());

drop policy if exists sections_public_read on public.store_sections;
create policy sections_member_read on public.store_sections for select to authenticated
using (public.is_org_member(organization_id) or public.is_super_admin());

drop policy if exists brand_assets_read on public.brand_assets;
create policy brand_assets_member_read on public.brand_assets for select to authenticated
using (public.is_org_member(organization_id) or public.is_super_admin());

drop policy if exists media_public_read on public.product_media;
create policy media_member_read on public.product_media for select to authenticated
using (public.is_org_member(organization_id) or public.is_super_admin());

revoke all on function public.organization_sales_summary(uuid) from public;
grant execute on function public.organization_sales_summary(uuid) to authenticated;
