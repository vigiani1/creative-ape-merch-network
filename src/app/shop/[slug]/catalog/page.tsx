import { ProductCard, type StorefrontProductCardData } from "@/components/storefront/product-card";
import { StorefrontHeader } from "@/components/storefront/storefront-header";
import { MobileFilterSheet } from "@/components/storefront/mobile-filter-sheet";
import { SetupRequired } from "@/components/setup-required";
import { hasSupabaseEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

type MediaRef = { bucket?: string | null; path?: string | null; externalUrl?: string | null };
type CatalogProduct = {
  id: string;
  slug: string;
  name: string;
  priceCents: number;
  primaryImage?: MediaRef | null;
  secondaryImage?: MediaRef | null;
  colors?: { name: string; imageUrl?: string | null }[];
  sizes?: string[];
  badge?: string | null;
  inStock?: boolean;
};
type HomePayload = {
  store: { name: string; slug: string };
  designSystem?: { logoUrl?: string | null; colors?: Record<string,string | null> };
  navigation?: { id?: string; label: string; target: string }[];
};
type FiltersPayload = {
  total?: number;
  categories?: { name: string; slug: string; count: number }[];
  sizes?: { name?: string; size?: string; count: number }[];
  colors?: { name?: string; color?: string; count: number }[];
  collections?: { name: string; slug: string; count: number }[];
};

function mediaPublicUrl(supabase: Awaited<ReturnType<typeof createClient>>, media?: MediaRef | null) {
  if (!media) return null;
  if (media.externalUrl) return media.externalUrl;
  if (!media.path) return null;
  return supabase.storage.from(media.bucket || "product-media").getPublicUrl(media.path).data.publicUrl;
}

export default async function CatalogPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { slug } = await params;
  const query = await searchParams;

  if (!hasSupabaseEnv()) {
    return <main className="mx-auto max-w-5xl p-8"><SetupRequired area="Store catalog" /></main>;
  }

  const search = typeof query.q === "string" ? query.q : "";
  const category = typeof query.category === "string" ? query.category : null;
  const sort = typeof query.sort === "string" ? query.sort : "featured";
  const availability = query.stock === "1" ? "in_stock" : null;

  const supabase = await createClient();
  const [{ data: homeData }, { data: catalogData }, { data: filterData }] = await Promise.all([
    supabase.rpc("get_public_storefront_home_render_v5", { target_store_slug: slug }),
    supabase.rpc("get_public_storefront_catalog_v3", {
      target_store_slug: slug,
      category_slug_filter: category ?? undefined,
      search_query: search || undefined,
      availability_filter: availability ?? undefined,
      sort_key: sort,
      result_limit: 120,
      result_offset: 0,
    }),
    supabase.rpc("get_public_storefront_filters_v2", { target_store_slug: slug }),
  ]);

  const home = homeData as HomePayload | null;
  const catalog = catalogData as { count?: number; products?: CatalogProduct[] } | null;
  const filters = filterData as FiltersPayload | null;

  if (!home?.store) return <main className="storefront-empty"><h1>Store not found</h1></main>;

  const products = catalog?.products ?? [];
  const colors = home.designSystem?.colors ?? {};
  const toCard = (product: CatalogProduct): StorefrontProductCardData => ({
    id: product.id,
    slug: product.slug,
    name: product.name,
    priceCents: product.priceCents,
    primaryImageUrl: mediaPublicUrl(supabase, product.primaryImage),
    secondaryImageUrl: mediaPublicUrl(supabase, product.secondaryImage),
    colors: product.colors,
    badge: product.badge,
  });

  return (
    <main
      className="storefront"
      style={{
        "--store-bg": colors.background || "#ffffff",
        "--store-text": colors.text || "#111111",
        "--store-primary": colors.primary || "#111827",
        "--store-accent": colors.accent || "#f59e0b",
      } as React.CSSProperties}
    >
      <StorefrontHeader
        storeSlug={home.store.slug}
        storeName={home.store.name}
        logoUrl={home.designSystem?.logoUrl}
        navigation={home.navigation ?? []}
      />

      <section className="catalog-head">
        <p className="store-eyebrow">Shop</p>
        <div className="catalog-head__row">
          <h1>{category ? filters?.categories?.find((item) => item.slug === category)?.name ?? "Shop" : "All Products"}</h1>
          <p>{catalog?.count ?? products.length} products</p>
        </div>
      </section>

      <section className="catalog-controls" aria-label="Product filters">
        <MobileFilterSheet
          storeSlug={home.store.slug}
          categories={filters?.categories ?? []}
          category={category}
          search={search}
          sort={sort}
          inStock={Boolean(availability)}
        />
        <form className="catalog-controls__search" action={`/shop/${home.store.slug}/catalog`}>
          {category ? <input type="hidden" name="category" value={category} /> : null}
          {sort !== "featured" ? <input type="hidden" name="sort" value={sort} /> : null}
          <input
            type="search"
            name="q"
            defaultValue={search}
            placeholder="Search products"
            aria-label="Search products"
            autoFocus={query.focus === "search"}
          />
          <button type="submit">Search</button>
        </form>

        <div className="catalog-controls__group">
          <details className="catalog-filter">
            <summary>Category</summary>
            <div className="catalog-filter__menu">
              <a href={`/shop/${home.store.slug}/catalog`} className={!category ? "is-active" : ""}>All products</a>
              {(filters?.categories ?? []).map((item) => (
                <a
                  key={item.slug}
                  href={`/shop/${home.store.slug}/catalog?category=${encodeURIComponent(item.slug)}`}
                  className={category === item.slug ? "is-active" : ""}
                >
                  <span>{item.name}</span><span>{item.count}</span>
                </a>
              ))}
            </div>
          </details>

          <a
            href={`/shop/${home.store.slug}/catalog?${new URLSearchParams({
              ...(category ? { category } : {}),
              ...(search ? { q: search } : {}),
              ...(availability ? {} : { stock: "1" }),
              ...(sort !== "featured" ? { sort } : {}),
            }).toString()}`}
            className={availability ? "catalog-filter-button is-active" : "catalog-filter-button"}
          >
            In stock
          </a>
        </div>

        <form className="catalog-sort" action={`/shop/${home.store.slug}/catalog`}>
          {category ? <input type="hidden" name="category" value={category} /> : null}
          {search ? <input type="hidden" name="q" value={search} /> : null}
          {availability ? <input type="hidden" name="stock" value="1" /> : null}
          <label htmlFor="sort">Sort</label>
          <select id="sort" name="sort" defaultValue={sort}>
            <option value="featured">Featured</option>
            <option value="newest">Newest</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="name_asc">Name: A to Z</option>
          </select>
          <button type="submit">Apply</button>
        </form>
      </section>

      {(category || search || availability) ? (
        <div className="catalog-applied">
          <span>Applied:</span>
          {category ? (
            <a href={`/shop/${home.store.slug}/catalog`} className="catalog-chip">
              {filters?.categories?.find((item) => item.slug === category)?.name ?? category} ×
            </a>
          ) : null}
          {search ? (
            <a href={`/shop/${home.store.slug}/catalog${category ? `?category=${encodeURIComponent(category)}` : ""}`} className="catalog-chip">
              “{search}” ×
            </a>
          ) : null}
          {availability ? (
            <a
              href={`/shop/${home.store.slug}/catalog?${new URLSearchParams({
                ...(category ? { category } : {}),
                ...(search ? { q: search } : {}),
                ...(sort !== "featured" ? { sort } : {}),
              }).toString()}`}
              className="catalog-chip"
            >
              In stock ×
            </a>
          ) : null}
          <a href={`/shop/${home.store.slug}/catalog`} className="catalog-clear-all">Clear all</a>
        </div>
      ) : null}

      <section className="catalog-results">
        {products.length ? (
          <div className="product-grid">
            {products.map((product) => (
              <ProductCard key={product.id} storeSlug={home.store.slug} product={toCard(product)} />
            ))}
          </div>
        ) : (
          <div className="catalog-empty">
            <h2>No products found</h2>
            <p>Try removing a filter or searching for something else.</p>
            <a href={`/shop/${home.store.slug}/catalog`} className="store-button">Clear filters</a>
          </div>
        )}
      </section>
    </main>
  );
}
