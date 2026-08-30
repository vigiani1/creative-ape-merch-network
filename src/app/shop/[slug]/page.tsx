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

function settingNumber(settings: unknown, key: string) {
  if (!settings || typeof settings !== "object" || Array.isArray(settings)) return null;
  const value = (settings as Record<string, unknown>)[key];
  return typeof value === "number" ? value : typeof value === "string" && value ? Number(value) : null;
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
  const heroSection = sections.find((section) => section.section_type === "hero");
  const heroImage = heroSection ? setting(heroSection.settings, "image_url") : "";
  const heroVideo = heroSection ? setting(heroSection.settings, "video_url") : "";
  const heroTitle = heroSection ? setting(heroSection.settings, "title") : "";
  const heroBody = heroSection ? setting(heroSection.settings, "body") : "";
  const heroButtonLabel = heroSection ? setting(heroSection.settings, "button_label") : "";
  const heroButtonUrl = heroSection ? setting(heroSection.settings, "button_url") : "";
  const heroButtonShape = heroSection ? setting(heroSection.settings, "button_shape") : "";
  const heroAlign = heroSection ? setting(heroSection.settings, "align") : "left";
  const heroMinHeight = heroSection ? settingNumber(heroSection.settings, "min_height") : null;
  const hasProductSection = sections.some((section) => ["featured_products", "product_grid"].includes(section.section_type));

  const productGrid = (featuredOnly = false, limit?: number | null) => {
    const baseRows = featuredOnly ? productRows.filter((product) => product.featured) : productRows;
    const rows = limit ? baseRows.slice(0, limit) : baseRows;
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
        className="relative overflow-hidden border-b border-black/10 bg-cover bg-center px-6 py-16 text-white"
        style={{
          backgroundColor: heroColor,
          minHeight: heroMinHeight ? `${heroMinHeight}px` : undefined,
          backgroundImage: (heroImage || theme?.hero_image_url)
            ? `linear-gradient(rgba(0,0,0,.45),rgba(0,0,0,.45)),url("${heroImage || theme?.hero_image_url}")`
            : undefined,
        }}
      >
        {heroVideo ? <video src={heroVideo} autoPlay muted loop playsInline className="absolute inset-0 h-full w-full object-cover opacity-60" /> : null}
        <div className={`relative mx-auto max-w-6xl ${heroAlign === "center" ? "text-center" : heroAlign === "right" ? "text-right" : "text-left"}`}>
          <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
            {theme?.logo_url ? <img src={theme.logo_url} alt="" className="h-20 max-w-[240px] object-contain object-left" /> : <span />}
            {publicPages.length ? <nav className="flex flex-wrap gap-4 text-sm font-bold">{publicPages.map((page) => <Link key={page.slug} href={`/shop/${store.slug}/${page.slug}`}>{page.nav_label || page.title}</Link>)}</nav> : null}
          </div>
          <p className="text-sm font-bold uppercase tracking-[0.2em]">Creative Ape Merch Network</p>
          <h1 className="mt-4 text-5xl font-black">{heroTitle || store.title || store.name}</h1>
          <p className={`mt-4 text-white/80 ${heroAlign === "center" ? "mx-auto max-w-2xl" : heroAlign === "right" ? "ml-auto max-w-2xl" : "max-w-2xl"}`}>{heroBody || store.description}</p>
          {heroButtonLabel && heroButtonUrl ? <a href={heroButtonUrl} className={`mt-7 inline-block bg-white px-5 py-3 font-black text-black ${heroButtonShape === "pill" ? "rounded-full" : heroButtonShape === "square" ? "rounded-none" : "rounded-xl"}`}>{heroButtonLabel}</a> : null}
        </div>
      </section>

      {sections.map((section) => {
        const title = setting(section.settings, "title");
        const body = setting(section.settings, "body");
        const imageUrl = setting(section.settings, "image_url");
        const linkUrl = setting(section.settings, "link_url");
        const videoUrl = setting(section.settings, "video_url");
        const items = settingItems(section.settings);
        const buttonLabel = setting(section.settings, "button_label");
        const buttonUrl = setting(section.settings, "button_url");
        const buttonShape = setting(section.settings, "button_shape");
        const align = setting(section.settings, "align");
        const minHeight = settingNumber(section.settings, "min_height");
        const textAlign = align === "center" ? "text-center" : align === "right" ? "text-right" : "text-left";

        if (section.section_type === "hero") return null;
        if (section.section_type === "product_grid") return <div key={section.id}>{productGrid(false, settingNumber(section.settings, "featured_count"))}</div>;
        if (section.section_type === "featured_products") return <div key={section.id}>{productGrid(true, settingNumber(section.settings, "featured_count"))}</div>;

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
            <section key={section.id} className="mx-auto grid max-w-6xl gap-8 px-6 py-12 md:grid-cols-2 md:items-center" style={{ minHeight: minHeight ?? undefined }}>
              <div className={textAlign}>
                {title ? <h2 className="text-3xl font-black">{title}</h2> : null}
                {body ? <p className="mt-4 whitespace-pre-line text-lg opacity-65">{body}</p> : null}
                {buttonLabel && buttonUrl ? <a href={buttonUrl} className={`mt-5 inline-block bg-black px-5 py-3 font-bold text-white ${buttonShape === "pill" ? "rounded-full" : buttonShape === "square" ? "rounded-none" : "rounded-xl"}`}>{buttonLabel}</a> : linkUrl ? <a href={linkUrl} className="mt-5 inline-block font-bold underline">Learn more</a> : null}
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
