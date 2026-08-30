import Link from "next/link";
import { SetupRequired } from "@/components/setup-required";
import { ProductCard, type StorefrontProductCardData } from "@/components/storefront/product-card";
import { StorefrontHeader } from "@/components/storefront/storefront-header";
import { hasSupabaseEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

type MediaRef = {
  bucket?: string | null;
  path?: string | null;
  externalUrl?: string | null;
};

type CatalogProduct = {
  id: string;
  slug: string;
  name: string;
  priceCents: number;
  primaryImage?: MediaRef | null;
  secondaryImage?: MediaRef | null;
  colors?: { name: string; imageUrl?: string | null }[];
  badge?: string | null;
};

type HomeSection = {
  id: string;
  type: string;
  position: number;
  settings: Record<string, unknown>;
  data?: unknown;
};

type HomePayload = {
  store: {
    id: string;
    name: string;
    slug: string;
    title?: string | null;
    description?: string | null;
  };
  designSystem: {
    logoUrl?: string | null;
    heroImageUrl?: string | null;
    colors?: {
      primary?: string | null;
      secondary?: string | null;
      accent?: string | null;
      background?: string | null;
      text?: string | null;
    };
  };
  navigation?: { id?: string; label: string; target: string }[];
  sections?: HomeSection[];
};

function readString(source: Record<string, unknown> | undefined, key: string) {
  const value = source?.[key];
  return typeof value === "string" ? value : "";
}

function readNumber(source: Record<string, unknown> | undefined, key: string) {
  const value = source?.[key];
  return typeof value === "number" ? value : typeof value === "string" && value ? Number(value) : null;
}

function mediaPublicUrl(
  supabase: Awaited<ReturnType<typeof createClient>>,
  media: MediaRef | null | undefined,
) {
  if (!media) return null;
  if (media.externalUrl) return media.externalUrl;
  if (!media.path) return null;
  return supabase.storage.from(media.bucket || "product-media").getPublicUrl(media.path).data.publicUrl;
}

export default async function StorePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  if (!hasSupabaseEnv()) {
    return (
      <main className="mx-auto max-w-5xl p-8">
        <SetupRequired area={`Storefront /shop/${slug}`} />
      </main>
    );
  }

  const supabase = await createClient();
  const [{ data: homeData }, { data: catalogData }] = await Promise.all([
    supabase.rpc("get_public_storefront_home_render_v5", { target_store_slug: slug }),
    supabase.rpc("get_public_storefront_catalog_v3", {
      target_store_slug: slug,
      sort_key: "featured",
      result_limit: 48,
      result_offset: 0,
    }),
  ]);

  const home = homeData as HomePayload | null;
  const catalog = catalogData as { products?: CatalogProduct[] } | null;

  if (!home?.store) {
    return (
      <main className="storefront-empty">
        <h1>Store not found</h1>
        <p>This storefront is not published or does not exist.</p>
      </main>
    );
  }

  const products = catalog?.products ?? [];
  const productById = new Map(products.map((product) => [product.id, product]));
  const colors = home.designSystem?.colors ?? {};
  const sections = [...(home.sections ?? [])].sort((a, b) => a.position - b.position);
  const hero = sections.find((section) => section.type === "hero");
  const heroHeading = readString(hero?.settings, "heading") || home.store.title || home.store.name;
  const heroSubheading = readString(hero?.settings, "subheading") || home.store.description || "";
  const heroAction = readString(hero?.settings, "primaryActionLabel") || "Shop Now";
  const heroImage = home.designSystem?.heroImageUrl;

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

      <section className="store-hero">
        {heroImage ? <img src={heroImage} alt="" className="store-hero__image" /> : null}
        <div className="store-hero__shade" />
        <div className="store-hero__content">
          <p className="store-eyebrow">Official Store</p>
          <h1>{heroHeading}</h1>
          {heroSubheading ? <p className="store-hero__copy">{heroSubheading}</p> : null}
          <Link href={`/shop/${home.store.slug}/catalog`} className="store-button store-button--light">
            {heroAction}
          </Link>
        </div>
      </section>

      {sections.map((section) => {
        if (section.type === "hero") return null;

        if (section.type === "product_grid") {
          const sectionProducts = Array.isArray(section.data)
            ? section.data
                .map((item) => {
                  if (!item || typeof item !== "object" || Array.isArray(item)) return null;
                  const id = (item as Record<string, unknown>).id;
                  return typeof id === "string" ? productById.get(id) ?? null : null;
                })
                .filter((item): item is CatalogProduct => Boolean(item))
            : [];

          const fallbackLimit = readNumber(section.settings, "limit") ?? 8;
          const rows = sectionProducts.length ? sectionProducts : products.slice(0, fallbackLimit);

          if (!rows.length) return null;

          return (
            <section key={section.id} className="store-section" id={section.position === 20 ? "shop" : undefined}>
              <div className="store-section__heading">
                <div>
                  <p className="store-eyebrow">Shop</p>
                  <h2>{readString(section.settings, "heading") || "Featured"}</h2>
                </div>
                {Boolean(section.settings.showViewAll) ? (
                  <Link href={`/shop/${home.store.slug}/catalog`} className="store-text-link">
                    View all
                  </Link>
                ) : null}
              </div>
              <div className="product-grid">
                {rows.map((product) => (
                  <ProductCard key={product.id} storeSlug={home.store.slug} product={toCard(product)} />
                ))}
              </div>
            </section>
          );
        }

        if (section.type === "category_grid" && Array.isArray(section.data)) {
          const categories = section.data.filter(
            (item): item is { name: string; slug: string; count?: number } =>
              Boolean(item && typeof item === "object" && !Array.isArray(item) && typeof (item as { name?: unknown }).name === "string"),
          );

          if (!categories.length) return null;

          return (
            <section key={section.id} className="store-section store-section--tint">
              <div className="store-section__heading">
                <div>
                  <p className="store-eyebrow">Browse</p>
                  <h2>{readString(section.settings, "heading") || "Shop by category"}</h2>
                </div>
              </div>
              <div className="category-grid">
                {categories.map((category) => (
                  <Link
                    key={category.slug}
                    href={`/shop/${home.store.slug}/catalog?category=${encodeURIComponent(category.slug)}`}
                    className="category-card"
                  >
                    <span className="category-card__count">{category.count ?? 0} products</span>
                    <span className="category-card__name">{category.name}</span>
                    <span className="category-card__arrow">Shop →</span>
                  </Link>
                ))}
              </div>
            </section>
          );
        }

        if (section.type === "featured_collection" && section.data && typeof section.data === "object" && !Array.isArray(section.data)) {
          const data = section.data as { name?: string; description?: string; imageUrl?: string; target?: string };
          if (!data.name) return null;

          return (
            <section key={section.id} className="editorial-feature">
              <div className="editorial-feature__media">
                {data.imageUrl ? <img src={data.imageUrl} alt="" /> : <div className="editorial-feature__placeholder" />}
              </div>
              <div className="editorial-feature__content">
                <p className="store-eyebrow">Featured collection</p>
                <h2>{data.name}</h2>
                {data.description ? <p>{data.description}</p> : null}
                <Link href={`/shop/${home.store.slug}/collections/${data.target?.split("/").pop() ?? ""}`} className="store-button">
                  Shop collection
                </Link>
              </div>
            </section>
          );
        }

        if (section.type === "story") {
          const heading = readString(section.settings, "heading");
          const body = readString(section.settings, "body");
          if (!heading && !body) return null;

          return (
            <section key={section.id} className="store-story">
              <p className="store-eyebrow">About</p>
              <h2>{heading || "Our Story"}</h2>
              {body ? <p>{body}</p> : null}
              <Link href={`/shop/${home.store.slug}/about`} className="store-text-link">
                Learn more
              </Link>
            </section>
          );
        }

        return null;
      })}

      <footer className="store-footer">
        <div>
          <strong>{home.store.name}</strong>
          <p>Official merchandise powered by Creative Ape Branding.</p>
        </div>
        <div className="store-footer__links">
          <Link href={`/shop/${home.store.slug}/catalog`}>Shop</Link>
          <Link href={`/shop/${home.store.slug}/about`}>About</Link>
          <Link href="/cart">Cart</Link>
        </div>
      </footer>
    </main>
  );
}
