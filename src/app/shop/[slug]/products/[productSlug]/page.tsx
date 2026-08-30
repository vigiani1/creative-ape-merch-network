import Link from "next/link";
import { StorefrontHeader } from "@/components/storefront/storefront-header";
import { ProductDetailExperience } from "@/components/storefront/product-detail-experience";
import { SetupRequired } from "@/components/setup-required";
import { hasSupabaseEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

type HomePayload = {
  store: { name: string; slug: string };
  designSystem?: { logoUrl?: string | null; colors?: Record<string, string | null> };
  navigation?: { id?: string; label: string; target: string }[];
};

type MediaItem = {
  id: string;
  bucket?: string | null;
  path?: string | null;
  externalUrl?: string | null;
  altText?: string | null;
  isPrimary?: boolean;
};

type ProductDetail = {
  product: {
    id: string;
    slug: string;
    name: string;
    description?: string | null;
    priceCents: number;
    category?: string | null;
  };
  media?: MediaItem[];
  colors?: { name: string; imageUrl?: string | null }[];
  sizes?: string[];
  availability?: {
    id: string;
    size?: string | null;
    color?: string | null;
    sku?: string | null;
    quantity?: number | null;
    status?: string | null;
    priceCents: number;
  }[];
  collections?: { name: string; slug: string; type?: string }[];
};

function mediaPublicUrl(
  supabase: Awaited<ReturnType<typeof createClient>>,
  media?: MediaItem,
) {
  if (!media) return null;
  if (media.externalUrl) return media.externalUrl;
  if (!media.path) return null;
  return supabase.storage.from(media.bucket || "product-media").getPublicUrl(media.path).data.publicUrl;
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string; productSlug: string }>;
}) {
  const { slug, productSlug } = await params;

  if (!hasSupabaseEnv()) {
    return <main className="mx-auto max-w-5xl p-8"><SetupRequired area="Product detail" /></main>;
  }

  const supabase = await createClient();
  const [{ data: homeData }, { data: detailData }] = await Promise.all([
    supabase.rpc("get_public_storefront_home_render_v5", { target_store_slug: slug }),
    supabase.rpc("get_public_product_detail_v3", {
      target_store_slug: slug,
      target_product_slug: productSlug,
    }),
  ]);

  const home = homeData as HomePayload | null;
  const detail = detailData as ProductDetail | null;

  if (!home?.store || !detail?.product) {
    return <main className="storefront-empty"><h1>Product not found</h1></main>;
  }

  const colors = home.designSystem?.colors ?? {};
  const media = detail.media ?? [];
  const resolvedMedia = media.map((item) => ({ ...item, url: mediaPublicUrl(supabase, item) }));
  const primary = resolvedMedia.find((item) => item.isPrimary) ?? resolvedMedia[0];
  const categoryLabel = detail.product.category || "Merchandise";

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

      <div className="pdp-breadcrumb">
        <Link href={`/shop/${home.store.slug}/catalog`}>Shop</Link>
        <span>/</span>
        <span>{categoryLabel}</span>
      </div>

      <ProductDetailExperience
        productId={detail.product.id}
        storeSlug={home.store.slug}
        name={detail.product.name}
        description={detail.product.description}
        categoryLabel={categoryLabel}
        basePriceCents={detail.product.priceCents}
        media={resolvedMedia.map((item) => ({
          id: item.id,
          url: item.url,
          altText: item.altText,
          isPrimary: item.isPrimary,
        }))}
        sizes={detail.sizes ?? []}
        colors={detail.colors ?? []}
        availability={detail.availability ?? []}
      />

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
