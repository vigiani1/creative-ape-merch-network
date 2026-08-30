import Link from "next/link";
import { ProductCard, type StorefrontProductCardData } from "@/components/storefront/product-card";
import { StorefrontHeader } from "@/components/storefront/storefront-header";
import { SetupRequired } from "@/components/setup-required";
import { hasSupabaseEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

type MediaRef = {
  bucket?: string | null;
  path?: string | null;
  externalUrl?: string | null;
  altText?: string | null;
};

type ProductRow = {
  id: string;
  slug: string;
  name: string;
  priceCents: number;
  primaryImage?: MediaRef | null;
  secondaryImage?: MediaRef | null;
  colors?: { name: string; imageUrl?: string | null }[];
  badge?: string | null;
};

type MerchandisingPage = {
  header?: {
    kind: string;
    name: string;
    slug: string;
    description?: string | null;
    imageUrl?: string | null;
    type?: string | null;
  } | null;
  count?: number;
  products?: ProductRow[];
};

type HomePayload = {
  store: { name: string; slug: string };
  designSystem?: { logoUrl?: string | null; colors?: Record<string, string | null> };
  navigation?: { id?: string; label: string; target: string }[];
};

function mediaPublicUrl(
  supabase: Awaited<ReturnType<typeof createClient>>,
  media?: MediaRef | null,
) {
  if (!media) return null;
  if (media.externalUrl) return media.externalUrl;
  if (!media.path) return null;
  return supabase.storage.from(media.bucket || "product-media").getPublicUrl(media.path).data.publicUrl;
}

export default async function CollectionDetail({
  params,
}: {
  params: Promise<{ slug: string; collectionSlug: string }>;
}) {
  const { slug, collectionSlug } = await params;

  if (!hasSupabaseEnv()) {
    return <main className="mx-auto max-w-5xl p-8"><SetupRequired area="Collection detail" /></main>;
  }

  const supabase = await createClient();
  const [{ data: homeData }, { data: pageData }] = await Promise.all([
    supabase.rpc("get_public_storefront_home_render_v5", { target_store_slug: slug }),
    supabase.rpc("get_public_merchandising_page_v2", {
      target_store_slug: slug,
      page_kind: "collection",
      page_slug: collectionSlug,
    }),
  ]);

  const home = homeData as HomePayload | null;
  const page = pageData as MerchandisingPage | null;

  if (!home?.store || !page?.header) {
    return <main className="storefront-empty"><h1>Collection not found</h1></main>;
  }

  const colors = home.designSystem?.colors ?? {};
  const products = page.products ?? [];
  const headerImage = page.header.imageUrl;

  const toCard = (product: ProductRow): StorefrontProductCardData => ({
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

      <section className={headerImage ? "collection-hero collection-hero--image" : "collection-hero"}>
        {headerImage ? <img src={headerImage} alt="" className="collection-hero__image" /> : null}
        {headerImage ? <div className="collection-hero__shade" /> : null}
        <div className="collection-hero__content">
          <p className="store-eyebrow">Collection</p>
          <h1>{page.header.name}</h1>
          {page.header.description ? <p>{page.header.description}</p> : null}
          <span>{page.count ?? products.length} products</span>
        </div>
      </section>

      <section className="collection-products">
        {products.length ? (
          <div className="product-grid">
            {products.map((product) => (
              <ProductCard key={product.id} storeSlug={home.store.slug} product={toCard(product)} />
            ))}
          </div>
        ) : (
          <div className="collection-index-empty">
            <h2>No products in this collection yet.</h2>
            <Link href={`/shop/${home.store.slug}/catalog`} className="store-button">Shop all products</Link>
          </div>
        )}
      </section>
    </main>
  );
}
