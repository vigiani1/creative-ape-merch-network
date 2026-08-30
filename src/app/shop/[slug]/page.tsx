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

export default async function StorePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!hasSupabaseEnv()) return <main className="mx-auto max-w-5xl p-8"><SetupRequired area={`Storefront /shop/${slug}`} /></main>;

  const supabase = await createClient();
  const { data: stores } = await supabase.rpc("get_public_store", { store_slug: slug });
  const store = stores?.[0] as PublicStore | undefined;

  if (!store) return <main className="mx-auto max-w-5xl p-8"><h1 className="text-3xl font-black">Store not found</h1><p className="mt-3 text-black/60">This storefront is not published or does not exist.</p></main>;

  const [{ data: products }, themeResult] = await Promise.all([
    supabase.rpc("get_public_store_products", { target_store_id: store.id }),
    (supabase.rpc as any)("get_public_store_theme", { target_store_id: store.id }),
  ]);

  const theme = themeResult.data?.[0] as PublicTheme | undefined;
  const productRows = ((products || []) as PublicProduct[]);

  const mediaPairs = await Promise.all(
    productRows.map(async (product) => {
      const result = await (supabase.rpc as any)("get_public_product_media", { target_product_id: product.id });
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
          {theme?.logo_url ? <img src={theme.logo_url} alt="" className="mb-8 h-20 max-w-[240px] object-contain object-left" /> : null}
          <p className="text-sm font-bold uppercase tracking-[0.2em]">Creative Ape Merch Network</p>
          <h1 className="mt-4 text-5xl font-black">{store.title || store.name}</h1>
          <p className="mt-4 max-w-2xl text-white/80">{store.description}</p>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-5 px-6 py-10 md:grid-cols-2 lg:grid-cols-3">
        {productRows.map((product) => {
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
    </main>
  );
}
