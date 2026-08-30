import Link from "next/link";
import { SetupRequired } from "@/components/setup-required";
import { hasSupabaseEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import type { PublicProduct, PublicStore } from "@/lib/supabase/public-types";

type PublicTheme = {
  logo_url: string | null;
  hero_image_url: string | null;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  background_color: string;
  text_color: string;
};

type PublicMedia = {
  id: string;
  media_type: string;
  storage_path: string | null;
  external_url: string | null;
  alt_text: string | null;
  display_order: number;
  is_primary: boolean;
};

type PublicSection = {
  id: string;
  section_type: string;
  section_position: number;
  settings: unknown;
};

function setting(settings: unknown, key: string) {
  if (!settings || typeof settings !== "object" || Array.isArray(settings)) return "";
  const value = (settings as Record<string, unknown>)[key];
  return typeof value === "string" ? value : "";
}

function settingItems(settings: unknown) {
  if (!settings || typeof settings !== "object" || Array.isArray(settings)) return [] as string[];
  const value = (settings as Record<string, unknown>).items;
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

export default async function StorePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!hasSupabaseEnv()) return <main className="mx-auto max-w-5xl p-8"><SetupRequired area={`Storefront /shop/${slug}`} /></main>;

  const supabase = await createClient();
  const { data: stores } = await supabase.rpc("get_public_store", { store_slug: slug });
  const store = stores?.[0] as PublicStore | undefined;

  if (!store) return <main className="mx-auto max-w-5xl p-8"><h1 className="text-3xl font-black">Store not found</h1><p className="mt-3 text-black/60">This storefront is not published or does not exist.</p></main>;

  const [{ data: products }, themeResult, sectionsResult, pagesResult] = await Promise.all([
    supabase.rpc("get_public_store_products", { target_store_id: store.id }),
    supabase.rpc("get_public_store_theme", { target_store_id: store.id }),
    supabase.rpc("get_public_store_sections", { target_store_id: store.id }),
    supabase.rpc("get_public_store_pages", { target_store_id: store.id }),
  ]);

  const theme = themeResult.data?.[0] as PublicTheme | undefined;
  const productRows = ((products || []) as PublicProduct[]);
  const sections = ((sectionsResult.data || []) as PublicSection[]);
  const publicPages = (pagesResult.data || []) as { slug: string; title: string; nav_label: string | null }[];

  const mediaPairs = await Promise.all(
    productRows.map(async (product) => {
      const result = await supabase.rpc("get_public_product_media", { target_product_id: product.id });
      const media = (result.data || []) as PublicMedia[];
      const primary = media.find((item) => item.is_primary && item.media_type === "image") ?? media.find((item) => item.media_type === "image");
      let url: string | null = null;
      if (primary?.external_url) url = primary.external_url;
      else if (primary?.storage_path) url = supabase.storage.from("product-media").getPublicUrl(primary.storage_path).data.publicUrl;
      return [product.id, url] as const;
    })
  );
  const primaryMedia = new Map(mediaPairs);

  const backgroundColor = theme?.background_color ?? "#ffffff";
  const textColor = theme?.text_color ?? "#111111";
  const heroColor = theme?.primary_color ?? "#111827";
  const hasProductSection = sections.some((section) => ["featured_products", "product_grid"].includes(section.section_type));

  const productGrid = (featuredOnly = false) => {
    const rows = featuredOnly ? productRows.filter((product) => product.featured) : productRows;
    return (
      <section className="mx-auto grid max-w-6xl gap-5 px-6 py-10 md:grid-cols-2 lg:grid-cols-3">
        {rows.map((product) => {
          const imageUrl = primaryMedia.get(product.id);
          return (
            <Link
              key={product.id}
              href={`/shop/${store.slug}/products/${product.slug}`}
              className="rounded-2xl border border-black/10 bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="aspect-square overflow-hidden rounded-xl bg-neutral-100">
                {imageUrl ? <img src={imageUrl} alt={product.name} className="h-full w-full object-cover" /> : null}
              </div>
              <h2 className="mt-4 text-lg font-bold">{product.name}</h2>
              <p className="mt-1 line-clamp-2 text-sm opacity-60">{product.description}</p>
              <p className="mt-4 font-black" style={{ color: theme?.secondary_color ?? textColor }}>${(Number(product.retail_price) / 100).toFixed(2)}</p>
            </Link>
          );
        })}
      </section>
    );
  };

  return (
    <main className="min-h-screen" style={{ backgroundColor, color: textColor }}>
      <section
        className="border-b border-black/10 bg-cover bg-center px-6 py-16 text-white"
        style={{
          backgroundColor: heroColor,
          backgroundImage: theme?.hero_image_url
            ? `linear-gradient(rgba(0,0,0,.45),rgba(0,0,0,.45)),url("${theme.hero_image_url}")`
            : undefined,
        }}
      >
        <div className="mx-auto max-w-6xl">
          <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
            {theme?.logo_url ? <img src={theme.logo_url} alt="" className="h-20 max-w-[240px] object-contain object-left" /> : <span />}
            {publicPages.length ? <nav className="flex flex-wrap gap-4 text-sm font-bold">{publicPages.map((page) => <Link key={page.slug} href={`/shop/${store.slug}/${page.slug}`}>{page.nav_label || page.title}</Link>)}</nav> : null}
          </div>
          <p className="text-sm font-bold uppercase tracking-[0.2em]">Creative Ape Merch Network</p>
          <h1 className="mt-4 text-5xl font-black">{store.title || store.name}</h1>
          <p className="mt-4 max-w-2xl text-white/80">{store.description}</p>
        </div>
      </section>

      {sections.map((section) => {
        const title = setting(section.settings, "title");
        const body = setting(section.settings, "body");
        const imageUrl = setting(section.settings, "image_url");
        const linkUrl = setting(section.settings, "link_url");
        const videoUrl = setting(section.settings, "video_url");
        const items = settingItems(section.settings);

        if (section.section_type === "hero") return null;
        if (section.section_type === "product_grid") return <div key={section.id}>{productGrid(false)}</div>;
        if (section.section_type === "featured_products") return <div key={section.id}>{productGrid(true)}</div>;

        if (section.section_type === "announcement") {
          return (
            <section key={section.id} className="px-6 py-4 text-center text-sm font-semibold" style={{ backgroundColor: theme?.accent_color ?? "#f3f4f6" }}>
              {linkUrl ? <a href={linkUrl} className="underline">{title || body}</a> : (title || body)}
            </section>
          );
        }

        if (section.section_type === "video" && videoUrl) {
          return (
            <section key={section.id} className="mx-auto max-w-5xl px-6 py-12">
              {title ? <h2 className="text-3xl font-black">{title}</h2> : null}
              {body ? <p className="mt-3 opacity-65">{body}</p> : null}
              <video src={videoUrl} controls className="mt-6 w-full rounded-3xl bg-black" />
            </section>
          );
        }

        if (["story", "text_image"].includes(section.section_type)) {
          return (
            <section key={section.id} className="mx-auto grid max-w-6xl gap-8 px-6 py-12 md:grid-cols-2 md:items-center">
              <div>
                {title ? <h2 className="text-3xl font-black">{title}</h2> : null}
                {body ? <p className="mt-4 whitespace-pre-line text-lg opacity-65">{body}</p> : null}
                {linkUrl ? <a href={linkUrl} className="mt-5 inline-block font-bold underline">Learn more</a> : null}
              </div>
              {imageUrl ? <img src={imageUrl} alt="" className="w-full rounded-3xl object-cover" /> : <div className="aspect-video rounded-3xl bg-black/5" />}
            </section>
          );
        }

        if (["sponsors", "socials", "faq"].includes(section.section_type)) {
          return (
            <section key={section.id} className="mx-auto max-w-5xl px-6 py-12">
              {title ? <h2 className="text-3xl font-black">{title}</h2> : null}
              {body ? <p className="mt-3 opacity-65">{body}</p> : null}
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {items.map((item) => <div key={item} className="rounded-2xl border border-black/10 bg-white p-4">{item}</div>)}
              </div>
            </section>
          );
        }

        return null;
      })}

      {!hasProductSection ? productGrid(false) : null}
    </main>
  );
}
