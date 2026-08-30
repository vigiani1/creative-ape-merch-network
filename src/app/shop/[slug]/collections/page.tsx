import Link from "next/link";
import { StorefrontHeader } from "@/components/storefront/storefront-header";
import { SetupRequired } from "@/components/setup-required";
import { hasSupabaseEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

type HomePayload = {
  store: { name: string; slug: string };
  designSystem?: { logoUrl?: string | null; colors?: Record<string, string | null> };
  navigation?: { id?: string; label: string; target: string }[];
};

type CollectionFilter = {
  name: string;
  slug: string;
  count: number;
};

type FiltersPayload = {
  collections?: CollectionFilter[];
};

export default async function CollectionsIndex({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  if (!hasSupabaseEnv()) {
    return <main className="mx-auto max-w-5xl p-8"><SetupRequired area="Collections" /></main>;
  }

  const supabase = await createClient();
  const [{ data: homeData }, { data: filterData }] = await Promise.all([
    supabase.rpc("get_public_storefront_home_render_v5", { target_store_slug: slug }),
    supabase.rpc("get_public_storefront_filters_v2", { target_store_slug: slug }),
  ]);

  const home = homeData as HomePayload | null;
  const filters = filterData as FiltersPayload | null;

  if (!home?.store) return <main className="storefront-empty"><h1>Store not found</h1></main>;

  const colors = home.designSystem?.colors ?? {};
  const collections = filters?.collections ?? [];

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

      <section className="collection-index-head">
        <p className="store-eyebrow">Collections</p>
        <h1>Shop by story, season, team, and event.</h1>
      </section>

      <section className="collection-index-grid">
        {collections.length ? collections.map((collection, index) => (
          <Link
            key={collection.slug}
            href={`/shop/${home.store.slug}/collections/${collection.slug}`}
            className={`collection-index-card ${index === 0 ? "collection-index-card--featured" : ""}`}
          >
            <span className="collection-index-card__count">{collection.count} products</span>
            <span className="collection-index-card__name">{collection.name}</span>
            <span className="collection-index-card__action">View collection →</span>
          </Link>
        )) : (
          <div className="collection-index-empty">
            <h2>No collections yet.</h2>
            <p>Products are still available in the main shop.</p>
            <Link href={`/shop/${home.store.slug}/catalog`} className="store-button">Shop all products</Link>
          </div>
        )}
      </section>

      <footer className="store-footer">
        <div>
          <strong>{home.store.name}</strong>
          <p>Official merchandise powered by Creative Ape Branding.</p>
        </div>
        <div className="store-footer__links">
          <Link href={`/shop/${home.store.slug}/catalog`}>Shop</Link>
          <Link href="/cart">Cart</Link>
        </div>
      </footer>
    </main>
  );
}
